<?php
session_start();
require 'config/database.php';
require 'config/lenguaje.php';
require 'includes/img-helpers.php';

$propiedades_stmt = $pdo->prepare("
    SELECT p.*,
           COALESCE(i.titulo, ies.titulo) AS titulo,
           COALESCE(i.ubicacion, ies.ubicacion) AS ubicacion,
           COALESCE(i.descripcion, ies.descripcion) AS descripcion,
           (SELECT url FROM propiedad_fotos WHERE propiedad_id = p.id ORDER BY orden LIMIT 1) as primera_foto
    FROM propiedades p
    LEFT JOIN propiedades_i18n i ON i.propiedad_id = p.id AND i.idioma = ?
    LEFT JOIN propiedades_i18n ies ON ies.propiedad_id = p.id AND ies.idioma = 'es'
    ORDER BY p.id DESC
");
$propiedades_stmt->execute([$lang]);
$propiedades = $propiedades_stmt->fetchAll(PDO::FETCH_ASSOC);
$categorias = $pdo->query("SELECT DISTINCT categoria FROM propiedades WHERE categoria != '' ORDER BY categoria")->fetchAll(PDO::FETCH_COLUMN);
$tipos = $pdo->query("SELECT DISTINCT tipo FROM propiedades ORDER BY tipo")->fetchAll(PDO::FETCH_COLUMN);
$filtros = array_merge(['todas'], $categorias, array_map(function($t) { return $t === 'venta' ? 'venta' : 'alquiler'; }, $tipos));
$filtros = array_unique($filtros);

$contenido = [];
$stmt = $pdo->query("SELECT clave, valor FROM contenido");
foreach ($stmt as $row) {
    $contenido[$row['clave']] = $row['valor'];
}
?>
<!DOCTYPE html>
<html lang="<?= $lang ?>">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= t('site_title') ?></title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{
    --cream: #FDFBF7;
    --cream-deep: #F6F1E9;
    --ink: #1F3D2E;
    --ink-soft: #3C5848;
    --coral: #E8623D;
    --coral-deep: #C94F2E;
    --gold: #D4A857;
    --line: rgba(31,61,46,0.12);
    --white: #ffffff;

    --font-display: 'Fraunces', serif;
    --font-body: 'Manrope', sans-serif;
  }

  *{margin:0;padding:0;box-sizing:border-box;}

  html{scroll-behavior:smooth;}

  body{
    background:var(--cream);
    color:var(--ink);
    font-family:var(--font-body);
    line-height:1.5;
    -webkit-font-smoothing:antialiased;
  }

  img{max-width:100%;display:block;}

  a{color:inherit;text-decoration:none;}

  .wrap{
    max-width:1180px;
    margin:0 auto;
    padding:0 32px;
  }

  /* ---------- focus visibility ---------- */
  a:focus-visible, button:focus-visible, input:focus-visible, textarea:focus-visible{
    outline:2px solid var(--coral);
    outline-offset:3px;
  }

  @media (prefers-reduced-motion: reduce){
    *{animation-duration:0.01ms !important; animation-iteration-count:1 !important; transition-duration:0.01ms !important; scroll-behavior:auto !important;}
  }

  /* ================= HEADER ================= */
  header{
    position:fixed;
    top:0; left:0; right:0;
    z-index:100;
    background:rgba(253,251,247,0.88);
    backdrop-filter:blur(10px);
    border-bottom:1px solid var(--line);
  }
  .nav{
    display:flex;
    align-items:center;
    justify-content:space-between;
    padding:18px 32px;
    max-width:1180px;
    margin:0 auto;
  }
  .logo{
    font-family:var(--font-display);
    font-weight:600;
    font-size:1.45rem;
    letter-spacing:-0.01em;
    color:var(--ink);
    display:flex;
    align-items:baseline;
    gap:6px;
  }
  .logo span{color:var(--coral);font-style:italic;font-weight:500;}
  .nav-links{
    display:flex;
    gap:36px;
    font-size:0.95rem;
    font-weight:600;
  }
  .nav-links a{
    position:relative;
    padding:4px 0;
    transition:color .2s;
  }
  .nav-links a::after{
    content:"";
    position:absolute;
    left:0; bottom:-2px;
    width:0; height:2px;
    background:var(--coral);
    transition:width .25s ease;
  }
  .nav-links a:hover::after{width:100%;}
  .nav-cta{
    background:var(--ink);
    color:var(--cream) !important;
    padding:11px 22px;
    border-radius:100px;
    font-size:0.9rem;
    font-weight:700;
    transition:background .2s, transform .2s;
  }
  .nav-cta:hover{background:var(--coral-deep); transform:translateY(-1px);}
  .nav-toggle{display:none;}

  @media (max-width: 860px){
    .nav-links{display:none;}
    .nav-toggle{
      display:block;
      background:none;
      border:none;
      font-size:1.6rem;
      cursor:pointer;
      color:var(--ink);
    }
  }

  /* ================= HERO ================= */
  .hero{
    position:relative;
    min-height:100vh;
    display:flex;
    align-items:center;
    padding:140px 0 80px;
    overflow:hidden;
  }
  .hero::before{
    content:"";
    position:absolute;
    top:-20%; right:-10%;
    width:55%;
    height:140%;
    background:radial-gradient(circle, rgba(232,98,61,0.10) 0%, rgba(232,98,61,0) 70%);
    z-index:0;
  }
  .hero-grid{
    display:grid;
    grid-template-columns:1.1fr 1fr;
    gap:60px;
    align-items:center;
    position:relative;
    z-index:1;
  }
  .eyebrow{
    display:inline-flex;
    align-items:center;
    gap:8px;
    font-size:0.85rem;
    font-weight:700;
    letter-spacing:0.06em;
    text-transform:uppercase;
    color:var(--coral-deep);
    margin-bottom:22px;
  }
  .eyebrow::before{
    content:"";
    width:7px; height:7px;
    border-radius:50%;
    background:var(--coral);
  }
  .hero h1{
    font-family:var(--font-display);
    font-weight:600;
    font-size:clamp(2.6rem, 4.8vw, 4.1rem);
    line-height:1.04;
    letter-spacing:-0.01em;
    color:var(--ink);
  }
  .hero h1 em{
    font-style:italic;
    font-weight:500;
    color:var(--coral);
  }
  .hero p.lead{
    margin-top:26px;
    font-size:1.15rem;
    color:var(--ink-soft);
    max-width:480px;
    line-height:1.65;
  }
  .hero-actions{
    margin-top:38px;
    display:flex;
    gap:16px;
    flex-wrap:wrap;
  }
  .btn{
    display:inline-flex;
    align-items:center;
    gap:8px;
    padding:16px 30px;
    border-radius:100px;
    font-weight:700;
    font-size:0.98rem;
    cursor:pointer;
    border:none;
    transition:transform .2s, box-shadow .2s, background .2s;
  }
  .btn-primary{
    background:var(--coral);
    color:#fff;
    box-shadow:0 10px 24px -8px rgba(232,98,61,0.55);
  }
  .btn-primary:hover{background:var(--coral-deep); transform:translateY(-2px);}
  .btn-ghost{
    background:transparent;
    color:var(--ink);
    border:1.5px solid var(--line);
  }
  .btn-ghost:hover{border-color:var(--ink); background:var(--white);}

  .hero-stats{
    display:flex;
    gap:36px;
    margin-top:54px;
    flex-wrap:wrap;
  }
  .hero-stats div{display:flex; flex-direction:column;}
  .hero-stats strong{
    font-family:var(--font-display);
    font-size:1.9rem;
    font-weight:600;
    color:var(--ink);
  }
  .hero-stats span{
    font-size:0.82rem;
    color:var(--ink-soft);
    margin-top:2px;
  }

  .hero-visual{
    position:relative;
  }
  .hero-card-main{
    border-radius:22px;
    overflow:hidden;
    box-shadow:0 30px 60px -20px rgba(31,61,46,0.35);
    position:relative;
  }
  .hero-card-main img{
    width:100%;
    height:480px;
    object-fit:cover;
  }
  .floating-tag{
    position:absolute;
    background:var(--white);
    border-radius:16px;
    padding:16px 20px;
    box-shadow:0 16px 32px -12px rgba(31,61,46,0.25);
    display:flex;
    align-items:center;
    gap:12px;
  }
  .floating-tag.price{
    bottom:-28px;
    left:-30px;
  }
  .floating-tag.verified{
    top:24px;
    right:-26px;
  }
  .floating-tag .icon{
    width:38px;height:38px;
    border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    flex-shrink:0;
  }
  .floating-tag.price .icon{background:rgba(212,168,87,0.18); color:var(--gold);}
  .floating-tag.verified .icon{background:rgba(31,61,46,0.1); color:var(--ink);}
  .floating-tag strong{display:block; font-size:0.95rem; font-family:var(--font-display); font-weight:600;}
  .floating-tag span{font-size:0.74rem; color:var(--ink-soft);}

  @media (max-width:900px){
    .hero-grid{grid-template-columns:1fr; text-align:left;}
    .hero{padding-top:120px;}
    .hero-card-main img{height:340px;}
    .floating-tag{position:static; margin-top:14px; display:inline-flex;}
    .floating-tag.verified{margin-left:12px;}
  }

  /* ================= SECTION HEADERS ================= */
  .section{padding:110px 0;}
  .section-head{
    max-width:620px;
    margin-bottom:60px;
  }
  .section-eyebrow{
    font-size:0.82rem;
    font-weight:700;
    letter-spacing:0.06em;
    text-transform:uppercase;
    color:var(--coral-deep);
    margin-bottom:14px;
    display:block;
  }
  .section-head h2{
    font-family:var(--font-display);
    font-weight:600;
    font-size:clamp(2rem, 3.4vw, 2.7rem);
    line-height:1.12;
    color:var(--ink);
  }
  .section-head p{
    margin-top:16px;
    color:var(--ink-soft);
    font-size:1.05rem;
    line-height:1.65;
  }
  .alt-bg{background:var(--cream-deep);}

  /* ================= PROPIEDADES ================= */
  .listings{
    display:grid;
    grid-template-columns:repeat(3, 1fr);
    gap:28px;
  }
  .listing-card{
    background:var(--white);
    border-radius:20px;
    overflow:hidden;
    border:1px solid var(--line);
    transition:transform .25s ease, box-shadow .25s ease;
  }
  .listing-card:hover{
    transform:translateY(-6px);
    box-shadow:0 24px 40px -16px rgba(31,61,46,0.22);
  }
  .listing-photo{
    position:relative;
    height:230px;
    overflow:hidden;
  }
  .listing-photo img{
    width:100%; height:100%; object-fit:cover;
    transition:transform .5s ease;
  }
  .listing-card:hover .listing-photo img{transform:scale(1.06);}
  .listing-badge{
    position:absolute;
    top:14px; left:14px;
    background:var(--ink);
    color:var(--cream);
    font-size:0.72rem;
    font-weight:700;
    text-transform:uppercase;
    letter-spacing:0.04em;
    padding:6px 12px;
    border-radius:100px;
  }
  .listing-badge.venta{background:var(--coral);}
  .listing-body{padding:24px 24px 26px;}
  .listing-address{
    font-family:var(--font-display);
    font-size:1.3rem;
    font-weight:600;
    color:var(--ink);
    line-height:1.25;
  }
  .listing-area{
    color:var(--ink-soft);
    font-size:0.88rem;
    margin-top:4px;
  }
  .listing-meta{
    display:flex;
    gap:18px;
    margin-top:16px;
    padding-top:16px;
    border-top:1px solid var(--line);
    font-size:0.85rem;
    color:var(--ink-soft);
  }
  .listing-meta span{display:flex; align-items:center; gap:6px;}
  .listing-price{
    margin-top:18px;
    display:flex;
    align-items:baseline;
    justify-content:space-between;
  }
  .listing-price strong{
    font-family:var(--font-display);
    font-size:1.5rem;
    font-weight:600;
    color:var(--coral-deep);
  }
  .listing-link{
    font-size:0.85rem;
    font-weight:700;
    color:var(--ink);
    border-bottom:1.5px solid var(--ink);
    padding-bottom:2px;
  }

  .tab-btn{
    padding:8px 18px;border-radius:100px;border:1.5px solid var(--line);
    background:transparent;color:var(--ink-soft);font-size:0.85rem;
    font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit;
  }
  .tab-btn:hover{border-color:var(--coral);color:var(--coral)}
  .tab-btn.activo{background:var(--coral);color:#fff;border-color:var(--coral)}

  @media (max-width:980px){
    .listings{grid-template-columns:repeat(2,1fr);}
  }
  @media (max-width:680px){
    .listings{grid-template-columns:1fr;}
  }

  /* ================= GALERIA ================= */
  .gallery{
    display:grid;
    grid-template-columns:repeat(4, 1fr);
    grid-template-rows:repeat(2, 220px);
    gap:16px;
  }
  .gallery a{
    display:block;
    border-radius:16px;
    overflow:hidden;
    position:relative;
  }
  .gallery img{
    width:100%;height:100%;object-fit:cover;
    transition:transform .5s ease;
  }
  .gallery a:hover img{transform:scale(1.07);}
  .gallery a::after{
    content:"";
    position:absolute; inset:0;
    background:linear-gradient(180deg, rgba(31,61,46,0) 50%, rgba(31,61,46,0.45) 100%);
    opacity:0;
    transition:opacity .3s ease;
  }
  .gallery a:hover::after{opacity:1;}
  .gallery .g-tag{
    position:absolute;
    bottom:14px; left:16px;
    color:#fff;
    font-size:0.85rem;
    font-weight:700;
    opacity:0;
    transform:translateY(8px);
    transition:opacity .3s, transform .3s;
    z-index:2;
  }
  .gallery a:hover .g-tag{opacity:1; transform:translateY(0);}
  .gallery .span2{grid-column:span 2;}
  .gallery .span-row2{grid-row:span 2;}

  @media (max-width:900px){
    .gallery{grid-template-columns:repeat(2,1fr); grid-template-rows:repeat(4,180px);}
    .gallery .span2{grid-column:span 1;}
    .gallery .span-row2{grid-row:span 1;}
  }

  /* ================= PRECIOS / PLANES ================= */
  .plans{
    display:grid;
    grid-template-columns:repeat(3,1fr);
    gap:24px;
    align-items:stretch;
  }
  .plan-card{
    background:var(--white);
    border:1.5px solid var(--line);
    border-radius:22px;
    padding:38px 32px;
    display:flex;
    flex-direction:column;
  }
  .plan-card.featured{
    background:var(--ink);
    border-color:var(--ink);
    color:var(--cream);
    position:relative;
    transform:translateY(-12px);
    box-shadow:0 30px 50px -20px rgba(31,61,46,0.4);
  }
  .plan-tag{
    position:absolute;
    top:-13px; right:32px;
    background:var(--gold);
    color:var(--ink);
    font-size:0.72rem;
    font-weight:800;
    text-transform:uppercase;
    letter-spacing:0.04em;
    padding:6px 14px;
    border-radius:100px;
  }
  .plan-name{
    font-family:var(--font-display);
    font-size:1.4rem;
    font-weight:600;
  }
  .plan-desc{
    font-size:0.9rem;
    margin-top:8px;
    opacity:0.75;
  }
  .plan-price{
    margin-top:28px;
    display:flex;
    align-items:baseline;
    gap:6px;
  }
  .plan-price strong{
    font-family:var(--font-display);
    font-size:2.6rem;
    font-weight:600;
  }
  .plan-price span{
    font-size:0.88rem;
    opacity:0.7;
  }
  .plan-list{
    list-style:none;
    margin-top:30px;
    flex-grow:1;
    display:flex;
    flex-direction:column;
    gap:14px;
  }
  .plan-list li{
    font-size:0.93rem;
    display:flex;
    align-items:flex-start;
    gap:10px;
  }
  .plan-list li::before{
    content:"";
    font-weight:800;
    color:var(--coral);
    flex-shrink:0;
  }
  .plan-card.featured .plan-list li::before{color:var(--gold);}
  .plan-card .btn{
    margin-top:32px;
    justify-content:center;
    width:100%;
  }
  .plan-card .btn-ghost{border-color:var(--line); color:var(--ink);}
  .plan-card.featured .btn-ghost{border-color:rgba(253,251,247,0.3); color:var(--cream);}

  @media (max-width:900px){
    .plans{grid-template-columns:1fr; max-width:420px; margin:0 auto;}
    .plan-card.featured{transform:none;}
  }

  /* ================= RESEÑAS ================= */
  .reviews-row{
    display:grid;
    grid-template-columns:repeat(3,1fr);
    gap:24px;
  }
  .review-card{
    background:var(--white);
    border-radius:20px;
    padding:32px 28px;
    border:1px solid var(--line);
  }
  .stars{color:var(--gold); font-size:0.95rem; letter-spacing:2px;}
  .review-text{
    margin-top:16px;
    font-size:0.98rem;
    color:var(--ink);
    line-height:1.6;
  }
  .review-who{
    margin-top:22px;
    display:flex;
    align-items:center;
    gap:12px;
  }
  .review-avatar{
    width:42px;height:42px;
    border-radius:50%;
    background:var(--cream-deep);
    display:flex;align-items:center;justify-content:center;
    font-family:var(--font-display);
    font-weight:600;
    color:var(--coral-deep);
  }
  .review-who strong{font-size:0.92rem; display:block;}
  .review-who span{font-size:0.78rem; color:var(--ink-soft);}

  @media (max-width:900px){
    .reviews-row{grid-template-columns:1fr;}
  }

  /* ================= CONTACTO ================= */
  .contact-grid{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:50px;
    align-items:start;
  }
  .contact-info h2{margin-bottom:10px;}
  .contact-channel{
    display:flex;
    align-items:center;
    gap:16px;
    padding:18px 0;
    border-bottom:1px solid var(--line);
  }
  .contact-channel .icon{
    width:46px;height:46px;
    border-radius:50%;
    background:var(--cream-deep);
    display:flex;align-items:center;justify-content:center;
    flex-shrink:0;
  }
  .contact-channel strong{display:block; font-size:0.98rem;}
  .contact-channel span{font-size:0.85rem; color:var(--ink-soft);}

  .whatsapp-cta{
    margin-top:28px;
    background:#1F3D2E;
    color:var(--cream);
    border-radius:18px;
    padding:26px 28px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:16px;
    flex-wrap:wrap;
  }
  .whatsapp-cta p{font-size:0.95rem; max-width:280px; line-height:1.5;}
  .whatsapp-cta .btn-primary{background:#25D366; box-shadow:0 10px 24px -8px rgba(37,211,102,0.5);}
  .whatsapp-cta .btn-primary:hover{background:#1ebe5b;}

  .contact-form{
    background:var(--white);
    border:1px solid var(--line);
    border-radius:22px;
    padding:38px;
  }
  .form-row{margin-bottom:20px;}
  .form-row label{
    display:block;
    font-size:0.85rem;
    font-weight:700;
    margin-bottom:8px;
    color:var(--ink);
  }
  .form-row input, .form-row textarea, .form-row select{
    width:100%;
    padding:13px 16px;
    border-radius:10px;
    border:1.5px solid var(--line);
    background:var(--cream);
    font-family:var(--font-body);
    font-size:0.95rem;
    color:var(--ink);
    transition:border-color .2s;
  }
  .form-row input:focus, .form-row textarea:focus, .form-row select:focus{
    border-color:var(--coral);
    outline:none;
  }
  .form-row textarea{resize:vertical; min-height:100px;}
  .form-grid-2{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:16px;
  }
  .contact-form .btn-primary{width:100%; justify-content:center; margin-top:6px;}

  @media (max-width:900px){
    .contact-grid{grid-template-columns:1fr;}
    .form-grid-2{grid-template-columns:1fr;}
  }

  /* ================= UBICACION ================= */
  .map-wrap{
    border-radius:22px;
    overflow:hidden;
    border:1px solid var(--line);
    position:relative;
    height:420px;
  }
  .map-wrap iframe{width:100%; height:100%; border:0; filter:saturate(0.9);}
  .map-overlay{
    position:absolute;
    bottom:24px; left:24px;
    background:var(--white);
    border-radius:16px;
    padding:20px 24px;
    box-shadow:0 16px 32px -12px rgba(31,61,46,0.3);
    max-width:280px;
  }
  .map-overlay strong{font-family:var(--font-display); font-size:1.1rem;}
  .map-overlay p{font-size:0.85rem; color:var(--ink-soft); margin-top:6px; line-height:1.5;}

  /* ================= FOOTER ================= */
  footer{
    background:var(--ink);
    color:var(--cream);
    padding:64px 0 32px;
  }
  .footer-grid{
    display:grid;
    grid-template-columns:1.4fr 1fr 1fr 1fr;
    gap:40px;
    padding-bottom:40px;
    border-bottom:1px solid rgba(253,251,247,0.12);
  }
  .footer-logo{
    font-family:var(--font-display);
    font-size:1.5rem;
    font-weight:600;
  }
  .footer-logo span{color:var(--coral); font-style:italic; font-weight:500;}
  .footer-grid p{font-size:0.9rem; opacity:0.7; margin-top:14px; max-width:260px; line-height:1.6;}
  .footer-col h4{font-size:0.85rem; text-transform:uppercase; letter-spacing:0.05em; opacity:0.55; margin-bottom:16px;}
  .footer-col a{display:block; font-size:0.92rem; opacity:0.85; margin-bottom:10px; transition:opacity .2s;}
  .footer-col a:hover{opacity:1; color:var(--coral);}
  .footer-bottom{
    display:flex;
    justify-content:space-between;
    padding-top:28px;
    font-size:0.82rem;
    opacity:0.6;
    flex-wrap:wrap;
    gap:10px;
  }

  @media (max-width:780px){
    .footer-grid{grid-template-columns:1fr 1fr;}
  }

  /* ================= SELECTOR IDIOMA ================= */
  .lang-select{position:relative;display:inline-flex;align-items:center;gap:4px;cursor:pointer;font-size:0.85rem;color:var(--ink-soft);padding:4px 8px;border-radius:6px;transition:background .15s;user-select:none;}
  .lang-select:hover{background:var(--ink);background:rgba(31,61,46,0.06);}
  .lang-select .arrow{font-size:0.6rem;margin-left:2px;transition:transform .2s;}
  .lang-select.open .arrow{transform:rotate(180deg);}
  .lang-dropdown{position:absolute;top:calc(100% + 6px);right:0;background:var(--cream);border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 24px rgba(31,61,46,0.1);padding:4px;min-width:150px;display:none;z-index:200;}
  .lang-dropdown.show{display:block;}
  .lang-dropdown a{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:6px;font-size:0.85rem;color:var(--ink);transition:background .15s;text-decoration:none;}
  .lang-dropdown a:hover{background:rgba(31,61,46,0.06);}
  .lang-dropdown a.activo{font-weight:700;color:var(--coral);}
  @media(max-width:600px){.lang-select .label-text{display:none;}.lang-dropdown{min-width:120px;}}
  /* ================= WHATSAPP FLOAT ================= */
  .wa-float{
    position:fixed;
    bottom:26px; right:26px;
    width:60px; height:60px;
    background:#25D366;
    border-radius:50%;
    display:flex;
    align-items:center;
    justify-content:center;
    box-shadow:0 14px 28px -8px rgba(37,211,102,0.6);
    z-index:90;
    transition:transform .2s;
  }
  .wa-float:hover{transform:scale(1.08);}
</style>
</head>
<body>

<header>
  <nav class="nav">
    <a href="#top" class="logo">Terra<span>&Hogar</span></a>
    <div class="nav-links">
      <a href="#propiedades"><?= t('nav_propiedades') ?></a>
      <a href="#galeria"><?= t('nav_galeria') ?></a>
      <a href="#planes"><?= t('nav_planes') ?></a>
      <a href="#resenas"><?= t('nav_resenas') ?></a>
      <a href="#ubicacion"><?= t('nav_ubicacion') ?></a>
    </div>
    <a href="#contacto" class="nav-cta"><?= t('nav_contactar') ?></a>
    <div class="lang-select" id="langSelector" onclick="toggleLang(event)">
      <span class="label-text"><?php $map=['es'=>'','en'=>'','pt'=>'']; echo $map[$lang]??''; ?></span>
      <span class="arrow"></span>
      <div class="lang-dropdown" id="langDropdown">
        <a href="?lang=es" class="<?= $lang==='es'?'activo':'' ?>"> <?= t('lang_es') ?></a>
        <a href="?lang=en" class="<?= $lang==='en'?'activo':'' ?>"> <?= t('lang_en') ?></a>
        <a href="?lang=pt" class="<?= $lang==='pt'?'activo':'' ?>"> <?= t('lang_pt') ?></a>
      </div>
    </div>
  </nav>
</header>

<main id="top">

  <!-- ============ HERO ============ -->
  <section class="hero">
    <div class="wrap hero-grid">
      <div>
        <span class="eyebrow"><?= t('hero_eyebrow') ?></span>
        <h1><?= strip_tags($contenido['hero_titulo_' . $lang] ?? $contenido['hero_titulo_es'] ?? $contenido['hero_titulo'] ?? t('hero_titulo_default'), '<br><em><strong>') ?></h1>
        <p class="lead"><?= htmlspecialchars($contenido['hero_descripcion_' . $lang] ?? $contenido['hero_descripcion_es'] ?? $contenido['hero_descripcion'] ?? t('hero_descripcion_default')) ?></p>
        <div class="hero-actions">
          <a href="#propiedades" class="btn btn-primary"><?= t('hero_btn_ver') ?></a>
          <a href="#contacto" class="btn btn-ghost"><?= t('hero_btn_asesor') ?></a>
        </div>
        <div class="hero-stats">
          <div><strong>180+</strong><span><?= t('hero_stats_vendidas') ?></span></div>
          <div><strong>12</strong><span><?= t('hero_stats_experiencia') ?></span></div>
          <div><strong>4.9</strong><span><?= t('hero_stats_calificacion') ?></span></div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="hero-card-main">
          <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=900&auto=format&fit=crop" alt="<?= t('hero_img_alt') ?>">
        </div>
        <div class="floating-tag price">
          <div class="icon">$</div>
          <div><strong>USD 185.000</strong><span><?= t('hero_tag_desde') ?></span></div>
        </div>
        <div class="floating-tag verified">
          <div class="icon"></div>
          <div><strong><?= t('hero_tag_verificada') ?></strong><span><?= t('hero_tag_documentacion') ?></span></div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ PROPIEDADES DESTACADAS ============ -->
  <section class="section" id="propiedades">
    <div class="wrap">
      <div class="section-head">
        <span class="section-eyebrow"><?= t('prop_eyebrow') ?></span>
        <h2><?= t('prop_titulo') ?></h2>
        <p><?= t('prop_descripcion') ?></p>
      </div>

      <div class="filtros-tabs" style="display:flex;gap:8px;margin-bottom:28px;flex-wrap:wrap">
        <button class="tab-btn activo" data-filtro="todas" onclick="filtrar('todas')"><?= t('filtro_todas') ?></button>
        <button class="tab-btn" data-filtro="venta" onclick="filtrar('venta')"><?= t('filtro_venta') ?></button>
        <button class="tab-btn" data-filtro="alquiler" onclick="filtrar('alquiler')"><?= t('filtro_alquiler') ?></button>
        <button class="tab-btn" data-filtro="casa" onclick="filtrar('casa')"><?= t('filtro_casas') ?></button>
        <button class="tab-btn" data-filtro="apartamento" onclick="filtrar('apartamento')"><?= t('filtro_apartamentos') ?></button>
        <button class="tab-btn" data-filtro="local" onclick="filtrar('local')"><?= t('filtro_locales') ?></button>
        <button class="tab-btn" data-filtro="terreno" onclick="filtrar('terreno')"><?= t('filtro_terrenos') ?></button>
        <?php if (in_array('cabaña', $categorias)): ?><button class="tab-btn" data-filtro="cabaña" onclick="filtrar('cabaña')"><?= t('filtro_cabanas') ?></button><?php endif; ?>
      </div>

      <div class="listings" id="listaProps">
        <?php if ($propiedades): ?>
          <?php foreach ($propiedades as $p):
            $cats = [$p['tipo'], $p['categoria']];
          ?>
            <a href="propiedad.php?id=<?= $p['id'] ?>" class="listing-card" data-cats="<?= implode(' ', $cats) ?>" style="display:block;text-decoration:none;color:inherit">
              <div class="listing-photo">
                <span class="listing-badge <?= $p['tipo'] === 'venta' ? 'venta' : '' ?>"><?= $p['tipo'] === 'venta' ? t('badge_venta') : t('badge_alquiler') ?></span>
                <img <?= unsplashSrcset($p['primera_foto'] ?: $p['imagen'] ?: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=800&auto=format&fit=crop', 700) ?> alt="<?= htmlspecialchars($p['titulo']) ?>" loading="lazy">
              </div>
              <div class="listing-body">
                <div class="listing-address"><?= htmlspecialchars($p['titulo']) ?></div>
                <div class="listing-area"><?= htmlspecialchars($p['ubicacion'] ?: t('listing_ciudad')) ?></div>
                <div class="listing-meta">
                  <?php if ($p['categoria'] === 'terreno'): ?>
                  <span> <?= (int)$p['metros'] ?> <?= t('listing_metros') ?></span>
                  <?php if ($p['uso_suelo']): ?><span style="text-transform:capitalize"><?= htmlspecialchars($p['uso_suelo']) ?></span><?php endif; ?>
                  <?php else: ?>
                  <span> <?= (int)$p['dormitorios'] ?> <?= t('listing_hab') ?></span>
                  <span> <?= (int)$p['banos'] ?> <?= t('listing_banos') ?></span>
                  <span> <?= (int)$p['metros'] ?> <?= t('listing_metros') ?></span>
                  <?php endif; ?>
                </div>
                <div class="listing-price">
                  <strong>USD <?= number_format((float)$p['precio_usd'], 0) ?><?= $p['tipo'] === 'alquiler' ? t('listing_alquiler_mes') : '' ?></strong>
                  <span class="listing-link"><?= t('listing_ver_mas') ?></span>
                </div>
              </div>
            </a>
          <?php endforeach; ?>
        <?php else: ?>
          <p style="color:var(--ink-soft);grid-column:1/-1;text-align:center;padding:40px 0"><?= t('listing_no_hay') ?></p>
        <?php endif; ?>
      </div>
    </div>
  </section>

  <!-- ============ GALERIA ============ -->
  <section class="section alt-bg" id="galeria">
    <div class="wrap">
      <div class="section-head">
        <span class="section-eyebrow"><?= t('galeria_eyebrow') ?></span>
        <h2><?= t('galeria_titulo') ?></h2>
        <p><?= t('galeria_descripcion') ?></p>
      </div>

      <div class="gallery">
        <a href="#" class="span2 span-row2">
          <img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=900&auto=format&fit=crop" alt="<?= t('galeria_img_living') ?>">
          <span class="g-tag"><?= t('galeria_living') ?></span>
        </a>
        <a href="#">
          <img src="https://images.unsplash.com/photo-1556912173-3bb406ef7e77?q=80&w=600&auto=format&fit=crop" alt="<?= t('galeria_img_cocina') ?>">
          <span class="g-tag"><?= t('galeria_cocina') ?></span>
        </a>
        <a href="#">
          <img src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=600&auto=format&fit=crop" alt="<?= t('galeria_img_dormitorio') ?>">
          <span class="g-tag"><?= t('galeria_dormitorio') ?></span>
        </a>
        <a href="#">
          <img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop" alt="<?= t('galeria_img_bano') ?>">
          <span class="g-tag"><?= t('galeria_bano') ?></span>
        </a>
        <a href="#" class="span2">
          <img src="https://images.unsplash.com/photo-1572331165267-854da2b10ccf?q=80&w=900&auto=format&fit=crop" alt="<?= t('galeria_img_patio') ?>">
          <span class="g-tag"><?= t('galeria_patio') ?></span>
        </a>
      </div>
    </div>
  </section>

  <!-- ============ SOBRE NOSOTROS ============ -->
  <section class="section alt-bg" id="about">
    <div class="wrap">
      <div class="section-head">
        <span class="section-eyebrow"><?= t('about_titulo') ?></span>
        <h2><?= t('about_titulo') ?></h2>
        <p><?= nl2br(htmlspecialchars($contenido['about_texto_' . $lang] ?? $contenido['about_texto_es'] ?? $contenido['about_texto'] ?? '')) ?></p>
      </div>
    </div>
  </section>

  <!-- ============ PLANES ============ -->
  <section class="section" id="planes">
    <div class="wrap">
      <div class="section-head">
        <span class="section-eyebrow"><?= t('planes_eyebrow') ?></span>
        <h2><?= t('planes_titulo') ?></h2>
        <p><?= t('planes_descripcion') ?></p>
      </div>

      <div class="plans">

        <div class="plan-card">
          <div class="plan-name"><?= t('plan_basico_nombre') ?></div>
          <p class="plan-desc"><?= t('plan_basico_desc') ?></p>
          <div class="plan-price"><strong><?= t('plan_basico_precio') ?></strong><span><?= t('plan_basico_precio_label') ?></span></div>
          <ul class="plan-list">
            <li><?= t('plan_basico_item1') ?></li>
            <li><?= t('plan_basico_item2') ?></li>
            <li><?= t('plan_basico_item3') ?></li>
          </ul>
          <a href="#contacto" class="btn btn-ghost"><?= t('plan_basico_btn') ?></a>
        </div>

        <div class="plan-card featured">
          <span class="plan-tag"><?= t('plan_destacado_tag') ?></span>
          <div class="plan-name"><?= t('plan_destacado_nombre') ?></div>
          <p class="plan-desc"><?= t('plan_destacado_desc') ?></p>
          <div class="plan-price"><strong><?= t('plan_destacado_precio') ?></strong><span><?= t('plan_destacado_precio_label') ?></span></div>
          <ul class="plan-list">
            <li><?= t('plan_destacado_item1') ?></li>
            <li><?= t('plan_destacado_item2') ?></li>
            <li><?= t('plan_destacado_item3') ?></li>
            <li><?= t('plan_destacado_item4') ?></li>
          </ul>
          <a href="#contacto" class="btn btn-primary"><?= t('plan_destacado_btn') ?></a>
        </div>

        <div class="plan-card">
          <div class="plan-name"><?= t('plan_gestion_nombre') ?></div>
          <p class="plan-desc"><?= t('plan_gestion_desc') ?></p>
          <div class="plan-price"><strong><?= t('plan_gestion_precio') ?></strong><span><?= t('plan_gestion_precio_label') ?></span></div>
          <ul class="plan-list">
            <li><?= t('plan_gestion_item1') ?></li>
            <li><?= t('plan_gestion_item2') ?></li>
            <li><?= t('plan_gestion_item3') ?></li>
          </ul>
          <a href="#contacto" class="btn btn-ghost"><?= t('plan_gestion_btn') ?></a>
        </div>

      </div>
    </div>
  </section>

  <!-- ============ RESEÑAS ============ -->
  <section class="section alt-bg" id="resenas">
    <div class="wrap">
      <div class="section-head">
        <span class="section-eyebrow"><?= t('resenas_eyebrow') ?></span>
        <h2><?= t('resenas_titulo') ?></h2>
      </div>

      <div class="reviews-row">

        <div class="review-card">
          <div class="stars"></div>
          <p class="review-text">Nos ayudaron a encontrar la casa en menos de un mes. La comunicación por WhatsApp hizo todo mucho más simple.</p>
          <div class="review-who">
            <div class="review-avatar">M</div>
            <div><strong>Mariela Acosta</strong><span>Compró en San Rafael</span></div>
          </div>
        </div>

        <div class="review-card">
          <div class="stars"></div>
          <p class="review-text">El plan de gestión completa valió cada centavo. Se encargaron de la negociación y el papeleo sin que tuviéramos que preocuparnos.</p>
          <div class="review-who">
            <div class="review-avatar">R</div>
            <div><strong>Rodrigo Ferreira</strong><span>Vendió su departamento</span></div>
          </div>
        </div>

        <div class="review-card">
          <div class="stars"></div>
          <p class="review-text">Muy transparentes con los precios y los tiempos. Nunca sentí que me estaban apurando para decidir.</p>
          <div class="review-who">
            <div class="review-avatar">L</div>
            <div><strong>Lucía Benítez</strong><span>Alquiló en el centro</span></div>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- ============ CONTACTO ============ -->
  <section class="section" id="contacto">
    <?php if (isset($_GET['ok'])): ?>
      <div class="wrap" style="margin-bottom:20px;background:#d4edda;border:1px solid #c3e6cb;color:#155724;border-radius:12px;padding:14px 20px;font-weight:600;"><?= t('form_ok') ?></div>
    <?php elseif (isset($_GET['error'])): ?>
      <div class="wrap" style="margin-bottom:20px;background:#f8d7da;border:1px solid #f5c6cb;color:#721c24;border-radius:12px;padding:14px 20px;font-weight:600;"><?= t('form_error') ?></div>
    <?php endif; ?>
    <div class="wrap contact-grid">
      <div class="contact-info">
        <span class="section-eyebrow"><?= t('contacto_eyebrow') ?></span>
        <h2><?= t('contacto_titulo') ?></h2>
        <p style="color:var(--ink-soft); margin-top:10px;"><?= t('contacto_descripcion') ?></p>

        <div class="contact-channel">
          <div class="icon"></div>
          <div><strong><?= t('contacto_oficina_label') ?></strong><span><?= t('contacto_oficina_direccion') ?></span></div>
        </div>
        <div class="contact-channel">
          <div class="icon"></div>
          <div><strong><?= htmlspecialchars($contenido['contacto_email'] ?? 'contacto@terrayhogar.com.py') ?></strong><span><?= t('contacto_email_label') ?></span></div>
        </div>
        <div class="contact-channel">
          <div class="icon"></div>
          <div><strong><?= t('contacto_horario_label') ?></strong><span><?= t('contacto_horario_valor') ?></span></div>
        </div>

        <div class="whatsapp-cta">
          <p><?= t('contacto_whatsapp_texto') ?></p>
          <a href="https://wa.me/595987172354" target="_blank" class="btn btn-primary"><?= t('contacto_whatsapp_btn') ?></a>
        </div>
      </div>

<?php
  $a = random_int(1, 9);
  $b = random_int(1, 9);
  $_SESSION['captcha_result'] = $a + $b;
?>
      <form class="contact-form" action="guardar_contacto.php" method="POST">
        <div style="position:absolute;left:-9999px"><input name="_trap" type="text" tabindex="-1" autocomplete="off"></div>
        <div class="form-grid-2">
          <div class="form-row">
            <label for="nombre"><?= t('form_nombre_label') ?></label>
            <input id="nombre" name="nombre" type="text" placeholder="<?= t('form_nombre_placeholder') ?>" required>
          </div>
          <div class="form-row">
            <label for="telefono"><?= t('form_telefono_label') ?></label>
            <input id="telefono" name="telefono" type="tel" placeholder="<?= t('form_telefono_placeholder') ?>" required>
          </div>
        </div>
        <div class="form-row">
          <label for="interes"><?= t('form_interes_label') ?></label>
          <select id="interes" name="interes">
            <option><?= t('form_interes_option1') ?></option>
            <option><?= t('form_interes_option2') ?></option>
            <option><?= t('form_interes_option3') ?></option>
            <option><?= t('form_interes_option4') ?></option>
          </select>
        </div>
        <div class="form-row">
          <label for="mensaje"><?= t('form_mensaje_label') ?></label>
          <textarea id="mensaje" name="mensaje" placeholder="<?= t('form_mensaje_placeholder') ?>" required></textarea>
        </div>
        <div class="form-row">
          <label for="_captcha"><?= sprintf(t('form_captcha_label'), $a, $b) ?></label>
          <input id="_captcha" name="_captcha" type="number" required placeholder="<?= t('form_captcha_placeholder') ?>">
        </div>
        <button type="submit" class="btn btn-primary"><?= t('form_enviar') ?></button>
      </form>
    </div>
  </section>

  <!-- ============ UBICACION ============ -->
  <section class="section alt-bg" id="ubicacion">
    <div class="wrap">
      <div class="section-head">
        <span class="section-eyebrow"><?= t('ubicacion_eyebrow') ?></span>
        <h2><?= t('ubicacion_titulo') ?></h2>
      </div>
      <div class="map-wrap">
        <iframe
          src="https://www.google.com/maps?q=Ciudad%20del%20Este%2C%20Paraguay&output=embed"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          title="<?= t('ubicacion_mapa_title') ?>">
        </iframe>
        <div class="map-overlay">
          <strong>Terra & Hogar</strong>
          <p><?= t('ubicacion_direccion') ?></p>
        </div>
      </div>
    </div>
  </section>

</main>

<footer>
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <div class="footer-logo">Terra<span>&Hogar</span></div>
        <p><?= t('footer_descripcion') ?></p>
      </div>
      <div class="footer-col">
        <h4><?= t('footer_navegacion') ?></h4>
        <a href="#propiedades"><?= t('nav_propiedades') ?></a>
        <a href="#galeria"><?= t('nav_galeria') ?></a>
        <a href="#planes"><?= t('nav_planes') ?></a>
        <a href="#resenas"><?= t('nav_resenas') ?></a>
      </div>
      <div class="footer-col">
        <h4><?= t('footer_contacto') ?></h4>
        <a href="https://wa.me/595987172354">WhatsApp</a>
        <a href="mailto:contacto@terrayhogar.com.py">Email</a>
        <a href="#ubicacion"><?= t('nav_ubicacion') ?></a>
      </div>
      <div class="footer-col">
        <h4><?= t('footer_redes') ?></h4>
        <a href="#">Instagram</a>
        <a href="#">Facebook</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span><?= t('footer_copyright') ?></span>
      <span><?= t('footer_paraguay') ?></span>
    </div>
  </div>
</footer>

<a href="https://wa.me/595987172354" target="_blank" class="wa-float" aria-label="<?= t('wa_float_aria') ?>">
  <svg width="30" height="30" viewBox="0 0 24 24" fill="white"><path d="M17.6 6.32A8.86 8.86 0 0 0 12.05 3.5C7.1 3.5 3.1 7.5 3.1 12.45c0 1.74.5 3.36 1.37 4.74L3.5 21l3.92-1c1.34.74 2.86 1.16 4.5 1.16 4.95 0 8.95-4 8.95-8.95 0-2.4-.93-4.65-2.27-5.9zm-5.55 13.8c-1.41 0-2.73-.38-3.88-1.05l-.28-.16-2.32.6.62-2.26-.18-.29a7.32 7.32 0 0 1-1.13-3.91c0-4.06 3.3-7.36 7.37-7.36 1.97 0 3.81.77 5.2 2.16a7.3 7.3 0 0 1 2.16 5.2c0 4.07-3.3 7.37-7.36 7.37zm4.03-5.52c-.22-.11-1.3-.64-1.5-.72-.2-.07-.35-.11-.5.11-.14.22-.57.72-.7.86-.13.15-.26.16-.48.05-.22-.1-.93-.34-1.77-1.09-.65-.58-1.09-1.3-1.22-1.51-.13-.22-.01-.34.1-.46.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.32-.04-.43-.08-.11-.5-1.2-.68-1.64-.18-.43-.36-.37-.5-.38-.13-.01-.28-.01-.43-.01-.15 0-.39.06-.6.28-.21.22-.8.78-.8 1.9 0 1.13.82 2.21.93 2.37.11.15 1.55 2.37 3.77 3.22 1.87.72 2.25.58 2.66.54.4-.04 1.3-.53 1.49-1.04.18-.51.18-.94.13-1.04-.05-.1-.2-.16-.42-.27z"/></svg>
</a>

</body>
</html>

<script>
function filtrar(filtro){
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('activo', b.dataset.filtro === filtro));
  document.querySelectorAll('#listaProps .listing-card').forEach(card => {
    const cats = card.dataset.cats || '';
    card.style.display = (filtro === 'todas' || cats.includes(filtro)) ? 'block' : 'none';
  });
}
function toggleLang(e){
  e.stopPropagation();
  document.getElementById('langSelector').classList.toggle('open');
  document.getElementById('langDropdown').classList.toggle('show');
}
document.addEventListener('click', function(){
  var sel = document.getElementById('langSelector');
  if(sel){ sel.classList.remove('open'); document.getElementById('langDropdown').classList.remove('show'); }
});
</script>
