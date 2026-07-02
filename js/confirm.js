/* Custom confirm/alert modal */
(function () {
  const css = `
@keyframes cfm-in {
  from { opacity:0; transform:translateY(32px) scale(.94); }
  to   { opacity:1; transform:translateY(0)    scale(1);   }
}
@keyframes cfm-bg-in { from{opacity:0} to{opacity:1} }

#cfm-overlay {
  display:none; position:fixed; inset:0; z-index:99999;
  background:rgba(6,6,6,.72);
  backdrop-filter:blur(16px) saturate(1.5);
  -webkit-backdrop-filter:blur(16px) saturate(1.5);
  align-items:center; justify-content:center; padding:20px;
  animation:cfm-bg-in .22s ease;
}

#cfm-card {
  background:#fff;
  border-radius:28px;
  width:100%; max-width:360px;
  box-shadow:
    0 0 0 1px rgba(0,0,0,.06),
    0 32px 80px rgba(0,0,0,.22),
    0 8px 24px rgba(0,0,0,.10);
  overflow:hidden;
  animation:cfm-in .34s cubic-bezier(.34,1.38,.64,1);
}

#cfm-body {
  padding:40px 28px 26px;
  text-align:center;
}

#cfm-icon-wrap {
  width:80px; height:80px; border-radius:50%;
  margin:0 auto 22px;
  display:flex; align-items:center; justify-content:center;
  position:relative;
}

#cfm-icon-wrap svg {
  width:34px; height:34px;
}

#cfm-title {
  font-family:'Noto Sans Lao','Playfair Display',sans-serif;
  font-size:1.05rem; font-weight:800;
  color:#111; margin-bottom:10px;
  line-height:1.45; letter-spacing:-.01em;
}

#cfm-msg {
  font-family:'Noto Sans Lao',sans-serif;
  font-size:.82rem; color:#b0aaa4; line-height:1.9;
}

#cfm-divider {
  height:1px; background:linear-gradient(90deg,transparent,#ece9e4 20%,#ece9e4 80%,transparent);
}

#cfm-btns {
  display:flex; gap:10px;
  padding:18px 22px 22px;
}

#cfm-cancel {
  flex:1; padding:14px 0;
  border:1.5px solid #ece9e3; background:#faf9f7;
  border-radius:14px;
  font-family:'Noto Sans Lao',sans-serif;
  font-size:.85rem; font-weight:600;
  cursor:pointer; color:#aaa;
  transition:all .18s; outline:none;
}
#cfm-cancel:hover { background:#f3f1ed; border-color:#d8d3cc; color:#666; }
#cfm-cancel:active { transform:scale(.98); }

#cfm-ok {
  flex:1.4; padding:14px 0;
  border:none; border-radius:14px;
  font-family:'Noto Sans Lao',sans-serif;
  font-size:.88rem; font-weight:800;
  cursor:pointer; color:#fff;
  transition:opacity .18s, transform .12s, box-shadow .18s;
  outline:none; letter-spacing:.02em;
}
#cfm-ok:hover  { opacity:.88; transform:translateY(-1px); }
#cfm-ok:active { transform:scale(.97) translateY(0); opacity:1; }
`;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const tpl = document.createElement('div');
  tpl.innerHTML = `
<div id="cfm-overlay">
  <div id="cfm-card" onclick="event.stopPropagation()">
    <div id="cfm-body">
      <div id="cfm-icon-wrap"></div>
      <div id="cfm-title"></div>
      <div id="cfm-msg"></div>
    </div>
    <div id="cfm-divider"></div>
    <div id="cfm-btns">
      <button id="cfm-cancel">ຍົກເລີກ</button>
      <button id="cfm-ok"></button>
    </div>
  </div>
</div>`;
  document.body.appendChild(tpl.firstElementChild);

  document.getElementById('cfm-overlay').addEventListener('click', cfmCancel);
  document.getElementById('cfm-cancel').addEventListener('click', cfmCancel);
  document.getElementById('cfm-ok').addEventListener('click', cfmOk);

  document.addEventListener('keydown', function (e) {
    if (document.getElementById('cfm-overlay').style.display !== 'flex') return;
    if (e.key === 'Escape') cfmCancel();
    if (e.key === 'Enter')  cfmOk();
  });
})();

const _SVG = {
  danger: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`,
  confirm: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r=".6" fill="currentColor"/></svg>`,
  success: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/></svg>`,
};

let _cfmCb = null;

function showConfirm(msg, onOk, opts) {
  opts = opts || {};
  _cfmBuild({ msg, onOk, mode:'confirm', title:opts.title, okLabel:opts.okLabel, danger:opts.danger });
}

function showAlert(msg, opts) {
  opts = opts || {};
  _cfmBuild({ msg, onOk:null, mode:'alert', title:opts.title, okLabel:opts.okLabel, danger:false });
}

function _cfmBuild(o) {
  var danger  = !!o.danger;
  var isAlert = o.mode === 'alert';

  document.getElementById('cfm-title').textContent =
    o.title || (danger ? 'ຢືນຢັນການລຶບ' : isAlert ? 'ແຈ້ງເຕືອນ' : 'ຢືນຢັນ');

  document.getElementById('cfm-msg').textContent = o.msg || '';

  var iw = document.getElementById('cfm-icon-wrap');
  if (danger) {
    iw.style.cssText = 'background:linear-gradient(135deg,#fff0f0,#ffe3e3);';
    iw.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#e03030" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>';
  } else if (isAlert) {
    iw.style.cssText = 'background:linear-gradient(135deg,#fffbee,#fff3cc);';
    iw.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#d4940a" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r=".6" fill="#d4940a"/></svg>';
  } else {
    iw.style.cssText = 'background:linear-gradient(135deg,#f0f0ff,#e8e8ff);';
    iw.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#5b5fc7" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r=".5" fill="#5b5fc7"/></svg>';
  }

  var okBtn = document.getElementById('cfm-ok');
  okBtn.textContent = o.okLabel || (isAlert ? 'ຕົກລົງ' : 'ຢືນຢັນ');
  if (danger) {
    okBtn.style.cssText = 'background:linear-gradient(135deg,#f04040,#c92020);box-shadow:0 6px 20px rgba(200,30,30,.35);';
  } else {
    okBtn.style.cssText = 'background:linear-gradient(135deg,#1a1a1a,#333);box-shadow:0 6px 20px rgba(0,0,0,.22);';
  }

  var cancel = document.getElementById('cfm-cancel');
  cancel.style.display = isAlert ? 'none' : '';

  _cfmCb = o.onOk || null;

  var ov   = document.getElementById('cfm-overlay');
  var card = document.getElementById('cfm-card');
  ov.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  card.style.animation = 'none';
  void card.offsetWidth;
  card.style.animation = '';
}

function cfmOk() {
  document.getElementById('cfm-overlay').style.display = 'none';
  document.body.style.overflow = '';
  var cb = _cfmCb; _cfmCb = null;
  if (cb) cb();
}

function cfmCancel() {
  document.getElementById('cfm-overlay').style.display = 'none';
  document.body.style.overflow = '';
  _cfmCb = null;
}
