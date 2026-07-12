<?php
session_start();
require 'config/database.php';
require 'config/lenguaje.php';
require 'includes/img-helpers.php';

$id = (int) ($_GET['id'] ?? 0);
$stmt = $pdo->prepare("
    SELECT p.*,
           COALESCE(i.titulo, ies.titulo) AS titulo,
           COALESCE(i.ubicacion, ies.ubicacion) AS ubicacion,
           COALESCE(i.descripcion, ies.descripcion) AS descripcion
    FROM propiedades p
    LEFT JOIN propiedades_i18n i ON i.propiedad_id = p.id AND i.idioma = ?
    LEFT JOIN propiedades_i18n ies ON ies.propiedad_id = p.id AND ies.idioma = 'es'
    WHERE p.id = ?
");
$stmt->execute([$lang, $id]);
$prop = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$prop) { header('Location: index.php'); exit; }

$fotos = $pdo->prepare("SELECT * FROM propiedad_fotos WHERE propiedad_id = ? ORDER BY orden");
$fotos->execute([$id]);
$fotos = $fotos->fetchAll(PDO::FETCH_ASSOC);

$relacionadas = $pdo->prepare("
    SELECT p.*,
           COALESCE(i.titulo, ies.titulo) AS titulo,
           COALESCE(i.ubicacion, ies.ubicacion) AS ubicacion,
           (SELECT url FROM propiedad_fotos WHERE propiedad_id = p.id ORDER BY orden LIMIT 1) as primera_foto
    FROM propiedades p
    LEFT JOIN propiedades_i18n i ON i.propiedad_id = p.id AND i.idioma = ?
    LEFT JOIN propiedades_i18n ies ON ies.propiedad_id = p.id AND ies.idioma = 'es'
    WHERE p.id != ?
    ORDER BY RAND() LIMIT 3
");
$relacionadas->execute([$lang, $id]);
$relacionadas = $relacionadas->fetchAll(PDO::FETCH_ASSOC);

$precioMostrar = $prop['tipo'] === 'alquiler'
    ? 'USD ' . number_format((float)$prop['precio_usd'], 0) . '/mes'
    : 'USD ' . number_format((float)$prop['precio_usd'], 0);

$direccion = $prop['ubicacion_exacta'] ?: $prop['ubicacion'];

$totalFotos = count($fotos);
$primeraFoto = $fotos[0]['url'] ?? $prop['imagen'] ?: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1200&auto=format&fit=crop';
$primeraFoto = optimizeImageUrl($primeraFoto, 1600);
?>
<!DOCTYPE html>
<html lang="<?= $lang ?>">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= htmlspecialchars($prop['titulo']) ?> — Terra & Hogar</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{
    --cream: #FDFBF7; --cream-deep: #F6F1E9; --ink: #1F3D2E;
    --ink-soft: #3C5848; --coral: #E8623D; --coral-deep: #C94F2E;
    --gold: #D4A857; --line: rgba(31,61,46,0.12); --white: #ffffff;
    --font-display: 'Fraunces', serif; --font-body: 'Manrope', sans-serif;
  }
  *{margin:0;padding:0;box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{background:var(--cream);color:var(--ink);font-family:var(--font-body);line-height:1.5;-webkit-font-smoothing:antialiased}
  img{max-width:100%;display:block}
  a{color:inherit;text-decoration:none}
  .wrap{max-width:1180px;margin:0 auto;padding:0 32px}

  header{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(253,251,247,0.95);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
  .nav{display:flex;align-items:center;justify-content:space-between;padding:16px 32px;max-width:1180px;margin:0 auto}
  .logo{font-family:var(--font-display);font-weight:600;font-size:1.3rem;color:var(--ink);display:flex;align-items:baseline;gap:6px}
  .logo span{color:var(--coral);font-style:italic;font-weight:500}
  .nav a{font-size:0.9rem;font-weight:600;padding:8px 18px;border-radius:100px;transition:all .2s}
  .nav .volver{color:var(--ink-soft)}.nav .volver:hover{background:var(--cream-deep)}

  .hero{min-height:100vh;display:flex;flex-direction:column}
  .hero-top{position:relative;flex:1;min-height:70vh;overflow:hidden;transition:background .3s}
  .hero-top .slide-img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0;transition:opacity .4s ease}
  .hero-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(31,61,46,0.1) 0%,rgba(31,61,46,0.6) 80%,rgba(31,61,46,0.9) 100%)}
  .hero-content{position:absolute;bottom:0;left:0;right:0;padding:40px 32px 50px;color:#fff;z-index:2}
  .hero-content .wrap{max-width:1180px;margin:0 auto;padding:0}
  .hero-badge{display:inline-block;background:var(--coral);color:#fff;font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;padding:6px 14px;border-radius:100px;margin-bottom:16px}
  .hero-badge.alquiler{background:#3b82f6}
  .hero-content h1{font-family:var(--font-display);font-size:clamp(2rem,3.6vw,3.2rem);font-weight:600;line-height:1.1;max-width:700px}
  .hero-content .price{font-family:var(--font-display);font-size:clamp(1.4rem,2.2vw,2rem);font-weight:600;color:var(--gold);margin-top:12px}
  .hero-content .location{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:0.95rem;opacity:0.9}

  .nav-flecha{position:absolute;top:50%;z-index:5;transform:translateY(-50%);width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.2);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.3);color:#fff;font-size:1.4rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;opacity:0}
  .hero-top:hover .nav-flecha{opacity:1}
  .nav-flecha:hover{background:rgba(255,255,255,0.35)}
  .nav-flecha.izq{left:20px}
  .nav-flecha.der{right:20px}

  .thumbnails{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);z-index:5;display:flex;gap:8px;padding:6px 12px;border-radius:50px;background:rgba(0,0,0,0.4);backdrop-filter:blur(4px)}
  .thumbnails button{width:10px;height:10px;border-radius:50%;border:2px solid rgba(255,255,255,0.5);background:transparent;cursor:pointer;padding:0;transition:all .2s}
  .thumbnails button.activo{background:#fff;border-color:#fff;transform:scale(1.3)}

  .body-section{padding:60px 0}
  .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start}

  .features{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:40px}
  .feature-card{background:var(--white);border:1px solid var(--line);border-radius:14px;padding:20px;text-align:center}
  .feature-card .icon{font-size:1.8rem;margin-bottom:6px}
  .feature-card .num{font-family:var(--font-display);font-size:1.6rem;font-weight:600;color:var(--ink)}
  .feature-card .label{font-size:0.82rem;color:var(--ink-soft);margin-top:2px}

  .desc h2{font-family:var(--font-display);font-size:1.6rem;font-weight:600;margin-bottom:16px}
  .desc p{font-size:1.02rem;color:var(--ink-soft);line-height:1.7}
  .amenidades-tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
  .amenidad-tag{background:var(--cream-deep);border:1px solid var(--line);border-radius:100px;padding:6px 14px;font-size:0.82rem;font-weight:500;color:var(--ink-soft)}

  .info-card{background:var(--white);border:1px solid var(--line);border-radius:18px;padding:32px;position:sticky;top:100px}
  .info-card h3{font-family:var(--font-display);font-size:1.3rem;font-weight:600;margin-bottom:16px}
  .info-row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--line);font-size:0.92rem}
  .info-row:last-child{border-bottom:none}
  .info-row .lbl{color:var(--ink-soft)}
  .info-row .val{font-weight:600}
  .info-card .btn{display:block;width:100%;text-align:center;margin-top:20px}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:14px 28px;border-radius:100px;font-weight:700;font-size:0.98rem;cursor:pointer;border:none;transition:all .2s;font-family:inherit}
  .btn-primary{background:var(--coral);color:#fff}
  .btn-primary:hover{background:var(--coral-deep);transform:translateY(-2px)}
  .btn-wa{background:#25D366;color:#fff}
  .btn-wa:hover{background:#1ebe5b;transform:translateY(-2px)}
  .btn-ghost{background:transparent;color:var(--ink);border:1.5px solid var(--line)}
  .btn-ghost:hover{border-color:var(--ink)}

  .map-section{padding:60px 0;background:var(--cream-deep)}
  .map-section h2{font-family:var(--font-display);font-size:1.6rem;font-weight:600;margin-bottom:20px}
  .map-box{height:380px;border-radius:18px;overflow:hidden;border:1px solid var(--line)}
  .map-box iframe{width:100%;height:100%;border:0}

  .mas-props{padding:60px 0}
  .mas-props h2{font-family:var(--font-display);font-size:1.6rem;font-weight:600;margin-bottom:24px}
  .props-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
  .prop-card{background:var(--white);border:1px solid var(--line);border-radius:16px;overflow:hidden;transition:transform .25s,box-shadow .25s;display:block;color:inherit;text-decoration:none}
  .prop-card:hover{transform:translateY(-4px);box-shadow:0 16px 32px -12px rgba(31,61,46,0.18)}
  .prop-card img{width:100%;height:180px;object-fit:cover}
  .prop-card .body{padding:16px 18px 20px}
  .prop-card .body .tit{font-family:var(--font-display);font-size:1.05rem;font-weight:600;color:var(--ink)}
  .prop-card .body .precio{font-size:1.1rem;font-weight:700;color:var(--coral-deep);margin-top:6px}
  .prop-card .body .meta{font-size:0.82rem;color:var(--ink-soft);margin-top:4px}

  .contact-cta{background:var(--ink);color:#fff;border-radius:18px;padding:40px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-top:40px}
  .contact-cta p{font-size:1rem;max-width:350px;line-height:1.6;opacity:0.9}
  .contact-cta .btn-primary{background:var(--coral)}

  .lang-select{position:relative;display:inline-flex;align-items:center;gap:4px;cursor:pointer;font-size:0.85rem;color:var(--ink-soft);padding:4px 8px;border-radius:6px;transition:background .15s;user-select:none;}
  .lang-select:hover{background:rgba(31,61,46,0.06);}
  .lang-select .arrow{font-size:0.6rem;margin-left:2px;transition:transform .2s;}
  .lang-select.open .arrow{transform:rotate(180deg);}
  .lang-dropdown{position:absolute;top:calc(100% + 6px);right:0;background:var(--cream);border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 24px rgba(31,61,46,0.1);padding:4px;min-width:150px;display:none;z-index:200;font-family:var(--font-body);}
  .lang-dropdown.show{display:block;}
  .lang-dropdown a{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:6px;font-size:0.85rem;color:var(--ink);transition:background .15s;text-decoration:none;}
  .lang-dropdown a:hover{background:rgba(31,61,46,0.06);}
  .lang-dropdown a.activo{font-weight:700;color:var(--coral);}
  .slide-img{cursor:zoom-in}
  .lightbox{display:none;position:fixed;inset:0;z-index:300;background:rgba(0,0,0,0.88);align-items:center;justify-content:center}
  .lightbox.abierto{display:flex}
  .lightbox .lb-close{position:absolute;top:16px;right:20px;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.15);border:none;color:#fff;font-size:1.4rem;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:10;transition:background .2s}
  .lightbox .lb-close:hover{background:rgba(255,255,255,0.3)}
  .lightbox .lb-img{max-width:90vw;max-height:88vh;object-fit:contain;border-radius:6px;box-shadow:0 8px 40px rgba(0,0,0,0.4)}
  .lightbox .lb-nav{position:absolute;top:50%;transform:translateY(-50%);width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,0.12);border:none;color:#fff;font-size:1.6rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s;z-index:10}
  .lightbox .lb-nav:hover{background:rgba(255,255,255,0.3)}
  .lightbox .lb-nav.izq{left:16px}
  .lightbox .lb-nav.der{right:16px}
  .lightbox .lb-counter{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,0.7);font-size:0.85rem;background:rgba(0,0,0,0.5);padding:6px 16px;border-radius:100px;font-family:var(--font-body)}
  @media(max-width:600px){.lang-select .label-text{display:none;}.lang-dropdown{min-width:120px;}
    .lightbox .lb-nav{width:40px;height:40px;font-size:1.2rem}
    .lightbox .lb-nav.izq{left:6px}
    .lightbox .lb-nav.der{right:6px}
    .lightbox .lb-close{top:8px;right:10px;width:36px;height:36px;font-size:1.2rem}
  }
  @media(max-width:860px){
    .grid-2{grid-template-columns:1fr}
    .features{gap:10px}
    .info-card{position:static}
    .hero-content{padding:30px 20px 40px}
    .body-section{padding:40px 0}
    .props-grid{grid-template-columns:1fr;max-width:400px;margin:0 auto}
    .nav-flecha{opacity:1;width:40px;height:40px;font-size:1.1rem}
  }
</style>
</head>
<body>

<header>
  <nav class="nav" style="gap:8px">
    <a href="index.php" class="logo">Terra<span>&Hogar</span></a>
    <a href="index.php#propiedades" class="volver"><?= t('prop_volver') ?></a>
    <div style="margin-left:auto"></div>
    <div class="lang-select" id="langSelector" onclick="toggleLang(event)">
      <span class="label-text"><?php $map=['es'=>'','en'=>'','pt'=>'']; echo $map[$lang]??''; ?></span>
      <span class="arrow"></span>
      <div class="lang-dropdown" id="langDropdown">
        <a href="?lang=es&id=<?= $id ?>" class="<?= $lang==='es'?'activo':'' ?>"> <?= t('lang_es') ?></a>
        <a href="?lang=en&id=<?= $id ?>" class="<?= $lang==='en'?'activo':'' ?>"> <?= t('lang_en') ?></a>
        <a href="?lang=pt&id=<?= $id ?>" class="<?= $lang==='pt'?'activo':'' ?>"> <?= t('lang_pt') ?></a>
      </div>
    </div>
  </nav>
</header>

<main class="hero">
  <div class="hero-top" id="heroTop">
    <?php if ($fotos): ?>
      <?php foreach ($fotos as $i => $f): ?>
        <img class="slide-img" <?= unsplashSrcset($f['url'], 1600) ?> alt="Foto <?= $i+1 ?> de <?= htmlspecialchars($prop['titulo']) ?>" data-index="<?= $i ?>" style="opacity:<?= $i === 0 ? 1 : 0 ?>;z-index:<?= $i === 0 ? 1 : 0 ?>">
      <?php endforeach; ?>
    <?php else: ?>
      <img class="slide-img" <?= unsplashSrcset($primeraFoto, 1600) ?> alt="<?= htmlspecialchars($prop['titulo']) ?>" data-index="0" style="opacity:1;z-index:1">
    <?php endif; ?>
    <div class="hero-overlay"></div>

    <?php if ($totalFotos > 1): ?>
      <button class="nav-flecha izq" onclick="cambiarFoto(-1)" id="btnIzq">‹</button>
      <button class="nav-flecha der" onclick="cambiarFoto(1)" id="btnDer">›</button>
      <div class="thumbnails" id="dots">
        <?php for ($i = 0; $i < $totalFotos; $i++): ?>
          <button class="<?= $i === 0 ? 'activo' : '' ?>" onclick="irAFoto(<?= $i ?>)"></button>
        <?php endfor; ?>
      </div>
    <?php endif; ?>

    <div class="hero-content">
      <div class="wrap">
        <span class="hero-badge <?= $prop['tipo'] ?>"><?= $prop['tipo'] === 'venta' ? t('badge_venta') : t('badge_alquiler') ?></span>
        <h1><?= htmlspecialchars($prop['titulo']) ?></h1>
        <div class="price"><?= $precioMostrar ?></div>
        <div class="location"> <?= htmlspecialchars($direccion ?: $prop['ubicacion'] ?: t('listing_ciudad')) ?></div>
      </div>
    </div>
  </div>
</main>

<div class="body-section">
  <div class="wrap grid-2">
    <div>
      <div class="features">
        <?php if ($prop['categoria'] === 'terreno'): ?>
        <div class="feature-card">
          <div class="icon"></div>
          <div class="num"><?= htmlspecialchars($prop['uso_suelo'] ?: '—') ?></div>
          <div class="label"><?= t('prop_uso_suelo') ?></div>
        </div>
        <div class="feature-card">
          <div class="icon"></div>
          <div class="num" style="font-size:0.85rem"><?= htmlspecialchars($prop['titulacion'] ?: '—') ?></div>
          <div class="label"><?= t('prop_titulacion') ?></div>
        </div>
        <div class="feature-card">
          <div class="icon"></div>
          <div class="num"><?= (int)$prop['metros'] ?> <?= t('prop_metrosc') ?></div>
          <div class="label"><?= t('prop_superficie') ?></div>
        </div>
        <?php else: ?>
        <div class="feature-card">
          <div class="icon"></div>
          <div class="num"><?= (int)$prop['dormitorios'] ?></div>
          <div class="label"><?= t('prop_dormitorios') ?></div>
        </div>
        <div class="feature-card">
          <div class="icon"></div>
          <div class="num"><?= (int)$prop['banos'] ?></div>
          <div class="label"><?= t('prop_banos_label') ?></div>
        </div>
        <div class="feature-card">
          <div class="icon"></div>
          <div class="num"><?= (int)$prop['metros'] ?> <?= t('prop_metrosc') ?></div>
          <div class="label"><?= t('prop_superficie') ?></div>
        </div>
        <?php endif; ?>
      </div>

      <div class="desc">
        <h2><?= t('prop_descripcion_titulo') ?></h2>
        <p><?= nl2br(htmlspecialchars($prop['descripcion'] ?? t('prop_sin_descripcion'))) ?></p>
        <?php if ($prop['categoria'] !== 'terreno' && !empty($prop['amenidades'])): ?>
        <h2 style="margin-top:32px"><?= t('prop_amenidades') ?></h2>
        <div class="amenidades-tags">
          <?php
          foreach (explode(',', $prop['amenidades']) as $amen):
            $key = 'amenidad_' . trim($amen);
            $label = t($key, trim($amen));
          ?>
            <span class="amenidad-tag"><?= htmlspecialchars($label) ?></span>
          <?php endforeach; ?>
        </div>
        <?php endif; ?>
      </div>
    </div>

    <div>
      <div class="info-card">
        <h3><?= t('prop_detalles') ?></h3>
        <div class="info-row"><span class="lbl"><?= t('prop_precio_label') ?></span><span class="val"><?= $precioMostrar ?></span></div>
        <div class="info-row"><span class="lbl"><?= t('prop_tipo_label') ?></span><span class="val" style="text-transform:capitalize"><?= $prop['tipo'] === 'venta' ? t('badge_venta') : t('badge_alquiler') ?></span></div>
        <?php if ($prop['categoria'] === 'terreno'): ?>
        <div class="info-row"><span class="lbl"><?= t('prop_lote_label') ?></span><span class="val"><?= htmlspecialchars($prop['lote'] ?: '—') ?></span></div>
        <div class="info-row"><span class="lbl"><?= t('prop_uso_suelo') ?></span><span class="val" style="text-transform:capitalize"><?= htmlspecialchars($prop['uso_suelo'] ?: '—') ?></span></div>
        <div class="info-row"><span class="lbl"><?= t('prop_impuestos_label') ?></span><span class="val" style="text-transform:capitalize"><?php
          $imp = $prop['impuestos'] ?? '';
          echo $imp === 'al_dia' ? t('imp_al_dia') : ($imp === 'pendiente' ? t('imp_pendiente') : ($imp === 'exento' ? t('imp_exento') : '—'));
        ?></span></div>
        <div class="info-row"><span class="lbl"><?= t('prop_titulacion') ?></span><span class="val" style="text-transform:capitalize"><?php
          $tit = $prop['titulacion'] ?? '';
          echo $tit === 'escritura' ? t('tit_escritura') : ($tit === 'titulo' ? t('tit_titulo') : ($tit === 'contrato' ? t('tit_contrato') : ($tit === 'posesion' ? t('tit_posesion') : '—')));
        ?></span></div>
        <?php else: ?>
        <div class="info-row"><span class="lbl"><?= t('prop_dormitorios') ?></span><span class="val"><?= (int)$prop['dormitorios'] ?></span></div>
        <div class="info-row"><span class="lbl"><?= t('prop_banos_label') ?></span><span class="val"><?= (int)$prop['banos'] ?></span></div>
        <?php endif; ?>
        <div class="info-row"><span class="lbl"><?= t('prop_superficie') ?></span><span class="val"><?= (int)$prop['metros'] ?> <?= t('prop_metrosc') ?></span></div>
        <div class="info-row"><span class="lbl"><?= t('prop_ubicacion_label') ?></span><span class="val" style="text-align:right;font-size:0.85rem"><?= htmlspecialchars($prop['ubicacion'] ?? '—') ?></span></div>

        <a href="https://wa.me/595987172354?text=Hola!%20Vi%20la%20propiedad%20<?= urlencode($prop['titulo']) ?>%20y%20quiero%20saber%20m%C3%A1s." target="_blank" class="btn btn-wa">
          <?= t('prop_consultar_wa') ?>
        </a>
        <a href="index.php#contacto" class="btn btn-ghost" style="margin-top:10px"><?= t('prop_enviar_consulta') ?></a>
      </div>
    </div>
  </div>
</div>

<section class="mas-props">
  <div class="wrap">
    <h2> <?= t('prop_relacionadas') ?></h2>
    <div class="props-grid">
      <?php foreach ($relacionadas as $r): ?>
        <a href="propiedad.php?id=<?= $r['id'] ?>" class="prop-card">
          <img <?= unsplashSrcset($r['primera_foto'] ?: $r['imagen'] ?: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=800&auto=format&fit=crop', 700) ?> alt="<?= htmlspecialchars($r['titulo']) ?>" loading="lazy">
          <div class="body">
            <div class="tit"><?= htmlspecialchars($r['titulo']) ?></div>
            <div class="precio">USD <?= number_format((float)$r['precio_usd'], 0) ?><?= $r['tipo'] === 'alquiler' ? t('prop_alquiler_mes') : '' ?></div>
            <div class="meta"><?php if ($r['categoria'] === 'terreno'): ?><?= (int)$r['metros'] ?> <?= t('prop_metrosc') ?><?php else: ?><?= (int)$r['dormitorios'] ?> <?= t('prop_habitaciones') ?> · <?= (int)$r['banos'] ?> <?= t('prop_banos') ?> · <?= (int)$r['metros'] ?> <?= t('prop_metrosc') ?><?php endif; ?></div>
          </div>
        </a>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<section class="map-section" id="ubicacion">
  <div class="wrap">
    <h2> <?= t('prop_ubicacion_titulo') ?></h2>
    <div class="map-box">
      <iframe src="https://www.google.com/maps?q=<?= urlencode($direccion ?: 'Ciudad del Este, Paraguay') ?>&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Mapa de ubicación"></iframe>
    </div>
    <div class="contact-cta">
      <p><?= t('prop_cta_texto') ?></p>
      <a href="https://wa.me/595987172354?text=Hola!%20Vi%20la%20propiedad%20<?= urlencode($prop['titulo']) ?>%20y%20quiero%20saber%20m%C3%A1s." target="_blank" class="btn btn-primary"><?= t('prop_cta_boton') ?></a>
    </div>
  </div>
</section>

<a href="https://wa.me/595987172354" target="_blank" style="position:fixed;bottom:26px;right:26px;width:60px;height:60px;background:#25D366;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 14px 28px -8px rgba(37,211,102,0.6);z-index:90;transition:transform .2s" aria-label="Contactar por WhatsApp">
  <svg width="30" height="30" viewBox="0 0 24 24" fill="white"><path d="M17.6 6.32A8.86 8.86 0 0 0 12.05 3.5C7.1 3.5 3.1 7.5 3.1 12.45c0 1.74.5 3.36 1.37 4.74L3.5 21l3.92-1c1.34.74 2.86 1.16 4.5 1.16 4.95 0 8.95-4 8.95-8.95 0-2.4-.93-4.65-2.27-5.9zm-5.55 13.8c-1.41 0-2.73-.38-3.88-1.05l-.28-.16-2.32.6.62-2.26-.18-.29a7.32 7.32 0 0 1-1.13-3.91c0-4.06 3.3-7.36 7.37-7.36 1.97 0 3.81.77 5.2 2.16a7.3 7.3 0 0 1 2.16 5.2c0 4.07-3.3 7.37-7.36 7.37zm4.03-5.52c-.22-.11-1.3-.64-1.5-.72-.2-.07-.35-.11-.5.11-.14.22-.57.72-.7.86-.13.15-.26.16-.48.05-.22-.1-.93-.34-1.77-1.09-.65-.58-1.09-1.3-1.22-1.51-.13-.22-.01-.34.1-.46.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.32-.04-.43-.08-.11-.5-1.2-.68-1.64-.18-.43-.36-.37-.5-.38-.13-.01-.28-.01-.43-.01-.15 0-.39.06-.6.28-.21.22-.8.78-.8 1.9 0 1.13.82 2.21.93 2.37.11.15 1.55 2.37 3.77 3.22 1.87.72 2.25.58 2.66.54.4-.04 1.3-.53 1.49-1.04.18-.51.18-.94.13-1.04-.05-.1-.2-.16-.42-.27z"/></svg>
</a>

<div class="lightbox" id="lightbox" onclick="cerrarLightbox(event)">
  <button class="lb-close" onclick="cerrarLightbox()" aria-label="Cerrar"></button>
  <?php if ($totalFotos > 1): ?>
  <button class="lb-nav izq" onclick="cambiarFoto(-1)" aria-label="Anterior">‹</button>
  <button class="lb-nav der" onclick="cambiarFoto(1)" aria-label="Siguiente">›</button>
  <?php endif; ?>
  <img class="lb-img" id="lbImg" src="" alt="">
  <?php if ($totalFotos > 1): ?>
  <div class="lb-counter" id="lbCounter"></div>
  <?php endif; ?>
</div>

<?php
$fotosHd = array_map(function($url) { return optimizeImageUrl($url, 2000); }, array_column($fotos, 'url'));
?>

<script>
function toggleLang(e){e.stopPropagation();document.getElementById('langSelector').classList.toggle('open');document.getElementById('langDropdown').classList.toggle('show');}
document.addEventListener('click',function(e){var ls=document.getElementById('langSelector');if(!ls.contains(e.target)){ls.classList.remove('open');document.getElementById('langDropdown').classList.remove('show');}});
const fotos = <?= json_encode(array_map(function($url) { return optimizeImageUrl($url, 1600); }, array_column($fotos, 'url'))) ?>;
const fotosHd = <?= json_encode($fotosHd) ?>;
let actual = 0;

function cambiarFoto(dir) {
  const paso = dir;
  let nueva = actual + paso;
  if (nueva < 0) nueva = fotos.length - 1;
  if (nueva >= fotos.length) nueva = 0;
  irAFoto(nueva);
}

function irAFoto(idx) {
  if (idx === actual) return;
  document.querySelectorAll('.slide-img').forEach((img, i) => {
    img.style.opacity = i === idx ? '1' : '0';
    img.style.zIndex = i === idx ? '1' : '0';
  });
  document.querySelectorAll('.thumbnails button').forEach((btn, i) => {
    btn.classList.toggle('activo', i === idx);
  });
  actual = idx;
  var lb = document.getElementById('lightbox');
  if (lb.classList.contains('abierto')) {
    document.getElementById('lbImg').src = fotosHd[idx];
    var c = document.getElementById('lbCounter');
    if (c) c.textContent = (idx + 1) + ' / ' + fotosHd.length;
  }
}

function abrirLightbox(idx) {
  document.getElementById('lightbox').classList.add('abierto');
  document.body.style.overflow = 'hidden';
  document.getElementById('lbImg').src = fotosHd[idx];
  var c = document.getElementById('lbCounter');
  if (c) c.textContent = (idx + 1) + ' / ' + fotosHd.length;
}

function cerrarLightbox(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('lightbox').classList.remove('abierto');
  document.body.style.overflow = '';
}

if (fotosHd.length > 0) {
  document.querySelectorAll('.slide-img').forEach(function(img) {
    img.addEventListener('click', function() {
      abrirLightbox(parseInt(this.dataset.index));
    });
  });
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    var lb = document.getElementById('lightbox');
    if (lb.classList.contains('abierto')) cerrarLightbox();
    return;
  }
  if (e.key === 'ArrowLeft') cambiarFoto(-1);
  if (e.key === 'ArrowRight') cambiarFoto(1);
});

(function() {
  var lb = document.getElementById('lightbox');
  var startX = 0;
  lb.addEventListener('touchstart', function(e) {
    startX = e.changedTouches[0].screenX;
  }, {passive: true});
  lb.addEventListener('touchend', function(e) {
    var diff = e.changedTouches[0].screenX - startX;
    if (Math.abs(diff) > 50) {
      cambiarFoto(diff > 0 ? -1 : 1);
    }
  }, {passive: true});
})();
</script>

</body>
</html>
