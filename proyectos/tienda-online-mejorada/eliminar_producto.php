<?php
require_once 'config.php';

if (!isset($_SESSION['admin_logueado']) || $_SESSION['admin_logueado'] !== true) {
    header("Location: login.php");
    exit();
}


if (isset($_GET['id'])) {
  $id = $_GET['id'];

  $sql = "DELETE FROM productos WHERE id = ?";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param("i", $id);

  if ($stmt->execute()) {
    header("Location: admin.php?mensaje=Producto eliminado");
  } else {
    header("Location: admin.php?error=Error al eliminar producto");
  }
  $stmt->close();
} else {
  header("Location: admin.php?error=ID no especificado");
}

$conn->close();
exit();
