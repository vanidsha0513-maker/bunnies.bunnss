<?php
require 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    // ດຶງຂໍ້ມູນໝວດໝູ່ທັງໝົດ ຫຼື ອັນດຽວ
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM categories WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $cat = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($cat) {
                echo json_encode($cat);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'ບໍ່ພົບໝວດໝູ່']);
            }
        } else {
            // ດຶງທັງໝົດ + ນັບຈຳນວນສິນຄ້າໃນແຕ່ລະໝວດ
            $stmt = $pdo->query("
                SELECT c.*, COUNT(p.id) as product_count
                FROM categories c
                LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active'
                GROUP BY c.id
                ORDER BY c.name ASC
            ");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        }
        break;

    // ເພີ່ມໝວດໝູ່ໃໝ່
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ກະລຸນາໃສ່ຊື່ໝວດໝູ່']);
            break;
        }

        // ກວດສອບຊື່ຊ້ຳ
        $check = $pdo->prepare("SELECT id FROM categories WHERE name = ?");
        $check->execute([$data['name']]);
        if ($check->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'ໝວດໝູ່ນີ້ມີຢູ່ແລ້ວ']);
            break;
        }

        $stmt = $pdo->prepare("INSERT INTO categories (name, description) VALUES (?, ?)");
        $stmt->execute([
            trim($data['name']),
            trim($data['description'] ?? '')
        ]);
        echo json_encode([
            'success' => true,
            'id'      => $pdo->lastInsertId(),
            'message' => 'ເພີ່ມໝວດໝູ່ສຳເລັດ'
        ]);
        break;

    // ແກ້ໄຂໝວດໝູ່
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['id']) || empty($data['name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ຂໍ້ມູນບໍ່ຄົບຖ້ວນ']);
            break;
        }

        // ກວດສອບຊື່ຊ້ຳ (ຍົກເວັ້ນຕົວເອງ)
        $check = $pdo->prepare("SELECT id FROM categories WHERE name = ? AND id != ?");
        $check->execute([$data['name'], $data['id']]);
        if ($check->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'ໝວດໝູ່ນີ້ມີຢູ່ແລ້ວ']);
            break;
        }

        $stmt = $pdo->prepare("UPDATE categories SET name = ?, description = ? WHERE id = ?");
        $stmt->execute([
            trim($data['name']),
            trim($data['description'] ?? ''),
            $data['id']
        ]);
        echo json_encode(['success' => true, 'message' => 'ແກ້ໄຂສຳເລັດ']);
        break;

    // ລຶບໝວດໝູ່
    case 'DELETE':
        $id = $_GET['id'] ?? null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ບໍ່ພົບ ID']);
            break;
        }

        // ກວດສອບວ່າໝວດໝູ່ນີ້ມີສິນຄ້າຢູ່ບໍ
        $check = $pdo->prepare("SELECT COUNT(*) as cnt FROM products WHERE category_id = ?");
        $check->execute([$id]);
        $row = $check->fetch(PDO::FETCH_ASSOC);

        if ($row['cnt'] > 0) {
            http_response_code(400);
            echo json_encode([
                'error'   => 'ບໍ່ສາມາດລຶບໄດ້',
                'message' => "ໝວດໝູ່ນີ້ມີສິນຄ້າ {$row['cnt']} ລາຍການ ກະລຸນາຍ້າຍສິນຄ້າກ່ອນ"
            ]);
            break;
        }

        $pdo->prepare("DELETE FROM categories WHERE id = ?")->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'ລຶບໝວດໝູ່ສຳເລັດ']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
?>