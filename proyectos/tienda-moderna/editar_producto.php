<?php
require_once 'config.php';

if (!isset($_SESSION['admin_logueado']) || $_SESSION['admin_logueado'] !== true) {
    header("Location: login.php");
    exit();
}


$mensaje = '';
$error = '';
$producto = null;

if (isset($_GET['id'])) {
  $id = $_GET['id'];
  $sql = "SELECT * FROM productos WHERE id = ?";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param("i", $id);
  $stmt->execute();
  $result = $stmt->get_result();
  $producto = $result->fetch_assoc();
  $stmt->close();

  if (!$producto) {
    header("Location: admin.php?error=Producto no encontrado");
    exit();
  }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $id = $_POST['id'];
  $nombre = $_POST['nombre'];
  $descripcion = $_POST['descripcion'];
  $precio = $_POST['precio'];
  $stock = $_POST['stock'];
  $imagen = $_POST['imagen'];

  if (empty($nombre) || empty($precio) || empty($stock)) {
    $error = ' Nombre, precio y stock son obligatorios';
  } else {
    $sql = "UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, imagen = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssdisi", $nombre, $descripcion, $precio, $stock, $imagen, $id);

    if ($stmt->execute()) {
      header("Location: admin.php?mensaje=Producto actualizado");
      exit();
    } else {
      $error = ' Error al actualizar producto';
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
  <title> Editar Producto | Celso Dev</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
</head>

<body>
  <div class="container">
    <div class="header">
      <h1> Editar Producto</h1>
      <a href="admin.php" class="btn-volver">← Volver al panel</a>
    </div>

    <?php if ($error): ?>
      <div class="mensaje mensaje-error"><?php echo $error; ?></div>
    <?php endif; ?>

    <?php if ($producto): ?>
      <div class="card">
        <form method="POST">
          <input type="hidden" name="id" value="<?php echo $producto['id']; ?>">

          <div class="form-group">
            <label>Nombre del producto:</label>
            <input type="text" name="nombre" required value="<?php echo htmlspecialchars($producto['nombre']); ?>">
          </div>

          <div class="form-group">
            <label>Descripción:</label>
            <textarea name="descripcion"><?php echo htmlspecialchars($producto['descripcion']); ?></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Precio:</label>
              <input type="number" name="precio" required step="0.01" value="<?php echo $producto['precio']; ?>">
            </div>
            <div class="form-group">
              <label>Stock:</label>
              <input type="number" name="stock" required min="0" value="<?php echo $producto['stock']; ?>">
            </div>
          </div>

          <div class="form-group">
            <label>Nombre de la imagen:</label>
            <input type="text" name="imagen" value="<?php echo htmlspecialchars($producto['imagen']); ?>" placeholder="laptop.jpg">
            <small> Guarda la imagen en la carpeta <strong>img/</strong></small>
          </div>

          <button type="submit" class="btn-registrar"> Actualizar producto</button>
        </form>
      </div>
    <?php endif; ?>
  </div>
</body>

</html>