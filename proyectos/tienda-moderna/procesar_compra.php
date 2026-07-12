<?php
require_once 'config.php';

if (empty($_SESSION['carrito'])) {
    header("Location: index.php?error=" . urlencode(__('carrito_vacio')));
    exit();
}

// Obtener productos del carrito con validación de stock
$ids = array_map('intval', array_keys($_SESSION['carrito']));
$ids_str = implode(',', $ids);
$result = $conn->query("SELECT * FROM productos WHERE id IN ($ids_str)");
$productos = [];
$total = 0;
$errores_stock = [];

while ($row = $result->fetch_assoc()) {
    $cantidad_pedida = $_SESSION['carrito'][$row['id']];
    if ($cantidad_pedida > $row['stock']) {
        $errores_stock[] = sprintf(__('stock_insuficiente_msg'), $row['nombre'], $row['stock'], $cantidad_pedida);
    }
    $row['cantidad'] = $cantidad_pedida;
    $row['subtotal'] = $row['precio'] * $cantidad_pedida;
    $total += $row['subtotal'];
    $productos[] = $row;
}

// Procesar formulario
$errores_form = [];
$datos = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $datos['nombre']    = limpiar($_POST['nombre'] ?? '');
    $datos['email']     = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $datos['telefono']  = limpiar($_POST['telefono'] ?? '');
    $datos['direccion'] = limpiar($_POST['direccion'] ?? '');
    $datos['ciudad']    = limpiar($_POST['ciudad'] ?? '');
    $datos['notas']     = limpiar($_POST['notas'] ?? '');
    $datos['password']  = $_POST['registro_pass'] ?? '';

    // Validaciones
    if (strlen($datos['nombre']) < 3) $errores_form[] = __('nombre_minimo_3');
    if (!filter_var($datos['email'], FILTER_VALIDATE_EMAIL)) $errores_form[] = __('email_no_valido');
    if (strlen($datos['direccion']) < 5) $errores_form[] = __('direccion_corta');
    if (strlen($datos['ciudad']) < 2) $errores_form[] = __('ingresa_ciudad');

    if (empty($errores_form) && empty($errores_stock)) {
        // Insertar pedido en transacción
        $conn->begin_transaction();
        try {
            $stmt = $conn->prepare("INSERT INTO pedidos (nombre_cliente, email, telefono, direccion, ciudad, notas, total) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("ssssssd", $datos['nombre'], $datos['email'], $datos['telefono'], $datos['direccion'], $datos['ciudad'], $datos['notas'], $total);
            $stmt->execute();
            $pedido_id = $stmt->insert_id;

            foreach ($productos as $item) {
                // Verificar stock en tiempo real (transacción)
                $chk = $conn->prepare("SELECT stock FROM productos WHERE id = ? FOR UPDATE");
                $chk->bind_param("i", $item['id']);
                $chk->execute();
                $stock_actual = $chk->get_result()->fetch_assoc()['stock'];

                if ($stock_actual < $item['cantidad']) {
                    throw new Exception(sprintf(__('stock_insuficiente_para'), $item['nombre']));
                }

                $stmt2 = $conn->prepare("INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)");
                $stmt2->bind_param("iiidd", $pedido_id, $item['id'], $item['cantidad'], $item['precio'], $item['subtotal']);
                $stmt2->execute();

                $stmt3 = $conn->prepare("UPDATE productos SET stock = stock - ? WHERE id = ?");
                $stmt3->bind_param("ii", $item['cantidad'], $item['id']);
                $stmt3->execute();
            }

            $conn->commit();
            $_SESSION['carrito'] = [];
            $_SESSION['ultimo_pedido'] = $pedido_id;

            // Registrar o loguear cliente
            $chk = $conn->prepare("SELECT id, nombre FROM clientes WHERE email=?");
            $chk->bind_param("s", $datos['email']); $chk->execute();
            $cliente_existente = $chk->get_result()->fetch_assoc();
            if (!empty($datos['password']) && !$cliente_existente) {
                $hash = password_hash($datos['password'], PASSWORD_DEFAULT);
                $ins = $conn->prepare("INSERT INTO clientes (email, password, nombre, telefono, verificado) VALUES (?,?,?,?,1)");
                $ins->bind_param("ssss", $datos['email'], $hash, $datos['nombre'], $datos['telefono']);
                $ins->execute();
            }
            if ($cliente_existente || !empty($datos['password'])) {
                $_SESSION['cliente_email'] = $datos['email'];
                $_SESSION['cliente_nombre'] = $cliente_existente ? $cliente_existente['nombre'] : $datos['nombre'];
            }

            $seq = $conn->prepare("SELECT COUNT(*) c FROM pedidos WHERE email=?");
            $seq->bind_param("s", $datos['email']); $seq->execute();
            $num_pedido = $seq->get_result()->fetch_assoc()['c'];
            header("Location: index.php?mensaje=" . urlencode(sprintf(__('compra_realizada'), $num_pedido)));
            exit();

        } catch (Exception $e) {
            $conn->rollback();
            $errores_form[] = sprintf(__('error_procesar_compra'), $e->getMessage());
        }
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title> <?= __('finalizar_compra') ?> | <?= __('tienda_nombre') ?></title>
    
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <div class="header">
            <h1> <?= __('finalizar_compra') ?></h1>
            <div class="header-actions">
                <button class="btn-modo" id="btnModo" onclick="toggleModo()" title="<?= __('cambiar_modo') ?>"></button>
                <div class="header-lang-currency">
                  <div class="lang-hamburger">
                    <button class="lang-hamburger-btn" onclick="toggleLang(event)" title="<?= $idioma_actual ?>">
                      <img src="<?= $bandera_actual ?>" alt="<?= $lang_code ?>"> <span></span>
                    </button>
                    <div class="lang-hamburger-dropdown" id="langDrop">
                      <a href="#" onclick="return cl('es')" class="lang-option <?= $lang_code==='es'?'lang-active':'' ?>"><img src="img/paraguay%20icono%20.png" alt=""> Español</a>
                      <a href="#" onclick="return cl('en')" class="lang-option <?= $lang_code==='en'?'lang-active':'' ?>"><img src="img/eeuu%20icono.png" alt=""> English</a>
                      <a href="#" onclick="return cl('pt')" class="lang-option <?= $lang_code==='pt'?'lang-active':'' ?>"><img src="img/brasil%20icono.png" alt=""> Português</a>
                    </div>
                  </div>
                  <select class="moneda-select" onchange="var p=new URLSearchParams(location.search);p.set('moneda',this.value);location.search=p.toString()"><option value="Gs." <?= $moneda_sel==='Gs.'?'selected':'' ?>>Gs.</option><option value="USD" <?= $moneda_sel==='USD'?'selected':'' ?>>US$</option><option value="BRL" <?= $moneda_sel==='BRL'?'selected':'' ?>>R$</option><option value="EUR" <?= $moneda_sel==='EUR'?'selected':'' ?>>€</option></select>
                </div>
                <a href="<?= isset($_SESSION['cliente_email']) ? 'perfil.php' : 'login_cliente.php' ?>" class="btn-profile" title="<?= isset($_SESSION['cliente_email']) ? __('mi_perfil') : __('iniciar_sesion') ?>"></a>
                <a href="mis_pedidos.php" class="btn-volver"> <?= __('mis_pedidos') ?></a>
                <a href="carrito.php" class="btn-volver">← <?= __('volver_carrito') ?></a>
            </div>
        </div>
        <script>
        function toggleModo(){var h=document.documentElement,b=document.getElementById('btnModo');h.classList.toggle('light-mode');var c=h.classList.contains('light-mode');localStorage.setItem('modo',c?'claro':'oscuro');b.textContent=c?'':''}
        function toggleLang(e){e.stopPropagation();document.getElementById('langDrop').classList.toggle('abierto')}
        function cl(l){var p=new URLSearchParams(location.search);p.set('lang',l);location.search=p.toString();return false}
        document.addEventListener('click',function(){var d=document.getElementById('langDrop');if(d)d.classList.remove('abierto')})
        document.addEventListener('DOMContentLoaded',function(){var b=document.getElementById('btnModo');if(b&&document.documentElement.classList.contains('light-mode'))b.textContent=''})
        </script>

        <!-- Errores de stock -->
        <?php if (!empty($errores_stock)): ?>
          <div class="mensaje mensaje-error">
            <strong> <?= __('problema_stock') ?></strong><br>
            <?php foreach ($errores_stock as $e): ?>
              <p>• <?php echo $e; ?></p>
            <?php endforeach; ?>
            <a href="carrito.php" style="color: #742a2a; font-weight: bold;">← <?= __('actualizar_carrito') ?></a>
          </div>
        <?php endif; ?>

        <!-- Errores del formulario -->
        <?php if (!empty($errores_form)): ?>
          <div class="mensaje mensaje-error">
            <strong> <?= __('corrige_errores') ?></strong><br>
            <?php foreach ($errores_form as $e): ?>
              <p>• <?php echo $e; ?></p>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>

        <div class="card">
            <h2> <?= __('resumen_pedido') ?></h2>
            <div class="compra-resumen">
                <table>
                    <thead>
                        <tr><th><?= __('nombre') ?></th><th><?= __('cantidad') ?></th><th><?= __('subtotal') ?></th></tr>
                    </thead>
                    <tbody>
                        <?php foreach ($productos as $item): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($item['nombre']); ?></td>
                                <td><?php echo $item['cantidad']; ?></td>
                                <td><?= precio($item['subtotal']) ?></td>
                            </tr>
                        <?php endforeach; ?>
                        <tr class="fila-total">
                            <td colspan="2"><strong><?= __('total') ?></strong></td>
                            <td><strong><?= precio($total) ?></strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <form method="POST" class="formulario-compra" <?php echo !empty($errores_stock) ? 'style="opacity:0.5;pointer-events:none"' : ''; ?>>
                <h2> <?= __('datos_entrega') ?></h2>

                <div class="form-row">
                  <div class="form-group">
                    <label><?= __('nombre_completo') ?>: *</label>
                    <input type="text" name="nombre" required value="<?php echo $datos['nombre'] ?? ($_SESSION['cliente_nombre'] ?? ''); ?>" placeholder="Juan Pérez">
                  </div>
                  <div class="form-group">
                    <label><?= __('email') ?>: *</label>
                    <input type="email" name="email" required value="<?php echo $datos['email'] ?? ($_SESSION['cliente_email'] ?? ''); ?>" placeholder="correo@ejemplo.com" <?= isset($_SESSION['cliente_email']) ? 'readonly style="background:var(--bg3);cursor:not-allowed;"' : '' ?>>
                    <?php if (isset($_SESSION['cliente_email'])): ?>
                      <small style="color:var(--muted);font-size:.7rem;"><?= __('email_fijo_ver_pedidos') ?></small>
                    <?php endif; ?>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label><?= __('telefono_whatsapp') ?>:</label>
                    <input type="tel" name="telefono" value="<?php echo $datos['telefono'] ?? ''; ?>" placeholder="+595 981 000 000">
                  </div>
                  <div class="form-group">
                    <label><?= __('ciudad') ?>: *</label>
                    <input type="text" name="ciudad" required value="<?php echo $datos['ciudad'] ?? ''; ?>" placeholder="Ciudad del Este">
                  </div>
                </div>

                <div class="form-group">
                    <label><?= __('direccion_entrega') ?>: *</label>
                    <textarea name="direccion" required placeholder="Calle, número, barrio..."><?php echo $datos['direccion'] ?? ''; ?></textarea>
                </div>

                <div class="form-group">
                    <label><?= __('notas_adicionales') ?>:</label>
                    <textarea name="notas" placeholder="Horario de entrega, referencias del lugar..."><?php echo $datos['notas'] ?? ''; ?></textarea>
                </div>

                <div class="form-group" style="background:var(--gold-glow);padding:1rem;border-radius:8px;border:1px solid rgba(201,168,76,.3);">
                    <label style="color:var(--gold);"> <?= __('crear_cuenta_opcional') ?></label>
                    <input type="password" name="registro_pass" placeholder="<?= __('password_para_seguimiento') ?>" style="margin-top:4px;" value="">
                    <small style="color:var(--muted);font-size:.75rem;"><?= __('password_para_ver_pedidos') ?></small>
                </div>

                <button type="submit" class="btn-comprar btn-grande"> <?= __('confirmar_pedido') ?> — <?= precio($total) ?></button>
            </form>
        </div>
    </div>
</body>
</html>
