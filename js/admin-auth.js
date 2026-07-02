/* Admin auth guard — included by all admin pages */
(function () {
  /* inject logout-link hover colour */
  const s = document.createElement('style');
  s.textContent = '.adm-logout:hover{color:#ff6b6b!important;border-color:#ff6b6b!important}';
  document.head.appendChild(s);

  /* hide page immediately so no flash-of-content */
  document.documentElement.style.visibility = 'hidden';

  fetch('../api/admin-session.php', { credentials: 'same-origin' })
    .then(r => r.json())
    .then(d => {
      if (d.authed) {
        document.documentElement.style.visibility = '';
        const el = document.getElementById('adm-user-label');
        if (el && d.user) el.textContent = d.user;
      } else {
        location.replace('login.html');
      }
    })
    .catch(() => {
      /* network error — still show page so user can retry */
      document.documentElement.style.visibility = '';
    });
})();

function adminLogout() {
  fetch('../api/admin-logout.php', { credentials: 'same-origin' })
    .finally(() => location.replace('login.html'));
}
