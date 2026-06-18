<?php
require 'config.php';
$method = $_SERVER['REQUEST_METHOD'];
try { $pdo->exec("ALTER TABLE order_items ADD COLUMN is_preorder TINYINT(1) DEFAULT 0"); } catch(Exception $e) {}

if($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $orderNum = 'BUN-' . date('Ymd') . '-' . strtoupper(substr(uniqid(),6));

    $itemsTotal      = isset($data['items_total'])      ? (int)$data['items_total']      : (int)$data['total'];
    $shippingFee     = isset($data['shipping_fee'])     ? (int)$data['shipping_fee']      : 0;
    $shippingCompany = isset($data['shipping_company']) ? trim($data['shipping_company']) : '';
    $memberNumber    = isset($data['member_number'])    ? trim($data['member_number'])    : '';
    $paymentMethod   = isset($data['payment_method'])   ? trim($data['payment_method'])   : 'transfer';
    $memberId        = isset($data['member_id'])        ? (int)$data['member_id']         : null;
    $total           = $itemsTotal + $shippingFee;
    $customerPhone   = preg_replace('/\D/', '', trim($data['phone'] ?? ''));

    $stmt = $pdo->prepare(
        "INSERT INTO orders
         (order_number,customer_name,customer_phone,customer_address,
          total_amount,items_total,shipping_fee,shipping_company,member_number,
          payment_method,payment_slip,note,member_id)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)"
    );
    $stmt->execute([
        $orderNum,
        trim($data['name'] ?? ''), $customerPhone, trim($data['address'] ?? ''),
        $total, $itemsTotal, $shippingFee, $shippingCompany, $memberNumber,
        $paymentMethod, $data['slip'] ?? '', trim($data['note'] ?? ''),
        $memberId ?: null
    ]);
    $orderId = $pdo->lastInsertId();

    foreach($data['items'] as $item) {
        $isPre = empty($item['is_preorder']) ? 0 : 1;
        $pdo->prepare("INSERT INTO order_items (order_id,product_id,quantity,price,is_preorder) VALUES (?,?,?,?,?)")
            ->execute([$orderId, $item['id'], $item['qty'], $item['price'], $isPre]);
        if (!$isPre) {
            $pdo->prepare("UPDATE products SET stock=stock-? WHERE id=?")
                ->execute([$item['qty'], $item['id']]);
        }
    }
    echo json_encode(['success'=>true,'order_number'=>$orderNum]);

} elseif($method === 'GET') {
    if(isset($_GET['id'])) {
        $stmt = $pdo->prepare(
            "SELECT oi.*, p.name AS product_name, p.image AS product_image
             FROM order_items oi
             LEFT JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id = ?"
        );
        $stmt->execute([$_GET['id']]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

    } elseif(isset($_GET['member_id'])) {
        $mid = (int)$_GET['member_id'];
        $stmt = $pdo->prepare(
            "SELECT * FROM orders WHERE member_id = ? ORDER BY created_at DESC"
        );
        $stmt->execute([$mid]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

    } elseif(isset($_GET['phone'])) {
        $phone = preg_replace('/\D/', '', trim($_GET['phone']));
        $right8 = substr($phone, -8);
        $stmt = $pdo->prepare(
            "SELECT * FROM orders
             WHERE RIGHT(REPLACE(REPLACE(REPLACE(customer_phone,' ',''),'-',''),'+856',''), 8) = ?
             ORDER BY created_at DESC"
        );
        $stmt->execute([$right8]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

    } else {
        $stmt = $pdo->query("SELECT * FROM orders ORDER BY created_at DESC");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

} elseif($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);

    /* customer self-cancel: action=cancel, must still be pending */
    if(isset($data['action']) && $data['action'] === 'cancel') {
        $id = (int)($data['id'] ?? 0);
        if(!$id) { echo json_encode(['success'=>false,'error'=>'ບໍ່ພົບ ID']); exit; }
        $row = $pdo->prepare("SELECT status FROM orders WHERE id=?");
        $row->execute([$id]);
        $ord = $row->fetch(PDO::FETCH_ASSOC);
        if(!$ord) { echo json_encode(['success'=>false,'error'=>'ບໍ່ພົບຄຳສັ່ງ']); exit; }
        if($ord['status'] !== 'pending') {
            echo json_encode(['success'=>false,'error'=>'ຍົກເລີກບໍ່ໄດ້ — ຄຳສັ່ງນີ້ຖືກຢືນຢັນແລ້ວ']);
            exit;
        }
        /* restore stock */
        $items = $pdo->prepare("SELECT product_id, quantity FROM order_items WHERE order_id=?");
        $items->execute([$id]);
        foreach($items->fetchAll(PDO::FETCH_ASSOC) as $it) {
            $pdo->prepare("UPDATE products SET stock=stock+? WHERE id=?")->execute([$it['quantity'],$it['product_id']]);
        }
        $pdo->prepare("UPDATE orders SET status='cancelled' WHERE id=?")->execute([$id]);
        echo json_encode(['success'=>true]);
        exit;
    }

    /* customer update address */
    if(isset($data['action']) && $data['action'] === 'update_address') {
        $id   = (int)($data['id'] ?? 0);
        $addr = trim($data['address'] ?? '');
        if(!$id) { echo json_encode(['success'=>false,'error'=>'ບໍ່ພົບ ID']); exit; }
        $pdo->prepare("UPDATE orders SET customer_address=? WHERE id=?")->execute([$addr, $id]);
        echo json_encode(['success'=>true]);
        exit;
    }

    /* admin status update */
    $pdo->prepare("UPDATE orders SET status=? WHERE id=?")->execute([$data['status'],$data['id']]);
    echo json_encode(['success'=>true]);
}
?>
