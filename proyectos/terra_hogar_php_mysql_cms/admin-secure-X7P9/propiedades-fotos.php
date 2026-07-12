<?php
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/../includes/img-helpers.php';
requerir_admin();

$id = (int) ($_GET['id'] ?? 0);
$prop = $pdo->prepare("SELECT id, titulo FROM propiedades WHERE id = ?");
$prop->execute([$id]);
$prop = $prop->fetch(PDO::FETCH_ASSOC);
if (!$prop) { header('Location: propiedades.php'); exit; }

if ($_POST && isset($_POST['nueva_foto'])) {
    validar_csrf();
    $url = trim($_POST['nueva_foto']);
    if ($url !== '') {
        $max = $pdo->prepare("SELECT COALESCE(MAX(orden), -1) + 1 FROM propiedad_fotos WHERE propiedad_id = ?");
        $max->execute([$id]);
        $orden = (int) $max->fetchColumn();
        $stmt = $pdo->prepare("INSERT INTO propiedad_fotos (propiedad_id, url, orden) VALUES (?, ?, ?)");
        $stmt->execute([$id, $url, $orden]);
        $mensaje = 'Foto agregada.';
    }
}

if (isset($_POST['eliminar_foto'])) {
    validar_csrf();
    $fotoId = (int) $_POST['eliminar_foto'];
    $stmt = $pdo->prepare("DELETE FROM propiedad_fotos WHERE id = ? AND propiedad_id = ?");
    $stmt->execute([$fotoId, $id]);
    header('Location: propiedades-fotos.php?id=' . $id . '&msg=eliminado');
    exit;
}

$fotos = $pdo->prepare("SELECT * FROM propiedad_fotos WHERE propiedad_id = ? ORDER BY orden");
$fotos->execute([$id]);
$fotos = $fotos->fetchAll(PDO::FETCH_ASSOC);

$seccion = 'propiedades';
require_once 'header.php';
?>

<h1>Fotos: <?= htmlspecialchars($prop['titulo']) ?></h1>
<p class="subtitle">Agregá o eliminá fotos de la galería de esta propiedad</p>

<?php if (isset($mensaje)): ?><div class="alert alert-success"><?= $mensaje ?></div><?php endif; ?>
<?php if (isset($_GET['msg']) && $_GET['msg'] === 'eliminado'): ?><div class="alert alert-success">Foto eliminada.</div><?php endif; ?>

<div class="card">
  <h3>Agregar foto</h3>
  <form method="post" style="display:flex;gap:10px;align-items:end">
    <?= csrf_field() ?>
    <div class="form-group" style="flex:1;margin-bottom:0">
      <input name="nueva_foto" type="url" placeholder="https://images.unsplash.com/..." required>
      <small style="display:block;margin-top:4px;color:#888;font-size:0.78rem">Para que se vea nítida, usá una imagen de al menos 1600px de ancho.</small>
    </div>
    <button type="submit" class="btn btn-primary">+ Agregar</button>
  </form>
</div>

<div class="card">
  <h3>Galería actual (<?= count($fotos) ?> fotos)</h3>
  <?php if ($fotos): ?>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px">
      <?php foreach ($fotos as $f): ?>
        <div style="border:1px solid #eee;border-radius:10px;overflow:hidden;position:relative">
          <img src="<?= htmlspecialchars(optimizeImageUrl($f['url'], 400)) ?>" alt="" style="width:100%;height:140px;object-fit:cover;display:block">
          <div style="padding:8px 10px;display:flex;justify-content:space-between;align-items:center;font-size:0.78rem;color:#888">
            <span>#<?= $f['orden'] ?></span>
            <form method="post" style="display:inline" onsubmit="return confirm('¿Eliminar esta foto?')">
              <?= csrf_field() ?>
              <input type="hidden" name="eliminar_foto" value="<?= $f['id'] ?>">
              <button type="submit" class="btn btn-delete btn-sm"></button>
            </form>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
  <?php else: ?>
    <p style="color:#888">No hay fotos adicionales. La imagen principal se usará como única foto.</p>
  <?php endif; ?>
</div>

<p><a href="propiedades-editar.php?id=<?= $id ?>" class="btn btn-secondary">← Volver a editar propiedad</a></p>

<?php require_once 'footer.php'; ?>
