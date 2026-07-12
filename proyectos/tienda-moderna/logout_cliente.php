<?php
require_once 'config.php';
unset($_SESSION['cliente_email'], $_SESSION['cliente_nombre']);
header("Location: index.php");
exit();
