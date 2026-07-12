<?php
require_once 'config.php';
$email = $_SESSION['verificacion_email'] ?? '';
if (!$email) {
    header("Location: registro.php");
    exit();
}
$error = '';
$exito = '';
$codigo_dev = $_SESSION['verificacion_codigo_dev'] ?? '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $codigo = trim($_POST['codigo'] ?? '');
    $s = $conn->prepare("SELECT id, codigo_verificacion, codigo_expiracion FROM clientes WHERE email=? AND verificado=0");
    $s->bind_param("s", $email); $s->execute();
    $cli = $s->get_result()->fetch_assoc();
    if (!$cli) {
        $error = __('codigo_invalido');
    } elseif ($cli['codigo_verificacion'] !== $codigo) {
        $error = __('codigo_incorrecto');
    } elseif (strtotime($cli['codigo_expiracion']) < time()) {
        $error = __('codigo_expirado');
    } else {
        $up = $conn->prepare("UPDATE clientes SET verificado=1, codigo_verificacion=NULL, codigo_expiracion=NULL WHERE id=?");
        $up->bind_param("i", $cli['id']); $up->execute();
        $_SESSION['cliente_email'] = $email;
        $nom = $conn->prepare("SELECT nombre FROM clientes WHERE email=?");
        $nom->bind_param("s", $email); $nom->execute();
        $_SESSION['cliente_nombre'] = $nom->get_result()->fetch_assoc()['nombre'];
        unset($_SESSION['verificacion_email'], $_SESSION['verificacion_codigo_dev']);
        header("Location: mis_pedidos.php?verificado=1");
        exit();
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title> <?= __('verificar_cuenta') ?> | <?= __('tienda_nombre') ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <style>
    .login-wrapper { min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--bg); padding:2rem; }
    .login-card { background:var(--surface); border-radius:24px; padding:2.5rem; width:100%; max-width:420px; border:1px solid var(--border); box-shadow:var(--shadow-dark); text-align:center; }
    .login-card h1 { font-family:'Playfair Display',serif; font-size:1.5rem; font-weight:900; color:var(--ivory); margin-bottom:.5rem; }
    .login-card p { color:var(--muted); font-size:.9rem; margin-bottom:1.5rem; line-height:1.6; }
    .codigo-input { font-size:1.5rem; letter-spacing:8px; text-align:center; font-weight:700; padding:.75rem; }
    .btn-verificar { display:inline-flex; align-items:center; justify-content:center; padding:.85rem 2.5rem; background:var(--gold); color:#0C0C0F; font-weight:700; font-size:.9rem; border:none; border-radius:8px; cursor:pointer; transition:var(--t); margin-top:.5rem; }
    .btn-verificar:hover { background:var(--gold-light); }
    .dev-code { background:rgba(201,168,76,.1); border:1px dashed var(--gold); border-radius:8px; padding:.75rem; margin-bottom:1rem; font-size:.82rem; color:var(--muted); }
    .dev-code strong { font-size:1.3rem; letter-spacing:4px; color:var(--gold); }
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
  <?php if ($error): ?><div style="position:fixed;top:1rem;left:50%;transform:translateX(-50%);z-index:9999;background:rgba(255,77,109,.1);color:var(--danger);border:1px solid rgba(255,77,109,.25);padding:.75rem 1rem;border-radius:8px;font-size:.86rem;"> <?= $error ?></div><?php endif; ?>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="login-icon"></div>
      <h1><?= __('verificar_cuenta') ?></h1>
      <p><?= sprintf(__('enviamos_codigo'), htmlspecialchars($email)) ?></p>
      <?php if ($codigo_dev): ?>
      <div class="dev-code">
         <?= __('modo_desarrollo') ?><br>
        <strong><?= $codigo_dev ?></strong>
      </div>
      <?php endif; ?>
      <form method="POST">
        <div class="form-group">
          <input type="text" name="codigo" class="codigo-input" placeholder="000000" maxlength="6" autofocus required>
        </div>
        <button type="submit" class="btn-verificar"> <?= __('verificar') ?></button>
      </form>
      <div style="margin-top:1.25rem;font-size:.8rem;">
        <a href="login_cliente.php" style="color:var(--gold);">← <?= __('ir_al_login') ?></a>
      </div>
    </div>
  </div>
  <script>
  function toggleLang(e){e.stopPropagation();document.getElementById('langDrop').classList.toggle('abierto')}
  function cl(l){var p=new URLSearchParams(location.search);p.set('lang',l);location.search=p.toString();return false}
  document.addEventListener('click',function(){var d=document.getElementById('langDrop');if(d)d.classList.remove('abierto')})
  </script>
</body>
</html>
