<?php
require_once __DIR__ . '/auth.php';
requerir_admin();

$claves_imagen = ['hero_imagen', 'restaurante_foto'];
$claves_texto = [
    'restaurante_nombre', 'hero_titulo', 'hero_subtitulo',
    'telefono', 'email', 'direccion',
    'horas_lun_jue', 'horas_vie_sab', 'horas_dom', 'copyright'
];
$claves = array_merge($claves_texto, $claves_imagen);

$upload_dir = __DIR__ . '/uploads/';
$msg = '';
$err = '';

if ($_POST) {
    foreach ($claves_texto as $clave) {
        $valor = trim($_POST[$clave] ?? '');
        $stmt = $pdo->prepare("INSERT INTO restaurante_settings (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)");
        $stmt->execute([$clave, $valor]);
    }

    foreach ($claves_imagen as $clave) {
        if (isset($_FILES[$clave]) && $_FILES[$clave]['error'] === UPLOAD_ERR_OK) {
            $ext = strtolower(pathinfo($_FILES[$clave]['name'], PATHINFO_EXTENSION));
            if (in_array($ext, ['jpg','jpeg','png','gif','webp'])) {
                $stmt = $pdo->prepare("SELECT valor FROM restaurante_settings WHERE clave = ?");
                $stmt->execute([$clave]);
                $old = $stmt->fetchColumn();
                if ($old && file_exists($upload_dir . $old)) {
                    unlink($upload_dir . $old);
                }
                $nombre = $clave . '_' . uniqid() . '.' . $ext;
                move_uploaded_file($_FILES[$clave]['tmp_name'], $upload_dir . $nombre);
                $stmt = $pdo->prepare("INSERT INTO restaurante_settings (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)");
                $stmt->execute([$clave, $nombre]);
            } else {
                $err = 'Formato no valido para ' . $clave . ' (solo jpg, png, gif, webp)';
            }
        }
        if (isset($_POST[$clave . '_eliminar']) && $_POST[$clave . '_eliminar'] === '1') {
            $stmt = $pdo->prepare("SELECT valor FROM restaurante_settings WHERE clave = ?");
            $stmt->execute([$clave]);
            $old = $stmt->fetchColumn();
            if ($old && file_exists($upload_dir . $old)) unlink($upload_dir . $old);
            $stmt = $pdo->prepare("INSERT INTO restaurante_settings (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)");
            $stmt->execute([$clave, '']);
        }
    }

    if (!$err) $msg = 'Configuracion guardada correctamente';
}

$settings = [];
foreach ($claves as $clave) {
    $stmt = $pdo->prepare("SELECT valor FROM restaurante_settings WHERE clave = ?");
    $stmt->execute([$clave]);
    $settings[$clave] = $stmt->fetchColumn() ?: '';
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configuracion - Eclat Admin</title>
    <link rel="stylesheet" href="admin.css">
    <style>
        .img-preview {
            width: 200px;
            height: 120px;
            object-fit: cover;
            border-radius: 8px;
            border: 1px solid #ddd;
            margin-bottom: 0.5rem;
            display: block;
        }
        .img-preview-lg {
            width: 100%;
            max-width: 400px;
            height: 200px;
            object-fit: cover;
            border-radius: 8px;
            border: 1px solid #ddd;
            margin-bottom: 0.5rem;
            display: block;
        }
        .img-actions {
            display: flex;
            gap: 0.5rem;
            align-items: center;
            flex-wrap: wrap;
            margin-top: 0.5rem;
        }
        .img-actions label { font-size: 0.85rem; font-weight: normal; }
    </style>
</head>
<body>
    <div class="admin-layout">
        <nav class="admin-nav">
            <h2>Eclat Admin</h2>
            <a href="index.php">Dashboard</a>
            <a href="menu.php">Menu</a>
            <a href="categories.php">Categorias</a>
            <a href="settings.php" class="active">Configuracion</a>
            <a href="logout.php">Cerrar sesion</a>
        </nav>
        <main class="admin-main">
            <h1>Configuracion</h1>
            <?php if ($msg): ?><div class="msg msg-ok"><?php echo $msg; ?></div><?php endif; ?>
            <?php if ($err): ?><div class="msg msg-err"><?php echo htmlspecialchars($err); ?></div><?php endif; ?>
            <div class="card">
                <form method="POST" enctype="multipart/form-data">
                    <h3 style="margin-bottom:1rem;color:#d4a574">Informacion del restaurante</h3>

                    <div class="form-group">
                        <label>Nombre del restaurante</label>
                        <input type="text" name="restaurante_nombre" value="<?php echo htmlspecialchars($settings['restaurante_nombre']); ?>">
                    </div>

                    <hr style="margin:1rem 0;border:none;border-top:1px solid #eee">

                    <h3 style="margin-bottom:1rem;color:#d4a574">Hero (portada principal)</h3>

                    <div class="form-group">
                        <label>Titulo</label>
                        <input type="text" name="hero_titulo" value="<?php echo htmlspecialchars($settings['hero_titulo']); ?>">
                    </div>
                    <div class="form-group">
                        <label>Subtitulo</label>
                        <textarea name="hero_subtitulo" rows="3"><?php echo htmlspecialchars($settings['hero_subtitulo']); ?></textarea>
                    </div>
                    <div class="form-group">
                        <label>Imagen de portada (hero)</label>
                        <?php if (!empty($settings['hero_imagen'])): ?>
                            <img src="uploads/<?php echo htmlspecialchars($settings['hero_imagen']); ?>" alt="Hero actual" class="img-preview-lg">
                            <div class="img-actions">
                                <label><input type="checkbox" name="hero_imagen_eliminar" value="1"> Eliminar imagen actual</label>
                            </div>
                        <?php endif; ?>
                        <input type="file" name="hero_imagen" accept="image/*">
                    </div>

                    <hr style="margin:1rem 0;border:none;border-top:1px solid #eee">

                    <h3 style="margin-bottom:1rem;color:#d4a574">Foto del restaurante (logo / about)</h3>

                    <div class="form-group">
                        <label>Foto del restaurante</label>
                        <?php if (!empty($settings['restaurante_foto'])): ?>
                            <img src="uploads/<?php echo htmlspecialchars($settings['restaurante_foto']); ?>" alt="Foto actual" class="img-preview">
                            <div class="img-actions">
                                <label><input type="checkbox" name="restaurante_foto_eliminar" value="1"> Eliminar imagen actual</label>
                            </div>
                        <?php endif; ?>
                        <input type="file" name="restaurante_foto" accept="image/*">
                    </div>

                    <hr style="margin:1rem 0;border:none;border-top:1px solid #eee">

                    <h3 style="margin-bottom:1rem;color:#d4a574">Contacto</h3>

                    <div class="form-group">
                        <label>Telefono</label>
                        <input type="text" name="telefono" value="<?php echo htmlspecialchars($settings['telefono']); ?>">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" value="<?php echo htmlspecialchars($settings['email']); ?>">
                    </div>
                    <div class="form-group">
                        <label>Direccion</label>
                        <input type="text" name="direccion" value="<?php echo htmlspecialchars($settings['direccion']); ?>">
                    </div>

                    <hr style="margin:1rem 0;border:none;border-top:1px solid #eee">

                    <h3 style="margin-bottom:1rem;color:#d4a574">Horarios</h3>

                    <div class="form-group">
                        <label>Lunes - Jueves</label>
                        <input type="text" name="horas_lun_jue" value="<?php echo htmlspecialchars($settings['horas_lun_jue']); ?>">
                    </div>
                    <div class="form-group">
                        <label>Viernes - Sabado</label>
                        <input type="text" name="horas_vie_sab" value="<?php echo htmlspecialchars($settings['horas_vie_sab']); ?>">
                    </div>
                    <div class="form-group">
                        <label>Domingo</label>
                        <input type="text" name="horas_dom" value="<?php echo htmlspecialchars($settings['horas_dom']); ?>">
                    </div>

                    <hr style="margin:1rem 0;border:none;border-top:1px solid #eee">

                    <div class="form-group">
                        <label>Copyright</label>
                        <input type="text" name="copyright" value="<?php echo htmlspecialchars($settings['copyright']); ?>">
                    </div>

                    <button type="submit" class="btn btn-primary">Guardar configuracion</button>
                </form>
            </div>
        </main>
    </div>
</body>
</html>
