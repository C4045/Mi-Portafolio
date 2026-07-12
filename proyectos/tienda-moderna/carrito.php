<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD']==='POST' && isset($_POST['accion'])) {
    if ($_POST['accion']==='agregar') {
        $pid = (int)$_POST['producto_id'];
        $qty = max(1,(int)($_POST['cantidad']??1));
        $s = $conn->prepare("SELECT stock,nombre FROM productos WHERE id=?");
        $s->bind_param("i",$pid); $s->execute();
        $p = $s->get_result()->fetch_assoc();
        if (!$p) { header("Location: index.php?error=" . urlencode(__('producto_no_encontrado'))); exit(); }
        $ya = $_SESSION['carrito'][$pid]??0;
        if ($ya+$qty>$p['stock']) {
            $d=$p['stock']-$ya;
            $error_msg = $d<=0 ? sprintf(__('sin_unidades'), $p['nombre']) : sprintf(__('solo'), $d, $p['nombre']);
            header("Location: index.php?error=" . urlencode($error_msg)); exit();
        }
        $_SESSION['carrito'][$pid]=$ya+$qty;
        header("Location: carrito.php?agregado=1"); exit();
    }
    if ($_POST['accion']==='actualizar') {
        $pid=(int)$_POST['producto_id']; $qty=(int)$_POST['cantidad'];
        if ($qty<=0) { unset($_SESSION['carrito'][$pid]); }
        else { $s=$conn->prepare("SELECT stock FROM productos WHERE id=?"); $s->bind_param("i",$pid); $s->execute(); $r=$s->get_result()->fetch_assoc(); $_SESSION['carrito'][$pid]=min($qty,$r['stock']); }
        header("Location: carrito.php"); exit();
    }
}
if (isset($_GET['eliminar'])) { unset($_SESSION['carrito'][(int)$_GET['eliminar']]); header("Location: carrito.php"); exit(); }
if (isset($_GET['vaciar']))   { $_SESSION['carrito']=[]; header("Location: carrito.php"); exit(); }

$items=[]; $total=0;
if (!empty($_SESSION['carrito'])) {
    $ids=array_filter(array_map('intval',array_keys($_SESSION['carrito'])),fn($i)=>$i>0);
    if ($ids) {
        $ph=implode(',',array_fill(0,count($ids),'?'));
        $s=$conn->prepare("SELECT * FROM productos WHERE id IN ($ph)");
        $s->bind_param(str_repeat('i',count($ids)),...$ids); $s->execute();
        $res=$s->get_result(); while($r=$res->fetch_assoc()) {
            $r['cantidad']=$_SESSION['carrito'][$r['id']]; $r['subtotal']=$r['precio']*$r['cantidad'];
            $total+=$r['subtotal']; $items[]=$r;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title><?= __('carrito') ?> | <?= __('tienda_nombre') ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <script>(function(){var m=localStorage.getItem('modo');if(m==='claro'){document.documentElement.classList.add('light-mode')}})();</script>
</head>
<body>
<div class="header">
  <h1> <?= __('carrito') ?></h1>
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
    <a href="index.php" class="btn-volver">← <?= __('seguir_comprando') ?></a>
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
  <?php if (isset($_GET['agregado'])): ?>
    <div class="mensaje mensaje-exito"> <?= __('producto_agregado') ?></div>
  <?php endif; ?>

  <?php if (empty($items)): ?>
    <div class="card" style="text-align:center;padding:4rem 2rem;">
      <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style="margin-bottom:1.5rem;opacity:.3">
        <circle cx="40" cy="40" r="36" fill="none" stroke="#C9A84C" stroke-width="1.5"/>
        <text x="40" y="47" text-anchor="middle" font-size="28"></text>
      </svg>
      <p style="font-size:1.1rem;font-weight:600;color:var(--muted);margin-bottom:1.5rem;"><?= __('carrito_vacio') ?></p>
      <a href="index.php" class="btn-comprar"><?= __('ver_productos') ?></a>
    </div>
  <?php else: ?>
    <div class="card">
      <?php foreach($items as $it): ?>
        <div class="carrito-item">
          <div class="carrito-info">
            <h3><?php echo htmlspecialchars($it['nombre']); ?></h3>
            <p><?= __('precio_unitario') ?>: <strong style="color:var(--gold)"><?= precio($it['precio']) ?></strong>
               &nbsp;·&nbsp; <?= __('subtotal') ?>: <strong style="color:var(--gold)"><?= precio($it['subtotal']) ?></strong></p>
          </div>
          <div class="carrito-controles">
            <form action="carrito.php" method="POST" class="form-cantidad">
              <input type="hidden" name="accion" value="actualizar">
              <input type="hidden" name="producto_id" value="<?php echo $it['id']; ?>">
              <input type="number" name="cantidad" value="<?php echo $it['cantidad']; ?>" min="0" max="<?php echo $it['stock']; ?>" class="input-cantidad">
              <button type="submit" class="btn-actualizar">↺</button>
            </form>
            <a href="carrito.php?eliminar=<?php echo $it['id']; ?>" class="btn-eliminar" onclick="return confirm('<?= __('confirmar_quitar') ?>')"> <?= __('quitar') ?></a>
          </div>
        </div>
      <?php endforeach; ?>
      <div class="carrito-total">
        <h2><?= __('total') ?>: <span class="total-precio"><?= precio($total) ?></span></h2>
        <div class="carrito-acciones">
          <a href="carrito.php?vaciar=1" class="btn-vaciar" onclick="return confirm('<?= __('confirmar_vaciar') ?>')"> <?= __('vaciar') ?></a>
          <a href="procesar_compra.php" class="btn-comprar"> <?= __('finalizar_compra') ?></a>
        </div>
      </div>
    </div>
  <?php endif; ?>
</div>
<footer><?= sprintf(__('copyright'), date('Y')) ?></footer>
</body>
</html>
