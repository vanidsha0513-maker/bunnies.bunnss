<?php
session_start();
header('Content-Type: application/json');
header('Cache-Control: no-store');
echo json_encode([
    'authed' => !empty($_SESSION['admin_logged']),
    'user'   => $_SESSION['admin_user'] ?? null,
]);
?>
