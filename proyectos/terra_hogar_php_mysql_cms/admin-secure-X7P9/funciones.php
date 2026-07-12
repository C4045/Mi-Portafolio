<?php
function limpiar_output(string $str): string {
    return htmlspecialchars($str, ENT_QUOTES, 'UTF-8');
}

function obtener_amenidades_lista(): array {
    return [
        'wifi' => 'WiFi',
        'aire' => 'Aire acondicionado',
        'lavanderia' => 'Lavandería',
        'cocina' => 'Cocina equipada',
        'estacionamiento' => 'Estacionamiento',
        'agua_caliente' => 'Agua caliente',
        'seguridad' => 'Seguridad 24h',
        'pileta' => 'Pileta',
        'quincho' => 'Quincho',
        'balcon' => 'Balcón',
        'ascensor' => 'Ascensor',
        'amoblado' => 'Amoblado',
        'terraza' => 'Patio / Terraza',
        'jardin' => 'Jardín',
        'portero' => 'Portero eléctrico',
        'gas' => 'Gas instalado',
        'calefaccion' => 'Calefacción',
        'agua' => 'Agua corriente',
        'electricidad' => 'Electricidad',
        'cable' => 'TV cable',
        'lavavajillas' => 'Lavavajillas',
        'microondas' => 'Microondas',
        'heladera' => 'Heladera',
        'lavarropa' => 'Lavarropa',
        'cochera' => 'Cochera cubierta',
        'parrilla' => 'Parrillero',
    ];
}

function renderizar_amenidades_checkboxes(string $seleccionadas = ''): void {
    $checked = explode(',', $seleccionadas);
    foreach (obtener_amenidades_lista() as $val => $label): ?>
        <label class="amenidad-check">
            <input type="checkbox" name="amenidades[]" value="<?= $val ?>" <?= in_array($val, $checked) ? 'checked' : '' ?>>
            <span><?= $label ?></span>
        </label>
    <?php endforeach;
}

function validar_propiedad(array $data, array $i18n = []): string {
    $precio = str_replace(',', '.', trim($data['precio_usd'] ?? ''));
    if ($precio === '') {
        return 'Completá todos los campos obligatorios.';
    }
    if (!is_numeric($precio) || $precio <= 0) {
        return 'El precio debe ser un número válido.';
    }
    $es_titulo = trim($i18n['es']['titulo'] ?? '');
    if ($es_titulo === '') {
        return 'El título en español es obligatorio.';
    }
    return '';
}

function extraer_propiedad_post(): array {
    return [
        'precio_usd'     => str_replace(',', '.', trim($_POST['precio_usd'] ?? '')),
        'imagen'         => trim($_POST['imagen'] ?? ''),
        'tipo'           => $_POST['tipo'] ?? 'venta',
        'categoria'      => $_POST['categoria'] ?? 'casa',
        'ubicacion_exacta' => trim($_POST['ubicacion_exacta'] ?? ''),
        'dormitorios'    => (int) ($_POST['dormitorios'] ?? 0),
        'banos'          => (int) ($_POST['banos'] ?? 0),
        'metros'         => (int) ($_POST['metros'] ?? 0),
        'lote'           => trim($_POST['lote'] ?? ''),
        'uso_suelo'      => trim($_POST['uso_suelo'] ?? ''),
        'impuestos'      => trim($_POST['impuestos'] ?? ''),
        'titulacion'     => trim($_POST['titulacion'] ?? ''),
        'amenidades'     => isset($_POST['amenidades']) ? implode(',', $_POST['amenidades']) : '',
    ];
}

function extraer_i18n_post(): array {
    $idiomas = ['es', 'en', 'pt'];
    $data = [];
    foreach ($idiomas as $lang) {
        $data[$lang] = [
            'titulo'      => trim($_POST["i18n_{$lang}_titulo"] ?? ''),
            'descripcion' => trim($_POST["i18n_{$lang}_descripcion"] ?? ''),
            'ubicacion'   => trim($_POST["i18n_{$lang}_ubicacion"] ?? ''),
        ];
    }
    return $data;
}

function guardar_i18n(PDO $pdo, int $propiedad_id, array $i18n): void {
    $stmt = $pdo->prepare(
        "INSERT INTO propiedades_i18n (propiedad_id, idioma, titulo, descripcion, ubicacion)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE titulo = VALUES(titulo), descripcion = VALUES(descripcion), ubicacion = VALUES(ubicacion)"
    );
    foreach ($i18n as $lang => $campos) {
        $stmt->execute([$propiedad_id, $lang, $campos['titulo'], $campos['descripcion'], $campos['ubicacion']]);
    }
}

function cargar_i18n(PDO $pdo, int $propiedad_id): array {
    $stmt = $pdo->prepare("SELECT * FROM propiedades_i18n WHERE propiedad_id = ?");
    $stmt->execute([$propiedad_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $data = ['es' => ['titulo' => '', 'descripcion' => '', 'ubicacion' => ''],
             'en' => ['titulo' => '', 'descripcion' => '', 'ubicacion' => ''],
             'pt' => ['titulo' => '', 'descripcion' => '', 'ubicacion' => '']];
    foreach ($rows as $r) {
        $data[$r['idioma']] = [
            'titulo'      => $r['titulo'] ?? '',
            'descripcion' => $r['descripcion'] ?? '',
            'ubicacion'   => $r['ubicacion'] ?? '',
        ];
    }
    return $data;
}

function render_lang_tabs(array $i18n, string $prefix = ''): void {
    $idiomas = ['es' => ' Español', 'en' => ' English', 'pt' => ' Português'];
    ?>
    <div class="lang-tabs">
      <?php foreach ($idiomas as $code => $label): ?>
        <button type="button" class="lang-tab <?= $code === 'es' ? 'activo' : '' ?>" data-lang="<?= $code ?>"><?= $label ?></button>
      <?php endforeach; ?>
    </div>
    <?php foreach ($idiomas as $code => $label):
      $v = $i18n[$code] ?? ['titulo' => '', 'descripcion' => '', 'ubicacion' => ''];
      $lang_id = $prefix . 'lang_' . $code;
    ?>
    <div class="lang-panel" id="<?= $lang_id ?>" style="<?= $code === 'es' ? '' : 'display:none' ?>">
      <div class="form-group">
        <label for="i18n_<?= $code ?>_titulo">Título <?= $code === 'es' ? '*' : '' ?></label>
        <input id="i18n_<?= $code ?>_titulo" name="i18n_<?= $code ?>_titulo" type="text" placeholder="Ej: Av. Las Lomas 342" value="<?= limpiar_output($v['titulo']) ?>" <?= $code === 'es' ? 'required' : '' ?>>
      </div>
      <div class="form-group">
        <label for="i18n_<?= $code ?>_ubicacion">Ubicación</label>
        <input id="i18n_<?= $code ?>_ubicacion" name="i18n_<?= $code ?>_ubicacion" type="text" placeholder="Ej: Barrio San Rafael · Ciudad del Este" value="<?= limpiar_output($v['ubicacion']) ?>">
      </div>
      <div class="form-group">
        <label for="i18n_<?= $code ?>_descripcion">Descripción</label>
        <textarea id="i18n_<?= $code ?>_descripcion" name="i18n_<?= $code ?>_descripcion" placeholder="Descripción detallada..."><?= htmlspecialchars($v['descripcion']) ?></textarea>
      </div>
    </div>
    <?php endforeach;
}
