<?php
require_once __DIR__ . '/auth.php';
requerir_admin();

$id = (int)($_GET['id'] ?? 0);
$item = $pdo->prepare("SELECT * FROM menu_items WHERE id = ?");
$item->execute([$id]);
$item = $item->fetch();

if ($item) {
    if ($item['imagen'] && file_exists(__DIR__ . '/uploads/' . $item['imagen'])) {
        unlink(__DIR__ . '/uploads/' . $item['imagen']);
    }
    $stmt = $pdo->prepare("DELETE FROM menu_items WHERE id = ?");
    $stmt->execute([$id]);
}

header("Location: menu.php?msg=Plato eliminado");
exit();
