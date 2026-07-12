<?php
require_once __DIR__ . '/auth.php';
requerir_admin();

$categories = $pdo->query("SELECT * FROM categories ORDER BY sort_order")->fetchAll();
$msg = '';
$err = '';

if ($_POST) {
    $nombre = trim($_POST['nombre'] ?? '');
    $descripcion = trim($_POST['descripcion'] ?? '');
    $precio = (float)($_POST['precio'] ?? 0);
    $category_id = $_POST['category_id'] ? (int)$_POST['category_id'] : null;
    $destacado = isset($_POST['destacado']) ? 1 : 0;
    $activo = isset($_POST['activo']) ? 1 : 0;
    $imagen = '';

    if (empty($nombre) || $precio <= 0) {
        $err = 'Nombre y precio son obligatorios';
    }

    if (!$err && isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
        $ext = strtolower(pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION));
        if (in_array($ext, ['jpg','jpeg','png','gif','webp'])) {
            $imagen = uniqid('menu_') . '.' . $ext;
            move_uploaded_file($_FILES['imagen']['tmp_name'], __DIR__ . '/uploads/' . $imagen);
        } else {
            $err = 'Formato de imagen no valido (jpg, png, gif, webp)';
        }
    }

    if (!$err) {
        $stmt = $pdo->prepare("INSERT INTO menu_items (category_id, nombre, descripcion, precio, imagen, destacado, activo) VALUES (?,?,?,?,?,?,?)");
        $stmt->execute([$category_id, $nombre, $descripcion, $precio, $imagen, $destacado, $activo]);
        header("Location: menu.php?msg=Plato agregado correctamente");
        exit();
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agregar plato - Eclat Admin</title>
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
            <h1>Agregar plato</h1>
            <div class="card">
                <?php if ($err): ?><div class="msg msg-err"><?php echo htmlspecialchars($err); ?></div><?php endif; ?>
                <form method="POST" enctype="multipart/form-data">
                    <div class="form-group">
                        <label>Nombre *</label>
                        <input type="text" name="nombre" required value="<?php echo htmlspecialchars($_POST['nombre'] ?? ''); ?>">
                    </div>
                    <div class="form-group">
                        <label>Descripcion</label>
                        <textarea name="descripcion"><?php echo htmlspecialchars($_POST['descripcion'] ?? ''); ?></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Precio ($) *</label>
                            <input type="number" step="0.01" name="precio" required value="<?php echo htmlspecialchars($_POST['precio'] ?? ''); ?>">
                        </div>
                        <div class="form-group">
                            <label>Categoria</label>
                            <select name="category_id">
                                <option value="">Sin categoria</option>
                                <?php foreach ($categories as $cat): ?>
                                <option value="<?php echo $cat['id']; ?>" <?php echo ($_POST['category_id'] ?? '') == $cat['id'] ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($cat['nombre']); ?>
                                </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Imagen</label>
                        <input type="file" name="imagen" accept="image/*">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>
                                <input type="checkbox" name="destacado" value="1" checked>
                                Plato destacado
                            </label>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" name="activo" value="1" checked>
                                Activo
                            </label>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Guardar plato</button>
                    <a href="menu.php" class="btn" style="background:#ddd;color:#333">Cancelar</a>
                </form>
            </div>
        </main>
    </div>
</body>
</html>
