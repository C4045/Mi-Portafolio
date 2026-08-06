<?php
require_once 'config.php';

$busqueda = isset($_GET['buscar']) ? limpiar($_GET['buscar']) : '';
$orden = isset($_GET['orden']) ? limpiar($_GET['orden']) : 'reciente';

$sql = "SELECT * FROM productos";
$params = [];
$tipos = '';

if ($busqueda !== '') {
    $sql .= " WHERE nombre LIKE ? OR descripcion LIKE ?";
    $like = "%" . $busqueda . "%";
    $params[] = $like;
    $params[] = $like;
    $tipos .= 'ss';
}

switch ($orden) {
    case 'precio_asc':  $sql .= " ORDER BY precio ASC"; break;
    case 'precio_desc': $sql .= " ORDER BY precio DESC"; break;
    case 'nombre':      $sql .= " ORDER BY nombre ASC"; break;
    default:            $sql .= " ORDER BY id DESC";
}

$stmt = $conn->prepare($sql);
if (!empty($params)) {
    $stmt->bind_param($tipos, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();

$total_carrito = array_sum($_SESSION['carrito']);
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title> Mi Tienda Online</title>
  <link rel="stylesheet" href="styles.css">
  <style>
    .gear{position:fixed;font-size:1rem;opacity:0.15;z-index:999;pointer-events:none;user-select:none}
    .gear-tr{top:8px;right:10px;pointer-events:auto;cursor:default;opacity:0.18}
    .gear-tl{top:8px;left:10px}
    .gear-bl{bottom:8px;left:10px}
    .gear-br{bottom:8px;right:10px}
    .gear-tr:hover{opacity:0.4}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1> Mi Tienda Online</h1>
      <div class="header-actions">
        <a href="carrito.php" class="btn-carrito">
           Carrito <span class="badge"><?php echo $total_carrito; ?></span>
        </a>
        <a href="contacto.php" class="btn-volver" style="background:white;color:#667eea;"> Contacto</a>
      </div>
    </div>

    <div class="gear gear-tl"></div>
    <div class="gear gear-tr" ondblclick="location.href='login.php'"></div>
    <div class="gear gear-bl"></div>
    <div class="gear gear-br"></div>

    <?php if (isset($_GET['mensaje'])): ?>
      <div class="mensaje mensaje-exito"> <?php echo limpiar($_GET['mensaje']); ?></div>
    <?php endif; ?>
    <?php if (isset($_GET['error'])): ?>
      <div class="mensaje mensaje-error"> <?php echo limpiar($_GET['error']); ?></div>
    <?php endif; ?>

    <!-- Barra de búsqueda y filtros -->
    <form method="GET" class="barra-busqueda">
      <input type="text" name="buscar" placeholder=" Buscar producto..." value="<?php echo $busqueda; ?>">
      <select name="orden">
        <option value="reciente" <?php echo $orden === 'reciente' ? 'selected' : ''; ?>>Más recientes</option>
        <option value="precio_asc" <?php echo $orden === 'precio_asc' ? 'selected' : ''; ?>>Precio: menor a mayor</option>
        <option value="precio_desc" <?php echo $orden === 'precio_desc' ? 'selected' : ''; ?>>Precio: mayor a menor</option>
        <option value="nombre" <?php echo $orden === 'nombre' ? 'selected' : ''; ?>>Nombre A-Z</option>
      </select>
      <button type="submit" class="btn-buscar">Buscar</button>
      <?php if ($busqueda): ?>
        <a href="index.php" class="btn-limpiar"> Limpiar</a>
      <?php endif; ?>
    </form>

    <div class="productos-grid">
      <?php if ($result->num_rows > 0): ?>
        <?php while ($row = $result->fetch_assoc()): ?>
          <div class="producto-card <?php echo $row['stock'] <= 0 ? 'agotado' : ''; ?>">
            <a href="producto.php?id=<?php echo (int)$row['id']; ?>" style="text-decoration:none;color:inherit;">
            <div class="producto-img">
              <?php if ($row['imagen'] && file_exists("img/" . $row['imagen'])): ?>
                <img src="img/<?php echo limpiar($row['imagen']); ?>" alt="<?php echo limpiar($row['nombre']); ?>">
              <?php else: ?>
                <div class="img-placeholder"></div>
              <?php endif; ?>
              <?php if ($row['stock'] > 0 && $row['stock'] <= 3): ?>
                <span class="badge-stock-bajo">¡Últimas unidades!</span>
              <?php endif; ?>
            </div>
            </a>
            <div class="producto-info">
              <a href="producto.php?id=<?php echo (int)$row['id']; ?>" style="text-decoration:none;color:inherit;">
                <h3><?php echo limpiar($row['nombre']); ?></h3>
              </a>
              <p><?php echo limpiar($row['descripcion']); ?></p>
              <div class="producto-precio"><?php echo $moneda; ?><?php echo number_format($row['precio'], 0, ',', '.'); ?></div>
              <div class="producto-stock <?php echo $row['stock'] <= 3 ? 'stock-critico' : ''; ?>">
                <?php echo $row['stock'] > 0 ? " Stock: {$row['stock']}" : " Agotado"; ?>
              </div>
              <form action="carrito.php" method="POST">
                <input type="hidden" name="producto_id" value="<?php echo $row['id']; ?>">
                <input type="hidden" name="accion" value="agregar">
                <div class="cantidad-control">
                  <label>Cantidad:</label>
                  <input type="number" name="cantidad" value="1" min="1" max="<?php echo $row['stock']; ?>" <?php echo $row['stock'] <= 0 ? 'disabled' : ''; ?>>
                </div>
                <button type="submit" class="btn-agregar" <?php echo $row['stock'] <= 0 ? 'disabled' : ''; ?>>
                  <?php echo $row['stock'] > 0 ? ' Agregar al carrito' : ' Agotado'; ?>
                </button>
              </form>
            </div>
          </div>
        <?php endwhile; ?>
      <?php else: ?>
        <div class="vacio-estado">
          <p> <?php echo $busqueda ? "No se encontraron productos para \"$busqueda\"" : "No hay productos disponibles"; ?></p>
          <?php if ($busqueda): ?><a href="index.php">Ver todos los productos</a><?php endif; ?>
        </div>
      <?php endif; ?>
    </div>
  </div>
</body>
</html>
<?php $conn->close(); ?>
