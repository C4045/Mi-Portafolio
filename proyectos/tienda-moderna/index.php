<?php
require_once 'config.php';

$busqueda = isset($_GET['buscar']) ? limpiar($_GET['buscar']) : '';
$orden    = isset($_GET['orden'])  ? limpiar($_GET['orden'])  : 'reciente';

$sql = "SELECT * FROM productos"; $params = []; $tipos = '';
if ($busqueda !== '') {
    $sql .= " WHERE nombre LIKE ? OR descripcion LIKE ?";
    $like = "%$busqueda%"; $params[] = $like; $params[] = $like; $tipos .= 'ss';
}
switch ($orden) {
    case 'precio_asc':  $sql .= " ORDER BY precio ASC";  break;
    case 'precio_desc': $sql .= " ORDER BY precio DESC"; break;
    case 'nombre':      $sql .= " ORDER BY nombre ASC";  break;
    default:            $sql .= " ORDER BY id DESC";
}
$stmt = $conn->prepare($sql);
if (!empty($params)) { $stmt->bind_param($tipos, ...$params); }
$stmt->execute();
$result = $stmt->get_result();
$total_carrito = array_sum($_SESSION['carrito']);

/* Paleta de colores para placeholders SVG */
$paletas = [
    ['#1A1A2C','#C9A84C','#2A2A40'],
    ['#1A2C1A','#4CC984','#2A402A'],
    ['#2C1A1A','#C94C4C','#402A2A'],
    ['#1A1E2C','#4C7EC9','#2A2E40'],
    ['#2C1A2C','#C94CAF','#401A40'],
    ['#2C251A','#C98D4C','#403A2A'],
];
$iconos = ['','','','','','','',''];
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= __('titulo_sitio') ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <style>
    .gear{position:fixed;font-size:1rem;opacity:0.15;z-index:999;pointer-events:none;user-select:none}
    .gear-tr{top:8px;right:10px;pointer-events:auto;cursor:default;opacity:0.18}
    .gear-tl{top:8px;left:10px}
    .gear-bl{bottom:8px;left:10px}
    .gear-br{bottom:8px;right:10px}
    .gear-tr:hover{opacity:0.4}
  </style>
  <script>
    (function(){var m=localStorage.getItem('modo');if(m==='claro'){document.documentElement.classList.add('light-mode')}})();
  </script>
</head>
<body>

<div class="header">
  <h1> <?= __('tienda_nombre') ?></h1>
  <div class="header-actions">
    <a href="carrito.php" class="btn-carrito">
       <?= __('carrito') ?> <span class="badge"><?php echo $total_carrito; ?></span>
    </a>
    <a href="mis_pedidos.php" class="btn-volver"> <?= __('mis_pedidos') ?></a>
    <a href="contacto.php" class="btn-volver"> <?= __('contacto') ?></a>
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

  <!-- Engranajes de esquina (falsos y real) -->
  <div class="gear gear-tl" title=""></div>
  <div class="gear gear-tr" title="" ondblclick="location.href='login.php'"></div>
  <div class="gear gear-bl"></div>
  <div class="gear gear-br"></div>

  <div class="hero">
    <!-- Arte SVG generativo de fondo -->
    <div class="hero-art">
      <svg width="100%" height="100%" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="rg1" cx="75%" cy="20%" r="55%">
            <stop offset="0%" stop-color="#C9A84C" stop-opacity="0.18"/>
            <stop offset="100%" stop-color="#C9A84C" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="rg2" cx="90%" cy="80%" r="40%">
            <stop offset="0%" stop-color="#6C4FC9" stop-opacity="0.12"/>
            <stop offset="100%" stop-color="#6C4FC9" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="lineGold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#C9A84C" stop-opacity="0"/>
            <stop offset="50%" stop-color="#C9A84C" stop-opacity="0.7"/>
            <stop offset="100%" stop-color="#C9A84C" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="400" fill="url(#rg1)"/>
        <rect width="1200" height="400" fill="url(#rg2)"/>
        <circle cx="980" cy="100" r="180" fill="none" stroke="#C9A84C" stroke-width="0.8" stroke-opacity="0.18"/>
        <circle cx="980" cy="100" r="130" fill="none" stroke="#C9A84C" stroke-width="0.5" stroke-opacity="0.12"/>
        <circle cx="980" cy="100" r="80"  fill="none" stroke="#C9A84C" stroke-width="0.5" stroke-opacity="0.12"/>
        <circle cx="980" cy="100" r="35"  fill="none" stroke="#E8C97A" stroke-width="1"   stroke-opacity="0.3"/>
        <polygon points="980,68 1012,100 980,132 948,100" fill="none" stroke="#E8C97A" stroke-width="1.2" stroke-opacity="0.35"/>
        <line x1="920" y1="100" x2="1040" y2="100" stroke="#C9A84C" stroke-width="0.5" stroke-opacity="0.25"/>
        <line x1="980" y1="40"  x2="980"  y2="160" stroke="#C9A84C" stroke-width="0.5" stroke-opacity="0.25"/>
        <line x1="0" y1="0" x2="200" y2="0"   stroke="url(#lineGold)" stroke-width="1"/>
        <line x1="0" y1="400" x2="200" y2="400" stroke="url(#lineGold)" stroke-width="1"/>
        <?php for($gy=40;$gy<=360;$gy+=40): for($gx=40;$gx<=700;$gx+=60): ?>
        <circle cx="<?php echo $gx; ?>" cy="<?php echo $gy; ?>" r="1" fill="#C9A84C" fill-opacity="<?php echo round(0.04+($gx/700)*0.06,3); ?>"/>
        <?php endfor; endfor; ?>
        <line x1="1050" y1="0" x2="1200" y2="150" stroke="#C9A84C" stroke-width="0.6" stroke-opacity="0.15"/>
        <line x1="1100" y1="0" x2="1200" y2="100" stroke="#C9A84C" stroke-width="0.4" stroke-opacity="0.1"/>
        <line x1="1000" y1="400" x2="1200" y2="250" stroke="#C9A84C" stroke-width="0.6" stroke-opacity="0.12"/>
      </svg>
    </div>
    <span class="hero-tag"> <?= __('coleccion') ?> <?php echo date('Y'); ?></span>
    <h2><?= __('lo_mejor_elegido') ?></h2>
    <p><?= __('productos_seleccionados') ?></p>
  </div>

  <?php if (isset($_GET['mensaje'])): ?>
    <div class="mensaje mensaje-exito"> <?php echo limpiar($_GET['mensaje']); ?></div>
  <?php endif; ?>
  <?php if (isset($_GET['error'])): ?>
    <div class="mensaje mensaje-error"> <?php echo limpiar($_GET['error']); ?></div>
  <?php endif; ?>

  <form method="GET" class="barra-busqueda">
    <span style="color:#4A4A62;font-size:1rem;">⌕</span>
    <input type="text" name="buscar" placeholder="<?= __('buscar_producto') ?>" value="<?php echo $busqueda; ?>">
    <select name="orden">
      <option value="reciente"    <?php echo $orden==='reciente'   ?'selected':''; ?>><?= __('mas_recientes') ?></option>
      <option value="precio_asc"  <?php echo $orden==='precio_asc' ?'selected':''; ?>><?= __('precio_ascendente') ?></option>
      <option value="precio_desc" <?php echo $orden==='precio_desc'?'selected':''; ?>><?= __('precio_descendente') ?></option>
      <option value="nombre"      <?php echo $orden==='nombre'     ?'selected':''; ?>><?= __('nombre_az') ?></option>
    </select>
    <button type="submit" class="btn-buscar"><?= __('buscar') ?></button>
    <?php if ($busqueda): ?>
      <a href="index.php" class="btn-limpiar"> <?= __('limpiar') ?></a>
    <?php endif; ?>
  </form>

  <p class="section-title">
    <?php echo $busqueda ? sprintf(__('resultados_para'), $busqueda) : __('productos_destacados'); ?>
  </p>

  <div class="productos-grid">
    <?php if ($result->num_rows > 0):
      $idx = 0;
      while ($row = $result->fetch_assoc()):
        $p = $paletas[$idx % count($paletas)];
        $ico = $iconos[$idx % count($iconos)];
        $idx++;
    ?>
      <div class="producto-card <?php echo $row['stock']<=0?'agotado':''; ?>">
        <a href="producto.php?id=<?php echo (int)$row['id']; ?>">
          <div class="producto-img">
            <?php if ($row['imagen'] && file_exists("img/".$row['imagen'])): ?>
              <img src="img/<?php echo limpiar($row['imagen']); ?>" alt="<?php echo limpiar($row['nombre']); ?>">
            <?php else: ?>
              <!-- SVG placeholder artístico único por producto -->
              <div class="img-placeholder">
                <svg width="100%" height="100%" viewBox="0 0 280 220" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id="pg<?php echo $idx; ?>" cx="50%" cy="40%" r="60%">
                      <stop offset="0%" stop-color="<?php echo $p[2]; ?>"/>
                      <stop offset="100%" stop-color="<?php echo $p[0]; ?>"/>
                    </radialGradient>
                  </defs>
                  <rect width="280" height="220" fill="url(#pg<?php echo $idx; ?>)"/>
                  <circle cx="140" cy="100" r="75" fill="none" stroke="<?php echo $p[1]; ?>" stroke-width="0.7" stroke-opacity="0.3"/>
                  <circle cx="140" cy="100" r="52" fill="none" stroke="<?php echo $p[1]; ?>" stroke-width="0.5" stroke-opacity="0.25"/>
                  <circle cx="140" cy="100" r="30" fill="none" stroke="<?php echo $p[1]; ?>" stroke-width="1"   stroke-opacity="0.4"/>
                  <polygon points="140,72 165,100 140,128 115,100"
                           fill="none" stroke="<?php echo $p[1]; ?>"
                           stroke-width="1" stroke-opacity="0.5"/>
                  <line x1="10" y1="10" x2="35" y2="10" stroke="<?php echo $p[1]; ?>" stroke-width="1.5" stroke-opacity="0.4"/>
                  <line x1="10" y1="10" x2="10" y2="35" stroke="<?php echo $p[1]; ?>" stroke-width="1.5" stroke-opacity="0.4"/>
                  <line x1="270" y1="10" x2="245" y2="10" stroke="<?php echo $p[1]; ?>" stroke-width="1.5" stroke-opacity="0.4"/>
                  <line x1="270" y1="10" x2="270" y2="35" stroke="<?php echo $p[1]; ?>" stroke-width="1.5" stroke-opacity="0.4"/>
                  <line x1="10" y1="210" x2="35" y2="210" stroke="<?php echo $p[1]; ?>" stroke-width="1.5" stroke-opacity="0.4"/>
                  <line x1="10" y1="210" x2="10" y2="185" stroke="<?php echo $p[1]; ?>" stroke-width="1.5" stroke-opacity="0.4"/>
                  <line x1="270" y1="210" x2="245" y2="210" stroke="<?php echo $p[1]; ?>" stroke-width="1.5" stroke-opacity="0.4"/>
                  <line x1="270" y1="210" x2="270" y2="185" stroke="<?php echo $p[1]; ?>" stroke-width="1.5" stroke-opacity="0.4"/>
                  <text x="140" y="108" text-anchor="middle" font-size="28" dominant-baseline="middle"><?php echo $ico; ?></text>
                </svg>
              </div>
            <?php endif; ?>
            <?php if ($row['stock']>0 && $row['stock']<=3): ?>
              <span class="badge-stock-bajo"><?= __('ultimas_unidades') ?></span>
            <?php endif; ?>
          </div>
        </a>
        <div class="producto-info">
          <a href="producto.php?id=<?php echo (int)$row['id']; ?>">
            <h3><?php echo limpiar($row['nombre']); ?></h3>
          </a>
          <p><?php echo limpiar($row['descripcion']); ?></p>
          <div class="producto-precio"><?= precio($row['precio']) ?></div>
          <div class="producto-stock <?php echo $row['stock']<=3?'stock-critico':''; ?>">
            <?php echo $row['stock']>0 ? " " . sprintf(__('stock_formato'), $row['stock']) : __('agotado'); ?>
          </div>
          <form action="carrito.php" method="POST">
            <input type="hidden" name="producto_id" value="<?php echo $row['id']; ?>">
            <input type="hidden" name="accion"      value="agregar">
            <div class="cantidad-control">
              <label><?= __('cantidad') ?>:</label>
              <input type="number" name="cantidad" value="1" min="1"
                     max="<?php echo $row['stock']; ?>"
                     <?php echo $row['stock']<=0?'disabled':''; ?>>
            </div>
            <button type="submit" class="btn-agregar" <?php echo $row['stock']<=0?'disabled':''; ?>>
              <?php echo $row['stock']>0 ? '+ ' . __('agregar_carrito') : __('sin_stock'); ?>
            </button>
          </form>
        </div>
      </div>
    <?php endwhile; ?>
    <?php else: ?>
      <div class="vacio-estado">
        <p> <?php echo $busqueda ? sprintf(__('no_resultados_busqueda'), $busqueda) : __('no_hay_productos'); ?></p>
        <?php if ($busqueda): ?><a href="index.php">← <?= __('ver_todos') ?></a><?php endif; ?>
      </div>
    <?php endif; ?>
  </div>

</div><!-- /container -->

<footer><?= sprintf(__('copyright'), date('Y')) ?></footer>

</body>
</html>
<?php $conn->close(); ?>
