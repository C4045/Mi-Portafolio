<?php
require_once __DIR__ . '/auth.php';
requerir_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: propiedades.php');
    exit;
}
validar_csrf();

$id = (int) ($_POST['id'] ?? 0);
if ($id > 0) {
    $stmt = $pdo->prepare("DELETE FROM propiedades WHERE id = ?");
    $stmt->execute([$id]);
}
header('Location: propiedades.php?msg=eliminado');
exit;
