<?php
$host = 'localhost';
$user = 'root';
$pass = '';
$name = 'eclat';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$name;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die("Error de conexion: " . $e->getMessage());
}

date_default_timezone_set('America/Asuncion');
if (session_status() === PHP_SESSION_NONE) session_start();

function limpiar($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}
