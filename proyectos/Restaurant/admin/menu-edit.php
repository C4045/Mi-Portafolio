<?php
require_once __DIR__ . '/auth.php';
requerir_admin();

$id = (int)($_GET['id'] ?? 0);
$item = $pdo->prepare("SELECT * FROM menu_items WHERE id = ?");
$item->execute([$id]);
$item = $item->fetch();
if (!$item) { header("Location: menu.php"); exit(); }

$categories = $pdo->query("SELECT * FROM categories ORDER BY sort_order")->fetchAll();
$err = '';

if ($_POST) {
    $nombre = trim($_POST['nombre'] ?? '');
    $descripcion = trim($_POST['descripcion'] ?? '');
    $precio = (float)($_POST['precio'] ?? 0);
    $category_id = $_POST['category_id'] ? (int)$_POST['category_id'] : null;
    $destacado = isset($_POST['destacado']) ? 1 : 0;
    $activo = isset($_POST['activo']) ? 1 : 0;
    $imagen = $item['imagen'];

    if (empty($nombre) || $precio <= 0) {
        $err = 'Nombre y precio son obligatorios';
    }

    if (!$err && isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
        $ext = strtolower(pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION));
        if (in_array($ext, ['jpg','jpeg','png','gif','webp'])) {
            if ($imagen && file_exists(__DIR__ . '/uploads/' . $imagen)) unlink(__DIR__ . '/uploads/' . $imagen);
            $imagen = uniqid('menu_') . '.' . $ext;
            move_uploaded_file($_FILES['imagen']['tmp_name'], __DIR__ . '/uploads/' . $imagen);
        } else {
            $err = 'Formato de imagen no valido';
        }
    }

    if (!$err) {
        $stmt = $pdo->prepare("UPDATE menu_items SET category_id=?, nombre=?, descripcion=?, precio=?, imagen=?, destacado=?, activo=? WHERE id=?");
        $stmt->execute([$category_id, $nombre, $descripcion, $precio, $imagen, $destacado, $activo, $id]);
        header("Location: menu.php?msg=Plato actualizado correctamente");
        exit();
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editar plato - Eclat Admin</title>
    <link rel="stylesheet" href="admin.css">
</head>
<body>
    <div class="admin-layout">
        <nav class="admin-nav">
            <h2>Eclat Admin</h2>
            <a href="index.php">Dashboard</a>
            <a href="menu.php">Menu</a>
            <a href="categories.php">Categorias</a>
            <a href="settings.php">Configuracion</a>
            <a href="logout.php">Cerrar sesion</a>
        </nav>
        <main class="admin-main">
            <h1>Editar plato</h1>
            <div class="card">
                <?php if ($err): ?><div class="msg msg-err"><?php echo htmlspecialchars($err); ?></div><?php endif; ?>
                <form method="POST" enctype="multipart/form-data">
                    <div class="form-group">
                        <label>Nombre *</label>
                        <input type="text" name="nombre" required value="<?php echo htmlspecialchars($item['nombre']); ?>">
                    </div>
                    <div class="form-group">
                        <label>Descripcion</label>
                        <textarea name="descripcion"><?php echo htmlspecialchars($item['descripcion']); ?></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Precio ($) *</label>
                            <input type="number" step="0.01" name="precio" required value="<?php echo $item['precio']; ?>">
                        </div>
                        <div class="form-group">
                            <label>Categoria</label>
                            <select name="category_id">
                                <option value="">Sin categoria</option>
                                <?php foreach ($categories as $cat): ?>
                                <option value="<?php echo $cat['id']; ?>" <?php echo $item['category_id'] == $cat['id'] ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($cat['nombre']); ?>
                                </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Imagen</label>
                        <?php if ($item['imagen']): ?>
                            <div style="margin-bottom:0.5rem"><img src="uploads/<?php echo htmlspecialchars($item['imagen']); ?>" style="width:100px;height:100px;object-fit:cover;border-radius:8px" alt=""></div>
                        <?php endif; ?>
                        <input type="file" name="imagen" accept="image/*">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label><input type="checkbox" name="destacado" value="1" <?php echo $item['destacado'] ? 'checked' : ''; ?>> Destacado</label>
                        </div>
                        <div class="form-group">
                            <label><input type="checkbox" name="activo" value="1" <?php echo $item['activo'] ? 'checked' : ''; ?>> Activo</label>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Guardar cambios</button>
                    <a href="menu.php" class="btn" style="background:#ddd;color:#333">Cancelar</a>
                </form>
            </div>
        </main>
    </div>
</body>
</html>
