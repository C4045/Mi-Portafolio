<?php
require_once 'config.php';

$msg = '';
$err = '';
$datos = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $datos['nombre']   = limpiar($_POST['nombre'] ?? '');
    $datos['email']    = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $datos['telefono'] = limpiar($_POST['telefono'] ?? '');
    $datos['asunto']   = limpiar($_POST['asunto'] ?? '');
    $datos['mensaje']  = limpiar($_POST['mensaje'] ?? '');

    if (strlen($datos['nombre']) < 2)   $err = 'Ingresa tu nombre';
    elseif (!filter_var($datos['email'], FILTER_VALIDATE_EMAIL)) $err = 'Email inválido';
    elseif (strlen($datos['mensaje']) < 10) $err = 'El mensaje es muy corto';
    else {
        $conn->query("CREATE TABLE IF NOT EXISTS contactos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            telefono VARCHAR(50),
            asunto VARCHAR(255),
            mensaje TEXT NOT NULL,
            leido TINYINT(1) DEFAULT 0,
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");

        $s = $conn->prepare("INSERT INTO contactos (nombre, email, telefono, asunto, mensaje) VALUES (?,?,?,?,?)");
        $s->bind_param("sssss", $datos['nombre'], $datos['email'], $datos['telefono'], $datos['asunto'], $datos['mensaje']);
        if ($s->execute()) {
            $msg = ' ¡Mensaje enviado! Te responderemos pronto.';
            $datos = [];
        } else {
            $err = 'Error al enviar el mensaje, intenta de nuevo.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title> Contacto | Mi Tienda</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <div class="header">
      <h1> Contacto</h1>
      <a href="index.php" class="btn-volver">← Volver a la tienda</a>
    </div>

    <div class="card" style="max-width:600px; margin:0 auto;">
      <?php if ($msg): ?>
        <div class="mensaje mensaje-exito"><?= $msg ?></div>
      <?php endif; ?>
      <?php if ($err): ?>
        <div class="mensaje mensaje-error"> <?= $err ?></div>
      <?php endif; ?>

      <h2 style="margin-bottom:1.25rem;"> Envianos un mensaje</h2>

      <form method="POST">
        <div class="form-row">
          <div class="form-group">
            <label>Nombre completo *</label>
            <input type="text" name="nombre" required placeholder="Juan Pérez" value="<?= htmlspecialchars($datos['nombre'] ?? '') ?>">
          </div>
          <div class="form-group">
            <label>Email *</label>
            <input type="email" name="email" required placeholder="correo@ejemplo.com" value="<?= htmlspecialchars($datos['email'] ?? '') ?>">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Teléfono / WhatsApp</label>
            <input type="tel" name="telefono" placeholder="+595 981 000 000" value="<?= htmlspecialchars($datos['telefono'] ?? '') ?>">
          </div>
          <div class="form-group">
            <label>Asunto</label>
            <input type="text" name="asunto" placeholder="Consulta sobre un producto" value="<?= htmlspecialchars($datos['asunto'] ?? '') ?>">
          </div>
        </div>
        <div class="form-group">
          <label>Mensaje *</label>
          <textarea name="mensaje" required placeholder="Escribí tu consulta aquí..." style="height:140px;"><?= htmlspecialchars($datos['mensaje'] ?? '') ?></textarea>
        </div>
        <button type="submit" class="btn-registrar"> Enviar mensaje</button>
      </form>
    </div>
  </div>
</body>
</html>
