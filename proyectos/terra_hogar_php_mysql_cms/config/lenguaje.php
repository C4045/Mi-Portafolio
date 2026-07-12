<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$idiomas_soportados = ['es', 'en', 'pt'];

$lang = $_GET['lang'] ?? $_SESSION['lang'] ?? $_COOKIE['lang'] ?? 'es';

if (!in_array($lang, $idiomas_soportados)) {
    $lang = 'es';
}

$_SESSION['lang'] = $lang;
setcookie('lang', $lang, time() + 86400 * 365, '/', '', false, true);

$traducciones = [];
$archivo = __DIR__ . '/../lang/' . $lang . '.php';
if (file_exists($archivo)) {
    $traducciones = require $archivo;
}
if (!is_array($traducciones)) {
    $traducciones = [];
}

$fallback = [];
$fallback_file = __DIR__ . '/../lang/es.php';
if (file_exists($fallback_file)) {
    $fallback = require $fallback_file;
}
if (!is_array($fallback)) {
    $fallback = [];
}

function t(string $clave, string $default = ''): string {
    global $traducciones, $fallback;
    if (isset($traducciones[$clave]) && $traducciones[$clave] !== '') {
        return $traducciones[$clave];
    }
    if (isset($fallback[$clave]) && $fallback[$clave] !== '') {
        return $fallback[$clave];
    }
    return $default !== '' ? $default : $clave;
}

function t_echo(string $clave, string $default = ''): void {
    echo t($clave, $default);
}
