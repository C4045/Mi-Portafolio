<?php
require_once 'config.php';
if (!isset($_SESSION['cliente_email'])) {
    header("Location: login_cliente.php");
    exit();
}
$email = $_SESSION['cliente_email'];
$mensaje = '';
$error = '';

if (isset($_GET['cancelar'])) {
    $cid = (int)$_GET['cancelar'];
    $chk = $conn->prepare("SELECT id, estado FROM pedidos WHERE id=? AND email=?");
    $chk->bind_param("is", $cid, $email); $chk->execute();
    $ped = $chk->get_result()->fetch_assoc();
    if (!$ped) {
        $error = __('pedido_no_encontrado');
    } elseif ($ped['estado'] !== 'pendiente') {
        $error = __('pedido_ya_procesado');
    } else {
        $conn->begin_transaction();
        try {
            $items = $conn->prepare("SELECT producto_id, cantidad FROM pedido_items WHERE pedido_id=?");
            $items->bind_param("i", $cid); $items->execute(); $res = $items->get_result();
            while ($it = $res->fetch_assoc()) {
                $up = $conn->prepare("UPDATE productos SET stock = stock + ? WHERE id=?");
                $up->bind_param("ii", $it['cantidad'], $it['producto_id']); $up->execute();
            }
            $upd = $conn->prepare("UPDATE pedidos SET estado='cancelado' WHERE id=?");
            $upd->bind_param("i", $cid); $upd->execute();
            $conn->commit();
            $mensaje = __('pedido_cancelado');
        } catch (Exception $e) {
            $conn->rollback();
            $error = __('error_cancelar');
        }
    }
}

$pedidos = $conn->prepare("SELECT * FROM pedidos WHERE email=? ORDER BY id DESC");
$pedidos->bind_param("s", $email); $pedidos->execute();
$result = $pedidos->get_result();
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title> <?= __('mis_pedidos') ?> | <?= __('tienda_nombre') ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <script>(function(){var m=localStorage.getItem('modo');if(m==='claro'){document.documentElement.classList.add('light-mode')}})();</script>
</head>
<body>
<div class="header">
  <h1> <?= __('mis_pedidos') ?></h1>
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
    <a href="index.php" class="btn-volver">← <?= __('volver_tienda') ?></a>
    <a href="perfil.php" class="btn-volver"> <?= __('mi_perfil') ?></a>
    <a href="logout_cliente.php" class="btn-volver" style="color:var(--danger);border-color:rgba(255,77,109,.3);"> <?= __('cerrar_sesion') ?></a>
  </div>
</div>
<script>
function toggleModo(){var h=document.documentElement,b=document.getElementById('btnModo');h.classList.toggle('light-mode');var c=h.classList.contains('light-mode');localStorage.setItem('modo',c?'claro':'oscuro');b.textContent=c?'':''}
function toggleLang(e){e.stopPropagation();document.getElementById('langDrop').classList.toggle('abierto')}
function cl(l){var p=new URLSearchParams(location.search);p.set('lang',l);location.search=p.toString();return false}
document.addEventListener('click',function(){var d=document.getElementById('langDrop');if(d)d.classList.remove('abierto')})
document.addEventListener('DOMContentLoaded',function(){var b=document.getElementById('btnModo');if(b&&document.documentElement.classList.contains('light-mode'))b.textContent=''})
</script>
<div class="container">
  <p style="margin-bottom:1.5rem;color:var(--muted);"> <?= sprintf(__('hola_cliente'), htmlspecialchars($_SESSION['cliente_nombre'])) ?></p>
  <?php if ($mensaje): ?><div class="mensaje mensaje-exito"> <?= $mensaje ?></div><?php endif; ?>
  <?php if ($error): ?><div class="mensaje mensaje-error"> <?= $error ?></div><?php endif; ?>
  <?php if ($result->num_rows > 0): ?>
    <?php while ($p = $result->fetch_assoc()):
      $items_pedido = $conn->prepare("SELECT pi.*, pr.nombre FROM pedido_items pi JOIN productos pr ON pi.producto_id=pr.id WHERE pi.pedido_id=?");
      $items_pedido->bind_param("i", $p['id']); $items_pedido->execute(); $items = $items_pedido->get_result();
    ?>
    <div class="card" style="margin-bottom:1.5rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem;margin-bottom:.75rem;">
        <h3 style="font-size:1.1rem;color:var(--ivory);">#<?= $p['id'] ?> — <?= date('d/m/Y H:i', strtotime($p['fecha'] ?? $p['fecha_pedido'])) ?></h3>
        <span class="badge-estado e-<?= $p['estado'] ?>"><?= __('estado_' . $p['estado']) ?></span>
      </div>
      <table class="tbl" style="font-size:.85rem;">
        <thead><tr><th><?= __('nombre') ?></th><th><?= __('cantidad') ?></th><th><?= __('subtotal') ?></th></tr></thead>
        <tbody>
          <?php while ($it = $items->fetch_assoc()): ?>
          <tr><td><?= htmlspecialchars($it['nombre']) ?></td><td><?= $it['cantidad'] ?></td><td><?= precio($it['subtotal']) ?></td></tr>
          <?php endwhile; ?>
          <tr style="font-weight:bold;background:var(--gold-glow);"><td colspan="2"><?= __('total') ?></td><td><?= precio($p['total']) ?></td></tr>
        </tbody>
      </table>
      <div style="margin-top:.75rem;font-size:.82rem;color:var(--muted);">
         <?= htmlspecialchars($p['direccion']) ?>, <?= htmlspecialchars($p['ciudad']) ?>
      </div>
      <div style="margin-top:.75rem;display:flex;gap:.5rem;flex-wrap:wrap;">
        <?php if ($p['estado'] === 'pendiente'): ?>
          <a href="mis_pedidos.php?cancelar=<?= $p['id'] ?>" class="btn-vaciar btn-sm" onclick="return confirm('<?= __('confirmar_cancelar') ?>')"> <?= __('cancelar_pedido') ?></a>
        <?php elseif (!in_array($p['estado'], ['cancelado','entregado'])): ?>
          <small style="color:var(--muted);font-size:.78rem;"><?= __('pedido_ya_en_proceso') ?></small>
        <?php endif; ?>
      </div>
    </div>
    <?php endwhile; ?>
  <?php else: ?>
    <div class="card" style="text-align:center;padding:4rem 2rem;">
      <p style="font-size:1.1rem;color:var(--muted);"> <?= __('no_hay_pedidos') ?></p>
      <a href="index.php" class="btn-comprar" style="display:inline-block;margin-top:1rem;"><?= __('ver_productos') ?></a>
    </div>
  <?php endif; ?>
</div>
<footer><?= sprintf(__('copyright'), date('Y')) ?></footer>
</body>
</html>
