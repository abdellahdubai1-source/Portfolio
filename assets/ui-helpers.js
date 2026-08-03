/**
 * Shared UI helpers used by the public contact form AND the admin dashboard:
 *   - window.showToast(message, type)         -> success | error | info
 *   - window.confirmDialog(options) -> Promise<boolean>
 *
 * Both build their own DOM on first use, so no markup needs to exist on the
 * page beforehand. Styles live in assets/contact-and-ui.css (public pages)
 * and admin/css/admin.css (admin pages) — both target the same class names.
 */
(function () {
  'use strict';

  // ============ Toast notifications ============
  var toastHost = null;
  function ensureToastHost() {
    if (toastHost) return toastHost;
    toastHost = document.createElement('div');
    toastHost.className = 'at-toast-host';
    toastHost.setAttribute('aria-live', 'polite');
    toastHost.setAttribute('aria-atomic', 'true');
    document.body.appendChild(toastHost);
    return toastHost;
  }

  window.showToast = function showToast(message, type) {
    type = type || 'info';
    var host = ensureToastHost();
    var el = document.createElement('div');
    el.className = 'at-toast at-toast--' + type;

    var icon = document.createElement('span');
    icon.className = 'at-toast-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ');

    var text = document.createElement('span');
    text.className = 'at-toast-text';
    text.textContent = message;

    el.appendChild(icon);
    el.appendChild(text);
    host.appendChild(el);

    requestAnimationFrame(function () { el.classList.add('in'); });

    var remove = function () {
      el.classList.remove('in');
      el.classList.add('out');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
    };
    var timer = setTimeout(remove, 4200);
    el.addEventListener('click', function () { clearTimeout(timer); remove(); });
  };

  // ============ Confirm dialog (Promise-based, styled to match theme) ============
  window.confirmDialog = function confirmDialog(opts) {
    opts = opts || {};
    var title = opts.title || 'Are you sure?';
    var message = opts.message || 'This action cannot be undone.';
    var confirmLabel = opts.confirmLabel || 'Delete';
    var cancelLabel = opts.cancelLabel || 'Cancel';
    var danger = opts.danger !== false;

    return new Promise(function (resolve) {
      var overlay = document.createElement('div');
      overlay.className = 'at-modal-overlay';

      var modal = document.createElement('div');
      modal.className = 'at-modal at-confirm-modal';
      modal.setAttribute('role', 'alertdialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'at-confirm-title');

      modal.innerHTML =
        '<h3 id="at-confirm-title">' + title.replace(/</g, '&lt;') + '</h3>' +
        '<p>' + message.replace(/</g, '&lt;') + '</p>' +
        '<div class="at-modal-actions">' +
          '<button type="button" class="at-btn at-btn-ghost" data-action="cancel">' + cancelLabel + '</button>' +
          '<button type="button" class="at-btn ' + (danger ? 'at-btn-danger' : 'at-btn-primary') + '" data-action="confirm">' + confirmLabel + '</button>' +
        '</div>';

      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      document.body.classList.add('at-modal-open');

      var confirmBtn = modal.querySelector('[data-action="confirm"]');
      var cancelBtn = modal.querySelector('[data-action="cancel"]');

      function close(result) {
        document.body.classList.remove('at-modal-open');
        overlay.removeEventListener('keydown', onKeydown);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve(result);
      }

      function onKeydown(e) {
        if (e.key === 'Escape') close(false);
      }

      confirmBtn.addEventListener('click', function () { close(true); });
      cancelBtn.addEventListener('click', function () { close(false); });
      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(false); });
      overlay.addEventListener('keydown', onKeydown);

      requestAnimationFrame(function () {
        overlay.classList.add('in');
        confirmBtn.focus();
      });
    });
  };
})();
