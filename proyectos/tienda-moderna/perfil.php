<?php
require_once 'config.php';
if (!isset($_SESSION['cliente_email'])) {
    header("Location: login_cliente.php");
    exit();
}
$email = $_SESSION['cliente_email'];
$s = $conn->prepare("SELECT * FROM clientes WHERE email=?");
$s->bind_param("s", $email); $s->execute();
$cliente = $s->get_result()->fetch_assoc();
if (!$cliente) { header("Location: logout_cliente.php"); exit(); }

$msg = ''; $err = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $accion = $_POST['accion'] ?? '';

    if ($accion === 'actualizar_datos') {
        $nombre = limpiar($_POST['nombre']);
        $telefono = limpiar($_POST['telefono']);
        if (strlen($nombre) < 2) { $err = __('nombre_minimo_3'); }
        else {
            $up = $conn->prepare("UPDATE clientes SET nombre=?, telefono=? WHERE email=?");
            $up->bind_param("sss", $nombre, $telefono, $email); $up->execute();
            $_SESSION['cliente_nombre'] = $nombre;
            if (isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
                $ext = strtolower(pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION));
                if (in_array($ext, ['jpg','jpeg','png','gif','webp'])) {
                    if ($cliente['foto'] && file_exists('img/clientes/'.$cliente['foto'])) unlink('img/clientes/'.$cliente['foto']);
                    $nom = 'cliente_'.$cliente['id'].'.'.$ext;
                    if (!is_dir('img/clientes')) mkdir('img/clientes', 0777, true);
                    move_uploaded_file($_FILES['foto']['tmp_name'], 'img/clientes/'.$nom);
                    $up2 = $conn->prepare("UPDATE clientes SET foto=? WHERE email=?");
                    $up2->bind_param("ss", $nom, $email); $up2->execute();
                    $cliente['foto'] = $nom;
                } else { $err = 'Solo JPG, PNG, GIF, WEBP'; }
            }
            if (!$err) { $msg = __('perfil_actualizado'); $cliente['nombre'] = $nombre; $cliente['telefono'] = $telefono; }
        }
    }

    // Cambiar contraseña
    if ($accion === 'cambiar_pass') {
        $actual = $_POST['pass_actual'] ?? '';
        $nueva  = $_POST['pass_nueva'] ?? '';
        $conf   = $_POST['pass_confirm'] ?? '';
        if (!password_verify($actual, $cliente['password'])) { $err = __('pass_actual_incorrecta'); }
        elseif (strlen($nueva) < 6) { $err = __('password_corta'); }
        elseif ($nueva !== $conf) { $err = __('password_no_coinciden'); }
        else {
            $hash = password_hash($nueva, PASSWORD_DEFAULT);
            $up = $conn->prepare("UPDATE clientes SET password=? WHERE email=?");
            $up->bind_param("ss", $hash, $email); $up->execute();
            $msg = __('pass_actualizada');
        }
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title> <?= __('mi_perfil') ?> | <?= __('tienda_nombre') ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <script>(function(){var m=localStorage.getItem('modo');if(m==='claro'){document.documentElement.classList.add('light-mode')}})();</script>
  <style>
    .perfil-wrap { display:grid; grid-template-columns: 280px 1fr; gap:1.5rem; align-items:start; }
    .perfil-side { text-align:center; }
    .perfil-avatar { width:150px; height:150px; border-radius:50%; object-fit:cover; margin:0 auto 1rem; display:block; border:3px solid var(--gold); }
    .perfil-avatar-placeholder { width:150px; height:150px; border-radius:50%; margin:0 auto 1rem; display:flex; align-items:center; justify-content:center; font-size:3.5rem; background:var(--surface2); border:3px dashed var(--muted2); }
    @media (max-width:768px) { .perfil-wrap { grid-template-columns:1fr; } .perfil-side { text-align:center; } }
  </style>
</head>
<body>
<div class="header">
  <h1> <?= __('mi_perfil') ?></h1>
  <div class="header-actions">
    <button class="btn-modo" id="btnModo" onclick="toggleModo()" title="<?= __('cambiar_modo') ?>"></button>
    <div class="header-lang-currency">
      <div class="lang-hamburger">
        <button class="lang-hamburger-btn" onclick="toggleLang(event)" title="<?= $idioma_actual ?>"><img src="<?= $bandera_actual ?>" alt="<?= $lang_code ?>"> <span></span></button>
        <div class="lang-hamburger-dropdown" id="langDrop">
          <a href="#" onclick="return cl('es')" class="lang-option <?= $lang_code==='es'?'lang-active':'' ?>"><img src="img/paraguay%20icono%20.png" alt=""> Español</a>
          <a href="#" onclick="return cl('en')" class="lang-option <?= $lang_code==='en'?'lang-active':'' ?>"><img src="img/eeuu%20icono.png" alt=""> English</a>
          <a href="#" onclick="return cl('pt')" class="lang-option <?= $lang_code==='pt'?'lang-active':'' ?>"><img src="img/brasil%20icono.png" alt=""> Português</a>
        </div>
      </div>
      <select class="moneda-select" onchange="var p=new URLSearchParams(location.search);p.set('moneda',this.value);location.search=p.toString()"><option value="Gs." <?= $moneda_sel==='Gs.'?'selected':'' ?>>Gs.</option><option value="USD" <?= $moneda_sel==='USD'?'selected':'' ?>>US$</option><option value="BRL" <?= $moneda_sel==='BRL'?'selected':'' ?>>R$</option><option value="EUR" <?= $moneda_sel==='EUR'?'selected':'' ?>>€</option></select>
    </div>
    <a href="mis_pedidos.php" class="btn-volver"> <?= __('mis_pedidos') ?></a>
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
  <?php if ($msg): ?><div class="mensaje mensaje-exito"> <?= $msg ?></div><?php endif; ?>
  <?php if ($err): ?><div class="mensaje mensaje-error"> <?= $err ?></div><?php endif; ?>

  <div class="perfil-wrap">
    <div class="perfil-side">
      <?php if ($cliente['foto'] && file_exists('img/clientes/'.$cliente['foto'])): ?>
        <img src="img/clientes/<?= $cliente['foto'] ?>" class="perfil-avatar" alt="avatar">
      <?php else: ?>
        <div class="perfil-avatar-placeholder"></div>
      <?php endif; ?>
      <h2 style="font-size:1.2rem;color:var(--ivory);"><?= htmlspecialchars($cliente['nombre']) ?></h2>
      <p style="font-size:.82rem;color:var(--muted);"><?= htmlspecialchars($cliente['email']) ?></p>
    </div>

    <div>
      <div class="card" style="margin-bottom:1.5rem;">
        <h3 style="margin-bottom:1rem;color:var(--gold);"> <?= __('datos_personales') ?></h3>
        <form method="POST" enctype="multipart/form-data">
          <input type="hidden" name="accion" value="actualizar_datos">
          <div class="form-row">
            <div class="form-group">
              <label><?= __('nombre_completo') ?></label>
              <input type="text" name="nombre" required value="<?= htmlspecialchars($cliente['nombre']) ?>">
            </div>
            <div class="form-group">
              <label><?= __('telefono_whatsapp') ?></label>
              <input type="text" name="telefono" value="<?= htmlspecialchars($cliente['telefono'] ?? '') ?>" placeholder="+595 981 000 000">
            </div>
          </div>
          <div class="form-group">
            <label><?= __('email') ?></label>
            <input type="email" value="<?= htmlspecialchars($cliente['email']) ?>" readonly style="background:var(--bg3);cursor:not-allowed;">
          </div>
          <div class="form-group">
            <label><?= __('foto_perfil') ?></label>
            <input type="file" name="foto" accept="image/*">
            <small style="color:var(--muted);font-size:.75rem;">JPG, PNG, GIF, WEBP</small>
          </div>
          <button type="submit" class="btn btn-primary"> <?= __('guardar_cambios') ?></button>
        </form>
      </div>

      <div class="card">
        <h3 style="margin-bottom:1rem;color:var(--gold);"> <?= __('cambiar_contrasena') ?></h3>
        <form method="POST">
          <input type="hidden" name="accion" value="cambiar_pass">
          <div class="form-row">
            <div class="form-group">
              <label><?= __('pass_actual') ?></label>
              <input type="password" name="pass_actual" required placeholder="••••••••">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label><?= __('nueva_contrasena') ?></label>
              <input type="password" name="pass_nueva" required placeholder="Mínimo 6 caracteres">
            </div>
            <div class="form-group">
              <label><?= __('confirmar_contrasena') ?></label>
              <input type="password" name="pass_confirm" required placeholder="Repetí la contraseña">
            </div>
          </div>
          <button type="submit" class="btn btn-primary"> <?= __('actualizar_pass') ?></button>
        </form>
      </div>
    </div>
  </div>
</div>
<footer><?= sprintf(__('copyright'), date('Y')) ?></footer>
</body>
</html>
