<?php
require_once __DIR__ . '/auth.php';
requerir_admin();

$msg = '';
if (isset($_GET['msg'])) $msg = htmlspecialchars($_GET['msg']);

$items = $pdo->query("
    SELECT m.*, c.nombre AS cat_nombre
    FROM menu_items m
    LEFT JOIN categories c ON m.category_id = c.id
    ORDER BY c.sort_order, m.sort_order
")->fetchAll();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Menu - Eclat Admin</title>
    <link rel="stylesheet" href="admin.css">
</head>
<body>
    <div class="admin-layout">
        <nav class="admin-nav">
            <h2>Eclat Admin</h2>
            <a href="index.php">Dashboard</a>
            <a href="menu.php" class="active">Menu</a>
            <a href="categories.php">Categorias</a>
            <a href="settings.php">Configuracion</a>
            <a href="logout.php">Cerrar sesion</a>
        </nav>
        <main class="admin-main">
            <h1>Menu</h1>
            <a href="menu-add.php" class="btn btn-primary" style="margin-bottom:1rem">+ Agregar plato</a>
            <?php if ($msg): ?><div class="msg msg-ok"><?php echo $msg; ?></div><?php endif; ?>
            <table>
                <thead>
                    <tr>
                        <th>Imagen</th>
                        <th>Nombre</th>
                        <th>Categoria</th>
                        <th>Precio</th>
                        <th>Destacado</th>
                        <th>Activo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($items as $item): ?>
                    <tr>
                        <td>
                            <?php if ($item['imagen']): ?>
                                <img src="uploads/<?php echo htmlspecialchars($item['imagen']); ?>" alt="">
                            <?php else: ?>
                                <span style="color:#ccc">Sin img</span>
                            <?php endif; ?>
                        </td>
                        <td><?php echo htmlspecialchars($item['nombre']); ?></td>
                        <td><?php echo htmlspecialchars($item['cat_nombre'] ?? '-'); ?></td>
                        <td>$<?php echo number_format($item['precio'], 2); ?></td>
                        <td><?php echo $item['destacado'] ? 'Si' : 'No'; ?></td>
                        <td><?php echo $item['activo'] ? 'Si' : 'No'; ?></td>
                        <td class="actions">
                            <a href="menu-edit.php?id=<?php echo $item['id']; ?>" class="btn btn-edit btn-sm">Editar</a>
                            <a href="menu-delete.php?id=<?php echo $item['id']; ?>" class="btn btn-delete btn-sm" onclick="return confirm('Eliminar este plato?')">Eliminar</a>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </main>
    </div>
</body>
</html>
