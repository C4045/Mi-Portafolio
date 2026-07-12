<?php
session_start();
require_once __DIR__ . '/../config/database.php';

function requerir_admin(): void {
    if (empty($_SESSION['admin'])) {
        exit('Acceso denegado');
    }
}

function csrf_token(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function csrf_field(): string {
    return '<input type="hidden" name="csrf_token" value="' . csrf_token() . '">';
}

function validar_csrf(): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') return;
    $token = $_POST['csrf_token'] ?? '';
    if (empty($token) || !hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
        exit('Error de seguridad: token CSRF inválido.');
    }
}

function verificar_intentos_login(string $ip): bool {
    $stmt = $GLOBALS['pdo']->prepare(
        "SELECT COUNT(*) FROM login_attempts WHERE ip = ? AND attempted_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)"
    );
    $stmt->execute([$ip]);
    return $stmt->fetchColumn() < 5;
}

function registrar_intento_login(string $ip): void {
    $stmt = $GLOBALS['pdo']->prepare("INSERT INTO login_attempts (ip) VALUES (?)");
    $stmt->execute([$ip]);
}

function limpiar_intentos_login(string $ip): void {
    $stmt = $GLOBALS['pdo']->prepare("DELETE FROM login_attempts WHERE ip = ?");
    $stmt->execute([$ip]);
}
