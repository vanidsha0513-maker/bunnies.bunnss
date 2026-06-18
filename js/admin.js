/**
 * admin.js — bunnies.bunn Admin JavaScript
 * ຄຸ້ມຄອງ: ໝວດໝູ່, ສິນຄ້າ, ຄຳສັ່ງຊື້
 */

'use strict';

// ============================================================
// UTILITY
// ============================================================

/** ແປ HTML entities ເພື່ອປ້ອງກັນ XSS */
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** ສະແດງ Toast Notification */
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show' + (type === 'error' ? ' error' : '');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => { t.className = 'toast'; }, 3500);
}

/** Format ລາຄາ */
function formatPrice(n) {
  return '₭' + Number(n || 0).toLocaleString();
}

/** Format ວັນທີ */
function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('lo-LA');
}


// ============================================================
// ========== CATEGORIES ======================================
// ============================================================

let editingCatId = null;

/** ໂຫຼດລາຍການໝວດໝູ່ */
async function loadCategories() {
  const grid = document.getElementById('cat-grid');
  if (!grid) return;
  grid.innerHTML = '<p style="color:#aaa;padding:20px">ກຳລັງໂຫຼດ...</p>';

  try {
    const res = await fetch('../api/categories.php');
    if (!res.ok) throw new Error('Server error');
    const cats = await res.json();

    if (!cats.length) {
      grid.innerHTML = '<div class="empty-state">📂 ຍັງບໍ່ມີໝວດໝູ່ — ກົດ "+ ເພີ່ມໝວດໝູ່" ເພື່ອເລີ່ມ</div>';
      return;
    }

    grid.innerHTML = cats.map(c => `
      <div class="cat-card">
        <div class="cat-name">🗂️ ${escHtml(c.name)}</div>
        <div class="cat-desc">${escHtml(c.description || '—')}</div>
        <div class="cat-count">📦 ສິນຄ້າ: ${c.product_count} ລາຍການ</div>
        <div class="cat-actions">
          <button class="btn btn-primary" style="flex:1"
            onclick='openEditCatModal(${JSON.stringify(c)})'>✏️ ແກ້ໄຂ</button>
          <button class="btn btn-danger" style="flex:1"
            onclick="deleteCategory(${c.id}, '${escHtml(c.name)}', ${c.product_count})">🗑️ ລຶບ</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = '<div class="empty-state" style="color:#c00">❌ ໂຫຼດຂໍ້ມູນຜິດພາດ</div>';
  }
}

/** ເປີດ Modal ເພີ່ມ */
function openModal() {
  editingCatId = null;
  setValue('cat-id', '');
  setValue('cat-name', '');
  setValue('cat-desc', '');
  setText('modal-title', 'ເພີ່ມໝວດໝູ່ໃໝ່');
  openModalEl('modal');
  focusEl('cat-name');
}

/** ເປີດ Modal ແກ້ໄຂ */
function openEditCatModal(cat) {
  editingCatId = cat.id;
  setValue('cat-id', cat.id);
  setValue('cat-name', cat.name);
  setValue('cat-desc', cat.description || '');
  setText('modal-title', 'ແກ້ໄຂໝວດໝູ່');
  openModalEl('modal');
  focusEl('cat-name');
}

/** ປິດ Modal */
function closeModal() {
  closeModalEl('modal');
  editingCatId = null;
}

/** ບັນທຶກ (ເພີ່ມ / ແກ້ໄຂ) */
async function saveCategory() {
  const name = getValue('cat-name').trim();
  const desc = getValue('cat-desc').trim();

  if (!name) {
    showToast('ກະລຸນາໃສ່ຊື່ໝວດໝູ່', 'error');
    focusEl('cat-name');
    return;
  }

  const isEdit = !!editingCatId;
  const method = isEdit ? 'PUT' : 'POST';
  const body = isEdit
    ? { id: editingCatId, name, description: desc }
    : { name, description: desc };

  try {
    const res = await fetch('../api/categories.php', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (data.success) {
      showToast(isEdit ? '✅ ແກ້ໄຂໝວດໝູ່ສຳເລັດ' : '✅ ເພີ່ມໝວດໝູ່ສຳເລັດ');
      closeModal();
      loadCategories();
    } else {
      showToast(data.error || 'ເກີດຂໍ້ຜິດພາດ', 'error');
    }
  } catch {
    showToast('ບໍ່ສາມາດເຊື່ອມຕໍ່ server', 'error');
  }
}

/** ລຶບໝວດໝູ່ */
async function deleteCategory(id, name, productCount) {
  if (productCount > 0) {
    showToast(`❌ "${name}" ມີສິນຄ້າ ${productCount} ລາຍ — ຍ້າຍສິນຄ້າກ່ອນ`, 'error');
    return;
  }
  if (!confirm(`ຢືນຢັນລຶບໝວດໝູ່ "${name}"?`)) return;

  try {
    const res = await fetch(`../api/categories.php?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('✅ ລຶບໝວດໝູ່ສຳເລັດ');
      loadCategories();
    } else {
      showToast(data.message || data.error || 'ລຶບຜິດພາດ', 'error');
    }
  } catch {
    showToast('ບໍ່ສາມາດເຊື່ອມຕໍ່ server', 'error');
  }
}


// ============================================================
// ========== PRODUCTS ========================================
// ============================================================

let editingProdId = null;
let uploadedImagePath = '';

/** ໂຫຼດລາຍການສິນຄ້າ */
async function loadProducts(catId = '', search = '') {
  const tbody = document.getElementById('product-table');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px">ກຳລັງໂຫຼດ...</td></tr>';

  let url = '../api/products.php';
  const params = [];
  if (catId) params.push(`category=${catId}`);
  if (search) params.push(`search=${encodeURIComponent(search)}`);
  if (params.length) url += '?' + params.join('&');

  try {
    const res = await fetch(url);
    const products = await res.json();

    if (!products.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:30px">ບໍ່ພົບສິນຄ້າ</td></tr>';
      return;
    }

    tbody.innerHTML = products.map(p => `
      <tr>
        <td>
          <img src="${p.image ? '../' + escHtml(p.image) : ''}" alt="${escHtml(p.name)}"
            style="width:50px;height:50px;object-fit:cover;background:#eee"
            onerror="this.style.background='#e8e8e8'">
        </td>
        <td>
          <strong>${escHtml(p.name)}</strong><br>
          <span style="font-size:12px;color:#999">${escHtml(p.sku || '—')}</span>
        </td>
        <td>${escHtml(p.category_name || '—')}</td>
        <td><strong>${formatPrice(p.price)}</strong></td>
        <td>
          <span style="color:${p.stock < 5 ? '#c00' : '#2a7a2a'};font-weight:bold">
            ${p.stock}
          </span>
        </td>
        <td>
          <button class="btn btn-primary" onclick='openEditProdModal(${JSON.stringify(p)})'>✏️</button>
          <button class="btn btn-danger" onclick="deleteProduct(${p.id}, '${escHtml(p.name)}')">🗑️</button>
        </td>
      </tr>
    `).join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#c00">❌ ໂຫຼດຜິດພາດ</td></tr>';
  }
}

/** ໂຫຼດໝວດໝູ່ລົງ Dropdown ໃນ Product Form */
async function loadCatOptions() {
  const sel = document.getElementById('p-cat');
  if (!sel) return;
  try {
    const res = await fetch('../api/categories.php');
    const cats = await res.json();
    const current = sel.value;
    sel.innerHTML = '<option value="">-- ເລືອກໝວດໝູ່ --</option>' +
      cats.map(c => `<option value="${c.id}">${escHtml(c.name)}</option>`).join('');
    if (current) sel.value = current;
  } catch { /* ignore */ }
}

/** ເປີດ Modal ເພີ່ມສິນຄ້າ */
function openProdModal() {
  editingProdId = null;
  uploadedImagePath = '';
  clearProdForm();
  setText('prod-modal-title', 'ເພີ່ມສິນຄ້າໃໝ່');
  openModalEl('prod-modal');
  loadCatOptions();
  focusEl('p-name');
}

/** ເປີດ Modal ແກ້ໄຂສິນຄ້າ */
function openEditProdModal(p) {
  editingProdId = p.id;
  uploadedImagePath = p.image || '';
  setValue('p-id', p.id);
  setValue('p-name', p.name);
  setValue('p-cat', p.category_id || '');
  setValue('p-price', p.price);
  setValue('p-stock', p.stock);
  setValue('p-sku', p.sku || '');
  setValue('p-weight', p.weight || '');
  setValue('p-dims', p.dimensions || '');
  setValue('p-desc', p.description || '');
  setValue('p-status', p.status || 'active');
  setValue('p-image-path', p.image || '');

  const preview = document.getElementById('img-preview');
  if (preview) {
    if (p.image) { preview.src = '../' + p.image; preview.style.display = 'block'; }
    else { preview.style.display = 'none'; }
  }

  setText('prod-modal-title', 'ແກ້ໄຂສິນຄ້າ');
  openModalEl('prod-modal');
  loadCatOptions().then(() => { setValue('p-cat', p.category_id || ''); });
  focusEl('p-name');
}

function closeProdModal() {
  closeModalEl('prod-modal');
  editingProdId = null;
  uploadedImagePath = '';
}

/** ອັບໂຫຼດຮູບ + Preview */
async function previewImage(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Local preview ທັນທີ
  const reader = new FileReader();
  reader.onload = ev => {
    const preview = document.getElementById('img-preview');
    if (preview) { preview.src = ev.target.result; preview.style.display = 'block'; }
  };
  reader.readAsDataURL(file);

  // Upload to server
  try {
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch('../api/upload.php', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.path) {
      uploadedImagePath = data.path;
      setValue('p-image-path', data.path);
      showToast('✅ ອັບໂຫຼດຮູບສຳເລັດ');
    } else {
      showToast('ອັບໂຫຼດຮູບຜິດພາດ', 'error');
    }
  } catch {
    showToast('ເຊື່ອມຕໍ່ server ຜິດພາດ', 'error');
  }
}

/** ບັນທຶກສິນຄ້າ */
async function saveProduct() {
  const name = getValue('p-name').trim();
  const price = getValue('p-price');

  if (!name) { showToast('ກະລຸນາໃສ່ຊື່ສິນຄ້າ', 'error'); focusEl('p-name'); return; }
  if (!price || isNaN(price)) { showToast('ກະລຸນາໃສ່ລາຄາ', 'error'); focusEl('p-price'); return; }

  const isEdit = !!editingProdId;
  const body = {
    id: editingProdId,
    category_id: getValue('p-cat'),
    name,
    description: getValue('p-desc').trim(),
    price: parseFloat(price),
    stock: parseInt(getValue('p-stock')) || 0,
    image: getValue('p-image-path') || uploadedImagePath,
    sku: getValue('p-sku').trim(),
    weight: parseFloat(getValue('p-weight')) || null,
    dimensions: getValue('p-dims').trim(),
    status: getValue('p-status') || 'active'
  };

  try {
    const res = await fetch('../api/products.php', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (data.success) {
      showToast(isEdit ? '✅ ແກ້ໄຂສິນຄ້າສຳເລັດ' : '✅ ເພີ່ມສິນຄ້າສຳເລັດ');
      closeProdModal();
      loadProducts();
    } else {
      showToast(data.error || 'ເກີດຂໍ້ຜິດພາດ', 'error');
    }
  } catch {
    showToast('ບໍ່ສາມາດເຊື່ອມຕໍ່ server', 'error');
  }
}

/** ລຶບສິນຄ້າ */
async function deleteProduct(id, name) {
  if (!confirm(`ຢືນຢັນລຶບສິນຄ້າ "${name}"?`)) return;
  try {
    const res = await fetch(`../api/products.php?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('✅ ລຶບສິນຄ້າສຳເລັດ');
      loadProducts();
    } else {
      showToast(data.error || 'ລຶບຜິດພາດ', 'error');
    }
  } catch {
    showToast('ບໍ່ສາມາດເຊື່ອມຕໍ່ server', 'error');
  }
}

function clearProdForm() {
  ['p-id','p-name','p-price','p-stock','p-sku','p-weight','p-dims','p-desc','p-image-path'].forEach(id => setValue(id, ''));
  setValue('p-cat', '');
  setValue('p-status', 'active');
  const preview = document.getElementById('img-preview');
  if (preview) preview.style.display = 'none';
  const fileInput = document.getElementById('p-image');
  if (fileInput) fileInput.value = '';
}


// ============================================================
// ========== ORDERS ==========================================
// ============================================================

/** ໂຫຼດຄຳສັ່ງຊື້ທັງໝົດ */
async function loadOrders(status = '') {
  const tbody = document.getElementById('orders-table');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px">ກຳລັງໂຫຼດ...</td></tr>';

  let url = '../api/orders.php';
  if (status) url += `?status=${status}`;

  try {
    const res = await fetch(url);
    const orders = await res.json();

    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:30px">ບໍ່ພົບຄຳສັ່ງຊື້</td></tr>';
      return;
    }

    tbody.innerHTML = orders.map(o => `
      <tr>
        <td><strong>${escHtml(o.order_number)}</strong></td>
        <td>${escHtml(o.customer_name)}<br><span style="font-size:12px;color:#999">${escHtml(o.customer_phone || '')}</span></td>
        <td><strong>${formatPrice(o.total_amount)}</strong></td>
        <td>${getStatusBadge(o.status)}</td>
        <td style="font-size:12px;color:#777">${formatDate(o.created_at)}</td>
        <td>
          <button class="btn btn-primary" onclick="viewOrder(${o.id})">👁️ ເບິ່ງ</button>
          <select onchange="updateOrderStatus(${o.id}, this.value)" style="padding:6px;font-family:inherit;font-size:12px;border:1px solid #ccc">
            ${['pending','confirmed','shipped','completed','cancelled'].map(s =>
              `<option value="${s}" ${o.status===s?'selected':''}>${getStatusLabel(s)}</option>`
            ).join('')}
          </select>
        </td>
      </tr>
    `).join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#c00">❌ ໂຫຼດຜິດພາດ</td></tr>';
  }
}

/** ເບິ່ງລາຍລະອຽດຄຳສັ່ງ */
async function viewOrder(id) {
  try {
    const res = await fetch(`../api/orders.php?id=${id}`);
    const order = await res.json();
    const detail = document.getElementById('order-detail');
    if (!detail) return;

    const items = order.items || [];
    detail.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
        <div>
          <p><strong>ເລກທີ:</strong> ${escHtml(order.order_number)}</p>
          <p><strong>ຊື່:</strong> ${escHtml(order.customer_name)}</p>
          <p><strong>ເບີໂທ:</strong> ${escHtml(order.customer_phone || '—')}</p>
          <p><strong>ທີ່ຢູ່:</strong> ${escHtml(order.customer_address || '—')}</p>
          <p><strong>ໝາຍເຫດ:</strong> ${escHtml(order.note || '—')}</p>
        </div>
        <div>
          <p><strong>ສະຖານະ:</strong> ${getStatusBadge(order.status)}</p>
          <p><strong>ລວມ:</strong> <span style="font-size:18px;font-weight:bold">${formatPrice(order.total_amount)}</span></p>
          <p><strong>ວັນທີ:</strong> ${formatDate(order.created_at)}</p>
          ${order.payment_slip
            ? `<p><strong>ຫຼັກຖານ:</strong><br><img src="../${escHtml(order.payment_slip)}" style="max-width:150px;margin-top:8px;border:1px solid #ddd"></p>`
            : '<p><strong>ຫຼັກຖານ:</strong> ຍັງບໍ່ມີ</p>'
          }
        </div>
      </div>
      <h4 style="margin-bottom:12px">ລາຍການສິນຄ້າ</h4>
      <table style="width:100%">
        <thead><tr><th>ສິນຄ້າ</th><th>ລາຄາ</th><th>ຈຳນວນ</th><th>ລວມ</th></tr></thead>
        <tbody>
          ${items.map(i => `
            <tr>
              <td>${escHtml(i.product_name || i.product_id)}</td>
              <td>${formatPrice(i.price)}</td>
              <td>${i.quantity}</td>
              <td>${formatPrice(i.price * i.quantity)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    openModalEl('order-modal');
  } catch {
    showToast('ໂຫຼດຂໍ້ມູນຜິດພາດ', 'error');
  }
}

function closeOrderModal() {
  closeModalEl('order-modal');
}

/** ອັບເດດສະຖານະຄຳສັ່ງ */
async function updateOrderStatus(id, status) {
  try {
    const res = await fetch('../api/orders.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    const data = await res.json();
    if (data.success) {
      showToast('✅ ອັບເດດສະຖານະສຳເລັດ');
      loadOrders();
    } else {
      showToast('ອັບເດດຜິດພາດ', 'error');
    }
  } catch {
    showToast('ບໍ່ສາມາດເຊື່ອມຕໍ່ server', 'error');
  }
}

/** Status Badge HTML */
function getStatusBadge(status) {
  const map = {
    pending:   { color: '#f59e0b', label: 'ລໍຖ້າ' },
    confirmed: { color: '#3b82f6', label: 'ຢືນຢັນແລ້ວ' },
    shipped:   { color: '#8b5cf6', label: 'ຈັດສົ່ງ' },
    completed: { color: '#22c55e', label: 'ສຳເລັດ' },
    cancelled: { color: '#ef4444', label: 'ຍົກເລີກ' }
  };
  const s = map[status] || { color: '#9ca3af', label: status };
  return `<span style="background:${s.color};color:white;padding:3px 10px;border-radius:20px;font-size:12px">${s.label}</span>`;
}

function getStatusLabel(status) {
  const labels = { pending:'ລໍຖ້າ', confirmed:'ຢືນຢັນ', shipped:'ຈັດສົ່ງ', completed:'ສຳເລັດ', cancelled:'ຍົກເລີກ' };
  return labels[status] || status;
}


// ============================================================
// ========== DASHBOARD =======================================
// ============================================================

/** ໂຫຼດ Dashboard Stats */
async function loadDashboard() {
  try {
    const [summaryRes, monthlyRes] = await Promise.all([
      fetch('../api/reports.php?type=summary'),
      fetch('../api/reports.php?type=monthly')
    ]);
    const summary = await summaryRes.json();
    const monthly = await monthlyRes.json();

    // Stats cards
    const statsEl = document.getElementById('stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="stat-card">
          <div class="value">${formatPrice(summary.sales?.total)}</div>
          <div class="label">ຍອດຂາຍທັງໝົດ</div>
        </div>
        <div class="stat-card">
          <div class="value">${summary.sales?.count || 0}</div>
          <div class="label">ຄຳສັ່ງຊື້</div>
        </div>
        <div class="stat-card">
          <div class="value">${summary.products?.count || 0}</div>
          <div class="label">ສິນຄ້າ</div>
        </div>
        <div class="stat-card" style="border-left:3px solid #c00">
          <div class="value" style="color:#c00">${(summary.low_stock || []).length}</div>
          <div class="label">ສິນຄ້າໃກ້ໝົດ (&lt;5)</div>
        </div>
      `;
    }

    // Monthly table
    const monthBody = document.getElementById('monthly-body');
    if (monthBody) {
      monthBody.innerHTML = monthly.map(m => `
        <tr>
          <td>${escHtml(m.month)}</td>
          <td><strong>${formatPrice(m.total)}</strong></td>
          <td>${m.orders}</td>
        </tr>
      `).join('') || '<tr><td colspan="3" style="text-align:center;color:#aaa">ຍັງບໍ່ມີຂໍ້ມູນ</td></tr>';
    }

    // Low stock table
    const lowBody = document.getElementById('low-stock-body');
    if (lowBody) {
      const items = summary.low_stock || [];
      lowBody.innerHTML = items.length
        ? items.map(p => `<tr><td>${escHtml(p.name)}</td><td style="color:#c00;font-weight:bold">${p.stock}</td></tr>`).join('')
        : '<tr><td colspan="2" style="text-align:center;color:#aaa">ສິນຄ້າທັງໝົດຄົງຄ້າງດີ 👍</td></tr>';
    }

  } catch {
    showToast('ໂຫຼດ Dashboard ຜິດພາດ', 'error');
  }
}


// ============================================================
// ========== MODAL HELPERS ===================================
// ============================================================

function openModalEl(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModalEl(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function focusEl(id) {
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) el.focus();
  }, 120);
}


// ============================================================
// ========== GLOBAL KEY BINDINGS =============================
// ============================================================

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['modal', 'prod-modal', 'order-modal'].forEach(closeModalEl);
  }
});