<?php
require 'config.php';

$data   = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? '';

/* ── LOGIN (phone + password) ── */
if ($action === 'login') {
    $phone = preg_replace('/\D/', '', trim($data['phone'] ?? ''));
    $pass  = $data['password'] ?? '';

    if (!$phone || !$pass) {
        echo json_encode(['error' => 'ກະລຸນາໃສ່ເບີໂທ ແລະ ລະຫັດຜ່ານ']); exit;
    }

    $s = $pdo->prepare("SELECT id, name, password FROM members WHERE phone = ?");
    $s->execute([$phone]);
    $user = $s->fetch(PDO::FETCH_ASSOC);

    if (!$user || !$user['password'] || !password_verify($pass, $user['password'])) {
        echo json_encode(['error' => 'ເບີໂທ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ']); exit;
    }

    echo json_encode([
        'success' => true,
        'id'      => $user['id'],
        'name'    => $user['name'] ?: $phone,
        'phone'   => $phone
    ]);
    exit;
}

/* ── SEND OTP ── */
if ($action === 'send_otp') {
    $phone = preg_replace('/\D/', '', trim($data['phone'] ?? ''));
    $mode  = $data['mode'] ?? 'login';

    if (!$phone || strlen($phone) < 8) {
        echo json_encode(['error' => 'ເບີໂທບໍ່ຖືກຕ້ອງ']); exit;
    }

    $s = $pdo->prepare("SELECT id FROM members WHERE phone = ?");
    $s->execute([$phone]);
    $exists = (bool)$s->fetch();

    if (($mode === 'login' || $mode === 'reset') && !$exists) {
        echo json_encode(['error' => 'ບໍ່ພົບເບີໂທນີ້ — ກະລຸນາສະໝັກກ່ອນ']); exit;
    }
    if ($mode === 'register' && $exists) {
        echo json_encode(['error' => 'ເບີໂທນີ້ສະໝັກແລ້ວ — ກະລຸນາເຂົ້າສູ່ລະບົບ']); exit;
    }

    $otp = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);

    $pdo->prepare(
        "INSERT INTO member_otps (phone, otp, expires_at)
         VALUES (?, ?, NOW() + INTERVAL 5 MINUTE)
         ON DUPLICATE KEY UPDATE otp=VALUES(otp), expires_at=NOW() + INTERVAL 5 MINUTE"
    )->execute([$phone, $otp]);

    // TODO: ເຊື່ອມ SMS gateway ໃນ production
    echo json_encode(['success' => true, 'otp_debug' => $otp]); // DEV ONLY
    exit;
}

/* ── VERIFY OTP ── */
if ($action === 'verify_otp') {
    $phone = preg_replace('/\D/', '', trim($data['phone'] ?? ''));
    $otp   = trim($data['otp']  ?? '');
    $mode  = $data['mode'] ?? 'login';

    if (!$phone || strlen($otp) !== 6) {
        echo json_encode(['error' => 'ຂໍ້ມູນບໍ່ຄົບ']); exit;
    }

    $s = $pdo->prepare(
        "SELECT * FROM member_otps WHERE phone=? AND otp=? AND expires_at > NOW()"
    );
    $s->execute([$phone, $otp]);
    if (!$s->fetch()) {
        echo json_encode(['error' => 'ລະຫັດ OTP ບໍ່ຖືກ ຫຼື ໝົດອາຍຸ (5 ນາທີ)']); exit;
    }

    if ($mode === 'login') {
        // Login: delete OTP, return user
        $pdo->prepare("DELETE FROM member_otps WHERE phone=?")->execute([$phone]);
        $s = $pdo->prepare("SELECT id, name FROM members WHERE phone=?");
        $s->execute([$phone]);
        $user = $s->fetch(PDO::FETCH_ASSOC);
        if (!$user) { echo json_encode(['error' => 'ບໍ່ພົບຜູ້ໃຊ້']); exit; }
        echo json_encode(['success' => true, 'id' => $user['id'], 'name' => $user['name'] ?: $phone, 'phone' => $phone]);

    } else {
        // Register / Reset: store token for completing the flow
        $token = bin2hex(random_bytes(24));
        $pdo->prepare(
            "UPDATE member_otps SET token=?, expires_at=NOW() + INTERVAL 10 MINUTE WHERE phone=?"
        )->execute([$token, $phone]);
        echo json_encode(['verified' => true, 'token' => $token]);
    }
    exit;
}

/* ── RESET PASSWORD ── */
if ($action === 'reset_password') {
    $phone = preg_replace('/\D/', '', trim($data['phone'] ?? ''));
    $token = trim($data['token']    ?? '');
    $pass  = $data['password']      ?? '';

    if (!$phone || !$token || !$pass) {
        echo json_encode(['error' => 'ຂໍ້ມູນບໍ່ຄົບ']); exit;
    }
    if (strlen($pass) < 6) {
        echo json_encode(['error' => 'ລະຫັດຜ່ານຢ່າງໜ້ອຍ 6 ຕົວ']); exit;
    }

    $s = $pdo->prepare(
        "SELECT * FROM member_otps WHERE phone=? AND token=? AND expires_at > NOW()"
    );
    $s->execute([$phone, $token]);
    if (!$s->fetch()) {
        echo json_encode(['error' => 'ໝົດເວລາ — ກະລຸນາເລີ່ມໃໝ່']); exit;
    }

    $hash = password_hash($pass, PASSWORD_DEFAULT);
    $pdo->prepare("UPDATE members SET password=? WHERE phone=?")->execute([$hash, $phone]);
    $pdo->prepare("DELETE FROM member_otps WHERE phone=?")->execute([$phone]);

    echo json_encode(['success' => true]);
    exit;
}

/* ── COMPLETE REGISTER ── */
if ($action === 'complete_register') {
    $phone = preg_replace('/\D/', '', trim($data['phone'] ?? ''));
    $token = trim($data['token']    ?? '');
    $name  = trim($data['name']     ?? '');
    $pass  = $data['password']      ?? '';

    if (!$phone || !$token || !$name || !$pass) {
        echo json_encode(['error' => 'ຂໍ້ມູນບໍ່ຄົບ']); exit;
    }
    if (strlen($pass) < 6) {
        echo json_encode(['error' => 'ລະຫັດຜ່ານຢ່າງໜ້ອຍ 6 ຕົວ']); exit;
    }

    // Verify token
    $s = $pdo->prepare(
        "SELECT * FROM member_otps WHERE phone=? AND token=? AND expires_at > NOW()"
    );
    $s->execute([$phone, $token]);
    if (!$s->fetch()) {
        echo json_encode(['error' => 'ໝົດເວລາຢືນຢັນ — ກະລຸນາເລີ່ມໃໝ່']); exit;
    }

    // Check phone not already registered
    $s = $pdo->prepare("SELECT id FROM members WHERE phone=?");
    $s->execute([$phone]);
    if ($s->fetch()) {
        echo json_encode(['error' => 'ເບີໂທນີ້ສະໝັກແລ້ວ']); exit;
    }

    $hash = password_hash($pass, PASSWORD_DEFAULT);
    $pdo->prepare("INSERT INTO members (phone, name, password) VALUES (?,?,?)")
        ->execute([$phone, $name, $hash]);
    $id = $pdo->lastInsertId();

    $pdo->prepare("DELETE FROM member_otps WHERE phone=?")->execute([$phone]);

    echo json_encode(['success' => true, 'id' => $id, 'name' => $name, 'phone' => $phone]);
    exit;
}

echo json_encode(['error' => 'action ບໍ່ຖືກຕ້ອງ']);
?>
