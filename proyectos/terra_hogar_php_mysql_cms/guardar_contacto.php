<?php
session_start();
require_once __DIR__ . '/config/database.php';

$error = '';

if ($_POST) {
    $honeypot = trim($_POST['_trap'] ?? '');
    if ($honeypot !== '') {
        exit('SPAM detectado.');
    }

    $captcha_answer = trim($_POST['_captcha'] ?? '');
    $captcha_expected = $_SESSION['captcha_result'] ?? null;
    if ($captcha_expected === null || (int) $captcha_answer !== $captcha_expected) {
        header('Location: index.php?error=captcha');
        exit;
    }

    $nombre   = trim($_POST['nombre'] ?? '');
    $telefono = trim($_POST['telefono'] ?? '');
    $mensaje  = trim($_POST['mensaje'] ?? '');

    if (strlen($nombre) > 120) {
        $error = 'El nombre es demasiado largo.';
    } elseif (strlen($telefono) > 50) {
        $error = 'El teléfono es demasiado largo.';
    } elseif (strlen($mensaje) > 2000) {
        $error = 'El mensaje no puede superar los 2000 caracteres.';
    }

    if ($error === '') {
        if ($nombre === '' || $mensaje === '') {
            header('Location: index.php?error=completa');
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO contactos (nombre, telefono, mensaje) VALUES (?, ?, ?)");
        $stmt->execute([$nombre, $telefono, $mensaje]);

        $_SESSION['captcha_result'] = null;
        header('Location: index.php?ok=1');
        exit;
    }
}

header('Location: index.php?error=' . urlencode($error ?: 'completa'));
exit;
