<?php
require_once __DIR__ . '/../config/database.php';

function requerir_admin() {
    if (!isset($_SESSION['admin_id'])) {
        header("Location: login.php");
        exit();
    }
}

function generar_csrf() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function validar_csrf($token) {
    return hash_equals($_SESSION['csrf_token'] ?? '', $token);
}
