<?php
$host = 'localhost';
$user = 'root';
$password = '';
$database = 'tienda_moderna';

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

$banderas = [
    'es' => 'img/paraguay%20icono%20.png',
    'en' => 'img/eeuu%20icono.png',
    'pt' => 'img/brasil%20icono.png',
];
$bandera_actual = $banderas[$lang_code] ?? $banderas['es'];
$nombres_idioma = ['es' => 'Español', 'en' => 'English', 'pt' => 'Português'];
$idioma_actual = $nombres_idioma[$lang_code] ?? 'Español';

$config = $_SESSION['config_tienda'] ?? [
    'nombre'     => 'NovaRandú',
    'whatsapp'   => '',
    'email'      => '',
    'moneda'     => 'Gs.',
    'tasa_usd'   => 7500,
    'tasa_brl'   => 1300,
    'tasa_eur'   => 8200,
    'admin_user' => 'admin',
    'admin_pass' => 'admin123#',
];
$moneda = $config['moneda'];

$monedas_info = [
    'Gs.' => ['s' => 'Gs.', 'd' => 0],
    'USD' => ['s' => 'US$',  'd' => 2],
    'BRL' => ['s' => 'R$',   'd' => 2],
    'EUR' => ['s' => '€',    'd' => 2],
];
$moneda_tasas = [
    'Gs.' => 1,
    'USD' => (float)($config['tasa_usd'] ?? 7500),
    'BRL' => (float)($config['tasa_brl'] ?? 1300),
    'EUR' => (float)($config['tasa_eur'] ?? 8200),
];

$monedas_permitidas = ['Gs.', 'USD', 'BRL', 'EUR'];
if (isset($_GET['moneda']) && in_array($_GET['moneda'], $monedas_permitidas)) {
    $_SESSION['moneda_sel'] = $_GET['moneda'];
}
$moneda_sel = $_SESSION['moneda_sel'] ?? 'Gs.';
if (!isset($monedas_info[$moneda_sel])) $moneda_sel = 'Gs.';

function precio($gs) {
    global $moneda_sel, $monedas_info, $moneda_tasas;
    $info = $monedas_info[$moneda_sel] ?? $monedas_info['Gs.'];
    $tasa = $moneda_tasas[$moneda_sel] ?? 1;
    if ($tasa <= 0) $tasa = 1;
    $valor = $gs / $tasa;
    return $info['s'] . ' ' . number_format($valor, $info['d'], ',', '.');
}

// Usá tus propias keys de https://www.google.com/recaptcha/admin
// Las de acá son las test keys de Google (siempre válidas para desarrollo)
define('RECAPTCHA_SITE_KEY', '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI');
define('RECAPTCHA_SECRET_KEY', '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe');

function verificar_captcha($response) {
    $ch = curl_init('https://www.google.com/recaptcha/api/siteverify');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => 'secret=' . RECAPTCHA_SECRET_KEY . '&response=' . $response,
        CURLOPT_RETURNTRANSFER => true,
    ]);
    $res = json_decode(curl_exec($ch), true);
    curl_close($ch);
    return isset($res['success']) && $res['success'] === true;
}

function enviar_email($para, $asunto, $cuerpo) {
    $cabeceras = "MIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\nFrom: NovaRandú <noreply@novarandu.com>\r\n";
    return mail($para, $asunto, $cuerpo, $cabeceras);
}
?>
