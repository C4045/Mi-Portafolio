<?php
require_once 'config.php';

$error = '';
if (isset($_SESSION['cliente_email'])) {
    header("Location: mis_pedidos.php");
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email    = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $s = $conn->prepare("SELECT * FROM clientes WHERE email=?");
    $s->bind_param("s", $email); $s->execute();
    $cliente = $s->get_result()->fetch_assoc();
    if ($cliente && password_verify($password, $cliente['password'])) {
        if (!$cliente['verificado']) {
            $_SESSION['verificacion_email'] = $cliente['email'];
            $_SESSION['verificacion_codigo_dev'] = $cliente['codigo_verificacion'];
            header("Location: verificar_cuenta.php");
            exit();
        }
        $_SESSION['cliente_email']  = $cliente['email'];
        $_SESSION['cliente_nombre'] = $cliente['nombre'];
        header("Location: mis_pedidos.php");
        exit();
    }
    $error = __('error_login');
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title> <?= __('iniciar_sesion') ?> | <?= __('tienda_nombre') ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <style>
    .login-wrapper { min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--bg); padding:2rem; }
    .login-card { background:var(--surface); border-radius:24px; padding:2.5rem; width:100%; max-width:400px; border:1px solid var(--border); box-shadow:var(--shadow-dark); }
    .login-card h1 { font-family:'Playfair Display',serif; font-size:1.5rem; font-weight:900; color:var(--ivory); text-align:center; margin-bottom:.35rem; }
    .login-card p.sub { color:var(--muted); font-size:.86rem; text-align:center; margin-bottom:1.75rem; }
    .login-icon { text-align:center; font-size:2.5rem; margin-bottom:.5rem; }
    .btn-login { display:flex; align-items:center; justify-content:center; width:100%; padding:.85rem; background:var(--gold); color:#0C0C0F; font-family:'DM Sans',sans-serif; font-weight:700; font-size:.9rem; border:none; border-radius:8px; cursor:pointer; transition:var(--t); margin-top:.5rem; }
    .btn-login:hover { background:var(--gold-light); }
    .error-login { background:rgba(255,77,109,.1); color:var(--danger); border:1px solid rgba(255,77,109,.25); padding:.75rem 1rem; border-radius:8px; margin-bottom:1rem; font-size:.86rem; text-align:center; }
    .volver { text-align:center; margin-top:1.25rem; font-size:.82rem; }
    .volver a { color:var(--gold); }
  </style>
</head>
<body>
  <div style="position:fixed;top:1rem;right:1rem;z-index:999;display:flex;flex-direction:column;gap:3px;align-items:flex-end;">
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
  <div class="login-wrapper">
    <div class="login-card">
      <div class="login-icon"></div>
      <h1><?= __('iniciar_sesion') ?></h1>
      <p class="sub"><?= __('seguimiento_pedidos') ?></p>
      <?php if ($error): ?><div class="error-login"> <?= htmlspecialchars($error) ?></div><?php endif; ?>
      <form method="POST">
        <div class="form-group">
          <label><?= __('email') ?></label>
          <input type="email" name="email" required autofocus placeholder="correo@ejemplo.com">
        </div>
        <div class="form-group">
          <label><?= __('contrasena') ?></label>
          <input type="password" name="password" required placeholder="••••••••">
        </div>
        <button type="submit" class="btn-login"> <?= __('entrar') ?></button>
      </form>
      <div style="text-align:center;margin-top:.75rem;font-size:.82rem;"><a href="registro.php" style="color:var(--gold);font-weight:600;"> <?= __('crear_cuenta') ?></a></div>
      <div class="volver"><a href="index.php">← <?= __('volver_tienda') ?></a></div>
    </div>
  </div>
  <script>
  function toggleLang(e){e.stopPropagation();document.getElementById('langDrop').classList.toggle('abierto')}
  function cl(l){var p=new URLSearchParams(location.search);p.set('lang',l);location.search=p.toString();return false}
  document.addEventListener('click',function(){var d=document.getElementById('langDrop');if(d)d.classList.remove('abierto')})
  </script>
</body>
</html>
