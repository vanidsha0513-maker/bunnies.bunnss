/* Custom confirm/alert modal — replaces browser confirm() & alert() */
(function () {
  const css = `
@keyframes cfm-in {
  from { opacity:0; transform:scale(.86) translateY(28px); }
  to   { opacity:1; transform:scale(1)   translateY(0); }
}
@keyframes cfm-bg-in { from{opacity:0} to{opacity:1} }
#cfm-overlay {
  display:none; position:fixed; inset:0; z-index:99999;
  background:rgba(0,0,0,.52); backdrop-filter:blur(4px);
  -webkit-backdrop-filter:blur(4px);
  align-items:center; justify-content:center;
  animation:cfm-bg-in .18s ease;
}
#cfm-card {
  background:#fff; border-radius:22px;
  padding:38px 28px 28px; max-width:370px; width:88%;
  box-shadow:0 40px 100px rgba(0,0,0,.32);
  text-align:center;
  animation:cfm-in .24s cubic-bezier(.34,1.46,.64,1);
}
#cfm-icon-wrap {
  width:68px; height:68px; border-radius:50%;
  margin:0 auto 18px;
  display:flex; align-items:center; justify-content:center;
  font-size:1.8rem;
}
#cfm-title {
  font-family:'Noto Sans Lao',sans-serif;
  font-size:1.05rem; font-weight:700; color:#111; margin-bottom:8px;
}
#cfm-msg {
  font-family:'Noto Sans Lao',sans-serif;
  font-size:.875rem; color:#888; line-height:1.8; margin-bottom:28px;
}
#cfm-btns { display:flex; gap:10px; }
#cfm-cancel {
  flex:1; padding:13px 0;
  border:1.5px solid #e8e5e0; background:#fff;
  border-radius:12px;
  font-family:'Noto Sans Lao',sans-serif;
  font-size:.875rem; cursor:pointer; color:#888;
  transition:background .15s, border-color .15s; outline:none;
}
#cfm-cancel:hover { background:#f5f3f0; border-color:#d0ccc6; }
#cfm-ok {
  flex:1; padding:13px 0;
  border:none; border-radius:12px;
  font-family:'Noto Sans Lao',sans-serif;
  font-size:.875rem; font-weight:700; cursor:pointer; color:#fff;
  transition:opacity .15s, transform .1s; outline:none;
}
#cfm-ok:hover  { opacity:.88; }
#cfm-ok:active { transform:scale(.97); }
`;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const tpl = document.createElement('div');
  tpl.innerHTML = `
<div id="cfm-overlay">
  <div id="cfm-card" onclick="event.stopPropagation()">
    <div id="cfm-icon-wrap"></div>
    <div id="cfm-title"></div>
    <div id="cfm-msg"></div>
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

let _cfmCb = null;

function showConfirm(msg, onOk, opts) {
  opts = opts || {};
  _cfmBuild({ msg: msg, onOk: onOk, mode: 'confirm', title: opts.title, okLabel: opts.okLabel, danger: opts.danger });
}

function showAlert(msg, opts) {
  opts = opts || {};
  _cfmBuild({ msg: msg, onOk: null, mode: 'alert', title: opts.title, okLabel: opts.okLabel, danger: false });
}

function _cfmBuild(o) {
  var danger = !!o.danger;
  var isAlert = o.mode === 'alert';

  document.getElementById('cfm-title').textContent =
    o.title || (danger ? 'ລຶບຂໍ້ມູນ' : isAlert ? 'ແຈ້ງເຕືອນ' : 'ຢືນຢັນ');

  document.getElementById('cfm-msg').textContent = o.msg || '';

  var iw = document.getElementById('cfm-icon-wrap');
  if (danger)      { iw.style.background = '#fef0f0'; iw.textContent = '🗑️'; }
  else if (isAlert){ iw.style.background = '#fff3cd'; iw.textContent = 'ℹ️'; }
  else             { iw.style.background = '#f0f4ff'; iw.textContent = '❓'; }

  var okBtn = document.getElementById('cfm-ok');
  okBtn.textContent      = o.okLabel || (isAlert ? 'ຕົກລົງ' : 'ຢືນຢັນ');
  okBtn.style.background = danger ? '#e74c3c' : '#1a1a1a';

  var cancel = document.getElementById('cfm-cancel');
  cancel.style.display = isAlert ? 'none' : '';

  _cfmCb = o.onOk || null;

  var ov = document.getElementById('cfm-overlay');
  ov.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  /* re-trigger animation */
  var card = document.getElementById('cfm-card');
  card.style.animation = 'none';
  void card.offsetWidth;
  card.style.animation = '';
}

function cfmOk() {
  document.getElementById('cfm-overlay').style.display = 'none';
  document.body.style.overflow = '';
  var cb = _cfmCb;
  _cfmCb = null;
  if (cb) cb();
}

function cfmCancel() {
  document.getElementById('cfm-overlay').style.display = 'none';
  document.body.style.overflow = '';
  _cfmCb = null;
}
