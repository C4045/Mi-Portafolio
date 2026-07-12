<?php
require_once __DIR__ . '/../config/database.php';

if (isset($_SESSION['admin_id'])) {
    header("Location: index.php");
    exit();
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    if ($username && $password) {
        $stmt = $pdo->prepare("SELECT * FROM admins WHERE username = ?");
        $stmt->execute([$username]);
        $admin = $stmt->fetch();
        if ($admin && password_verify($password, $admin['password_hash'])) {
            $_SESSION['admin_id'] = $admin['id'];
            $_SESSION['admin_user'] = $admin['username'];
            header("Location: index.php");
            exit();
        }
        $error = 'Usuario o contrasena incorrectos';
    } else {
        $error = 'Complete todos los campos';
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - Eclat</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', sans-serif;
            background: #0f0f0f;
            color: #fff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-card {
            background: #1a1a1a;
            border-radius: 16px;
            padding: 2.5rem 2rem;
            width: 100%;
            max-width: 380px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        .login-card h1 {
            font-family: 'Cormorant Garamond', serif;
            text-align: center;
            font-size: 1.8rem;
            color: #d4a574;
            margin-bottom: 0.25rem;
        }
        .login-card p.sub {
            text-align: center;
            color: #888;
            font-size: 0.85rem;
            margin-bottom: 1.5rem;
        }
        .form-group { margin-bottom: 1rem; }
        .form-group label {
            display: block;
            font-size: 0.85rem;
            font-weight: 600;
            color: #aaa;
            margin-bottom: 0.4rem;
        }
        .form-group input {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1px solid #333;
            border-radius: 8px;
            font-size: 1rem;
            background: #222;
            color: #fff;
            transition: border-color 0.2s;
        }
        .form-group input:focus {
            outline: none;
            border-color: #d4a574;
        }
        .btn-login {
            width: 100%;
            padding: 0.85rem;
            background: #d4a574;
            color: #000;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            margin-top: 0.5rem;
            transition: background 0.2s;
        }
        .btn-login:hover { background: #e8c9b3; }
        .error {
            background: #3d1010;
            color: #f88;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            font-size: 0.9rem;
            text-align: center;
        }
        .back-link {
            text-align: center;
            margin-top: 1.25rem;
            font-size: 0.85rem;
        }
        .back-link a { color: #d4a574; text-decoration: none; }
    </style>
</head>
<body>
    <div class="login-card">
        <h1>Eclat Admin</h1>
        <p class="sub">Panel de gestion</p>
        <?php if ($error): ?>
            <div class="error"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>
        <form method="POST">
            <div class="form-group">
                <label>Usuario</label>
                <input type="text" name="username" required autofocus placeholder="admin">
            </div>
            <div class="form-group">
                <label>Contrasena</label>
                <input type="password" name="password" required placeholder="••••••">
            </div>
            <button type="submit" class="btn-login">Ingresar</button>
        </form>
        <div class="back-link">
            <a href="../index.php">Volver al sitio</a>
        </div>
    </div>
</body>
</html>
