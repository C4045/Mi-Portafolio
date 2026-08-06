<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'agregar') {
    $producto_id = (int)$_POST['producto_id'];
    $cantidad = isset($_POST['cantidad']) ? max(1, (int)$_POST['cantidad']) : 1;

    $stmt = $conn->prepare("SELECT stock, nombre FROM productos WHERE id = ?");
    $stmt->bind_param("i", $producto_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $producto = $result->fetch_assoc();

    if (!$producto) {
        header("Location: index.php?error=Producto no encontrado");
        exit();
    }

    $ya_en_carrito = isset($_SESSION['carrito'][$producto_id]) ? $_SESSION['carrito'][$producto_id] : 0;
    $total_solicitado = $ya_en_carrito + $cantidad;

    if ($total_solicitado > $producto['stock']) {
        $disponible = $producto['stock'] - $ya_en_carrito;
        if ($disponible <= 0) {
            header("Location: index.php?error=No hay más unidades disponibles de " . urlencode($producto['nombre']));
        } else {
            header("Location: index.php?error=Solo quedan $disponible unidades disponibles de " . urlencode($producto['nombre']));
        }
        exit();
    }

    $_SESSION['carrito'][$producto_id] = $total_solicitado;
    header("Location: carrito.php?agregado=1");
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'actualizar') {
    $producto_id = (int)$_POST['producto_id'];
    $nueva_cantidad = (int)$_POST['cantidad'];

    if ($nueva_cantidad <= 0) {
        unset($_SESSION['carrito'][$producto_id]);
    } else {
        $stmt = $conn->prepare("SELECT stock FROM productos WHERE id = ?");
        $stmt->bind_param("i", $producto_id);
        $stmt->execute();
        $res = $stmt->get_result()->fetch_assoc();
        $_SESSION['carrito'][$producto_id] = min($nueva_cantidad, $res['stock']);
    }
    header("Location: carrito.php");
    exit();
}

if (isset($_GET['eliminar'])) {
    $producto_id = (int)$_GET['eliminar'];
    unset($_SESSION['carrito'][$producto_id]);
    header("Location: carrito.php");
    exit();
}

if (isset($_GET['vaciar'])) {
    $_SESSION['carrito'] = [];
    header("Location: carrito.php");
    exit();
}

$productos_carrito = [];
$total = 0;

if (!empty($_SESSION['carrito'])) {
    $ids = array_map('intval', array_keys($_SESSION['carrito']));
    $ids = array_filter($ids, fn($id) => $id > 0);
    if (!empty($ids)) {
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $types = str_repeat('i', count($ids));
        $stmt = $conn->prepare("SELECT * FROM productos WHERE id IN ($placeholders)");
        $stmt->bind_param($types, ...$ids);
        $stmt->execute();
        $result = $stmt->get_result();

        while ($row = $result->fetch_assoc()) {
            $row['cantidad'] = $_SESSION['carrito'][$row['id']];
            $row['subtotal'] = $row['precio'] * $row['cantidad'];
            $total += $row['subtotal'];
            $productos_carrito[] = $row;
        }
        $stmt->close();
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title> Carrito | Mi Tienda</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <div class="header">
      <h1> Carrito de Compras</h1>
      <a href="index.php" class="btn-volver">← Seguir comprando</a>
    </div>

    <?php if (isset($_GET['agregado'])): ?>
      <div class="mensaje mensaje-exito"> Producto agregado al carrito</div>
    <?php endif; ?>

    <?php if (empty($productos_carrito)): ?>
      <div class="card">
        <p class="vacio"> Tu carrito está vacío</p>
        <a href="index.php" class="btn-comprar" style="display:inline-block; text-decoration:none; margin-top:1rem;">Ver productos</a>
      </div>
    <?php else: ?>
      <div class="card">
        <div class="carrito-items">
          <?php foreach ($productos_carrito as $item): ?>
            <div class="carrito-item">
              <div class="carrito-info">
                <h3><?php echo htmlspecialchars($item['nombre']); ?></h3>
                <p>Precio unitario: <strong><?php echo $moneda; ?><?php echo number_format($item['precio'], 0, ',', '.'); ?></strong></p>
                <p>Subtotal: <strong><?php echo $moneda; ?><?php echo number_format($item['subtotal'], 0, ',', '.'); ?></strong></p>
              </div>
              <div class="carrito-controles">
                <form action="carrito.php" method="POST" class="form-cantidad">
                  <input type="hidden" name="accion" value="actualizar">
                  <input type="hidden" name="producto_id" value="<?php echo $item['id']; ?>">
                  <label>Cantidad:</label>
                  <input type="number" name="cantidad" value="<?php echo $item['cantidad']; ?>" min="0" max="<?php echo $item['stock']; ?>" class="input-cantidad">
                  <button type="submit" class="btn-actualizar">↺ Actualizar</button>
                </form>
                <a href="carrito.php?eliminar=<?php echo $item['id']; ?>" class="btn-eliminar" onclick="return confirm('¿Quitar este producto?')"> Quitar</a>
              </div>
            </div>
          <?php endforeach; ?>
        </div>

        <div class="carrito-total">
          <h2>Total: <span class="total-precio"><?php echo $moneda; ?><?php echo number_format($total, 0, ',', '.'); ?></span></h2>
          <div class="carrito-acciones">
            <a href="carrito.php?vaciar=1" class="btn-vaciar" onclick="return confirm('¿Vaciar todo el carrito?')"> Vaciar carrito</a>
            <a href="procesar_compra.php" class="btn-comprar"> Finalizar compra</a>
          </div>
        </div>
      </div>
    <?php endif; ?>
  </div>
</body>
</html>
