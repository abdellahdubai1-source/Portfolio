/**
 * Route guard for admin/dashboard.html.
 * - Redirects to login.html if there is no active Supabase session.
 * - Double-checks the logged-in user actually has a row in the `admins`
 *   table (defense in depth beyond just "is logged in") — signs them out
 *   and redirects if not.
 * - Fires an `admin-ready` custom event (with the admin's id/email as
 *   detail) once verified, which every other admin/js/*.js file waits for
 *   before touching the database.
 *
 * dashboard.html has class="admin-checking" on <html> from the start, which
 * hides the whole dashboard shell via CSS (see admin/css/admin.css) until
 * this script removes it — so an unauthenticated visitor never sees a
 * flash of dashboard content before being redirected.
 */
(function () {
  'use strict';

  function goLogin() {
    window.location.replace('login.html');
  }

  function showConfigError() {
    // Deliberately do NOT remove the "admin-checking" class here — that
    // class is what keeps .admin-shell hidden (see admin/css/admin.css).
    // If Supabase isn't configured there is no way to verify anyone's
    // identity, so the dashboard must stay hidden rather than fall open.
    var note = document.querySelector('.admin-checking-note');
    if (note) {
      note.innerHTML = '<span class="admin-error-text">Supabase isn\'t configured yet. Edit <code>assets/supabase-config.js</code> with your project URL and anon key, then reload this page.</span>';
      note.classList.add('admin-checking-note--error');
    }
  }

  async function verify() {
    if (!window.sb) {
      showConfigError();
      return;
    }

    try {
      var sessionResult = await window.sb.auth.getSession();
      var session = sessionResult.data && sessionResult.data.session;
      if (!session) { goLogin(); return; }

      var adminResult = await window.sb.from('admins').select('id, email').eq('id', session.user.id).maybeSingle();
      if (adminResult.error || !adminResult.data) {
        console.warn('[auth-guard] signed-in user is not in the admins table — signing out.');
        try { await window.sb.auth.signOut(); } catch (e) { /* ignore */ }
        goLogin();
        return;
      }

      window.ADMIN_USER = {
        id: session.user.id,
        email: adminResult.data.email || session.user.email
      };

      document.documentElement.classList.remove('admin-checking');
      document.dispatchEvent(new CustomEvent('admin-ready', { detail: window.ADMIN_USER }));

      window.sb.auth.onAuthStateChange(function (event) {
        if (event === 'SIGNED_OUT') goLogin();
      });
    } catch (err) {
      console.error('[auth-guard] verification failed:', err);
      goLogin();
    }
  }

  verify();
})();
