// ==========================================
// CART.JS - Shopping cart logic
// bunnies.bunn
// ==========================================

function getCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
}

function renderCart() {
  const cart = getCart();
  const container = document.getElementById('cart-items');
  const summary   = document.getElementById('cart-summary');
  const emptyMsg  = document.getElementById('cart-empty');

  if (!cart.length) {
    if (container) container.innerHTML = '';
    if (summary)   summary.style.display = 'none';
    if (emptyMsg)  emptyMsg.style.display = 'block';
    return;
  }

  if (emptyMsg)  emptyMsg.style.display = 'none';
  if (summary)   summary.style.display = 'block';

  container.innerHTML = cart.map((item, i) => `
    <div class="cart-item" id="cart-row-${i}">
      <img
        src="${item.image || ''}"
        alt="${item.name}"
        onerror="this.style.background='#e8e8e8';this.src=''"
      >
      <div class="item-info">
        <div class="item-name">${item.name}</div>
        <div class="item-unit-price">${formatKip(item.price)} / ອັນ</div>
      </div>

      <div class="qty-control">
        <button onclick="changeQty(${i}, -1)">−</button>
        <input
          type="number"
          value="${item.qty}"
          min="1"
          onchange="setQty(${i}, this.value)"
        >
        <button onclick="changeQty(${i}, 1)">+</button>
      </div>

      <div class="item-price">${formatKip(item.price * item.qty)}</div>

      <button
        class="btn btn-danger"
        onclick="removeItem(${i})"
        title="ລຶບ"
      >✕</button>
    </div>
  `).join('');

  // Update totals
  const subtotal  = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);

  const elSub   = document.getElementById('subtotal');
  const elTotal = document.getElementById('total-price');
  const elCount = document.getElementById('item-count');

  if (elSub)   elSub.textContent   = formatKip(subtotal);
  if (elTotal) elTotal.textContent = formatKip(subtotal);
  if (elCount) elCount.textContent = itemCount + ' ລາຍການ';
}

function changeQty(idx, delta) {
  const cart = getCart();
  cart[idx].qty = Math.max(1, cart[idx].qty + delta);
  saveCart(cart);
  renderCart();
}

function setQty(idx, value) {
  const cart = getCart();
  const qty = parseInt(value);
  if (qty < 1 || isNaN(qty)) { renderCart(); return; }
  cart[idx].qty = qty;
  saveCart(cart);
  renderCart();
}

function removeItem(idx) {
  const cart = getCart();
  const name = cart[idx].name;
  cart.splice(idx, 1);
  saveCart(cart);
  renderCart();
  showToast(`ລຶບ "${name}" ອອກຈາກກະຕ່າແລ້ວ`, 'error');
}

function clearCart() {
  if (!confirm('ລຶບສິນຄ້າທັງໝົດໃນກະຕ່າ?')) return;
  localStorage.removeItem('cart');
  updateCartBadge();
  renderCart();
}

// Run on page load
document.addEventListener('DOMContentLoaded', () => {
  renderCart();
});