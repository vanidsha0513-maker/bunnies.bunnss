// ==========================================
// MAIN.JS — bunnies.bunn
// ==========================================

/* ============================================================
   UTILS
   ============================================================ */
const Utils = {
  fmt(amount) {
    return '₭' + Number(amount).toLocaleString();
  },
  getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  },
  debounce(fn, delay) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
  },
  getColor(name) {
    const map = {
      ແດງ:'#e74c3c', ຟ້າ:'#3498db', ຂຽວ:'#27ae60', ເຫລືອງ:'#f1c40f',
      ດຳ:'#1a1a1a', ຂາວ:'#f0f0f0', ບົວ:'#ff69b4', ສົ້ມ:'#e67e22',
      ມ່ວງ:'#9b59b6', ນ້ຳຕານ:'#8B4513', ຊາ:'#c9a96e', ເທົາ:'#95a5a6',
    };
    return map[name] || name || '#ccc';
  }
};
 
/* ============================================================
   API
   ============================================================ */
const API = {
  async get(url) {
    try {
      const r = await fetch('api/' + url);
      return await r.json();
    } catch { return null; }
  }
};

/* ============================================================
   CART
   ============================================================ */
const Cart = {
  _key: 'cart',

  _load() {
    try { return JSON.parse(localStorage.getItem(this._key) || '[]'); } catch { return []; }
  },
  _save(items) {
    localStorage.setItem(this._key, JSON.stringify(items));
    this.updateBadge();
  },

  get() {
    return this._load().map(i => ({
      ...i,
      key:      i.key || String(i.id) + '_' + (i.color || ''),
      quantity: i.quantity || i.qty || 1,
      qty:      i.qty || i.quantity || 1,
      name_lo:  i.name_lo || i.name,
      image_url: i.image_url || i.image || '',
    }));
  },

  count() {
    return this._load().reduce((s, i) => s + (i.qty || i.quantity || 1), 0);
  },

  total() {
    return this._load().reduce((s, i) => s + i.price * (i.qty || i.quantity || 1), 0);
  },

  add(product, qty = 1, color = '') {
    const items = this._load();
    const key   = String(product.id) + '_' + color;
    const idx   = items.findIndex(i =>
      (i.key === key) || (String(i.id) === String(product.id) && (i.color || '') === color)
    );
    if (idx > -1) {
      const q = (items[idx].qty || items[idx].quantity || 1) + qty;
      items[idx].qty = q; items[idx].quantity = q;
    } else {
      items.push({ ...product, key, color, qty, quantity: qty,
                   image_url: product.image_url || product.image || '' });
    }
    this._save(items);
    showToast('✓ ເພີ່ມໃສ່ກະຕ່າສຳເລັດ!');
  },

  remove(key) {
    this._save(this._load().filter(i =>
      (i.key || String(i.id) + '_' + (i.color || '')) !== key
    ));
  },

  updateQty(key, qty) {
    const items = this._load();
    const idx = items.findIndex(i =>
      (i.key || String(i.id) + '_' + (i.color || '')) === key
    );
    if (idx > -1) {
      items[idx].qty = qty; items[idx].quantity = qty;
      this._save(items);
    }
  },

  updateBadge() {
    const n = this.count();
    document.querySelectorAll('#cart-count, .cart-count').forEach(el => {
      el.textContent = n;
      el.style.display = n > 0 ? '' : 'none';
    });
  }
};

/* ============================================================
   TOAST (also exposed as Toast.show for cart.html)
   ============================================================ */
const Toast = { show: (msg, type) => showToast(msg, type) };

function showToast(msg, type = 'success') {
  const existing = document.querySelector('.bb-toast');
  if (existing) { clearTimeout(existing._timer); existing.remove(); }

  const icons  = { success: '✓', error: '✕', info: 'i' };
  const bgs    = { success: '#111',     error: '#c0392b', info: '#1a6fa8' };
  const accents = { success: '#c9a96e', error: '#ff8080', info: '#74b9ff' };
  const bg  = bgs[type]     || bgs.success;
  const acc = accents[type] || accents.success;

  if (!document.getElementById('bb-toast-style')) {
    const s = document.createElement('style');
    s.id = 'bb-toast-style';
    s.textContent = `
      @keyframes bbIn  { from{transform:translateY(70px);opacity:0} to{transform:translateY(0);opacity:1} }
      @keyframes bbOut { from{transform:translateY(0);opacity:1}    to{transform:translateY(70px);opacity:0} }
      @keyframes bbBar { from{transform:scaleX(1)} to{transform:scaleX(0)} }
      .bb-toast { position:fixed; bottom:28px; right:24px; z-index:9999; min-width:220px; max-width:320px;
        border-radius:12px; overflow:hidden; box-shadow:0 10px 36px rgba(0,0,0,.30);
        animation:bbIn .35s cubic-bezier(.34,1.4,.64,1) both; font-family:'Phetsarath OT',serif; }
      .bb-toast-inner { display:flex; align-items:center; gap:12px; padding:14px 16px; }
      .bb-toast-icon  { width:26px; height:26px; border-radius:50%; display:flex; align-items:center;
        justify-content:center; font-size:13px; font-weight:700; flex-shrink:0; }
      .bb-toast-msg   { flex:1; font-size:14px; color:#fff; line-height:1.4; }
      .bb-toast-prog  { height:3px; transform-origin:left; animation:bbBar 2.8s linear both; }
    `;
    document.head.appendChild(s);
  }

  const toast = document.createElement('div');
  toast.className = 'bb-toast';
  toast.style.background = bg;
  toast.innerHTML = `
    <div class="bb-toast-inner">
      <div class="bb-toast-icon" style="background:${acc};color:${bg}">${icons[type] || '✓'}</div>
      <span class="bb-toast-msg">${msg}</span>
    </div>
    <div class="bb-toast-prog" style="background:${acc}"></div>
  `;
  document.body.appendChild(toast);
  toast._timer = setTimeout(() => {
    toast.style.animation = 'bbOut .25s ease forwards';
    setTimeout(() => toast.remove(), 260);
  }, 2800);
}

/* ============================================================
   LEGACY helpers (used by checkout.html and older pages)
   ============================================================ */
function updateCartBadge() { Cart.updateBadge(); }
function formatKip(amount) { return Utils.fmt(amount); }

function quickAddToCart(id, name, price, image, isPreorder) {
  const items = Cart._load();
  const idx   = items.findIndex(i => String(i.id) === String(id) && !i.color);
  if (idx > -1) {
    items[idx].qty = (items[idx].qty || 1) + 1;
    items[idx].quantity = items[idx].qty;
    if (isPreorder) items[idx].is_preorder = true;
    Cart._save(items);
  } else {
    Cart.add({ id, name, name_lo: name, price: parseFloat(price) || 0,
               image, image_url: image, is_preorder: !!isPreorder }, 1, '');
  }
}

function buildProductCard(p) {
  const imgSrc = p.image_url || p.image || '';
  const imgTag = imgSrc
    ? `<img src="${imgSrc}" alt="${p.name_lo||p.name}"
           style="width:100%;height:100%;object-fit:cover;display:block"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';
  const fallback = `<div style="display:${imgSrc?'none':'flex'};width:100%;height:100%;
    align-items:center;justify-content:center;font-size:2.5rem;color:#ccc">🛍️</div>`;
  const safeP = JSON.stringify({
    id: p.id, name: p.name_lo||p.name, name_lo: p.name_lo||p.name,
    price: p.price, image_url: imgSrc
  }).replace(/"/g, "'");
  return `
    <div class="shop-card" onclick="location.href='product.html?id=${p.id}'" style="cursor:pointer">
      <div style="aspect-ratio:1;overflow:hidden;border-radius:6px;background:#f0ede8">
        ${imgTag}${fallback}
      </div>
      <div style="padding:10px 4px 4px">
        <div style="font-size:14px;margin-bottom:4px">${p.name_lo || p.name}</div>
        <div style="font-weight:bold;color:#c9a96e">${Utils.fmt(p.price)}</div>
        <button onclick="event.stopPropagation();Cart.add(${safeP})"
                style="margin-top:8px;width:100%;padding:6px;background:#111;color:#fff;
                       border:none;border-radius:4px;cursor:pointer;font-size:13px">
          + ໃສ່ກະຕ່າ
        </button>
      </div>
    </div>`;
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => Cart.updateBadge());
