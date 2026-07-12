<?php
require_once 'config.php';

// Protección admin
if (!isset($_SESSION['admin_logueado']) || $_SESSION['admin_logueado'] !== true) {
    header("Location: login.php");
    exit();
}


$mensaje = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $nombre = $_POST['nombre'];
  $descripcion = $_POST['descripcion'];
  $precio = $_POST['precio'];
  $stock = $_POST['stock'];
  $imagen = $_POST['imagen'];

  // Validar datos
  if (empty($nombre) || empty($precio) || empty($stock)) {
    $error = ' Nombre, precio y stock son obligatorios';
  } else {
    $sql = "INSERT INTO productos (nombre, descripcion, precio, stock, imagen) VALUES (?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssdis", $nombre, $descripcion, $precio, $stock, $imagen);

    if ($stmt->execute()) {
      $mensaje = ' Producto agregado correctamente';
    } else {
      $error = ' Error al agregar producto';
    }
    $stmt->close();
  }
}
?>

<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title> Agregar Producto | Celso Dev</title>
  <link rel="stylesheet" href="styles.css">
</head>

<body>
  <div class="container">
    <div class="header">
      <h1> Agregar Producto</h1>
      <a href="admin.php" class="btn-volver">← Volver al panel</a>
    </div>

    <?php if ($mensaje): ?>
      <div class="mensaje mensaje-exito"><?php echo $mensaje; ?></div>
    <?php endif; ?>
    <?php if ($error): ?>
      <div class="mensaje mensaje-error"><?php echo $error; ?></div>
    <?php endif; ?>

    <div class="card">
      <form method="POST">
        <div class="form-group">
          <label>Nombre del producto:</label>
          <input type="text" name="nombre" required placeholder="Ej: Laptop HP">
        </div>

        <div class="form-group">
          <label>Descripción:</label>
          <textarea name="descripcion" placeholder="Descripción del producto..."></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Precio (sin puntos):</label>
            <input type="number" name="precio" required step="0.01" placeholder="450000">
          </div>
          <div class="form-group">
            <label>Stock inicial:</label>
            <input type="number" name="stock" required min="0" value="10">
          </div>
        </div>

        <div class="form-group">
          <label>Nombre de la imagen (opcional):</label>
          <input type="text" name="imagen" placeholder="laptop.jpg">
          <small> Guarda la imagen en la carpeta <strong>img/</strong></small>
        </div>

        <button type="submit" class="btn-registrar"> Agregar producto</button>
      </form>
    </div>
  </div>
</body>

</html>