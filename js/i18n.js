/* ── i18n: Lao / English ── */
const TRANS = {
  lo: {
    /* nav */
    'nav.home'    : 'ໜ້າຫຼັກ',
    'nav.shop'    : 'ຮ້ານຄ້າ',
    'nav.about'   : 'ກ່ຽວກັບ',
    'nav.contact' : 'ຕິດຕໍ່',
    'nav.search'  : 'ຄົ້ນຫາ',
    'nav.account' : 'ບັນຊີ',
    'nav.cart'    : 'ກະຕ່າ',
    /* dropdown */
    'dd.welcome'  : 'ຍິນດີຕ້ອນຮັບ',
    'dd.login'    : 'ເຂົ້າສູ່ລະບົບ',
    'dd.register' : 'ສະໝັກສະມາຊິກ',
    'dd.profile'  : 'ໂປຣໄຟລ໌ຂອງຂ້ອຍ',
    'dd.orders'   : 'ລາຍການສັ່ງຊື້',
    'dd.logout'   : 'ອອກຈາກລະບົບ',
    /* sidebar */
    'sb.cats'     : 'ໝວດໝູ່ສິນຄ້າ',
    'sb.all'      : 'ທັງໝົດ',
    'sb.price'    : 'ກັ່ນຕອງລາຄາ',
    'sb.size'     : 'ຂະໜາດ',
    'sb.color'    : 'ສີ',
    'sb.brand'    : 'ແບຣນ',
    'sb.featured' : 'ສິນຄ້າແນະນຳ',
    'sb.filter'   : 'ກັ່ນຕອງ',
    /* toolbar */
    'tb.sort.default'    : 'ຈັດລຽງປົກກະຕິ',
    'tb.sort.price.asc'  : 'ລາຄາ: ຕ່ຳ → ສູງ',
    'tb.sort.price.desc' : 'ລາຄາ: ສູງ → ຕ່ຳ',
    'tb.sort.name'       : 'ຊື່: ກ → ຮ',
    'tb.filter'          : 'Filter',
    /* product card */
    'card.view'     : 'ເບິ່ງສິນຄ້າ',
    'card.add'      : '+ ກະຕ່າ',
    'card.add.mob'  : '+ ໃສ່ກະຕ່າ',
    'card.pre'      : '📦 Pre-Order',
    'card.pre.mob'  : '📦 Pre-Order (7-14 ວັນ)',
    'card.label.new': 'ສິນຄ້າໃໝ່',
    'card.label.sale': 'ລຸດລາຄາ',
    'card.label.pre': '📦 Pre-Order',
    /* footer / misc */
    'loading'     : 'ກຳລັງໂຫຼດ...',
    'no.products' : 'ບໍ່ພົບສິນຄ້າ',
  },
  en: {
    /* nav */
    'nav.home'    : 'Home',
    'nav.shop'    : 'Shop',
    'nav.about'   : 'About',
    'nav.contact' : 'Contact',
    'nav.search'  : 'Search',
    'nav.account' : 'Account',
    'nav.cart'    : 'Cart',
    /* dropdown */
    'dd.welcome'  : 'Welcome',
    'dd.login'    : 'Sign In',
    'dd.register' : 'Register',
    'dd.profile'  : 'My Profile',
    'dd.orders'   : 'My Orders',
    'dd.logout'   : 'Sign Out',
    /* sidebar */
    'sb.cats'     : 'Categories',
    'sb.all'      : 'All Products',
    'sb.price'    : 'Filter By Price',
    'sb.size'     : 'Size',
    'sb.color'    : 'Color',
    'sb.brand'    : 'Brand',
    'sb.featured' : 'Featured',
    'sb.filter'   : 'Filter',
    /* toolbar */
    'tb.sort.default'    : 'Default Sorting',
    'tb.sort.price.asc'  : 'Price: Low → High',
    'tb.sort.price.desc' : 'Price: High → Low',
    'tb.sort.name'       : 'Name: A → Z',
    'tb.filter'          : 'Filter',
    /* product card */
    'card.view'     : 'View Item',
    'card.add'      : '+ Cart',
    'card.add.mob'  : '+ Add to Cart',
    'card.pre'      : '📦 Pre-Order',
    'card.pre.mob'  : '📦 Pre-Order (7-14 days)',
    'card.label.new': 'New',
    'card.label.sale': 'Sale',
    'card.label.pre': '📦 Pre-Order',
    /* footer / misc */
    'loading'     : 'Loading...',
    'no.products' : 'No products found',
  }
};

let _lang = localStorage.getItem('bunn_lang') || 'lo';

function t(key) {
  return (TRANS[_lang] && TRANS[_lang][key]) || (TRANS.lo[key]) || key;
}

function setLang(lang) {
  _lang = lang;
  localStorage.setItem('bunn_lang', lang);
  applyLang();
  /* re-render dynamic parts if available */
  if (typeof loadProducts === 'function') loadProducts(
    typeof currentCatId !== 'undefined' ? currentCatId : 0,
    typeof searchQuery  !== 'undefined' ? searchQuery  : ''
  );
  if (typeof loadSidebarCats === 'function') loadSidebarCats();
}

function applyLang() {
  /* update all [data-i18n] elements */
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = val;
    } else if (el.tagName === 'OPTION') {
      el.textContent = val;
    } else {
      el.textContent = val;
    }
  });

  /* update language toggle button state */
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === _lang);
  });
}

/* run on load */
document.addEventListener('DOMContentLoaded', applyLang);
