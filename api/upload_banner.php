<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-cache');

// GET ping
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        'ok'             => true,
        'php'            => PHP_VERSION,
        'file_uploads'   => ini_get('file_uploads'),
        'upload_max'     => ini_get('upload_max_filesize'),
        'dir_exists'     => is_dir(__DIR__ . '/../uploads/banners/'),
        'dir_writable'   => is_writable(__DIR__ . '/../uploads/banners/'),
        'dir_path'       => realpath(__DIR__ . '/../uploads/banners/'),
    ]);
    exit;
}

// POST upload
$slot = isset($_POST['slot']) ? (int)$_POST['slot'] : 0;
if ($slot < 1 || $slot > 3) {
    echo json_encode(['success' => false, 'error' => 'slot invalid: ' . $slot]);
    exit;
}

if (empty($_FILES['image']) || $_FILES['image']['error'] !== 0) {
    $code = empty($_FILES['image']) ? 'no file' : 'error code ' . $_FILES['image']['error'];
    echo json_encode(['success' => false, 'error' => 'file error: ' . $code]);
    exit;
}

$dir = __DIR__ . '/../uploads/banners/';
if (!is_dir($dir)) mkdir($dir, 0777, true);

$ext  = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION)) ?: 'jpg';
$dest = $dir . 'slide' . $slot . '.' . $ext;

// remove old files for this slot
foreach (glob($dir . 'slide' . $slot . '.*') ?: [] as $old) @unlink($old);

if (move_uploaded_file($_FILES['image']['tmp_name'], $dest)) {
    echo json_encode(['success' => true, 'path' => 'uploads/banners/slide' . $slot . '.' . $ext]);
} else {
    echo json_encode([
        'success'      => false,
        'error'        => 'move_uploaded_file failed',
        'dest'         => $dest,
        'dir_writable' => is_writable($dir),
        'tmp_file'     => $_FILES['image']['tmp_name'],
        'tmp_exists'   => file_exists($_FILES['image']['tmp_name']),
    ]);
}
?>
