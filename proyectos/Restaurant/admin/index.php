<?php
require_once __DIR__ . '/auth.php';
requerir_admin();

$total_items = $pdo->query("SELECT COUNT(*) FROM menu_items")->fetchColumn();
$total_categories = $pdo->query("SELECT COUNT(*) FROM categories")->fetchColumn();
$active_items = $pdo->query("SELECT COUNT(*) FROM menu_items WHERE activo = 1")->fetchColumn();
$featured = $pdo->query("SELECT COUNT(*) FROM menu_items WHERE destacado = 1")->fetchColumn();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Eclat Admin</title>
    <link rel="stylesheet" href="admin.css">
</head>
<body>
    <div class="admin-layout">
        <nav class="admin-nav">
            <h2>Eclat Admin</h2>
            <a href="index.php" class="active">Dashboard</a>
            <a href="menu.php">Menu</a>
            <a href="categories.php">Categorias</a>
            <a href="settings.php">Configuracion</a>
            <a href="logout.php">Cerrar sesion</a>
        </nav>
        <main class="admin-main">
            <h1>Dashboard</h1>
            <div class="stats">
                <div class="stat-card">
                    <h3><?php echo $total_items; ?></h3>
                    <p>Platos totales</p>
                </div>
                <div class="stat-card">
                    <h3><?php echo $active_items; ?></h3>
                    <p>Platos activos</p>
                </div>
                <div class="stat-card">
                    <h3><?php echo $featured; ?></h3>
                    <p>Destacados</p>
                </div>
                <div class="stat-card">
                    <h3><?php echo $total_categories; ?></h3>
                    <p>Categorias</p>
                </div>
            </div>
        </main>
    </div>
</body>
</html>
