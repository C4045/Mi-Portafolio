<?php
require_once __DIR__ . '/auth.php';
requerir_admin();

$seccion = 'contactos';
$contactos = $pdo->query("SELECT * FROM contactos ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC);
require_once 'header.php';
?>

<h1>Mensajes de contacto</h1>
<p class="subtitle">Consultas recibidas a través del formulario de la landing page</p>

<div class="card">
  <?php if ($contactos): ?>
    <?php foreach ($contactos as $c): ?>
      <div class="mensaje-item">
        <div class="meta">
          <span class="nombre"><?= htmlspecialchars($c['nombre']) ?></span>
          <span>
            <?= htmlspecialchars($c['telefono']) ?> —
            <?= $c['created_at'] ?>
          </span>
        </div>
        <div class="texto"><?= nl2br(htmlspecialchars($c['mensaje'])) ?></div>
      </div>
    <?php endforeach; ?>
  <?php else: ?>
    <p style="color:#888;text-align:center;padding:30px 0">No hay mensajes de contacto todavía.</p>
  <?php endif; ?>
</div>

<?php require_once 'footer.php'; ?>
