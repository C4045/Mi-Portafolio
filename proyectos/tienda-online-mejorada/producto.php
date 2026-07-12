<?php
require_once 'config.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    header("Location: index.php?error=Producto no encontrado");
    exit();
}

$stmt = $conn->prepare("SELECT * FROM productos WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$producto = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$producto) {
    header("Location: index.php?error=Producto no encontrado");
    exit();
}

$imagenes = [];
if ($producto['imagen']) {
    $imagenes[] = $producto['imagen'];
    $info = pathinfo($producto['imagen']);
    $base = $info['filename'];
    $ext  = $info['extension'];
    for ($i = 1; $i <= 10; $i++) {
        $extra = "{$base}_{$i}.{$ext}";
        if (file_exists("img/$extra")) {
            $imagenes[] = $extra;
        }
    }
}

$relacionados = $conn->query(
    "SELECT * FROM productos WHERE id != $id ORDER BY RAND() LIMIT 4"
);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo limpiar($producto['nombre']); ?> | Mi Tienda</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        .galeria-principal img { width:100%; height:400px; object-fit:contain; display:block; background:var(--bg3); }
        .galeria-thumbs { display:flex; gap:.5rem; padding:.75rem; background:var(--bg3); flex-wrap:wrap; }
        .galeria-thumbs img { width:70px; height:70px; object-fit:cover; border-radius:var(--radius-sm); cursor:pointer; border:2px solid transparent; transition:var(--t); }
        .galeria-thumbs img:hover,.galeria-thumbs img.activa { border-color:var(--gold); }
        .info-descripcion { font-size:1rem; line-height:1.7; color:var(--ivory); margin:1.5rem 0; }
        .stock-disponible { background:rgba(52,211,153,.1); color:#34D399; }
        .stock-bajo { background:rgba(250,204,21,.1); color:#FACC15; }
        .stock-agotado { background:rgba(255,77,109,.1); color:var(--danger); }
        .info-detalles { background:var(--bg3); border-radius:var(--radius); padding:1.25rem; margin:1.5rem 0; border:1px solid var(--border); }
        .info-detalles h3 { font-size:1rem; color:var(--gold); margin-bottom:.75rem; }
        .info-detalles li { padding:.4rem 0; font-size:.9rem; color:var(--ivory); border-bottom:1px solid var(--border); }
        .info-detalles li:last-child { border-bottom:none; }
        .info-detalles li strong { color:var(--gold); display:inline-block; min-width:130px; }
        .acciones-producto { display:flex; gap:1rem; align-items:center; flex-wrap:wrap; margin-top:1.5rem; padding-top:1.5rem; border-top:1px solid var(--border); }
        .acciones-producto .cantidad-control { display:flex; align-items:center; gap:.5rem; }
        .acciones-producto .cantidad-control input { width:70px; padding:.6rem; font-size:1rem; text-align:center; }
        .btn-detalle-comprar { flex:1; padding:.85rem 2rem; background:var(--gold); color:#0C0C0F; border:none; border-radius:var(--radius-sm); font-size:1rem; font-weight:700; cursor:pointer; transition:var(--t); }
        .btn-detalle-comprar:hover { background:var(--gold-light); }
        .btn-detalle-comprar:disabled { background:var(--muted2); color:var(--muted); cursor:not-allowed; }
        .tabla-espec { width:100%; border-collapse:collapse; }
        .tabla-espec tr { border-bottom:1px solid var(--border); }
        .tabla-espec tr:last-child { border-bottom:none; }
        .tabla-espec td { padding:0.6rem 0.75rem; font-size:0.95rem; color:var(--muted); vertical-align:top; }
        .espec-label { color:var(--gold); font-weight:600; min-width:180px; width:30%; }
        .espec-valor { color:var(--ivory); }
        .relacionados { margin-top:3rem; }
        .relacionados h2 { font-size:1.3rem; color:var(--ivory); margin-bottom:1rem; }
        @media (max-width:768px) { .galeria-principal img { height:280px; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><?php echo limpiar($producto['nombre']); ?></h1>
            <a href="index.php" class="btn-volver">Volver a la tienda</a>
        </div>

        <?php if (isset($_GET['agregado'])): ?>
            <div class="mensaje mensaje-exito">Producto agregado al carrito</div>
        <?php endif; ?>

        <div class="card" style="padding:2rem;">
            <div class="producto-detalle">
                <div class="galeria-principal">
                    <img id="imgPrincipal" src="img/<?php echo $imagenes[0] ?? ''; ?>"
                         alt="<?php echo limpiar($producto['nombre']); ?>"
                         onerror="this.parentElement.innerHTML='<div class=img-placeholder style=height:400px;display:flex;align-items:center;justify-content:center;font-size:5rem;background:#f7f7f7;></div>'">
                    <?php if (count($imagenes) > 1): ?>
                    <div class="galeria-thumbs">
                        <?php foreach ($imagenes as $i => $img): ?>
                            <img src="img/<?php echo $img; ?>"
                                 class="<?php echo $i === 0 ? 'activa' : ''; ?>"
                                 onclick="document.getElementById('imgPrincipal').src='img/<?php echo $img; ?>';document.querySelectorAll('.galeria-thumbs img').forEach(e=>e.classList.remove('activa'));this.classList.add('activa');"
                                 alt="Foto <?php echo $i + 1; ?>">
                        <?php endforeach; ?>
                    </div>
                    <?php endif; ?>
                </div>

                <div class="info-producto">
                    <h1><?php echo limpiar($producto['nombre']); ?></h1>

                    <div class="info-precio">
                        <?php echo $moneda; ?><?php echo number_format($producto['precio'], 0, ',', '.'); ?>
                    </div>

                    <div class="info-stock <?php
                        echo $producto['stock'] > 3 ? 'stock-disponible' : ($producto['stock'] > 0 ? 'stock-bajo' : 'stock-agotado');
                    ?>">
                        <?php
                        if ($producto['stock'] > 3) {
                            echo "Disponible (" . (int)$producto['stock'] . " unidades)";
                        } elseif ($producto['stock'] > 0) {
                            echo "Quedan " . (int)$producto['stock'] . " unidades";
                        } else {
                            echo "Agotado";
                        }
                        ?>
                    </div>

                    <div class="info-descripcion">
                        <?php echo nl2br(limpiar($producto['descripcion'])); ?>
                    </div>

                    <div class="info-detalles">
                        <h3>Información general</h3>
                        <ul>
                            <li><strong>Precio:</strong> <?php echo $moneda; ?><?php echo number_format($producto['precio'], 0, ',', '.'); ?></li>
                            <li><strong>Stock disponible:</strong> <?php echo (int)$producto['stock']; ?> unidades</li>
                            <li><strong>Código:</strong> PROD-<?php echo str_pad((int)$producto['id'], 4, '0', STR_PAD_LEFT); ?></li>
                            <li><strong>Fecha de alta:</strong> <?php echo date('d/m/Y', strtotime($producto['fecha_creacion'])); ?></li>
                        </ul>
                    </div>

                    <form action="carrito.php" method="POST" class="acciones-producto">
                        <input type="hidden" name="producto_id" value="<?php echo (int)$producto['id']; ?>">
                        <input type="hidden" name="accion" value="agregar">
                        <div class="cantidad-control">
                            <label>Cantidad:</label>
                            <input type="number" name="cantidad" value="1" min="1"
                                   max="<?php echo $producto['stock']; ?>"
                                   <?php echo $producto['stock'] <= 0 ? 'disabled' : ''; ?>>
                        </div>
                        <button type="submit" class="btn-detalle-comprar"
                                <?php echo $producto['stock'] <= 0 ? 'disabled' : ''; ?>>
                            <?php echo $producto['stock'] > 0 ? 'Agregar al carrito' : 'Agotado'; ?>
                        </button>
                    </form>
                </div>
            </div>
        </div>

        <?php if (!empty($producto['detalles'])): ?>
        <div class="card" style="padding:2rem;margin-top:2rem;">
            <div class="especificaciones">
                <h2 style="font-size:1.3rem;color:#1a1a2e;margin-bottom:1rem;">Especificaciones</h2>
                <table class="tabla-espec">
                    <?php foreach (explode("\n", $producto['detalles']) as $linea): ?>
                        <?php $linea = trim($linea); if (!$linea) continue; ?>
                        <?php if (strpos($linea, ':') !== false): ?>
                            <?php list($label, $valor) = explode(':', $linea, 2); ?>
                            <tr><td class="espec-label"><?php echo limpiar(trim($label)); ?></td><td class="espec-valor"><?php echo limpiar(trim($valor)); ?></td></tr>
                        <?php else: ?>
                            <tr><td colspan="2"><?php echo limpiar($linea); ?></td></tr>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </table>
            </div>
        </div>
        <?php endif; ?>

        <?php if ($relacionados && $relacionados->num_rows > 0): ?>
        <div class="relacionados">
            <h2>Productos relacionados</h2>
            <div class="productos-grid">
                <?php while ($r = $relacionados->fetch_assoc()): ?>
                <div class="producto-card">
                    <a href="producto.php?id=<?php echo (int)$r['id']; ?>" style="text-decoration:none;color:inherit;">
                    <div class="producto-img">
                        <?php if ($r['imagen'] && file_exists("img/".$r['imagen'])): ?>
                            <img src="img/<?php echo $r['imagen']; ?>" alt="<?php echo limpiar($r['nombre']); ?>">
                        <?php else: ?>
                            <div class="img-placeholder"></div>
                        <?php endif; ?>
                    </div>
                    <div class="producto-info">
                        <h3><?php echo limpiar($r['nombre']); ?></h3>
                        <div class="producto-precio"><?php echo $moneda; ?><?php echo number_format($r['precio'], 0, ',', '.'); ?></div>
                    </div>
                    </a>
                </div>
                <?php endwhile; ?>
            </div>
        </div>
        <?php endif; ?>
    </div>
</body>
</html>
