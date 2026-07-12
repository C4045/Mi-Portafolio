<?php
require_once __DIR__ . '/auth.php';
requerir_admin();

$totalPropiedades = $pdo->query("SELECT COUNT(*) FROM propiedades")->fetchColumn();
$totalContactos   = $pdo->query("SELECT COUNT(*) FROM contactos")->fetchColumn();
$ultimosContactos = $pdo->query("SELECT * FROM contactos ORDER BY created_at DESC LIMIT 3")->fetchAll(PDO::FETCH_ASSOC);
$ultimasProp      = $pdo->query("SELECT * FROM propiedades ORDER BY id DESC LIMIT 3")->fetchAll(PDO::FETCH_ASSOC);

$seccion = 'dashboard';
require_once 'header.php';
?>

<div class="stats">
  <div class="stat-card"><div class="num"><?= $totalPropiedades ?></div><div class="label">Propiedades registradas</div></div>
  <div class="stat-card" style="border-left-color:#3b82f6"><div class="num"><?= $totalContactos ?></div><div class="label">Mensajes de contacto</div></div>
  <div class="stat-card" style="border-left-color:#10b981"><div class="num"><?= $ultimosContactos[0]['nombre'] ?? '—' ?></div><div class="label">Último contacto</div></div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
  <div class="card">
    <h3>Últimas propiedades</h3>
    <?php if ($ultimasProp): ?>
      <table>
        <tr><th>Título</th><th>Precio</th><th></th></tr>
        <?php foreach ($ultimasProp as $p): ?>
          <tr>
            <td><?= htmlspecialchars($p['titulo']) ?></td>
            <td>USD <?= number_format($p['precio_usd'], 2) ?></td>
            <td><a href="propiedades.php" class="btn btn-edit btn-sm">Ver todas</a></td>
          </tr>
        <?php endforeach; ?>
      </table>
    <?php else: ?>
      <p style="color:#888;font-size:0.9rem">Todavía no hay propiedades. <a href="propiedades-crear.php" style="color:#e8623d;font-weight:600">Agregá la primera →</a></p>
    <?php endif; ?>
  </div>

  <div class="card">
    <h3>Últimos mensajes</h3>
    <?php if ($ultimosContactos): ?>
      <?php foreach ($ultimosContactos as $c): ?>
        <div class="mensaje-item">
          <div class="meta">
            <span class="nombre"><?= htmlspecialchars($c['nombre']) ?></span>
            <span><?= $c['created_at'] ?></span>
          </div>
          <div class="texto"><?= htmlspecialchars(mb_substr($c['mensaje'], 0, 100)) ?><?= mb_strlen($c['mensaje']) > 100 ? '…' : '' ?></div>
        </div>
      <?php endforeach; ?>
      <p style="margin-top:10px"><a href="contactos.php" class="btn btn-edit btn-sm">Ver todos</a></p>
    <?php else: ?>
      <p style="color:#888;font-size:0.9rem">No hay mensajes aún.</p>
    <?php endif; ?>
  </div>
</div>

<?php require_once 'footer.php'; ?>
