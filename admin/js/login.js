/**
 * Admin login page logic: sign in with Supabase email/password auth, verify
 * the account is actually listed in the `admins` table, then redirect to
 * the dashboard. Also auto-redirects if a valid admin session already
 * exists (e.g. returning to /admin/login.html while already logged in).
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    var form = document.getElementById('login-form');
    var alertBox = document.getElementById('login-alert');
    var submitBtn = form ? form.querySelector('[type="submit"]') : null;
    var defaultBtnText = submitBtn ? submitBtn.textContent : 'Sign In';

    if (!window.sb) {
      showAlert('Supabase isn’t configured yet. Edit assets/supabase-config.js with your project URL and anon key.');
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

    checkExistingSession();

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        handleLogin();
      });
    }

    function showAlert(message) {
      if (!alertBox) return;
      alertBox.textContent = message;
      alertBox.classList.add('show');
    }

    function hideAlert() {
      if (!alertBox) return;
      alertBox.classList.remove('show');
      alertBox.textContent = '';
    }

    function setLoading(isLoading) {
      if (!submitBtn) return;
      submitBtn.disabled = isLoading;
      submitBtn.classList.toggle('is-loading', isLoading);
      submitBtn.textContent = isLoading ? 'Signing in…' : defaultBtnText;
    }

    async function checkExistingSession() {
      try {
        var result = await window.sb.auth.getSession();
        var session = result.data && result.data.session;
        if (!session) return;

        var adminResult = await window.sb.from('admins').select('id').eq('id', session.user.id).maybeSingle();
        if (adminResult.data) {
          window.location.replace('dashboard.html');
        }
      } catch (err) {
        console.warn('[login] session check failed:', err);
      }
    }

    async function handleLogin() {
      hideAlert();

      var email = (form.elements['email'] ? form.elements['email'].value : '').trim();
      var password = form.elements['password'] ? form.elements['password'].value : '';

      if (!email || !password) {
        showAlert('Please enter both your email and password.');
        return;
      }

      setLoading(true);

      try {
        var signInResult = await window.sb.auth.signInWithPassword({ email: email, password: password });

        if (signInResult.error) {
          setLoading(false);
          showAlert(signInResult.error.message || 'Invalid email or password.');
          return;
        }

        var userId = signInResult.data.user.id;
        var adminResult = await window.sb.from('admins').select('id').eq('id', userId).maybeSingle();

        if (adminResult.error || !adminResult.data) {
          await window.sb.auth.signOut();
          setLoading(false);
          showAlert('This account is not authorized to access the admin dashboard.');
          return;
        }

        if (window.showToast) window.showToast('Welcome back!', 'success');
        window.location.replace('dashboard.html');
      } catch (err) {
        console.error('[login] unexpected error:', err);
        setLoading(false);
        showAlert('Something went wrong signing in. Please try again.');
      }
    }
  }
})();
