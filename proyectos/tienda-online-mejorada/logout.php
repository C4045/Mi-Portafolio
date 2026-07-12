<?php
require_once 'config.php';
$_SESSION['admin_logueado'] = false;
unset($_SESSION['admin_usuario']);
session_destroy();
header("Location: login.php");
exit();
?>
