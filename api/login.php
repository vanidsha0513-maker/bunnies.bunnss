<?php
require 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
$stmt = $pdo->prepare("SELECT * FROM admins WHERE username = ?");
$stmt->execute([$data['username']]);
$admin = $stmt->fetch(PDO::FETCH_ASSOC);

if ($admin && password_verify($data['password'], $admin['password'])) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false]);
}
?>