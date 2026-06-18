<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo json_encode([
  'php_version'      => PHP_VERSION,
  'upload_enabled'   => ini_get('file_uploads') ? true : false,
  'upload_max_size'  => ini_get('upload_max_filesize'),
  'post_max_size'    => ini_get('post_max_size'),
  'tmp_dir'          => sys_get_temp_dir(),
  'tmp_writable'     => is_writable(sys_get_temp_dir()),
  'dir_exists'       => is_dir(dirname(__DIR__) . '/uploads/banners/'),
  'dir_writable'     => is_writable(dirname(__DIR__) . '/uploads/banners/'),
  'dir_path'         => dirname(__DIR__) . '/uploads/banners/',
  'files_received'   => !empty($_FILES),
  'files_data'       => $_FILES,
  'post_data'        => $_POST,
]);
?>
