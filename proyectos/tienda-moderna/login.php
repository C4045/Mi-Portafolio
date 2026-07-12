<?php
require_once 'config.php';

$error = '';

// Si ya está logueado, redirigir al admin
if (isset($_SESSION['admin_logueado']) && $_SESSION['admin_logueado'] === true) {
    header("Location: admin.php");
    exit();
}

// Procesar login
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $usuario  = trim($_POST['usuario'] ?? '');
    $password = $_POST['password'] ?? '';

    $USUARIO_ADMIN   = $config['admin_user'] ?? 'admin';
    $PASSWORD_ADMIN  = $config['admin_pass'] ?? 'admin123#';

    if ($usuario === $USUARIO_ADMIN && $password === $PASSWORD_ADMIN) {
        $_SESSION['admin_logueado'] = true;
        $_SESSION['admin_usuario']  = $usuario;
        header("Location: admin.php");
        exit();
    } else {
        $error = __('error_login');
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title> <?= __('admin_panel') ?> | <?= __('tienda_nombre') ?></title>
    
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
    <style>
        .login-wrapper {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-card {
            background: white;
            border-radius: 16px;
            padding: 2.5rem 2rem;
            width: 100%;
            max-width: 380px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.25);
        }
        .login-icon {
            font-size: 3rem;
            text-align: center;
            margin-bottom: 0.5rem;
        }
        .login-card h1 {
            text-align: center;
            font-size: 1.4rem;
            color: #1a1a2e;
            margin-bottom: 0.25rem;
        }
        .login-card p.subtitulo {
            text-align: center;
            color: #888;
            font-size: 0.9rem;
            margin-bottom: 1.5rem;
        }
        .login-card .form-group {
            margin-bottom: 1rem;
        }
        .login-card label {
            display: block;
            font-size: 0.85rem;
            font-weight: 600;
            color: #444;
            margin-bottom: 0.4rem;
        }
        .login-card input {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.2s;
            box-sizing: border-box;
        }
        .login-card input:focus {
            outline: none;
            border-color: #667eea;
        }
        .btn-login {
            width: 100%;
            padding: 0.85rem;
            background: var(--gold, #C9A84C);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            margin-top: 0.5rem;
            transition: background 0.2s;
        }
        .btn-login:hover { background: var(--gold-light, #E8C97A); }
        .error-login {
            background: #fed7d7;
            color: #742a2a;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            font-size: 0.9rem;
            text-align: center;
        }
        .volver-tienda {
            text-align: center;
            margin-top: 1.25rem;
            font-size: 0.85rem;
        }
        .volver-tienda a { color: #667eea; text-decoration: none; }
    </style>
</head>
<body>
    <div class="login-wrapper">
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
        <div class="login-card">
            <div class="login-icon"></div>
            <h1><?= __('admin_panel') ?></h1>
            <p class="subtitulo"><?= __('tienda_nombre') ?></p>

            <?php if ($error): ?>
                <div class="error-login"> <?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>

            <form method="POST">
                <div class="form-group">
                    <label><?= __('usuario') ?></label>
                    <input type="text" name="usuario" required autofocus
                           value="<?php echo htmlspecialchars($_POST['usuario'] ?? ''); ?>"
                           placeholder="admin">
                </div>
                <div class="form-group">
                    <label><?= __('contrasena') ?></label>
                    <input type="password" name="password" required placeholder="••••••••">
                </div>
                <button type="submit" class="btn-login"> <?= __('entrar_panel') ?></button>
            </form>

            <div class="volver-tienda">
                <a href="index.php">← <?= __('volver_tienda') ?></a>
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
