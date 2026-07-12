<?php
require_once 'config.php';

if (empty($_SESSION['carrito'])) {
    header("Location: index.php?error=Tu carrito está vacío");
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
        $errores_stock[] = "'{$row['nombre']}' solo tiene {$row['stock']} unidades disponibles (pediste $cantidad_pedida)";
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

    // Validaciones
    if (strlen($datos['nombre']) < 3) $errores_form[] = "El nombre debe tener al menos 3 caracteres";
    if (!filter_var($datos['email'], FILTER_VALIDATE_EMAIL)) $errores_form[] = "El email no es válido";
    if (strlen($datos['direccion']) < 5) $errores_form[] = "La dirección es demasiado corta";
    if (strlen($datos['ciudad']) < 2) $errores_form[] = "Ingresa tu ciudad";

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
                    throw new Exception("Stock insuficiente para '{$item['nombre']}'");
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
            header("Location: index.php?mensaje=¡Compra realizada! Tu pedido %23$pedido_id fue confirmado");
            exit();

        } catch (Exception $e) {
            $conn->rollback();
            $errores_form[] = "Error al procesar tu compra: " . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title> Finalizar Compra | Mi Tienda</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <div class="header">
            <h1> Finalizar Compra</h1>
            <a href="carrito.php" class="btn-volver">← Volver al carrito</a>
        </div>

        <!-- Errores de stock -->
        <?php if (!empty($errores_stock)): ?>
          <div class="mensaje mensaje-error">
            <strong> Problema con el stock:</strong><br>
            <?php foreach ($errores_stock as $e): ?>
              <p>• <?php echo $e; ?></p>
            <?php endforeach; ?>
            <a href="carrito.php" style="color: #742a2a; font-weight: bold;">← Actualizar carrito</a>
          </div>
        <?php endif; ?>

        <!-- Errores del formulario -->
        <?php if (!empty($errores_form)): ?>
          <div class="mensaje mensaje-error">
            <strong> Por favor corrige los siguientes errores:</strong><br>
            <?php foreach ($errores_form as $e): ?>
              <p>• <?php echo $e; ?></p>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>

        <div class="card">
            <h2> Resumen de tu pedido</h2>
            <div class="compra-resumen">
                <table>
                    <thead>
                        <tr><th>Producto</th><th>Cant.</th><th>Subtotal</th></tr>
                    </thead>
                    <tbody>
                        <?php foreach ($productos as $item): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($item['nombre']); ?></td>
                                <td><?php echo $item['cantidad']; ?></td>
                                <td><?php echo $moneda; ?><?php echo number_format($item['subtotal'], 0, ',', '.'); ?></td>
                            </tr>
                        <?php endforeach; ?>
                        <tr class="fila-total">
                            <td colspan="2"><strong>TOTAL</strong></td>
                            <td><strong><?php echo $moneda; ?><?php echo number_format($total, 0, ',', '.'); ?></strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <form method="POST" class="formulario-compra" <?php echo !empty($errores_stock) ? 'style="opacity:0.5;pointer-events:none"' : ''; ?>>
                <h2> Datos de entrega</h2>

                <div class="form-row">
                  <div class="form-group">
                    <label>Nombre completo: *</label>
                    <input type="text" name="nombre" required value="<?php echo $datos['nombre'] ?? ''; ?>" placeholder="Juan Pérez">
                  </div>
                  <div class="form-group">
                    <label>Email: *</label>
                    <input type="email" name="email" required value="<?php echo $datos['email'] ?? ''; ?>" placeholder="correo@ejemplo.com">
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Teléfono / WhatsApp:</label>
                    <input type="tel" name="telefono" value="<?php echo $datos['telefono'] ?? ''; ?>" placeholder="+595 981 000 000">
                  </div>
                  <div class="form-group">
                    <label>Ciudad: *</label>
                    <input type="text" name="ciudad" required value="<?php echo $datos['ciudad'] ?? ''; ?>" placeholder="Ciudad del Este">
                  </div>
                </div>

                <div class="form-group">
                    <label>Dirección de entrega: *</label>
                    <textarea name="direccion" required placeholder="Calle, número, barrio..."><?php echo $datos['direccion'] ?? ''; ?></textarea>
                </div>

                <div class="form-group">
                    <label>Notas adicionales (opcional):</label>
                    <textarea name="notas" placeholder="Horario de entrega, referencias del lugar..."><?php echo $datos['notas'] ?? ''; ?></textarea>
                </div>

                <button type="submit" class="btn-comprar btn-grande"> Confirmar pedido — <?php echo $moneda; ?><?php echo number_format($total, 0, ',', '.'); ?></button>
            </form>
        </div>
    </div>
</body>
</html>
