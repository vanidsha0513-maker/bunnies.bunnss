<?php
require 'config.php';
$data = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? '';

if ($action === 'send_otp') {
    $phone = preg_replace('/\s+/', '', trim($data['phone'] ?? ''));
    if (!$phone) { echo json_encode(['error' => 'ກະລຸນາໃສ່ເບີໂທ']); exit; }

    $otp = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);

    $pdo->prepare(
        "INSERT INTO member_otps (phone, otp, expires_at)
         VALUES (?, ?, NOW() + INTERVAL 5 MINUTE)
         ON DUPLICATE KEY UPDATE otp=VALUES(otp), expires_at=NOW() + INTERVAL 5 MINUTE"
    )->execute([$phone, $otp]);

    // TODO: replace with real SMS gateway (Unitel / ETL / M-Phet)
    // Example: send_sms_unitel($phone, "ລະຫັດ OTP bunnies.bunn: $otp (ໃຊ້ໄດ້ 5 ນາທີ)");

    $response = ['success' => true, 'message' => 'ສົ່ງ OTP ໄປທີ່ ' . $phone];
    // DEV ONLY — remove in production
    $response['otp_debug'] = $otp;
    echo json_encode($response);

} elseif ($action === 'verify_otp') {
    $phone            = preg_replace('/\s+/', '', trim($data['phone']            ?? ''));
    $otp              = trim($data['otp']              ?? '');
    $shippingCompany  = trim($data['shipping_company'] ?? '');
    $memberNumber     = trim($data['member_number']    ?? '');

    if (!$phone || strlen($otp) !== 6) {
        echo json_encode(['error' => 'ຂໍ້ມູນບໍ່ຄົບຖ້ວນ']); exit;
    }

    $stmt = $pdo->prepare(
        "SELECT * FROM member_otps WHERE phone=? AND otp=? AND expires_at > NOW()"
    );
    $stmt->execute([$phone, $otp]);
    if (!$stmt->fetch()) {
        echo json_encode(['error' => 'OTP ບໍ່ຖືກຕ້ອງ ຫຼື ໝົດອາຍຸແລ້ວ']); exit;
    }

    $pdo->prepare(
        "INSERT INTO members (phone, shipping_company, member_number)
         VALUES (?,?,?)
         ON DUPLICATE KEY UPDATE shipping_company=VALUES(shipping_company), member_number=VALUES(member_number)"
    )->execute([$phone, $shippingCompany, $memberNumber]);

    $pdo->prepare("DELETE FROM member_otps WHERE phone=?")->execute([$phone]);

    echo json_encode(['success' => true, 'message' => 'ຢືນຢັນສຳເລັດ']);

} else {
    echo json_encode(['error' => 'action ບໍ່ຖືກຕ້ອງ']);
}
?>
