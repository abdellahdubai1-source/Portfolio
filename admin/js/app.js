/**
 * Admin dashboard shell: mobile sidebar toggle, hash-based section routing,
 * topbar title, admin email display, and logout. Waits for the `admin-ready`
 * event fired by auth-guard.js before doing anything that touches the DB.
 *
 * Other admin/js/*.js files register themselves on window.AdminApp.views
 * (e.g. window.AdminApp.views.messages = { load: fn }) — app.js calls
 * `load()` the first time a section is opened, and again every time you
 * switch back to it, so data stays fresh.
 */
window.AdminApp = window.AdminApp || { views: {} };

(function () {
  'use strict';

  var VIEW_TITLES = {
    overview: 'Overview',
    messages: 'Messages',
    projects: 'Projects',
    testimonials: 'Testimonials'
  };

  document.addEventListener('admin-ready', function (e) {
    setupShell(e.detail);
  });

  function setupShell(adminUser) {
    var sidebar = document.getElementById('admin-sidebar');
    var overlay = document.getElementById('admin-sidebar-overlay');
    var burger = document.getElementById('admin-burger');
    var emailEl = document.getElementById('admin-user-email');
    var logoutBtn = document.getElementById('admin-logout');
    var topbarTitle = document.getElementById('admin-topbar-title');
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.admin-nav a[data-view]'));

    if (emailEl && adminUser) emailEl.textContent = adminUser.email || '';

    function openSidebar() {
      sidebar.classList.add('open');
      overlay.classList.add('show');
    }
    function closeSidebar() {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    }

    if (burger) burger.addEventListener('click', openSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);
    navLinks.forEach(function (a) { a.addEventListener('click', closeSidebar); });

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async function () {
        var ok = await window.confirmDialog({
          title: 'Log out?',
          message: 'You will need to sign in again to access the dashboard.',
          confirmLabel: 'Log Out',
          danger: false
        });
        if (!ok) return;
        try {
          await window.sb.auth.signOut();
        } finally {
          window.location.replace('login.html');
        }
      });
    }

    function currentViewName() {
      var hash = (window.location.hash || '').replace('#', '');
      return VIEW_TITLES[hash] ? hash : 'overview';
    }

    function renderView(name) {
      document.querySelectorAll('.admin-view').forEach(function (el) {
        el.classList.toggle('active', el.id === 'view-' + name);
      });
      navLinks.forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('data-view') === name);
      });
      if (topbarTitle) topbarTitle.textContent = VIEW_TITLES[name] || 'Dashboard';

      var view = window.AdminApp.views[name];
      if (view && typeof view.load === 'function') {
        view.load();
      }
    }

    window.addEventListener('hashchange', function () { renderView(currentViewName()); });
    renderView(currentViewName());

    // Modules that need to run once regardless of which tab is open
    // (e.g. realtime subscriptions) can hook into this event.
    document.dispatchEvent(new CustomEvent('admin-shell-ready'));
  }
})();
