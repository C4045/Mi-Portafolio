<?php
require_once __DIR__ . '/../config/database.php';

$mensaje = '';
$error = '';

if ($_POST) {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirmar = $_POST['confirmar'] ?? '';

    if ($username === '' || $password === '') {
        $error = 'Completá todos los campos.';
    } elseif ($password !== $confirmar) {
        $error = 'Las contraseñas no coinciden.';
    } elseif (strlen($password) < 8) {
        $error = 'La contraseña debe tener al menos 8 caracteres.';
    } else {
        $stmt = $pdo->prepare("SELECT id FROM admins WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            $error = 'El usuario ya existe.';
        } else {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)");
            $stmt->execute([$username, $hash]);
            $mensaje = "Admin «{$username}» creado correctamente.";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Crear Admin — Terra & Hogar</title>
<link rel="stylesheet" href="admin.css">
</head>
<body class="login-body">
<div class="login-box">
  <h1>Crear administrador</h1>
  <p>Generá el primer usuario para acceder al panel</p>
  <?php if ($error): ?><div class="error-msg"><?= $error ?></div><?php endif; ?>
  <?php if ($mensaje): ?><div class="alert alert-success" style="background:#d4edda;color:#155724;padding:10px;border-radius:6px;margin-bottom:12px"><?= $mensaje ?></div><?php endif; ?>
  <form method="post">
    <div class="form-group">
      <label for="username">Usuario</label>
      <input id="username" name="username" type="text" required>
    </div>
    <div class="form-group">
      <label for="password">Contraseña (mín. 8 caracteres)</label>
      <input id="password" name="password" type="password" required minlength="8">
    </div>
    <div class="form-group">
      <label for="confirmar">Confirmar contraseña</label>
      <input id="confirmar" name="confirmar" type="password" required minlength="8">
    </div>
    <button type="submit" class="btn btn-primary">Crear admin</button>
    <a href="login.php" class="btn btn-secondary" style="display:inline-block;margin-top:10px">Volver al login</a>
  </form>
</div>
</body>
</html>
