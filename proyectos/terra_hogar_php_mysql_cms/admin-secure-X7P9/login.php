<?php
require_once __DIR__ . '/auth.php';
if (!empty($_SESSION['admin'])) {
    header('Location: dashboard.php');
    exit;
}

$error = '';
$ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

if ($_POST) {
    validar_csrf();
    $username = trim($_POST['user'] ?? '');
    $password = $_POST['pass'] ?? '';

    if (!verificar_intentos_login($ip)) {
        $error = 'Demasiados intentos. Esperá 15 minutos.';
    } elseif ($username === '' || $password === '') {
        $error = 'Completá todos los campos.';
    } else {
        $stmt = $pdo->prepare("SELECT id, username, password_hash FROM admins WHERE username = ?");
        $stmt->execute([$username]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($admin && password_verify($password, $admin['password_hash'])) {
            session_regenerate_id(true);
            $_SESSION['admin'] = true;
            $_SESSION['admin_id'] = (int) $admin['id'];
            $_SESSION['admin_user'] = $admin['username'];
            limpiar_intentos_login($ip);
            header('Location: dashboard.php');
            exit;
        }
        registrar_intento_login($ip);
        $error = 'Credenciales incorrectas';
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Acceso Admin — Terra & Hogar</title>
<link rel="stylesheet" href="admin.css">
</head>
<body class="login-body">
<div class="login-box">
  <div class="logo">Terra<span>&Hogar</span></div>
  <h1>Panel administrativo</h1>
  <p>Ingresá tus credenciales para acceder</p>
  <?php if ($error): ?><div class="error-msg"><?= $error ?></div><?php endif; ?>
  <form method="post">
    <?= csrf_field() ?>
    <div class="form-group">
      <label for="user">Usuario</label>
      <input id="user" name="user" type="text" placeholder="admin" required>
    </div>
    <div class="form-group">
      <label for="pass">Contraseña</label>
      <input id="pass" name="pass" type="password" placeholder="••••••••" required>
    </div>
    <button type="submit" class="btn btn-primary">Ingresar al panel →</button>
  </form>
  <p style="margin-top:14px;font-size:0.8rem;text-align:center"><a href="crear_admin.php">¿Primer acceso? Crear administrador</a></p>
</div>
</body>
</html>
