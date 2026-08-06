<?php
$host = 'localhost';
$user = 'root';
$password = '';
$database = 'tienda_online';

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    die("Error de conexión: " . $conn->connect_error);
}

$conn->set_charset("utf8");
date_default_timezone_set('America/Asuncion');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['carrito'])) {
    $_SESSION['carrito'] = [];
}

function limpiar($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

$idiomas_permitidos = ['es','en','pt'];
if (isset($_GET['lang']) && in_array($_GET['lang'], $idiomas_permitidos)) {
    $_SESSION['lang'] = $_GET['lang'];
}
$lang_code = $_SESSION['lang'] ?? 'es';
$lang_file = __DIR__ . '/lang/' . $lang_code . '.php';
$_traducciones = file_exists($lang_file) ? require $lang_file : [];
function __($key) {
    global $_traducciones;
    return $_traducciones[$key] ?? $key;
}

$config = $_SESSION['config_tienda'] ?? [
    'nombre'   => 'Mi Tienda Online',
    'whatsapp' => '',
    'email'    => '',
    'moneda'   => 'Gs.',
];
$moneda = $config['moneda'];
?>
