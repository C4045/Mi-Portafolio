<?php
require_once __DIR__ . '/auth.php';
requerir_admin();

$msg = '';
$err = '';

if ($_POST) {
    $accion = $_POST['accion'] ?? '';
    if ($accion === 'add') {
        $nombre = trim($_POST['nombre'] ?? '');
        if ($nombre) {
            $stmt = $pdo->prepare("INSERT INTO categories (nombre, sort_order) VALUES (?, COALESCE((SELECT MAX(sort_order)+1 FROM categories c), 0))");
            $stmt->execute([$nombre]);
            $msg = 'Categoria agregada';
        } else {
            $err = 'El nombre es obligatorio';
        }
    } elseif ($accion === 'edit') {
        $id = (int)($_POST['id'] ?? 0);
        $nombre = trim($_POST['nombre'] ?? '');
        if ($id && $nombre) {
            $stmt = $pdo->prepare("UPDATE categories SET nombre = ? WHERE id = ?");
            $stmt->execute([$nombre, $id]);
            $msg = 'Categoria actualizada';
        }
    } elseif ($accion === 'delete') {
        $id = (int)($_POST['id'] ?? 0);
        if ($id) {
            $pdo->prepare("UPDATE menu_items SET category_id = NULL WHERE category_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM categories WHERE id = ?")->execute([$id]);
            $msg = 'Categoria eliminada';
        }
    }
}

$categories = $pdo->query("SELECT c.*, (SELECT COUNT(*) FROM menu_items WHERE category_id = c.id) AS total FROM categories c ORDER BY c.sort_order")->fetchAll();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Categorias - Eclat Admin</title>
    <link rel="stylesheet" href="admin.css">
</head>
<body>
    <div class="admin-layout">
        <nav class="admin-nav">
            <h2>Eclat Admin</h2>
            <a href="index.php">Dashboard</a>
            <a href="menu.php">Menu</a>
            <a href="categories.php" class="active">Categorias</a>
            <a href="settings.php">Configuracion</a>
            <a href="logout.php">Cerrar sesion</a>
        </nav>
        <main class="admin-main">
            <h1>Categorias</h1>
            <?php if ($msg): ?><div class="msg msg-ok"><?php echo $msg; ?></div><?php endif; ?>
            <?php if ($err): ?><div class="msg msg-err"><?php echo $err; ?></div><?php endif; ?>

            <div class="card" style="margin-bottom:1rem">
                <form method="POST" style="display:flex;gap:0.5rem">
                    <input type="hidden" name="accion" value="add">
                    <input type="text" name="nombre" placeholder="Nueva categoria" required style="flex:1;padding:0.6rem 0.8rem;border:1px solid #ddd;border-radius:8px;font-size:0.95rem">
                    <button type="submit" class="btn btn-primary">Agregar</button>
                </form>
            </div>

            <table>
                <thead>
                    <tr><th>Nombre</th><th>Platos</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                    <?php foreach ($categories as $cat): ?>
                    <tr>
                        <td>
                            <form method="POST" style="display:flex;gap:0.5rem">
                                <input type="hidden" name="accion" value="edit">
                                <input type="hidden" name="id" value="<?php echo $cat['id']; ?>">
                                <input type="text" name="nombre" value="<?php echo htmlspecialchars($cat['nombre']); ?>" required style="padding:0.3rem 0.5rem;border:1px solid #ddd;border-radius:4px;font-size:0.9rem">
                                <button type="submit" class="btn btn-edit btn-sm">Guardar</button>
                            </form>
                        </td>
                        <td><?php echo $cat['total']; ?></td>
                        <td>
                            <form method="POST" onsubmit="return confirm('Eliminar categoria? Los platos quedaran sin categoria')">
                                <input type="hidden" name="accion" value="delete">
                                <input type="hidden" name="id" value="<?php echo $cat['id']; ?>">
                                <button type="submit" class="btn btn-delete btn-sm">Eliminar</button>
                            </form>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </main>
    </div>
</body>
</html>
