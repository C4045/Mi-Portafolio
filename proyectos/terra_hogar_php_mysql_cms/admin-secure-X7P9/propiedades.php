<?php
require_once __DIR__ . '/auth.php';
requerir_admin();

$seccion = 'propiedades';
$mensaje = $_GET['msg'] ?? '';
require_once 'header.php';
?>

<h1>Propiedades</h1>
<p class="subtitle">Gestioná las propiedades destacadas que se muestran en la landing page</p>

<?php if ($mensaje === 'creado'): ?><div class="alert alert-success">Propiedad creada correctamente.</div><?php endif; ?>
<?php if ($mensaje === 'editado'): ?><div class="alert alert-success">Propiedad actualizada correctamente.</div><?php endif; ?>
<?php if ($mensaje === 'eliminado'): ?><div class="alert alert-success">Propiedad eliminada.</div><?php endif; ?>

<div style="margin-bottom:16px">
  <a href="propiedades-crear.php" class="btn btn-primary">+ Nueva propiedad</a>
</div>

<div class="card">
  <?php
  $props = $pdo->query("SELECT p.*, COALESCE(i.titulo, '') AS titulo_i18n FROM propiedades p LEFT JOIN propiedades_i18n i ON i.propiedad_id = p.id AND i.idioma = 'es' ORDER BY p.id DESC")->fetchAll(PDO::FETCH_ASSOC);
  if ($props):
  ?>
  <table>
    <tr>
      <th>ID</th>
      <th>Título</th>
      <th>Precio</th>
      <th>Tipo</th>
      <th>Categoría</th>
      <th>Detalles</th>
      <th>Acciones</th>
    </tr>
    <?php foreach ($props as $p): ?>
    <tr>
      <td><?= $p['id'] ?></td>
      <td><strong><?= htmlspecialchars($p['titulo_i18n'] ?: ($p['titulo'] ?? '')) ?></strong></td>
      <td>USD <?= number_format($p['precio_usd'], 2) ?></td>
      <td><span style="padding:2px 8px;border-radius:50px;font-size:0.75rem;font-weight:600;background:<?= $p['tipo'] === 'venta' ? '#fee2e2' : '#dbeafe' ?>;color:<?= $p['tipo'] === 'venta' ? '#dc2626' : '#2563eb' ?>"><?= $p['tipo'] ?></span></td>
      <td style="text-transform:capitalize;font-size:0.85rem"><?= htmlspecialchars($p['categoria']) ?></td>
      <td style="font-size:0.82rem;color:#666"><?php if ($p['categoria'] === 'terreno'): ?><?= htmlspecialchars($p['uso_suelo'] ?: '—') ?> · <?= $p['metros'] ?> m²<?php else: ?><?= $p['dormitorios'] ?> hab · <?= $p['banos'] ?> ba · <?= $p['metros'] ?> m²<?php endif; ?></td>
      <td class="acciones">
        <a href="propiedades-editar.php?id=<?= $p['id'] ?>" class="btn btn-edit btn-sm"> Editar</a>
        <form method="post" action="propiedades-eliminar.php" style="display:inline" onsubmit="return confirm('¿Eliminar esta propiedad?')">
          <?= csrf_field() ?>
          <input type="hidden" name="id" value="<?= $p['id'] ?>">
          <button type="submit" class="btn btn-delete btn-sm"> Eliminar</button>
        </form>
      </td>
    </tr>
    <?php endforeach; ?>
  </table>
  <?php else: ?>
    <p style="color:#888">No hay propiedades registradas. <a href="propiedades-crear.php" style="color:#e8623d;font-weight:600">Crear primera →</a></p>
  <?php endif; ?>
</div>

<?php require_once 'footer.php'; ?>
