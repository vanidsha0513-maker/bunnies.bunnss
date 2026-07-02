<?php
/* ONE-TIME SETUP — DELETE THIS FILE AFTER USE */
require 'config.php';
header('Content-Type: text/html; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    if (!$username || strlen($password) < 4) {
        $err = 'ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານສັ້ນເກີນ';
    } else {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $check = $pdo->prepare("SELECT id FROM admins WHERE username=?");
        $check->execute([$username]);
        if ($check->fetch()) {
            $pdo->prepare("UPDATE admins SET password=? WHERE username=?")->execute([$hash, $username]);
        } else {
            $pdo->prepare("INSERT INTO admins (username,password) VALUES (?,?)")->execute([$username, $hash]);
        }
        $ok = true;
    }
}
?>
<!DOCTYPE html>
<html lang="lo">
<head>
<meta charset="UTF-8">
<title>Admin Init</title>
<style>
  body{font-family:'Noto Sans Lao',sans-serif;background:#f4f4f2;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
  .box{background:#fff;border-radius:16px;padding:40px 36px;max-width:400px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,.1)}
  h2{margin:0 0 6px;font-size:1.1rem;color:#111}
  .warn{background:#fff8e1;border:1px solid #ffd54f;border-radius:8px;padding:10px 14px;font-size:.8rem;color:#7a5c00;margin-bottom:24px}
  label{display:block;font-size:.75rem;color:#888;text-transform:uppercase;letter-spacing:.8px;margin-bottom:5px;margin-top:16px}
  input{width:100%;padding:11px 14px;border:1.5px solid #ddd;border-radius:8px;font-family:inherit;font-size:.9rem;box-sizing:border-box;outline:none}
  input:focus{border-color:#c9a96e}
  button{width:100%;margin-top:20px;padding:13px;background:#111;color:#fff;border:none;border-radius:10px;font-family:inherit;font-size:.9rem;font-weight:700;cursor:pointer}
  button:hover{background:#333}
  .ok{background:#e8f5e9;border:1px solid #a5d6a7;border-radius:10px;padding:16px;text-align:center;color:#1b5e20;font-weight:700}
  .err{background:#fce4ec;border:1px solid #ef9a9a;border-radius:10px;padding:12px;color:#c62828;margin-bottom:16px}
</style>
</head>
<body>
<div class="box">
  <h2>ຕັ້ງລະຫັດຜ່ານ Admin</h2>

  <?php if (!empty($ok)): ?>
    <div class="ok">
      ✅ ສຳເລັດ! ລຶບໄຟລ໌ <code>api/admin-init.php</code> ໄດ້ເລີຍ
    </div>
    <div style="margin-top:16px;text-align:center">
      <a href="../admin/login.html" style="color:#c9a96e;font-weight:700">→ ໄປໜ້າ Login</a>
    </div>
  <?php else: ?>
    <?php if (!empty($err)): ?>
      <div class="err">❌ <?= htmlspecialchars($err) ?></div>
    <?php endif; ?>
    <div class="warn">⚠️ ໃຊ້ຄັ້ງດຽວແລ້ວລຶບໄຟລ໌ນີ້ທັນທີ</div>
    <form method="POST">
      <label>Username</label>
      <input name="username" value="Taiy" required>
      <label>ລະຫັດຜ່ານໃໝ່</label>
      <input name="password" type="password" placeholder="ໃສ່ລະຫັດຜ່ານ" required>
      <button type="submit">Hash & ບັນທຶກ</button>
    </form>
  <?php endif; ?>
</div>
</body>
</html>
