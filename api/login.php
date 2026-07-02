<?php
session_start();
header('Content-Type: application/json');
require 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['username'], $data['password'])) {
    echo json_encode(['success' => false]); exit;
}

$stmt = $pdo->prepare("SELECT * FROM admins WHERE username = ?");
$stmt->execute([$data['username']]);
$admin = $stmt->fetch(PDO::FETCH_ASSOC);

if ($admin && password_verify($data['password'], $admin['password'])) {
    session_regenerate_id(true);
    $_SESSION['admin_logged'] = true;
    $_SESSION['admin_user']   = $admin['username'];
    $_SESSION['admin_id']     = $admin['id'];
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false]);
}
?>
