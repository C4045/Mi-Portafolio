<?php
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/funciones.php';
requerir_admin();

$id = (int) ($_GET['id'] ?? 0);
$prop = $pdo->prepare("SELECT * FROM propiedades WHERE id = ?");
$prop->execute([$id]);
$prop = $prop->fetch(PDO::FETCH_ASSOC);
if (!$prop) { header('Location: propiedades.php'); exit; }

$error = '';
if ($_POST) {
    validar_csrf();
    $d = extraer_propiedad_post();
    $i18n = extraer_i18n_post();
    $error = validar_propiedad($d, $i18n);
    if ($error === '') {
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("UPDATE propiedades SET precio_usd = ?, dormitorios = ?, banos = ?, metros = ?, lote = ?, uso_suelo = ?, impuestos = ?, titulacion = ?, amenidades = ?, tipo = ?, categoria = ?, ubicacion_exacta = ?, imagen = ? WHERE id = ?");
            $stmt->execute([$d['precio_usd'], $d['dormitorios'], $d['banos'], $d['metros'], $d['lote'], $d['uso_suelo'], $d['impuestos'], $d['titulacion'], $d['amenidades'], $d['tipo'], $d['categoria'], $d['ubicacion_exacta'], $d['imagen'], $id]);
            guardar_i18n($pdo, $id, $i18n);
            $pdo->commit();
            header('Location: propiedades.php?msg=editado');
            exit;
        } catch (Exception $e) {
            $pdo->rollBack();
            $error = 'Error al guardar: ' . $e->getMessage();
        }
    }
}

$i18n_valores = $_POST ? extraer_i18n_post() : cargar_i18n($pdo, $id);

$seccion = 'propiedades';
require_once 'header.php';
?>

<h1>Editar propiedad</h1>
<p class="subtitle">Modificá los datos de la propiedad</p>

<div class="card">
  <?php if ($error): ?><div class="alert alert-error"><?= $error ?></div><?php endif; ?>
  <form method="post">
    <?= csrf_field() ?>

    <div class="form-group">
      <label>Idiomas</label>
      <?php render_lang_tabs($i18n_valores); ?>
    </div>

    <hr style="margin:20px 0;border:none;border-top:1px solid #eee">

    <div class="form-row">
      <div class="form-group">
        <label for="precio_usd">Precio USD *</label>
        <input id="precio_usd" name="precio_usd" type="text" value="<?= limpiar_output($_POST['precio_usd'] ?? $prop['precio_usd']) ?>" required>
      </div>
      <div class="form-group">
        <label for="tipo">Tipo</label>
        <select id="tipo" name="tipo">
          <option value="venta" <?= (($_POST['tipo'] ?? $prop['tipo']) === 'venta') ? 'selected' : '' ?>>En venta</option>
          <option value="alquiler" <?= (($_POST['tipo'] ?? $prop['tipo']) === 'alquiler') ? 'selected' : '' ?>>Alquiler</option>
        </select>
      </div>
      <div class="form-group">
        <label for="categoria">Categoría</label>
        <select id="categoria" name="categoria">
          <option value="casa" <?= (($_POST['categoria'] ?? $prop['categoria']) === 'casa') ? 'selected' : '' ?>>Casa</option>
          <option value="apartamento" <?= (($_POST['categoria'] ?? $prop['categoria']) === 'apartamento') ? 'selected' : '' ?>>Apartamento</option>
          <option value="local" <?= (($_POST['categoria'] ?? $prop['categoria']) === 'local') ? 'selected' : '' ?>>Local comercial</option>
          <option value="terreno" <?= (($_POST['categoria'] ?? $prop['categoria']) === 'terreno') ? 'selected' : '' ?>>Terreno</option>
          <option value="cabaña" <?= (($_POST['categoria'] ?? $prop['categoria']) === 'cabaña') ? 'selected' : '' ?>>Cabaña</option>
        </select>
      </div>
    </div>
    <div class="form-row" id="edif-fields">
      <div class="form-group">
        <label for="dormitorios">Dormitorios</label>
        <input id="dormitorios" name="dormitorios" type="number" min="0" value="<?= (int)($_POST['dormitorios'] ?? $prop['dormitorios']) ?>">
      </div>
      <div class="form-group">
        <label for="banos">Baños</label>
        <input id="banos" name="banos" type="number" min="0" value="<?= (int)($_POST['banos'] ?? $prop['banos']) ?>">
      </div>
      <div class="form-group">
        <label for="metros">Metros²</label>
        <input id="metros" name="metros" type="number" min="0" value="<?= (int)($_POST['metros'] ?? $prop['metros']) ?>">
      </div>
    </div>

    <div class="form-row" id="terreno-fields" style="display:none">
      <div class="form-group">
        <label for="lote">N° de lote / manzana</label>
        <input id="lote" name="lote" type="text" placeholder="Ej: Lote 12, Mz. 5" value="<?= limpiar_output($_POST['lote'] ?? $prop['lote'] ?? '') ?>">
      </div>
      <div class="form-group">
        <label for="uso_suelo">Uso de suelo</label>
        <select id="uso_suelo" name="uso_suelo">
          <option value="" <?= (($_POST['uso_suelo'] ?? $prop['uso_suelo'] ?? '') === '') ? 'selected' : '' ?>>Seleccioná...</option>
          <option value="residencial" <?= (($_POST['uso_suelo'] ?? $prop['uso_suelo'] ?? '') === 'residencial') ? 'selected' : '' ?>>Residencial</option>
          <option value="comercial" <?= (($_POST['uso_suelo'] ?? $prop['uso_suelo'] ?? '') === 'comercial') ? 'selected' : '' ?>>Comercial</option>
          <option value="mixto" <?= (($_POST['uso_suelo'] ?? $prop['uso_suelo'] ?? '') === 'mixto') ? 'selected' : '' ?>>Mixto (residencial + comercial)</option>
          <option value="industrial" <?= (($_POST['uso_suelo'] ?? $prop['uso_suelo'] ?? '') === 'industrial') ? 'selected' : '' ?>>Industrial</option>
          <option value="rural" <?= (($_POST['uso_suelo'] ?? $prop['uso_suelo'] ?? '') === 'rural') ? 'selected' : '' ?>>Rural</option>
        </select>
      </div>
      <div class="form-group">
        <label for="impuestos">Impuestos</label>
        <select id="impuestos" name="impuestos">
          <option value="" <?= (($_POST['impuestos'] ?? $prop['impuestos'] ?? '') === '') ? 'selected' : '' ?>>Seleccioná...</option>
          <option value="al_dia" <?= (($_POST['impuestos'] ?? $prop['impuestos'] ?? '') === 'al_dia') ? 'selected' : '' ?>>Al día</option>
          <option value="pendiente" <?= (($_POST['impuestos'] ?? $prop['impuestos'] ?? '') === 'pendiente') ? 'selected' : '' ?>>Pendiente</option>
          <option value="exento" <?= (($_POST['impuestos'] ?? $prop['impuestos'] ?? '') === 'exento') ? 'selected' : '' ?>>Exento</option>
        </select>
      </div>
      <div class="form-group">
        <label for="titulacion">Titulación</label>
        <select id="titulacion" name="titulacion">
          <option value="" <?= (($_POST['titulacion'] ?? $prop['titulacion'] ?? '') === '') ? 'selected' : '' ?>>Seleccioná...</option>
          <option value="escritura" <?= (($_POST['titulacion'] ?? $prop['titulacion'] ?? '') === 'escritura') ? 'selected' : '' ?>>Escritura pública</option>
          <option value="titulo" <?= (($_POST['titulacion'] ?? $prop['titulacion'] ?? '') === 'titulo') ? 'selected' : '' ?>>Título de propiedad</option>
          <option value="contrato" <?= (($_POST['titulacion'] ?? $prop['titulacion'] ?? '') === 'contrato') ? 'selected' : '' ?>>Contrato privado</option>
          <option value="posesion" <?= (($_POST['titulacion'] ?? $prop['titulacion'] ?? '') === 'posesion') ? 'selected' : '' ?>>Posesión</option>
        </select>
      </div>
    </div>

    <div class="form-group" id="amenidades-group">
      <label>Servicios y amenidades</label>
      <div class="amenidades-grid">
        <?php renderizar_amenidades_checkboxes($_POST['amenidades'] ?? $prop['amenidades'] ?? ''); ?>
      </div>
    </div>

<script>
document.getElementById('categoria').addEventListener('change', function() {
  var esTerreno = this.value === 'terreno';
  document.getElementById('edif-fields').style.display = esTerreno ? 'none' : 'flex';
  document.getElementById('terreno-fields').style.display = esTerreno ? 'flex' : 'none';
  document.getElementById('amenidades-group').style.display = esTerreno ? 'none' : 'block';
});
<?php if (($prop['categoria'] ?? '') === 'terreno'): ?>
document.getElementById('edif-fields').style.display = 'none';
document.getElementById('terreno-fields').style.display = 'flex';
document.getElementById('amenidades-group').style.display = 'none';
<?php endif; ?>
</script>
    <div class="form-group">
      <label for="ubicacion_exacta">Ubicación exacta (dirección)</label>
      <input id="ubicacion_exacta" name="ubicacion_exacta" type="text" value="<?= htmlspecialchars($_POST['ubicacion_exacta'] ?? $prop['ubicacion_exacta']) ?>">
    </div>
    <div class="form-group">
      <label for="imagen">URL de la imagen principal</label>
      <input id="imagen" name="imagen" type="url" value="<?= htmlspecialchars($_POST['imagen'] ?? $prop['imagen']) ?>">
    </div>
    <div style="display:flex;gap:10px">
      <button type="submit" class="btn btn-primary">Guardar cambios</button>
      <a href="propiedades-fotos.php?id=<?= $id ?>" class="btn btn-edit"> Gestionar fotos</a>
      <a href="propiedades.php" class="btn btn-secondary">Cancelar</a>
    </div>
  </form>
</div>

<script>
document.querySelectorAll('.lang-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.lang-tab').forEach(function(t) { t.classList.remove('activo'); });
    this.classList.add('activo');
    document.querySelectorAll('.lang-panel').forEach(function(p) { p.style.display = 'none'; });
    document.getElementById('lang_' + this.dataset.lang).style.display = 'block';
  });
});
</script>

<?php require_once 'footer.php'; ?>
