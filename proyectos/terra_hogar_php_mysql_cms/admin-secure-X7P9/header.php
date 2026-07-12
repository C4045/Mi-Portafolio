<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin — Terra & Hogar</title>
<link rel="stylesheet" href="admin.css">
</head>
<body>
<div class="sidebar">
  <h2>Terra<span>&Hogar</span></h2>
  <nav>
    <a href="dashboard.php" class="<?= $seccion === 'dashboard' ? 'activo' : '' ?>"> Dashboard</a>
    <a href="propiedades.php" class="<?= $seccion === 'propiedades' ? 'activo' : '' ?>"> Propiedades</a>
    <a href="contactos.php" class="<?= $seccion === 'contactos' ? 'activo' : '' ?>"> Contactos</a>
    <a href="contenido.php" class="<?= $seccion === 'contenido' ? 'activo' : '' ?>"> Contenido</a>
  </nav>
  <div class="logout">
    <a href="logout.php">← Cerrar sesión</a>
  </div>
</div>
<div class="main">
