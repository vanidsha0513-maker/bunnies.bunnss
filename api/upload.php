<?php
require 'config.php';
if($_FILES['image']) {
    $ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
    $filename = 'uploads/' . uniqid('prod_') . '.' . $ext;
    move_uploaded_file($_FILES['image']['tmp_name'], '../' . $filename);
    echo json_encode(['success'=>true, 'path'=> $filename]);
}
?>