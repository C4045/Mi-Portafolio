<?php
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/funciones.php';
requerir_admin();

$claves_traducibles = ['hero_titulo', 'hero_descripcion', 'about_texto'];
$claves_fijas = ['contacto_email', 'contacto_telefono'];
$idiomas = ['es', 'en', 'pt'];

if ($_POST) {
    validar_csrf();
    foreach ($claves_fijas as $clave) {
        $valor = trim($_POST[$clave] ?? '');
        $stmt = $pdo->prepare("INSERT INTO contenido (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)");
        $stmt->execute([$clave, $valor]);
    }
    foreach ($claves_traducibles as $base) {
        foreach ($idiomas as $lang) {
            $clave = $base . '_' . $lang;
            $valor = trim($_POST[$clave] ?? '');
            if ($lang === 'es') {
                $stmt = $pdo->prepare("INSERT INTO contenido (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)");
                $stmt->execute([$clave, $valor]);
                $stmt = $pdo->prepare("INSERT INTO contenido (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)");
                $stmt->execute([$base, $valor]);
            } else {
                if ($valor !== '') {
                    $stmt = $pdo->prepare("INSERT INTO contenido (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)");
                    $stmt->execute([$clave, $valor]);
                }
            }
        }
    }
    $mensaje = 'Contenido actualizado correctamente.';
}

$todas_claves = array_merge($claves_fijas, $claves_traducibles);
foreach ($claves_traducibles as $base) {
    foreach ($idiomas as $lang) {
        $todas_claves[] = $base . '_' . $lang;
    }
}
$valores = [];
foreach ($todas_claves as $clave) {
    $stmt = $pdo->prepare("SELECT valor FROM contenido WHERE clave = ?");
    $stmt->execute([$clave]);
    $valores[$clave] = $stmt->fetchColumn() ?: '';
}
$i18n = [];
foreach ($claves_traducibles as $base) {
    foreach ($idiomas as $lang) {
        $clave = $base . '_' . $lang;
        $i18n[$base][$lang] = $valores[$clave] ?? '';
    }
}

$seccion = 'contenido';
require_once 'header.php';
?>

<h1>Contenido de la página</h1>
<p class="subtitle">Editá los textos principales de la landing page desde acá</p>

<?php if (isset($mensaje)): ?><div class="alert alert-success"><?= $mensaje ?></div><?php endif; ?>

<div class="card">
  <form method="post">
    <?= csrf_field() ?>

    <div class="form-group">
      <label>Idiomas</label>
      <div class="lang-tabs">
        <button type="button" class="lang-tab activo" data-lang="es"> Español</button>
        <button type="button" class="lang-tab" data-lang="en"> English</button>
        <button type="button" class="lang-tab" data-lang="pt"> Português</button>
      </div>
      <?php foreach ($idiomas as $lang): ?>
      <div class="lang-panel" id="lang_<?= $lang ?>" style="<?= $lang === 'es' ? '' : 'display:none' ?>">
        <div class="form-group">
          <label for="hero_titulo_<?= $lang ?>">Título del Hero <?= $lang === 'es' ? '*' : '' ?></label>
          <input id="hero_titulo_<?= $lang ?>" name="hero_titulo_<?= $lang ?>" type="text" value="<?= htmlspecialchars($i18n['hero_titulo'][$lang]) ?>" <?= $lang === 'es' ? 'required' : '' ?>>
        </div>
        <div class="form-group">
          <label for="hero_descripcion_<?= $lang ?>">Descripción del Hero <?= $lang === 'es' ? '*' : '' ?></label>
          <textarea id="hero_descripcion_<?= $lang ?>" name="hero_descripcion_<?= $lang ?>"><?= htmlspecialchars($i18n['hero_descripcion'][$lang]) ?></textarea>
        </div>
        <div class="form-group">
          <label for="about_texto_<?= $lang ?>">Texto "Sobre nosotros" <?= $lang === 'es' ? '*' : '' ?></label>
          <textarea id="about_texto_<?= $lang ?>" name="about_texto_<?= $lang ?>"><?= htmlspecialchars($i18n['about_texto'][$lang]) ?></textarea>
        </div>
      </div>
      <?php endforeach; ?>
    </div>

    <hr style="margin:20px 0;border:none;border-top:1px solid #eee">

    <div class="form-row">
      <div class="form-group">
        <label for="contacto_email">Email de contacto</label>
        <input id="contacto_email" name="contacto_email" type="email" value="<?= htmlspecialchars($valores['contacto_email']) ?>">
      </div>
      <div class="form-group">
        <label for="contacto_telefono">Teléfono de contacto</label>
        <input id="contacto_telefono" name="contacto_telefono" type="text" value="<?= htmlspecialchars($valores['contacto_telefono']) ?>">
      </div>
    </div>

    <button type="submit" class="btn btn-primary">Guardar cambios</button>
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
