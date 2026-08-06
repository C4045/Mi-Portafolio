<?php
require_once 'config.php';

$error = '';

if (isset($_SESSION['admin_logueado']) && $_SESSION['admin_logueado'] === true) {
    header("Location: admin.php");
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $usuario  = trim($_POST['usuario'] ?? '');
    $password = $_POST['password'] ?? '';

    //  CAMBIA ESTOS DATOS POR LOS TUYOS
    $USUARIO_ADMIN   = 'admin';
    $PASSWORD_ADMIN  = 'celso123'; // cámbiala por algo seguro

    if ($usuario === $USUARIO_ADMIN && $password === $PASSWORD_ADMIN) {
        $_SESSION['admin_logueado'] = true;
        $_SESSION['admin_usuario']  = $usuario;
        header("Location: admin.php");
        exit();
    } else {
        $error = 'Usuario o contraseña incorrectos';
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title> Admin Login | Mi Tienda</title>
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
            background: #667eea;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            margin-top: 0.5rem;
            transition: background 0.2s;
        }
        .btn-login:hover { background: #5a67d8; }
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
        <div class="login-card">
            <div class="login-icon"></div>
            <h1>Panel de Admin</h1>
            <p class="subtitulo">Mi Tienda Online</p>

            <?php if ($error): ?>
                <div class="error-login"> <?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>

            <form method="POST">
                <div class="form-group">
                    <label>Usuario</label>
                    <input type="text" name="usuario" required autofocus
                           value="<?php echo htmlspecialchars($_POST['usuario'] ?? ''); ?>"
                           placeholder="admin">
                </div>
                <div class="form-group">
                    <label>Contraseña</label>
                    <input type="password" name="password" required placeholder="••••••••">
                </div>
                <button type="submit" class="btn-login"> Entrar al panel</button>
            </form>

            <div class="volver-tienda">
                <a href="index.php">← Volver a la tienda</a>
            </div>
        </div>
    </div>
</body>
</html>
