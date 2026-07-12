<?php
require_once 'config.php';
if (isset($_SESSION['cliente_email'])) {
    header("Location: mis_pedidos.php");
    exit();
}
$error = '';
$exito = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nombre  = limpiar($_POST['nombre'] ?? '');
    $email   = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $pass    = $_POST['password'] ?? '';
    $pass2   = $_POST['password2'] ?? '';
    if (strlen($nombre) < 2) $error = __('nombre_minimo_3');
    elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) $error = __('email_invalido');
    elseif (strlen($pass) < 6) $error = __('password_corta');
    elseif ($pass !== $pass2) $error = __('password_no_coinciden');
    elseif (!verificar_captcha($_POST['g-recaptcha-response'] ?? '')) $error = __('captcha_invalido');
    else {
        $chk = $conn->prepare("SELECT id FROM clientes WHERE email=?");
        $chk->bind_param("s", $email); $chk->execute();
        if ($chk->get_result()->fetch_assoc()) {
            $error = __('email_ya_registrado');
        } else {
            $codigo = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $hash = password_hash($pass, PASSWORD_DEFAULT);
            $expira = date('Y-m-d H:i:s', strtotime('+30 minutes'));
            $ins = $conn->prepare("INSERT INTO clientes (email, password, nombre, verificado, codigo_verificacion, codigo_expiracion) VALUES (?,?,?,0,?,?)");
            $ins->bind_param("sssss", $email, $hash, $nombre, $codigo, $expira);
            if ($ins->execute()) {
                $cuerpo = "<h2>" . sprintf(__('bienvenido_verificacion'), $nombre) . "</h2><p>" . __('tu_codigo_es') . "</p><h1 style='font-size:2rem;letter-spacing:6px;background:#f0f0f0;padding:12px 20px;text-align:center;border-radius:8px;'>$codigo</h1><p>" . __('codigo_expiracion') . "</p>";
                enviar_email($email, __('verifica_tu_cuenta') . ' - NovaRandú', $cuerpo);
                $_SESSION['verificacion_email'] = $email;
                $_SESSION['verificacion_codigo_dev'] = $codigo;
                header("Location: verificar_cuenta.php");
                exit();
            } else {
                $error = __('error_registro');
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title> <?= __('crear_cuenta') ?> | <?= __('tienda_nombre') ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <script src="https://www.google.com/recaptcha/api.js" async defer></script>
  <style>
    .login-wrapper { min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--bg); padding:2rem; }
    .login-card { background:var(--surface); border-radius:24px; padding:2.5rem; width:100%; max-width:440px; border:1px solid var(--border); box-shadow:var(--shadow-dark); }
    .login-card h1 { font-family:'Playfair Display',serif; font-size:1.5rem; font-weight:900; color:var(--ivory); text-align:center; margin-bottom:.35rem; }
    .login-card p.sub { color:var(--muted); font-size:.86rem; text-align:center; margin-bottom:1.75rem; }
    .login-icon { text-align:center; font-size:2.5rem; margin-bottom:.5rem; }
    .btn-login { display:flex; align-items:center; justify-content:center; width:100%; padding:.85rem; background:var(--gold); color:#0C0C0F; font-family:'DM Sans',sans-serif; font-weight:700; font-size:.9rem; border:none; border-radius:8px; cursor:pointer; transition:var(--t); margin-top:.5rem; }
    .btn-login:hover { background:var(--gold-light); }
    .g-recaptcha { display:flex; justify-content:center; margin:.75rem 0; }
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
      <h1><?= __('crear_cuenta') ?></h1>
      <p class="sub"><?= __('crear_cuenta_para_pedidos') ?></p>
      <?php if ($error): ?><div style="background:rgba(255,77,109,.1);color:var(--danger);border:1px solid rgba(255,77,109,.25);padding:.75rem 1rem;border-radius:8px;margin-bottom:1rem;font-size:.86rem;text-align:center;"> <?= $error ?></div><?php endif; ?>
      <form method="POST">
        <div class="form-group">
          <label><?= __('nombre_completo') ?> *</label>
          <input type="text" name="nombre" required value="<?= htmlspecialchars($_POST['nombre'] ?? '') ?>" placeholder="Juan Pérez">
        </div>
        <div class="form-group">
          <label><?= __('email') ?> *</label>
          <input type="email" name="email" required value="<?= htmlspecialchars($_POST['email'] ?? '') ?>" placeholder="correo@ejemplo.com">
        </div>
        <div class="form-group">
          <label><?= __('contrasena') ?> *</label>
          <input type="password" name="password" required placeholder="Mínimo 6 caracteres">
        </div>
        <div class="form-group">
          <label><?= __('confirmar_contrasena') ?> *</label>
          <input type="password" name="password2" required placeholder="Repetí la contraseña">
        </div>
        <div class="g-recaptcha" data-sitekey="<?= RECAPTCHA_SITE_KEY ?>"></div>
        <button type="submit" class="btn-login"> <?= __('crear_cuenta_boton') ?></button>
      </form>
      <div style="text-align:center;margin-top:1rem;font-size:.82rem;"><a href="login_cliente.php" style="color:var(--gold);">← <?= __('ya_tienes_cuenta') ?></a></div>
      <div style="text-align:center;margin-top:.5rem;font-size:.82rem;"><a href="index.php" style="color:var(--muted);">← <?= __('volver_tienda') ?></a></div>
    </div>
  </div>
  <script>
  function toggleLang(e){e.stopPropagation();document.getElementById('langDrop').classList.toggle('abierto')}
  function cl(l){var p=new URLSearchParams(location.search);p.set('lang',l);location.search=p.toString();return false}
  document.addEventListener('click',function(){var d=document.getElementById('langDrop');if(d)d.classList.remove('abierto')})
  </script>
</body>
</html>
