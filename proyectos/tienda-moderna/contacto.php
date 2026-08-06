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

    if (strlen($datos['nombre']) < 2)   $err = __('nombre_requerido');
    elseif (!filter_var($datos['email'], FILTER_VALIDATE_EMAIL)) $err = __('email_invalido');
    elseif (strlen($datos['mensaje']) < 10) $err = __('mensaje_corto');
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
            $msg = ' ' . __('mensaje_enviado');
            $datos = [];
        } else {
            $err = __('error_enviar');
        }
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title> <?= __('contacto') ?> | <?= __('tienda_nombre') ?></title>
    
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <script>(function(){var m=localStorage.getItem('modo');if(m==='claro'){document.documentElement.classList.add('light-mode')}})();</script>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1> <?= __('contacto') ?></h1>
      <div class="header-actions">
        <button class="btn-modo" id="btnModo" onclick="toggleModo()" title="<?= __('cambiar_modo') ?>"></button>
        <div class="header-lang-currency">
          <div class="lang-hamburger">
            <button class="lang-hamburger-btn" onclick="toggleLang(event)" title="<?= $idioma_actual ?>">
              <img src="<?= $bandera_actual ?>" alt="<?= $lang_code ?>"> <span></span>
            </button>
            <div class="lang-hamburger-dropdown" id="langDrop">
              <a href="#" onclick="return cl('es')" class="lang-option <?= $lang_code==='es'?'lang-active':'' ?>"><img src="img/paraguay%20icono%20.png" alt=""> Español</a>
              <a href="#" onclick="return cl('en')" class="lang-option <?= $lang_code==='en'?'lang-active':'' ?>"><img src="img/eeuu%20icono.png" alt=""> English</a>
              <a href="#" onclick="return cl('pt')" class="lang-option <?= $lang_code==='pt'?'lang-active':'' ?>"><img src="img/brasil%20icono.png" alt=""> Português</a>
            </div>
          </div>
          <select class="moneda-select" onchange="var p=new URLSearchParams(location.search);p.set('moneda',this.value);location.search=p.toString()"><option value="Gs." <?= $moneda_sel==='Gs.'?'selected':'' ?>>Gs.</option><option value="USD" <?= $moneda_sel==='USD'?'selected':'' ?>>US$</option><option value="BRL" <?= $moneda_sel==='BRL'?'selected':'' ?>>R$</option><option value="EUR" <?= $moneda_sel==='EUR'?'selected':'' ?>>€</option></select>
        </div>
        <a href="<?= isset($_SESSION['cliente_email']) ? 'perfil.php' : 'login_cliente.php' ?>" class="btn-profile" title="<?= isset($_SESSION['cliente_email']) ? __('mi_perfil') : __('iniciar_sesion') ?>"></a>
        <a href="mis_pedidos.php" class="btn-volver"> <?= __('mis_pedidos') ?></a>
        <a href="index.php" class="btn-volver">← <?= __('volver_tienda') ?></a>
      </div>
    </div>
    <script>
    function toggleModo(){var h=document.documentElement,b=document.getElementById('btnModo');h.classList.toggle('light-mode');var c=h.classList.contains('light-mode');localStorage.setItem('modo',c?'claro':'oscuro');b.textContent=c?'':''}
    function toggleLang(e){e.stopPropagation();document.getElementById('langDrop').classList.toggle('abierto')}
    function cl(l){var p=new URLSearchParams(location.search);p.set('lang',l);location.search=p.toString();return false}
    document.addEventListener('click',function(){var d=document.getElementById('langDrop');if(d)d.classList.remove('abierto')})
    document.addEventListener('DOMContentLoaded',function(){var b=document.getElementById('btnModo');if(b&&document.documentElement.classList.contains('light-mode'))b.textContent=''})
    </script>

    <div class="card" style="max-width:600px; margin:0 auto;">
      <?php if ($msg): ?>
        <div class="mensaje mensaje-exito"><?= $msg ?></div>
      <?php endif; ?>
      <?php if ($err): ?>
        <div class="mensaje mensaje-error"> <?= $err ?></div>
      <?php endif; ?>

      <h2 style="margin-bottom:1.25rem;"> <?= __('envianos_mensaje') ?></h2>

      <form method="POST">
        <div class="form-row">
          <div class="form-group">
            <label><?= __('nombre_completo') ?> *</label>
            <input type="text" name="nombre" required placeholder="Juan Pérez" value="<?= htmlspecialchars($datos['nombre'] ?? '') ?>">
          </div>
          <div class="form-group">
            <label><?= __('email') ?> *</label>
            <input type="email" name="email" required placeholder="correo@ejemplo.com" value="<?= htmlspecialchars($datos['email'] ?? '') ?>">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label><?= __('telefono_whatsapp') ?></label>
            <input type="tel" name="telefono" placeholder="+595 981 000 000" value="<?= htmlspecialchars($datos['telefono'] ?? '') ?>">
          </div>
          <div class="form-group">
            <label><?= __('asunto') ?></label>
            <input type="text" name="asunto" placeholder="Consulta sobre un producto" value="<?= htmlspecialchars($datos['asunto'] ?? '') ?>">
          </div>
        </div>
        <div class="form-group">
          <label><?= __('mensaje') ?> *</label>
          <textarea name="mensaje" required placeholder="Escribí tu consulta aquí..." style="height:140px;"><?= htmlspecialchars($datos['mensaje'] ?? '') ?></textarea>
        </div>
        <button type="submit" class="btn-registrar"> <?= __('enviar_mensaje') ?></button>
      </form>
    </div>
  </div>
</body>
</html>
