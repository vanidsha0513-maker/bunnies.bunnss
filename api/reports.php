<?php
require 'config.php';
$report = $_GET['type'] ?? 'summary';

/* shared month filter helper */
function monthWhere($col = 'created_at') {
    global $_GET;
    $m = $_GET['month'] ?? '';
    if ($m && preg_match('/^\d{4}-\d{2}$/', $m)) {
        return ["AND DATE_FORMAT($col,'%Y-%m') = ?", [$m]];
    }
    return ['', []];
}

if ($report === 'summary') {
    [$mw, $mp] = monthWhere();
    $stmt = $pdo->prepare(
        "SELECT
           SUM(total_amount) AS total,
           COUNT(*) AS count,
           SUM(CASE WHEN payment_method='transfer'  AND status!='cancelled' THEN total_amount ELSE 0 END) AS transfer_total,
           SUM(CASE WHEN payment_method='cod'       AND status!='cancelled' THEN total_amount ELSE 0 END) AS cod_total,
           SUM(CASE WHEN status='cancelled' THEN total_amount ELSE 0 END) AS cancelled_total,
           COUNT(CASE WHEN status='cancelled' THEN 1 END) AS cancelled_count,
           COUNT(CASE WHEN payment_method='transfer' AND status!='cancelled' THEN 1 END) AS transfer_count,
           COUNT(CASE WHEN payment_method='cod'      AND status!='cancelled' THEN 1 END) AS cod_count
         FROM orders WHERE 1=1 $mw"
    );
    $stmt->execute($mp);
    $sales = $stmt->fetch(PDO::FETCH_ASSOC);

    $products = $pdo->query("SELECT COUNT(*) AS count FROM products WHERE status='active'")->fetch(PDO::FETCH_ASSOC);
    $lowStock = $pdo->query("SELECT * FROM products WHERE stock < 5 AND status='active'")->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['sales' => $sales, 'products' => $products, 'low_stock' => $lowStock]);

} elseif ($report === 'monthly') {
    $stmt = $pdo->query(
        "SELECT
           DATE_FORMAT(created_at,'%Y-%m') AS month,
           SUM(CASE WHEN status!='cancelled' THEN total_amount ELSE 0 END) AS total,
           SUM(CASE WHEN payment_method='transfer' AND status!='cancelled' THEN total_amount ELSE 0 END) AS transfer_total,
           SUM(CASE WHEN payment_method='cod'      AND status!='cancelled' THEN total_amount ELSE 0 END) AS cod_total,
           COUNT(*) AS orders,
           COUNT(CASE WHEN status='cancelled' THEN 1 END) AS cancelled
         FROM orders
         GROUP BY month
         ORDER BY month DESC
         LIMIT 12"
    );
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

} elseif ($report === 'top_products') {
    $stmt = $pdo->query(
        "SELECT p.id, p.name, p.sku, p.image,
                SUM(oi.quantity) AS total_qty,
                SUM(oi.quantity * oi.price) AS total_revenue
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         JOIN orders o   ON o.id = oi.order_id
         WHERE o.status != 'cancelled'
         GROUP BY p.id
         ORDER BY total_qty DESC
         LIMIT 10"
    );
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

} elseif ($report === 'profit') {
    [$mw, $mp] = monthWhere('o.created_at');

    /* overall profit */
    $stmt = $pdo->prepare(
        "SELECT
           COALESCE(SUM(oi.quantity * oi.price), 0)                       AS revenue,
           COALESCE(SUM(oi.quantity * COALESCE(p.cost_price,0)), 0)       AS cost,
           COALESCE(SUM(oi.quantity * oi.price), 0)
             - COALESCE(SUM(oi.quantity * COALESCE(p.cost_price,0)), 0)   AS profit,
           COALESCE(SUM(oi.quantity), 0)                                   AS units_sold
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         JOIN orders   o ON o.id = oi.order_id
         WHERE o.status != 'cancelled' $mw"
    );
    $stmt->execute($mp);
    $overall = $stmt->fetch(PDO::FETCH_ASSOC);

    /* profit by product */
    $stmt = $pdo->prepare(
        "SELECT p.id, p.name, p.sku, p.image, p.cost_price,
                SUM(oi.quantity)                                         AS qty,
                SUM(oi.quantity * oi.price)                              AS revenue,
                SUM(oi.quantity * COALESCE(p.cost_price,0))              AS cost,
                SUM(oi.quantity * oi.price)
                  - SUM(oi.quantity * COALESCE(p.cost_price,0))          AS profit
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         JOIN orders   o ON o.id = oi.order_id
         WHERE o.status != 'cancelled' $mw
         GROUP BY p.id
         ORDER BY profit DESC
         LIMIT 15"
    );
    $stmt->execute($mp);
    $byProduct = $stmt->fetchAll(PDO::FETCH_ASSOC);

    /* profit by month (always all-time for trend context) */
    $byMonth = $pdo->query(
        "SELECT
           DATE_FORMAT(o.created_at,'%Y-%m') AS month,
           SUM(oi.quantity * oi.price)                             AS revenue,
           SUM(oi.quantity * COALESCE(p.cost_price,0))             AS cost,
           SUM(oi.quantity * oi.price)
             - SUM(oi.quantity * COALESCE(p.cost_price,0))         AS profit
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         JOIN orders   o ON o.id = oi.order_id
         WHERE o.status != 'cancelled'
         GROUP BY month
         ORDER BY month DESC
         LIMIT 12"
    )->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['overall'=>$overall, 'by_product'=>$byProduct, 'by_month'=>$byMonth]);

} elseif ($report === 'status_counts') {
    [$mw, $mp] = monthWhere();
    $stmt = $pdo->prepare(
        "SELECT status, COUNT(*) AS cnt, SUM(total_amount) AS total
         FROM orders WHERE 1=1 $mw GROUP BY status"
    );
    $stmt->execute($mp);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

} elseif ($report === 'daily') {
    // Daily sales for a given month (default: current month)
    $month = isset($_GET['month']) ? $_GET['month'] : date('Y-m');
    if (!preg_match('/^\d{4}-\d{2}$/', $month)) $month = date('Y-m');

    $stmt = $pdo->prepare(
        "SELECT
           DATE(created_at) AS day,
           SUM(CASE WHEN status!='cancelled' THEN total_amount ELSE 0 END) AS total,
           COUNT(*) AS orders,
           COUNT(CASE WHEN status='cancelled' THEN 1 END) AS cancelled
         FROM orders
         WHERE DATE_FORMAT(created_at,'%Y-%m') = ?
         GROUP BY day
         ORDER BY day ASC"
    );
    $stmt->execute([$month]);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

} elseif ($report === 'day_orders') {
    $date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) $date = date('Y-m-d');

    $stmt = $pdo->prepare(
        "SELECT id, order_number, customer_name, customer_phone,
                total_amount, payment_method, status, created_at
         FROM orders
         WHERE DATE(created_at) = ?
         ORDER BY created_at DESC"
    );
    $stmt->execute([$date]);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

} elseif ($report === 'preorder_time') {
    $period = $_GET['period'] ?? 'month'; // day | week | month | year
    $year   = isset($_GET['year'])  ? (int)$_GET['year']  : (int)date('Y');
    $month  = isset($_GET['month']) ? $_GET['month']       : '';

    switch ($period) {
        case 'day':
            /* days of a specific month, default current */
            $m = ($month && preg_match('/^\d{4}-\d{2}$/', $month)) ? $month : date('Y-m');
            $stmt = $pdo->prepare(
                "SELECT
                   DATE(o.created_at)                       AS period_key,
                   DATE_FORMAT(o.created_at,'%d/%m/%Y')    AS period_label,
                   COUNT(DISTINCT o.id)                     AS order_count,
                   COALESCE(SUM(oi.quantity),0)             AS total_units,
                   COALESCE(SUM(oi.quantity * oi.price),0)  AS total_value
                 FROM order_items oi
                 JOIN orders o ON o.id = oi.order_id
                 WHERE oi.is_preorder = 1
                   AND o.status != 'cancelled'
                   AND DATE_FORMAT(o.created_at,'%Y-%m') = ?
                 GROUP BY period_key
                 ORDER BY period_key ASC"
            );
            $stmt->execute([$m]);
            break;

        case 'week':
            /* weeks of a specific year */
            $stmt = $pdo->prepare(
                "SELECT
                   YEARWEEK(o.created_at,1)                              AS period_key,
                   CONCAT('ອາທິດ ', WEEK(o.created_at,1),' /',YEAR(o.created_at)) AS period_label,
                   MIN(DATE(o.created_at))                               AS week_start,
                   COUNT(DISTINCT o.id)                                  AS order_count,
                   COALESCE(SUM(oi.quantity),0)                          AS total_units,
                   COALESCE(SUM(oi.quantity * oi.price),0)               AS total_value
                 FROM order_items oi
                 JOIN orders o ON o.id = oi.order_id
                 WHERE oi.is_preorder = 1
                   AND o.status != 'cancelled'
                   AND YEAR(o.created_at) = ?
                 GROUP BY period_key
                 ORDER BY period_key ASC"
            );
            $stmt->execute([$year]);
            break;

        case 'year':
            $stmt = $pdo->query(
                "SELECT
                   YEAR(o.created_at)                        AS period_key,
                   CONCAT(YEAR(o.created_at),' ປີ')          AS period_label,
                   COUNT(DISTINCT o.id)                      AS order_count,
                   COALESCE(SUM(oi.quantity),0)              AS total_units,
                   COALESCE(SUM(oi.quantity * oi.price),0)   AS total_value
                 FROM order_items oi
                 JOIN orders o ON o.id = oi.order_id
                 WHERE oi.is_preorder = 1 AND o.status != 'cancelled'
                 GROUP BY period_key
                 ORDER BY period_key ASC"
            );
            break;

        default: /* month */
            $stmt = $pdo->prepare(
                "SELECT
                   DATE_FORMAT(o.created_at,'%Y-%m')                                   AS period_key,
                   CONCAT(
                     ELT(MONTH(o.created_at),
                       'ມັງກອນ','ກຸມພາ','ມີນາ','ເມສາ','ພຶດສະພາ','ມິຖຸນາ',
                       'ກໍລະກົດ','ສິງຫາ','ກັນຍາ','ຕຸລາ','ພະຈິກ','ທັນວາ'),
                     ' ', YEAR(o.created_at)
                   )                                                                    AS period_label,
                   COUNT(DISTINCT o.id)                                                 AS order_count,
                   COALESCE(SUM(oi.quantity),0)                                         AS total_units,
                   COALESCE(SUM(oi.quantity * oi.price),0)                              AS total_value
                 FROM order_items oi
                 JOIN orders o ON o.id = oi.order_id
                 WHERE oi.is_preorder = 1
                   AND o.status != 'cancelled'
                   AND YEAR(o.created_at) = ?
                 GROUP BY period_key
                 ORDER BY period_key ASC"
            );
            $stmt->execute([$year]);
            break;
    }
    $rows = isset($stmt) ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
    /* available years for selector */
    $years = $pdo->query(
        "SELECT DISTINCT YEAR(o.created_at) AS y FROM order_items oi
         JOIN orders o ON o.id=oi.order_id
         WHERE oi.is_preorder=1 AND o.status!='cancelled'
         ORDER BY y DESC"
    )->fetchAll(PDO::FETCH_COLUMN);
    echo json_encode(['rows' => $rows, 'years' => $years]);

} elseif ($report === 'preorders') {
    /* summary counts */
    $summary = $pdo->query(
        "SELECT
           COUNT(*)                                          AS total_lines,
           COALESCE(SUM(oi.quantity),0)                     AS total_units,
           COALESCE(SUM(oi.quantity * oi.price),0)          AS total_value,
           COUNT(DISTINCT oi.product_id)                    AS unique_products,
           COUNT(DISTINCT o.customer_phone)                 AS unique_customers
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE oi.is_preorder = 1 AND o.status != 'cancelled'"
    )->fetch(PDO::FETCH_ASSOC);

    /* detail rows */
    $rows = $pdo->query(
        "SELECT
           oi.id, oi.quantity, oi.price,
           p.id AS product_id,
           COALESCE(p.name_lo, p.name) AS product_name,
           p.image AS product_image, p.sku,
           o.id AS order_id, o.order_number,
           o.customer_name, o.customer_phone,
           o.status, o.payment_method, o.created_at
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         JOIN orders   o ON o.id = oi.order_id
         WHERE oi.is_preorder = 1 AND o.status != 'cancelled'
         ORDER BY o.created_at DESC"
    )->fetchAll(PDO::FETCH_ASSOC);

    /* aggregate by product (how many units per product) */
    $byProduct = $pdo->query(
        "SELECT
           COALESCE(p.name_lo, p.name) AS product_name,
           p.image AS product_image, p.sku,
           SUM(oi.quantity)            AS total_units,
           COUNT(DISTINCT o.id)        AS order_count
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         JOIN orders   o ON o.id = oi.order_id
         WHERE oi.is_preorder = 1 AND o.status != 'cancelled'
         GROUP BY p.id
         ORDER BY total_units DESC"
    )->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['summary' => $summary, 'rows' => $rows, 'by_product' => $byProduct]);
}
?>
