<?php
require_once 'config.php';

if (!isset($_SESSION['admin_logueado']) || $_SESSION['admin_logueado'] !== true) {
    header("Location: login.php");
    exit();
}

$seccion = $_GET['s'] ?? 'dashboard';
$msg = '';
$err = '';

// ── ACCIONES POST ──────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $accion = $_POST['accion'] ?? '';

    function subir_fotos($archivos, $base_nombre, $desde = 1) {
        $info = pathinfo($base_nombre);
        $base = $info['filename'];
        $ext  = $info['extension'];
        $idx = max(1, $desde);
        if (!empty($archivos['name'][0])) {
            foreach ($archivos['name'] as $i => $name) {
                if ($archivos['error'][$i] !== UPLOAD_ERR_OK) continue;
                $e_ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
                if (!in_array($e_ext, ['jpg','jpeg','png','gif','webp'])) continue;
                while (file_exists("img/{$base}_{$idx}.{$ext}")) $idx++;
                $nom = "{$base}_{$idx}.{$ext}";
                move_uploaded_file($archivos['tmp_name'][$i], 'img/' . $nom);
                $idx++;
            }
        }
    }

    // Agregar producto
    if ($accion === 'agregar_producto') {
        $nombre      = trim($_POST['nombre']);
        $descripcion = trim($_POST['descripcion']);
        $detalles    = trim($_POST['detalles'] ?? '');
        $precio      = (float)$_POST['precio'];
        $stock       = (int)$_POST['stock'];
        $imagen      = '';

        if (isset($_FILES['imagenes']) && $_FILES['imagenes']['error'][0] === UPLOAD_ERR_OK) {
            $ext = strtolower(pathinfo($_FILES['imagenes']['name'][0], PATHINFO_EXTENSION));
            if (in_array($ext, ['jpg','jpeg','png','gif','webp'])) {
                $nuevo = uniqid('prod_') . '.' . $ext;
                move_uploaded_file($_FILES['imagenes']['tmp_name'][0], 'img/' . $nuevo);
                $imagen = $nuevo;
                subir_fotos($_FILES['imagenes'], $nuevo);
            } else {
                $err = 'Solo se permiten imágenes JPG, PNG, GIF, WEBP';
            }
        }

        if (!$err) {
            if (empty($nombre) || $precio <= 0 || $stock < 0) {
                $err = 'Nombre, precio y stock son obligatorios';
            } else {
                $s = $conn->prepare("INSERT INTO productos (nombre, descripcion, detalles, precio, stock, imagen) VALUES (?,?,?,?,?,?)");
                $s->bind_param("sssdis", $nombre, $descripcion, $detalles, $precio, $stock, $imagen);
                $s->execute() ? $msg = ' Producto agregado' : $err = 'Error al guardar';
            }
        }
        $seccion = 'productos';
    }

    // Editar producto
    if ($accion === 'editar_producto') {
        $id          = (int)$_POST['id'];
        $nombre      = trim($_POST['nombre']);
        $descripcion = trim($_POST['descripcion']);
        $detalles    = trim($_POST['detalles'] ?? '');
        $precio      = (float)$_POST['precio'];
        $stock       = (int)$_POST['stock'];

        $r = $conn->prepare("SELECT imagen FROM productos WHERE id=?");
        $r->bind_param("i", $id); $r->execute();
        $imagen = $r->get_result()->fetch_assoc()['imagen'] ?? '';

        if (isset($_FILES['imagenes']) && $_FILES['imagenes']['error'][0] === UPLOAD_ERR_OK) {
            $ext = strtolower(pathinfo($_FILES['imagenes']['name'][0], PATHINFO_EXTENSION));
            if (in_array($ext, ['jpg','jpeg','png','gif','webp'])) {
                if ($imagen && file_exists('img/'.$imagen)) {
                    $info = pathinfo($imagen);
                    $base = $info['filename'];
                    $iext = $info['extension'];
                    for ($i = 1; $i <= 20; $i++) {
                        $f = "img/{$base}_{$i}.{$iext}";
                        if (file_exists($f)) unlink($f);
                    }
                    unlink('img/'.$imagen);
                }
                $nuevo = uniqid('prod_') . '.' . $ext;
                move_uploaded_file($_FILES['imagenes']['tmp_name'][0], 'img/' . $nuevo);
                $imagen = $nuevo;
                subir_fotos($_FILES['imagenes'], $nuevo);
            }
        }

        $s = $conn->prepare("UPDATE productos SET nombre=?, descripcion=?, detalles=?, precio=?, stock=?, imagen=? WHERE id=?");
        $s->bind_param("sssdisi", $nombre, $descripcion, $detalles, $precio, $stock, $imagen, $id);
        if ($s->execute()) {
            header("Location: admin.php?s=productos&msg=actualizado");
        } else {
            header("Location: admin.php?s=productos&error=" . urlencode($s->error));
        }
        exit;
    }

    // Agregar fotos extra a producto existente
    if ($accion === 'agregar_fotos') {
        $id = (int)$_POST['id'];
        $r = $conn->prepare("SELECT imagen FROM productos WHERE id=?");
        $r->bind_param("i", $id); $r->execute();
        $img = $r->get_result()->fetch_assoc()['imagen'] ?? '';
        if ($img && isset($_FILES['fotos_extra'])) {
            subir_fotos($_FILES['fotos_extra'], $img);
            header("Location: admin.php?s=productos&edit=$id&msg=fotos_agregadas");
        } else {
            header("Location: admin.php?s=productos&edit=$id&error=" . urlencode('Primero debe haber una imagen principal'));
        }
        exit;
    }

    // Eliminar foto extra
    if ($accion === 'eliminar_foto') {
        $archivo = basename($_POST['archivo']);
        if (file_exists('img/'.$archivo)) unlink('img/'.$archivo);
        header("Location: admin.php?s=productos&edit=" . ((int)$_POST['id']) . "&msg=foto_eliminada");
        exit;
    }

    // Eliminar producto
    if ($accion === 'eliminar_producto') {
        $id = (int)$_POST['id'];
        $r = $conn->prepare("SELECT imagen FROM productos WHERE id=?");
        $r->bind_param("i", $id); $r->execute();
        $img = $r->get_result()->fetch_assoc()['imagen'] ?? '';
        if ($img) {
            $info = pathinfo($img);
            $base = $info['filename'];
            $ext  = $info['extension'];
            if (file_exists('img/'.$img)) unlink('img/'.$img);
            for ($i = 1; $i <= 20; $i++) {
                $f = "img/{$base}_{$i}.{$ext}";
                if (file_exists($f)) unlink($f);
            }
        }
        $s = $conn->prepare("DELETE FROM productos WHERE id=?");
        $s->bind_param("i", $id); $s->execute();
        $msg = ' Producto eliminado';
        $seccion = 'productos';
    }

    // Cambiar estado pedido
    if ($accion === 'cambiar_estado') {
        $id     = (int)$_POST['id'];
        $estado = limpiar($_POST['estado']);
        $estados_validos = ['pendiente','procesando','enviado','entregado','cancelado'];
        if (in_array($estado, $estados_validos)) {
            $s = $conn->prepare("UPDATE pedidos SET estado=? WHERE id=?");
            $s->bind_param("si", $estado, $id);
            $s->execute();
            $msg = ' Estado actualizado';
        }
        $seccion = 'pedidos';
    }

    // Eliminar pedido (solo cancelados)
    if ($accion === 'eliminar_pedido') {
        $id = (int)$_POST['id'];
        $chk = $conn->prepare("SELECT estado FROM pedidos WHERE id=?");
        $chk->bind_param("i", $id); $chk->execute();
        $estado = $chk->get_result()->fetch_assoc()['estado'] ?? '';

        if ($estado !== 'cancelado') {
            $err = 'Solo se pueden eliminar pedidos cancelados';
        } else {
            $conn->begin_transaction();
            try {
                $s1 = $conn->prepare("DELETE FROM pedido_items WHERE pedido_id=?");
                $s1->bind_param("i", $id); $s1->execute();
                $s1->close();

                $s2 = $conn->prepare("DELETE FROM pedidos WHERE id=?");
                $s2->bind_param("i", $id); $s2->execute();
                $s2->close();

                $conn->commit();
                $msg = ' Pedido eliminado';
            } catch (Exception $e) {
                $conn->rollback();
                $err = 'Error al eliminar el pedido';
            }
        }
        $seccion = 'pedidos';
    }

    // Guardar config
    if ($accion === 'guardar_config') {
        $_SESSION['config_tienda'] = [
            'nombre'     => limpiar($_POST['nombre_tienda']),
            'whatsapp'   => limpiar($_POST['whatsapp']),
            'email'      => limpiar($_POST['email_contacto']),
            'moneda'     => limpiar($_POST['moneda']),
            'tasa_usd'   => (float)($_POST['tasa_usd'] ?? 7500),
            'tasa_brl'   => (float)($_POST['tasa_brl'] ?? 1300),
            'tasa_eur'   => (float)($_POST['tasa_eur'] ?? 8200),
            'admin_user' => limpiar($_POST['admin_user']),
            'admin_pass' => $_POST['admin_pass'],
        ];
        $msg = ' Configuración guardada';
        $seccion = 'config';
    }
}

// Eliminar GET
if (isset($_GET['del']) && $seccion === 'productos') {
    $id = (int)$_GET['del'];
    $r = $conn->prepare("SELECT imagen FROM productos WHERE id=?");
    $r->bind_param("i",$id); $r->execute();
    $img = $r->get_result()->fetch_assoc()['imagen'] ?? '';
    if ($img && file_exists('img/'.$img)) unlink('img/'.$img);
    $s = $conn->prepare("DELETE FROM productos WHERE id=?");
    $s->bind_param("i",$id); $s->execute();
    header("Location: admin.php?s=productos&msg=eliminado"); exit();
}

// ── DATOS SEGÚN SECCIÓN ────────────────────────────────────────
$datos = [];

if ($seccion === 'dashboard') {
    $r = $conn->query("SELECT COUNT(*) c, COALESCE(SUM(stock),0) st FROM productos");
    $datos['productos'] = $r->fetch_assoc();
    $r2 = $conn->query("SELECT COUNT(*) c, COALESCE(SUM(total),0) t FROM pedidos");
    $datos['pedidos'] = $r2->fetch_assoc();
    $r3 = $conn->query("SELECT COUNT(*) c FROM pedidos WHERE estado='pendiente'");
    $datos['pendientes'] = $r3->fetch_assoc()['c'];
    $r4 = $conn->query("SELECT COUNT(*) c FROM productos WHERE stock <= 3");
    $datos['stock_bajo'] = $r4->fetch_assoc()['c'];
    $datos['ultimos_pedidos'] = $conn->query("SELECT p.*, (SELECT COUNT(*) FROM pedido_items WHERE pedido_id=p.id) items FROM pedidos p ORDER BY p.id DESC LIMIT 6");
    $datos['stock_critico'] = $conn->query("SELECT * FROM productos WHERE stock <= 3 ORDER BY stock ASC");
}

if ($seccion === 'productos') {
    $datos['lista'] = $conn->query("SELECT * FROM productos ORDER BY id DESC");
    if (isset($_GET['edit'])) {
        $edit_id = (int)$_GET['edit'];
        $s = $conn->prepare("SELECT * FROM productos WHERE id=?");
        $s->bind_param("i", $edit_id); $s->execute();
        $datos['editar'] = $s->get_result()->fetch_assoc();
    }
}

if ($seccion === 'pedidos') {
    $filtro_estado = isset($_GET['estado']) ? $_GET['estado'] : '';
    $estados_validos = ['pendiente','procesando','enviado','entregado','cancelado'];
    if ($filtro_estado && in_array($filtro_estado, $estados_validos)) {
        $stmt = $conn->prepare("SELECT * FROM pedidos WHERE estado = ? ORDER BY id DESC");
        $stmt->bind_param("s", $filtro_estado);
        $stmt->execute();
        $datos['lista'] = $stmt->get_result();
    } else {
        $datos['lista'] = $conn->query("SELECT * FROM pedidos ORDER BY id DESC");
    }
    if (isset($_GET['ver'])) {
        $pid = (int)$_GET['ver'];
        $s = $conn->prepare("SELECT * FROM pedidos WHERE id=?");
        $s->bind_param("i",$pid); $s->execute();
        $datos['pedido'] = $s->get_result()->fetch_assoc();
        $s2 = $conn->prepare("SELECT pi.*, p.nombre FROM pedido_items pi JOIN productos p ON pi.producto_id=p.id WHERE pi.pedido_id=?");
        $s2->bind_param("i",$pid); $s2->execute();
        $datos['items'] = $s2->get_result();
    }
}

if ($seccion === 'mensajes') {
    // Mensajes desde la tabla contactos (si existe)
    $tabla_existe = $conn->query("SHOW TABLES LIKE 'contactos'")->num_rows > 0;
    if (!$tabla_existe) {
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
    }
    $datos['lista'] = $conn->query("SELECT * FROM contactos ORDER BY id DESC");
    if (isset($_GET['ver'])) {
        $mid = (int)$_GET['ver'];
        $conn->query("UPDATE contactos SET leido=1 WHERE id=$mid");
        $s = $conn->prepare("SELECT * FROM contactos WHERE id=?");
        $s->bind_param("i",$mid); $s->execute();
        $datos['mensaje'] = $s->get_result()->fetch_assoc();
    }
    if (isset($_GET['del_msg'])) {
        $conn->query("DELETE FROM contactos WHERE id=".(int)$_GET['del_msg']);
        header("Location: admin.php?s=mensajes"); exit();
    }
    $datos['no_leidos'] = $conn->query("SELECT COUNT(*) c FROM contactos WHERE leido=0")->fetch_assoc()['c'];
}

$config = $_SESSION['config_tienda'] ?? ['nombre'=>'NovaRandú','whatsapp'=>'','email_contacto'=>'','moneda'=>'Gs.'];

// Badge no leídos
$no_leidos = 0;
$tbl = $conn->query("SHOW TABLES LIKE 'contactos'");
if ($tbl->num_rows > 0) {
    $no_leidos = $conn->query("SELECT COUNT(*) c FROM contactos WHERE leido=0")->fetch_assoc()['c'];
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin | NovaRandú</title>

  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <script>(function(){var m=localStorage.getItem('modo');if(m==='claro'){document.documentElement.classList.add('light-mode')}})();</script>
<style>
/* ── LAYOUT ── */
body { padding: 0; margin: 0; }
.admin-layout { display: flex; min-height: 100vh; }

/* SIDEBAR */
.sidebar {
  width: 220px; flex-shrink: 0;
  background: #1a1a2e;
  display: flex; flex-direction: column;
  position: sticky; top: 0; height: 100vh; overflow-y: auto;
}
.sidebar-logo {
  padding: 1.5rem 1.25rem 1rem;
  color: white; font-size: 1.1rem; font-weight: bold;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.sidebar-logo span { font-size: 0.75rem; color: #aaa; display: block; font-weight: normal; }
.sidebar nav { flex: 1; padding: 1rem 0; }
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 0.75rem 1.25rem;
  color: #ccc; text-decoration: none;
  font-size: 0.95rem; border-left: 3px solid transparent;
  transition: all 0.2s;
}
.nav-item:hover { background: rgba(255,255,255,0.08); color: white; }
.nav-item.activo { background: rgba(102,126,234,0.2); color: #a78bfa; border-left-color: #667eea; }
.nav-badge {
  background: #e53e3e; color: white; border-radius: 50px;
  font-size: 0.7rem; padding: 1px 7px; margin-left: auto;
}
.sidebar-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid rgba(255,255,255,0.1);
}
.sidebar-footer .usuario { color: #aaa; font-size: 0.8rem; margin-bottom: 0.5rem; }
.btn-logout {
  display: block; width: 100%; padding: 0.5rem;
  background: #e53e3e; color: white; border: none;
  border-radius: 6px; cursor: pointer; font-size: 0.85rem;
  text-align: center; text-decoration: none;
}

/* CONTENIDO */
.admin-content { flex: 1; padding: 2rem; background: #f7f8fc; min-height: 100vh; }
.page-header { margin-bottom: 1.5rem; }
.page-header h1 { font-size: 1.5rem; color: #1a1a2e; margin-bottom: 0.2rem; }
.page-header p { color: #666; font-size: 0.9rem; }

/* STATS */
.stats-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px,1fr)); gap: 1rem; margin-bottom: 1.5rem; }
.stat { background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-top: 3px solid #667eea; }
.stat.alerta { border-top-color: #e53e3e; }
.stat.exito  { border-top-color: #27ae60; }
.stat.warning{ border-top-color: #f6ad55; }
.stat-num  { font-size: 1.9rem; font-weight: bold; color: #1a1a2e; }
.stat-label{ font-size: 0.8rem; color: #888; margin-top: 2px; }

/* CARD */
.panel { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 1.5rem; }
.panel h2 { font-size: 1.1rem; color: #1a1a2e; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #eee; }

/* TABLA */
.tbl { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.tbl th { background: #f1f3f9; color: #555; font-weight: 600; padding: 0.7rem 1rem; text-align: left; }
.tbl td { padding: 0.75rem 1rem; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
.tbl tr:last-child td { border-bottom: none; }
.tbl tr:hover td { background: #fafbff; }

/* BADGES */
.badge-estado {
  display: inline-block; padding: 3px 10px; border-radius: 50px; font-size: 0.75rem; font-weight: 600;
}
.e-pendiente  { background: #fef3c7; color: #92400e; }
.e-procesando { background: #dbeafe; color: #1e40af; }
.e-enviado    { background: #e0e7ff; color: #3730a3; }
.e-entregado  { background: #d1fae5; color: #065f46; }
.e-cancelado  { background: #fee2e2; color: #991b1b; }

/* FORMULARIO */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-grid .span2 { grid-column: span 2; }
.form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #444; margin-bottom: 5px; }
.form-group input,
.form-group textarea,
.form-group select {
  width: 100%; padding: 0.65rem 0.9rem;
  border: 2px solid #e2e8f0; border-radius: 8px;
  font-size: 0.95rem; box-sizing: border-box; transition: border-color 0.2s;
}
.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus { outline: none; border-color: #667eea; }
.form-group textarea { height: 90px; resize: vertical; }
.img-preview { max-width: 120px; border-radius: 8px; margin-top: 6px; border: 2px solid #eee; }
.gallery-grid { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
.gallery-item { position:relative; width:90px; height:90px; border-radius:8px; overflow:hidden; border:1px solid #ddd; }
.gallery-item img { width:100%; height:100%; object-fit:cover; }
.gallery-item form { position:absolute; top:2px; right:2px; }
.btn-small { font-size:0.7rem; padding:2px 6px; border-radius:4px; cursor:pointer; }
.btn-danger { background:#e74c3c; color:#fff; border:none; }

/* BOTONES */
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 0.55rem 1.1rem; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; border: none; text-decoration: none; transition: opacity 0.2s; }
.btn:hover { opacity: 0.88; }
.btn-primary { background: #667eea; color: white; }
.btn-success { background: #27ae60; color: white; }
.btn-danger  { background: #e53e3e; color: white; }
.btn-warning { background: #f6ad55; color: #1a1a2e; }
.btn-ghost   { background: #f1f3f9; color: #444; }
.btn-sm      { padding: 0.3rem 0.7rem; font-size: 0.8rem; }

/* ACCIONES TABLA */
.acciones { display: flex; gap: 6px; }

/* ALERT */
.alerta-msg { padding: 0.85rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.9rem; }
.alerta-ok  { background: #d1fae5; color: #065f46; }
.alerta-err { background: #fee2e2; color: #991b1b; }

/* DETALLE PEDIDO */
.detalle-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
.detalle-item { font-size: 0.9rem; }
.detalle-item label { color: #888; font-size: 0.78rem; display: block; margin-bottom: 2px; font-weight: 600; text-transform: uppercase; }

/* MENSAJE CONTACTO */
.msg-cuerpo { background: #f7f8fc; border-radius: 8px; padding: 1rem; font-size: 0.95rem; line-height: 1.7; white-space: pre-wrap; margin: 1rem 0; }
.msg-no-leido td { font-weight: 600; }

/* FILTROS */
.filtros { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
.filtro-btn { padding: 0.35rem 0.9rem; border-radius: 50px; font-size: 0.8rem; border: 2px solid #e2e8f0; background: white; cursor: pointer; text-decoration: none; color: #555; }
.filtro-btn.activo { background: #667eea; color: white; border-color: #667eea; }

/* UPLOAD */
.upload-area { border: 2px dashed #c8d0e7; border-radius: 8px; padding: 1rem; text-align: center; color: #888; font-size: 0.85rem; }
.upload-area input { width: 100%; }

/* VACÍO */
.vacio-tabla { text-align: center; padding: 2rem; color: #aaa; }

/* RESPONSIVE */
@media (max-width: 768px) {
  .admin-layout { flex-direction: column; }
  .sidebar { width: 100%; height: auto; position: static; }
  .form-grid { grid-template-columns: 1fr; }
  .form-grid .span2 { grid-column: span 1; }
  .detalle-grid { grid-template-columns: 1fr; }
}
</style>
</head>
<body>
<div class="admin-layout">

  <!-- ── SIDEBAR ── -->
  <aside class="sidebar">
    <div class="sidebar-logo">
       <?= __('tienda_nombre') ?>
      <span><?= __('admin_panel') ?></span>
    </div>
    <nav>
      <a href="admin.php?s=dashboard" class="nav-item <?= $seccion==='dashboard'?'activo':'' ?>"> <?= __('dashboard') ?></a>
      <a href="admin.php?s=productos" class="nav-item <?= $seccion==='productos'?'activo':'' ?>"> <?= __('productos') ?></a>
      <a href="admin.php?s=pedidos"   class="nav-item <?= $seccion==='pedidos'  ?'activo':'' ?>"> <?= __('pedidos') ?></a>
      <a href="admin.php?s=mensajes"  class="nav-item <?= $seccion==='mensajes' ?'activo':'' ?>">
         <?= __('mensajes') ?>
        <?php if ($no_leidos > 0): ?><span class="nav-badge"><?= $no_leidos ?></span><?php endif; ?>
      </a>
      <a href="admin.php?s=config"    class="nav-item <?= $seccion==='config'   ?'activo':'' ?>"> <?= __('configuracion') ?></a>
      <hr style="border-color:rgba(255,255,255,0.1); margin: 0.5rem 1.25rem;">
      <a href="mis_pedidos.php" class="nav-item" target="_blank"> <?= __('mis_pedidos') ?></a>
      <a href="index.php" class="nav-item" target="_blank"> <?= __('ver_tienda') ?></a>
    </nav>
    <div class="sidebar-footer">
      <div style="display:flex;flex-direction:column;align-items:stretch;gap:3px;width:100%;padding:0.25rem 1rem;">
        <div class="lang-hamburger">
          <button class="lang-hamburger-btn" onclick="toggleLang(event)" title="<?= $idioma_actual ?>" style="width:100%;">
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
      <button class="btn-modo" id="btnModo" onclick="toggleModo()" title="<?= __('cambiar_modo') ?>" style="display:flex;align-items:center;gap:6px;width:100%;padding:0.5rem 1.25rem;background:transparent;color:#aaa;border:none;cursor:pointer;font-family:inherit;font-size:0.82rem;transition:var(--t)"> <?= __('modo_claro') ?></button>
      <div class="usuario"> <?= htmlspecialchars($_SESSION['admin_usuario'] ?? 'admin') ?></div>
      <a href="logout.php" class="btn-logout"> <?= __('cerrar_sesion') ?></a>
    </div>
    <script>
    function toggleModo(){var h=document.documentElement,b=document.getElementById('btnModo');h.classList.toggle('light-mode');var c=h.classList.contains('light-mode');localStorage.setItem('modo',c?'claro':'oscuro');b.innerHTML=c?' <?= __('modo_oscuro') ?>':' <?= __('modo_claro') ?>'}
    function toggleLang(e){e.stopPropagation();document.getElementById('langDrop').classList.toggle('abierto')}
    function cl(l){var p=new URLSearchParams(location.search);p.set('lang',l);location.search=p.toString();return false}
    document.addEventListener('click',function(){var d=document.getElementById('langDrop');if(d)d.classList.remove('abierto')})
    document.addEventListener('DOMContentLoaded',function(){var b=document.getElementById('btnModo');if(b&&document.documentElement.classList.contains('light-mode'))b.innerHTML=' <?= __('modo_oscuro') ?>'})
    </script>
  </aside>

  <!-- ── CONTENIDO ── -->
  <main class="admin-content">

    <?php if ($msg): ?><div class="alerta-msg alerta-ok"><?= $msg ?></div><?php endif; ?>
    <?php if ($err): ?><div class="alerta-msg alerta-err"> <?= $err ?></div><?php endif; ?>
    <?php if (isset($_GET['msg'])): ?><div class="alerta-msg alerta-ok"> Hecho</div><?php endif; ?>

    <!-- ══════════════ DASHBOARD ══════════════ -->
    <?php if ($seccion === 'dashboard'): ?>
    <div class="page-header">
      <h1> <?= __('dashboard') ?></h1>
      <p><?= __('resumen_tienda') ?></p>
    </div>

    <div class="stats-row">
      <div class="stat">
        <div class="stat-num"><?= $datos['productos']['c'] ?></div>
        <div class="stat-label"> <?= __('productos') ?></div>
      </div>
      <div class="stat exito">
        <div class="stat-num"><?= $datos['pedidos']['c'] ?></div>
        <div class="stat-label"> <?= __('pedidos_totales') ?></div>
      </div>
      <div class="stat warning">
        <div class="stat-num"><?= $datos['pendientes'] ?></div>
        <div class="stat-label"> <?= __('pendientes') ?></div>
      </div>
      <div class="stat <?= $datos['stock_bajo'] > 0 ? 'alerta' : '' ?>">
        <div class="stat-num"><?= $datos['stock_bajo'] ?></div>
        <div class="stat-label"> <?= __('stock_bajo_titulo') ?></div>
      </div>
      <div class="stat exito">
        <div class="stat-num"><?= precio($datos['pedidos']['t']) ?></div>
        <div class="stat-label"> <?= __('ingresos') ?></div>
      </div>
      <?php if ($no_leidos > 0): ?>
      <div class="stat alerta">
        <div class="stat-num"><?= $no_leidos ?></div>
        <div class="stat-label"> <?= __('mensajes_sin_leer') ?></div>
      </div>
      <?php endif; ?>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
      <!-- Últimos pedidos -->
      <div class="panel">
        <h2> <?= __('ultimos_pedidos') ?></h2>
        <?php if ($datos['ultimos_pedidos']->num_rows > 0): ?>
        <table class="tbl">
          <thead><tr><th>#</th><th><?= __('cliente') ?></th><th><?= __('total') ?></th><th><?= __('estado') ?></th></tr></thead>
          <tbody>
          <?php while ($p = $datos['ultimos_pedidos']->fetch_assoc()): ?>
            <tr>
              <td><a href="admin.php?s=pedidos&ver=<?= $p['id'] ?>" style="color:#667eea; font-weight:600;">#<?= $p['id'] ?></a></td>
              <td><?= htmlspecialchars($p['nombre_cliente']) ?></td>
              <td><?= precio($p['total']) ?></td>
              <td><span class="badge-estado e-<?= $p['estado'] ?>"><?= __('estado_' . $p['estado']) ?></span></td>
            </tr>
          <?php endwhile; ?>
          </tbody>
        </table>
        <?php else: ?><p class="vacio-tabla"><?= __('no_hay_pedidos') ?></p><?php endif; ?>
        <div style="text-align:right; margin-top:0.75rem;"><a href="admin.php?s=pedidos" class="btn btn-ghost btn-sm"><?= __('ver_todos') ?> →</a></div>
      </div>

      <!-- Stock crítico -->
      <div class="panel">
        <h2> <?= __('stock_bajo_titulo') ?></h2>
        <?php if ($datos['stock_critico']->num_rows > 0): ?>
        <table class="tbl">
          <thead><tr><th><?= __('nombre') ?></th><th><?= __('stock') ?></th><th></th></tr></thead>
          <tbody>
          <?php while ($p = $datos['stock_critico']->fetch_assoc()): ?>
            <tr>
              <td><?= htmlspecialchars($p['nombre']) ?></td>
              <td style="color:#e53e3e; font-weight:bold;"><?= $p['stock'] ?></td>
              <td><a href="admin.php?s=productos&edit=<?= $p['id'] ?>" class="btn btn-warning btn-sm"><?= __('editar') ?></a></td>
            </tr>
          <?php endwhile; ?>
          </tbody>
        </table>
        <?php else: ?><p class="vacio-tabla"> <?= __('stock_bien') ?></p><?php endif; ?>
      </div>
    </div>

    <!-- ══════════════ PRODUCTOS ══════════════ -->
    <?php elseif ($seccion === 'productos'): ?>
    <div class="page-header">
      <h1> Productos</h1>
      <p><?= __('gestiona_catalogo') ?></p>
    </div>

    <?php if (isset($datos['editar'])): ?>
    <!-- FORMULARIO EDITAR -->
    <div class="panel">
      <h2> <?= __('editar_producto') ?> — <?= htmlspecialchars($datos['editar']['nombre']) ?></h2>
      <form method="POST" enctype="multipart/form-data">
        <input type="hidden" name="accion" value="editar_producto">
        <input type="hidden" name="id" value="<?= $datos['editar']['id'] ?>">
        <div class="form-grid">
          <div class="form-group">
            <label><?= __('nombre') ?> *</label>
            <input type="text" name="nombre" required value="<?= htmlspecialchars($datos['editar']['nombre']) ?>">
          </div>
          <div class="form-group">
            <label><?= __('precio') ?> *</label>
            <input type="number" name="precio" required step="0.01" value="<?= $datos['editar']['precio'] ?>">
          </div>
          <div class="form-group span2">
            <label><?= __('descripcion') ?></label>
            <textarea name="descripcion"><?= htmlspecialchars($datos['editar']['descripcion']) ?></textarea>
          </div>
          <div class="form-group span2">
            <label><?= __('detalles_adicionales') ?></label>
            <textarea name="detalles" style="height:120px;"><?= htmlspecialchars($datos['editar']['detalles'] ?? '') ?></textarea>
          </div>
          <div class="form-group">
            <label><?= __('stock') ?> *</label>
            <input type="number" name="stock" required min="0" value="<?= $datos['editar']['stock'] ?>">
          </div>
          <div class="form-group">
            <label><?= __('imagen_actual') ?></label>
            <div class="upload-area">
              <input type="file" name="imagenes[]" accept="image/*" multiple>
            </div>
            <?php if ($datos['editar']['imagen'] && file_exists('img/'.$datos['editar']['imagen'])): ?>
              <img src="img/<?= htmlspecialchars($datos['editar']['imagen']) ?>" class="img-preview" alt="imagen actual">
            <?php endif; ?>
          </div>
        </div>

        <div style="display:flex; gap:0.75rem; margin-top:1rem;">
          <button type="submit" class="btn btn-primary"> <?= __('guardar_cambios') ?></button>
          <a href="admin.php?s=productos" class="btn btn-ghost"><?= __('cancelar') ?></a>
        </div>
      </form>

      <?php if ($datos['editar']['imagen']): ?>
      <?php
        $info = pathinfo($datos['editar']['imagen']);
        $base = $info['filename'];
        $ext  = $info['extension'];
        $fotos = [$datos['editar']['imagen']];
        for ($i = 1; $i <= 20; $i++) {
          $f = "{$base}_{$i}.{$ext}";
          if (file_exists('img/'.$f)) $fotos[] = $f;
        }
      ?>
      <hr style="border-color:var(--border);margin:1rem 0;">
      <div class="gallery-grid">
        <?php foreach ($fotos as $f): ?>
        <div class="gallery-item">
          <img src="img/<?= $f ?>" alt="foto">
          <form method="POST" onsubmit="return confirm('<?= __('confirmar_eliminar') ?>')">
            <input type="hidden" name="accion" value="eliminar_foto">
            <input type="hidden" name="id" value="<?= $datos['editar']['id'] ?>">
            <input type="hidden" name="archivo" value="<?= $f ?>">
            <button type="submit" class="btn btn-small btn-danger" title="<?= __('eliminar') ?>"></button>
          </form>
        </div>
        <?php endforeach; ?>
      </div>
      <form method="POST" enctype="multipart/form-data" style="margin-top:0.75rem;">
        <input type="hidden" name="accion" value="agregar_fotos">
        <input type="hidden" name="id" value="<?= $datos['editar']['id'] ?>">
        <input type="file" name="fotos_extra[]" accept="image/*" multiple>
        <button type="submit" class="btn btn-small btn-primary" style="margin-top:4px;"> <?= __('agregar_mas_fotos') ?></button>
      </form>
      <?php endif; ?>
    </div>

    <?php else: ?>
    <!-- FORMULARIO AGREGAR + LISTA -->
    <div style="display:grid; grid-template-columns: 380px 1fr; gap:1.5rem; align-items:start;">

      <div class="panel">
        <h2> <?= __('nuevo_producto') ?></h2>
        <form method="POST" enctype="multipart/form-data">
          <input type="hidden" name="accion" value="agregar_producto">
          <div class="form-group">
            <label><?= __('nombre') ?> *</label>
            <input type="text" name="nombre" required placeholder="Ej: Laptop HP Pavilion">
          </div>
          <div class="form-group">
            <label><?= __('descripcion') ?></label>
            <textarea name="descripcion" placeholder="Descripción del producto..."></textarea>
          </div>
          <div class="form-group">
            <label><?= __('detalles_adicionales') ?></label>
            <textarea name="detalles" placeholder="Ej: Marca: HP&#10;Procesador: Ryzen 5&#10;RAM: 8GB&#10;Disco: 256GB SSD&#10;Pantalla: 15.6 pulgadas" style="height:120px;"></textarea>
          </div>
          <div class="form-group">
            <label><?= __('precio') ?> *</label>
            <input type="number" name="precio" required step="0.01" placeholder="450000">
          </div>
          <div class="form-group">
            <label><?= __('stock_inicial') ?> *</label>
            <input type="number" name="stock" required min="0" value="10">
          </div>
          <div class="form-group">
            <label><?= __('imagen_producto') ?></label>
            <div class="upload-area">
               <?= __('selecciona_imagen') ?><br>
              <input type="file" name="imagenes[]" accept="image/*" multiple style="margin-top:6px;">
            </div>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%; margin-top:0.5rem;"> <?= __('agregar_producto') ?></button>
        </form>
      </div>

      <div class="panel">
        <h2> <?= __('catalogo') ?> (<?= $datos['lista']->num_rows ?> <?= __('productos') ?>)</h2>
        <?php if ($datos['lista']->num_rows > 0): ?>
        <table class="tbl">
          <thead><tr><th><?= __('nombre') ?></th><th><?= __('precio') ?></th><th><?= __('stock') ?></th><th><?= __('acciones') ?></th></tr></thead>
          <tbody>
          <?php while ($p = $datos['lista']->fetch_assoc()): ?>
            <tr>
              <td>
                <div style="display:flex; align-items:center; gap:10px;">
                  <?php if ($p['imagen'] && file_exists('img/'.$p['imagen'])): ?>
                    <img src="img/<?= htmlspecialchars($p['imagen']) ?>" style="width:40px;height:40px;object-fit:cover;border-radius:6px;">
                  <?php else: ?>
                    <div style="width:40px;height:40px;background:#f1f3f9;border-radius:6px;display:flex;align-items:center;justify-content:center;"></div>
                  <?php endif; ?>
                  <div>
                    <strong><?= htmlspecialchars($p['nombre']) ?></strong><br>
                    <small style="color:#888;"><?= htmlspecialchars(substr($p['descripcion'],0,50)) ?>...</small>
                  </div>
                </div>
              </td>
              <td><strong><?= precio($p['precio']) ?></strong></td>
              <td class="<?= $p['stock'] <= 3 ? 'stock-bajo' : '' ?>">
                <?= $p['stock'] ?> <?= $p['stock'] <= 3 ? '' : '' ?>
              </td>
              <td>
                <div class="acciones">
                  <a href="admin.php?s=productos&edit=<?= $p['id'] ?>" class="btn btn-warning btn-sm"></a>
                  <form method="POST" style="display:inline;" onsubmit="return confirm('<?= __('confirmar_eliminar') ?>')">
                    <input type="hidden" name="accion" value="eliminar_producto">
                    <input type="hidden" name="id" value="<?= $p['id'] ?>">
                    <button type="submit" class="btn btn-danger btn-sm"></button>
                  </form>
                </div>
              </td>
            </tr>
          <?php endwhile; ?>
          </tbody>
        </table>
        <?php else: ?><p class="vacio-tabla"> <?= __('no_hay_productos') ?></p><?php endif; ?>
      </div>
    </div>
    <?php endif; ?>

    <!-- ══════════════ PEDIDOS ══════════════ -->
    <?php elseif ($seccion === 'pedidos'): ?>
    <div class="page-header">
      <h1> Pedidos</h1>
      <p><?= __('administra_pedidos') ?></p>
    </div>

    <?php if (isset($datos['pedido'])): ?>
    <!-- DETALLE PEDIDO -->
    <?php $p = $datos['pedido']; ?>
    <div class="panel">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h2> <?= sprintf(__('pedido'), $p['id']) ?></h2>
        <a href="admin.php?s=pedidos" class="btn btn-ghost btn-sm">← <?= __('volver') ?></a>
      </div>

      <div class="detalle-grid">
        <div class="detalle-item"><label><?= __('cliente') ?></label><?= htmlspecialchars($p['nombre_cliente']) ?></div>
        <div class="detalle-item"><label><?= __('email') ?></label><a href="mailto:<?= $p['email'] ?>"><?= $p['email'] ?></a></div>
        <?php if (!empty($p['telefono'])): ?>
        <div class="detalle-item"><label><?= __('telefono_whatsapp') ?></label>
          <a href="https://wa.me/<?= preg_replace('/[^0-9]/','',$p['telefono']) ?>" target="_blank" style="color:#25d366;"> <?= $p['telefono'] ?></a>
        </div>
        <?php endif; ?>
        <?php if (!empty($p['ciudad'])): ?>
        <div class="detalle-item"><label><?= __('ciudad') ?></label><?= htmlspecialchars($p['ciudad']) ?></div>
        <?php endif; ?>
        <div class="detalle-item span2"><label><?= __('direccion') ?></label><?= htmlspecialchars($p['direccion']) ?></div>
        <?php if (!empty($p['notas'])): ?>
        <div class="detalle-item span2"><label><?= __('notas_cliente') ?></label><?= htmlspecialchars($p['notas']) ?></div>
        <?php endif; ?>
        <div class="detalle-item"><label><?= __('fecha') ?></label><?= isset($p['fecha']) ? date('d/m/Y H:i', strtotime($p['fecha'])) : '-' ?></div>
        <div class="detalle-item"><label><?= __('estado_actual') ?></label><span class="badge-estado e-<?= $p['estado'] ?>"><?= __('estado_' . $p['estado']) ?></span></div>
      </div>

      <h3 style="margin-bottom:0.5rem;"> <?= __('productos_pedidos') ?></h3>
      <table class="tbl" style="margin-bottom:1rem;">
        <thead><tr><th><?= __('nombre') ?></th><th><?= __('cantidad') ?></th><th><?= __('subtotal') ?></th></tr></thead>
        <tbody>
        <?php while ($item = $datos['items']->fetch_assoc()): ?>
          <tr>
            <td><?= htmlspecialchars($item['nombre']) ?></td>
            <td><?= $item['cantidad'] ?></td>
            <td><?= precio($item['subtotal']) ?></td>
          </tr>
        <?php endwhile; ?>
          <tr style="background:#f0fff4; font-weight:bold;">
            <td colspan="2"><?= __('total') ?></td>
            <td>$<?= number_format($p['total'],0,',','.') ?></td>
          </tr>
        </tbody>
      </table>

      <form method="POST" style="display:flex; gap:1rem; align-items:center; flex-wrap:wrap;">
        <input type="hidden" name="accion" value="cambiar_estado">
        <input type="hidden" name="id" value="<?= $p['id'] ?>">
        <label style="font-weight:600;"><?= __('cambiar_estado') ?></label>
        <select name="estado" style="padding:0.5rem 0.75rem; border:2px solid #e2e8f0; border-radius:8px;">
          <?php foreach (['pendiente','procesando','enviado','entregado','cancelado'] as $e): ?>
            <option value="<?= $e ?>" <?= $p['estado']===$e?'selected':'' ?>><?= __('estado_' . $e) ?></option>
          <?php endforeach; ?>
        </select>
        <button type="submit" class="btn btn-primary"> <?= __('actualizar') ?></button>
        <?php if (!empty($p['telefono'])): ?>
        <a href="https://wa.me/<?= preg_replace('/[^0-9]/','',$p['telefono']) ?>?text=<?= urlencode(sprintf(__('whatsapp_pedido_msg'), $p['nombre_cliente'], $p['id'], precio($p['total']))) ?>" target="_blank" class="btn btn-success"> WhatsApp</a>
        <?php endif; ?>
      </form>

      <?php if ($p['estado'] === 'cancelado'): ?>
      <hr style="margin:1.5rem 0; border-color:#eee;">
      <form method="POST" onsubmit="return confirm('<?= __('eliminar_pedido') ?>?')">
        <input type="hidden" name="accion" value="eliminar_pedido">
        <input type="hidden" name="id" value="<?= $p['id'] ?>">
        <button type="submit" class="btn btn-danger"> <?= __('eliminar_pedido') ?></button>
      </form>
      <?php endif; ?>
    </div>

    <?php else: ?>
    <!-- LISTA PEDIDOS -->
    <div class="filtros">
      <a href="admin.php?s=pedidos" class="filtro-btn <?= !isset($_GET['estado'])?'activo':'' ?>"><?= __('todos') ?></a>
      <?php foreach (['pendiente','procesando','enviado','entregado','cancelado'] as $e): ?>
        <a href="admin.php?s=pedidos&estado=<?= $e ?>" class="filtro-btn <?= (isset($_GET['estado'])&&$_GET['estado']===$e)?'activo':'' ?>"><?= __('estado_' . $e) ?></a>
      <?php endforeach; ?>
    </div>

    <div class="panel">
      <?php if ($datos['lista']->num_rows > 0): ?>
      <table class="tbl">
        <thead><tr><th>#</th><th><?= __('cliente') ?></th><th><?= __('total') ?></th><th><?= __('estado') ?></th><th><?= __('fecha') ?></th><th><?= __('acciones') ?></th></tr></thead>
        <tbody>
        <?php while ($p = $datos['lista']->fetch_assoc()): ?>
          <tr>
            <td><strong>#<?= $p['id'] ?></strong></td>
            <td>
              <?= htmlspecialchars($p['nombre_cliente']) ?><br>
              <small style="color:#888;"><?= htmlspecialchars($p['email']) ?></small>
            </td>
            <td><strong><?= precio($p['total']) ?></strong></td>
            <td><span class="badge-estado e-<?= $p['estado'] ?>"><?= __('estado_' . $p['estado']) ?></span></td>
            <td><?= isset($p['fecha']) ? date('d/m/Y H:i', strtotime($p['fecha'])) : '-' ?></td>
            <td>
              <div class="acciones">
                <a href="admin.php?s=pedidos&ver=<?= $p['id'] ?>" class="btn btn-primary btn-sm"><?= __('ver') ?></a>
                <?php if ($p['estado'] === 'cancelado'): ?>
                <form method="POST" style="display:inline;" onsubmit="return confirm('<?= __('eliminar_pedido') ?> #<?= $p['id'] ?>?')">
                  <input type="hidden" name="accion" value="eliminar_pedido">
                  <input type="hidden" name="id" value="<?= $p['id'] ?>">
                  <button type="submit" class="btn btn-danger btn-sm"></button>
                </form>
                <?php endif; ?>
              </div>
            </td>
          </tr>
        <?php endwhile; ?>
        </tbody>
      </table>
      <?php else: ?><p class="vacio-tabla"> <?= __('no_hay_pedidos') ?> <?= isset($_GET['estado']) ? __('con_este_estado') : __('aun') ?></p><?php endif; ?>
    </div>
    <?php endif; ?>

    <!-- ══════════════ MENSAJES ══════════════ -->
    <?php elseif ($seccion === 'mensajes'): ?>
    <div class="page-header">
      <h1> <?= __('mensajes_contacto') ?></h1>
      <p><?= __('mensajes_enviados') ?></p>
    </div>

    <?php if (isset($datos['mensaje'])): ?>
    <?php $m = $datos['mensaje']; ?>
    <div class="panel">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h2> <?= sprintf(__('mensaje_de'), htmlspecialchars($m['nombre'])) ?></h2>
        <a href="admin.php?s=mensajes" class="btn btn-ghost btn-sm">← <?= __('volver') ?></a>
      </div>
      <div class="detalle-grid">
        <div class="detalle-item"><label><?= __('nombre') ?></label><?= htmlspecialchars($m['nombre']) ?></div>
        <div class="detalle-item"><label><?= __('email') ?></label><a href="mailto:<?= $m['email'] ?>"><?= $m['email'] ?></a></div>
        <?php if ($m['telefono']): ?><div class="detalle-item"><label><?= __('telefono') ?></label><?= htmlspecialchars($m['telefono']) ?></div><?php endif; ?>
        <?php if ($m['asunto']): ?><div class="detalle-item"><label><?= __('asunto') ?></label><?= htmlspecialchars($m['asunto']) ?></div><?php endif; ?>
        <div class="detalle-item"><label><?= __('recibido') ?></label><?= isset($m['fecha']) ? date('d/m/Y H:i', strtotime($m['fecha'])) : '-' ?></div>
      </div>
      <div class="msg-cuerpo"><?= htmlspecialchars($m['mensaje']) ?></div>
      <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
        <a href="mailto:<?= $m['email'] ?>?subject=Re: <?= urlencode($m['asunto'] ?: __('sin_asunto')) ?>" class="btn btn-primary"> <?= __('responder_email') ?></a>
        <?php if ($m['telefono']): ?>
        <a href="https://wa.me/<?= preg_replace('/[^0-9]/','',$m['telefono']) ?>" target="_blank" class="btn btn-success"> WhatsApp</a>
        <?php endif; ?>
        <a href="admin.php?s=mensajes&del_msg=<?= $m['id'] ?>" class="btn btn-danger btn-sm" onclick="return confirm('<?= __('confirmar_eliminar') ?>')"> <?= __('eliminar') ?></a>
      </div>
    </div>

    <?php else: ?>
    <div class="panel">
      <?php if ($datos['lista']->num_rows > 0): ?>
      <table class="tbl">
        <thead><tr><th><?= __('de') ?></th><th><?= __('asunto') ?></th><th><?= __('fecha') ?></th><th><?= __('estado') ?></th><th></th></tr></thead>
        <tbody>
        <?php while ($m = $datos['lista']->fetch_assoc()): ?>
          <tr class="<?= !$m['leido'] ? 'msg-no-leido' : '' ?>">
            <td>
              <?= htmlspecialchars($m['nombre']) ?>
              <?= !$m['leido'] ? '<span style="background:#667eea;color:white;font-size:0.7rem;padding:1px 6px;border-radius:50px;margin-left:4px;">' . __('nuevo') . '</span>' : '' ?><br>
              <small style="color:#888;"><?= htmlspecialchars($m['email']) ?></small>
            </td>
            <td><?= htmlspecialchars($m['asunto'] ?: __('sin_asunto')) ?></td>
            <td><?= isset($m['fecha']) ? date('d/m/Y H:i', strtotime($m['fecha'])) : '-' ?></td>
            <td><?= $m['leido'] ? '<span style="color:#888;">' . __('leido') . '</span>' : '<span style="color:#667eea; font-weight:bold;">' . __('nuevo') . '</span>' ?></td>
            <td>
              <div class="acciones">
                <a href="admin.php?s=mensajes&ver=<?= $m['id'] ?>" class="btn btn-primary btn-sm"><?= __('leer') ?> →</a>
                <a href="admin.php?s=mensajes&del_msg=<?= $m['id'] ?>" class="btn btn-danger btn-sm" onclick="return confirm('<?= __('confirmar_eliminar') ?>')"></a>
              </div>
            </td>
          </tr>
        <?php endwhile; ?>
        </tbody>
      </table>
      <?php else: ?><p class="vacio-tabla"> <?= __('no_hay_mensajes') ?></p><?php endif; ?>
    </div>

    <div class="panel" style="margin-top:1rem;">
      <h2> <?= __('como_recibir_mensajes') ?></h2>
      <p style="font-size:0.9rem; color:#666; line-height:1.7;">
        <?= __('info_recibir_mensajes') ?>
      </p>
    </div>
    <?php endif; ?>

    <!-- ══════════════ CONFIGURACIÓN ══════════════ -->
    <?php elseif ($seccion === 'config'): ?>
    <div class="page-header">
      <h1> Configuración</h1>
      <p><?= __('ajustes_generales') ?></p>
    </div>

    <div class="panel" style="max-width:600px;">
      <h2> <?= __('datos_tienda') ?></h2>
      <form method="POST">
        <input type="hidden" name="accion" value="guardar_config">
        <div class="form-group">
          <label><?= __('nombre_tienda') ?></label>
          <input type="text" name="nombre_tienda" value="<?= htmlspecialchars($config['nombre'] ?? 'NovaRandú') ?>">
        </div>
        <div class="form-group">
          <label><?= __('numero_whatsapp') ?></label>
          <input type="text" name="whatsapp" placeholder="595981000000" value="<?= htmlspecialchars($config['whatsapp'] ?? '') ?>">
          <small style="color:#888;"><?= __('formato_whatsapp') ?></small>
        </div>
        <div class="form-group">
          <label><?= __('email_contacto') ?></label>
          <input type="email" name="email_contacto" placeholder="tienda@ejemplo.com" value="<?= htmlspecialchars($config['email'] ?? '') ?>">
        </div>
        <div class="form-group">
          <label><?= __('simbolo_moneda') ?></label>
            <select name="moneda">
            <option value="Gs." <?= ($config['moneda']??'Gs.')==='Gs.'?'selected':'' ?>><?= __('moneda_guarani') ?></option>
            <option value="$" <?= ($config['moneda']??'')==='$'?'selected':'' ?>><?= __('moneda_dolar') ?></option>
            <option value="USD" <?= ($config['moneda']??'')==='USD'?'selected':'' ?>><?= __('moneda_usd') ?></option>
            <option value="€" <?= ($config['moneda']??'')==='€'?'selected':'' ?>><?= __('moneda_euro') ?></option>
          </select>
        </div>
        <div style="margin-top:1rem;padding-top:1rem;border-top:2px solid #eee;">
          <h3 style="font-size:0.95rem;color:#1a1a2e;margin-bottom:0.75rem;"> Tasas de cambio (1 unidad = ? Gs.)</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>US$ 1 =</label>
              <input type="number" name="tasa_usd" step="1" value="<?= htmlspecialchars($config['tasa_usd'] ?? '7500') ?>">
            </div>
            <div class="form-group">
              <label>R$ 1 =</label>
              <input type="number" name="tasa_brl" step="1" value="<?= htmlspecialchars($config['tasa_brl'] ?? '1300') ?>">
            </div>
            <div class="form-group">
              <label>€ 1 =</label>
              <input type="number" name="tasa_eur" step="1" value="<?= htmlspecialchars($config['tasa_eur'] ?? '8200') ?>">
            </div>
          </div>
        </div>
        <div style="margin-top:1.5rem;padding-top:1.5rem;border-top:2px solid #eee;">
          <h3 style="font-size:1rem;color:#1a1a2e;margin-bottom:.75rem;"> <?= __('cambiar_password') ?></h3>
          <div class="form-grid">
            <div class="form-group">
              <label><?= __('usuario') ?></label>
              <input type="text" name="admin_user" value="<?= htmlspecialchars($config['admin_user'] ?? 'admin') ?>">
            </div>
            <div class="form-group">
              <label><?= __('contrasena') ?></label>
              <input type="text" name="admin_pass" value="<?= htmlspecialchars($config['admin_pass'] ?? 'admin123#') ?>">
            </div>
          </div>
        </div>
        <button type="submit" class="btn btn-primary" style="margin-top:1rem;"> <?= __('guardar_configuracion') ?></button>
      </form>
    </div>

    <?php endif; ?>

  </main>
</div>
</body>
</html>
