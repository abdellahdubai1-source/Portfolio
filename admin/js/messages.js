/**
 * Messages tab: list contact-form submissions, filter by status, view full
 * detail in a modal, change status (New/Read/Replied), delete with
 * confirmation. Subscribes to Supabase Realtime so brand-new submissions
 * appear automatically without a manual refresh, with a toast notification.
 */
(function () {
  'use strict';

  window.AdminApp = window.AdminApp || { views: {} };

  var currentFilter = 'all';
  var cache = [];
  var realtimeStarted = false;

  window.AdminApp.views.messages = {
    load: function () { fetchMessages(); }
  };

  document.addEventListener('admin-shell-ready', function () {
    setupFilters();
    startRealtime();
  });

  function setupFilters() {
    var filterBar = document.getElementById('messages-filters');
    if (!filterBar) return;
    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.chip');
      if (!btn) return;
      currentFilter = btn.getAttribute('data-status');
      Array.prototype.forEach.call(filterBar.querySelectorAll('.chip'), function (c) {
        c.classList.toggle('active', c === btn);
      });
      renderList();
    });
  }

  function startRealtime() {
    if (realtimeStarted || !window.sb) return;
    realtimeStarted = true;

    window.sb.channel('admin-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, function (payload) {
        if (payload.eventType === 'INSERT') {
          if (window.showToast) window.showToast('New message from ' + (payload.new.name || 'a visitor') + '!', 'success');
        }
        fetchMessages();
        if (window.AdminApp.views.overview) window.AdminApp.views.overview.load();
      })
      .subscribe();
  }

  async function fetchMessages() {
    var container = document.getElementById('messages-list');
    if (!container || !window.sb) return;

    // Only show the loading spinner on first load (cache empty) so realtime
    // refreshes don't flicker the whole list every time.
    if (!cache.length) {
      container.innerHTML = '<div class="admin-loading"><span class="spinner" aria-hidden="true"></span> Loading messages…</div>';
    }

    try {
      var result = await window.sb.from('messages').select('*').order('created_at', { ascending: false });
      if (result.error) {
        container.innerHTML = '<div class="admin-empty">Couldn\'t load messages. Please refresh the page.</div>';
        return;
      }
      cache = result.data || [];
      renderList();
    } catch (err) {
      console.error('[messages] load failed:', err);
      container.innerHTML = '<div class="admin-empty">Couldn\'t load messages. Please refresh the page.</div>';
    }
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch (e) { return iso; }
  }

  function badgeHtml(status) {
    var label = status.charAt(0).toUpperCase() + status.slice(1);
    return '<span class="badge badge-' + status + '">' + label + '</span>';
  }

  function renderList() {
    var container = document.getElementById('messages-list');
    if (!container) return;

    var items = currentFilter === 'all' ? cache : cache.filter(function (m) { return m.status === currentFilter; });

    if (!items.length) {
      container.innerHTML = '<div class="admin-empty">No messages' + (currentFilter !== 'all' ? ' with status "' + currentFilter + '"' : '') + ' yet.</div>';
      return;
    }

    container.innerHTML = items.map(function (m) {
      var snippet = escapeHtml(m.subject ? m.subject : m.message);
      return (
        '<article class="msg-card" data-id="' + m.id + '">' +
          '<div class="msg-card-top">' +
            '<div>' +
              '<p class="msg-card-name">' + escapeHtml(m.name) + '</p>' +
              '<p class="msg-card-email">' + escapeHtml(m.email) + '</p>' +
            '</div>' +
            '<div style="text-align:right;">' +
              badgeHtml(m.status) +
              '<p class="msg-card-date">' + formatDate(m.created_at) + '</p>' +
            '</div>' +
          '</div>' +
          '<p class="msg-card-snippet">' + snippet + '</p>' +
        '</article>'
      );
    }).join('');

    Array.prototype.forEach.call(container.querySelectorAll('.msg-card'), function (card) {
      card.addEventListener('click', function () {
        var id = card.getAttribute('data-id');
        var msg = cache.find(function (m) { return m.id === id; });
        if (msg) openDetail(msg);
      });
    });
  }

  function openDetail(msg) {
    var overlay = document.createElement('div');
    overlay.className = 'at-modal-overlay';

    var modal = document.createElement('div');
    modal.className = 'at-modal admin-modal-lg';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    modal.innerHTML =
      '<h3>' + escapeHtml(msg.name) + '</h3>' +
      '<p class="modal-meta">' + escapeHtml(msg.email) + (msg.phone ? ' &middot; ' + escapeHtml(msg.phone) : '') + ' &middot; ' + formatDate(msg.created_at) + '</p>' +
      (msg.subject ? '<p class="modal-meta"><strong>Subject:</strong> ' + escapeHtml(msg.subject) + '</p>' : '') +
      '<div class="modal-body-text">' + escapeHtml(msg.message) + '</div>' +
      '<p class="field-hint" style="margin-bottom:8px;">Status</p>' +
      '<div class="status-btn-row">' +
        '<button type="button" class="chip' + (msg.status === 'new' ? ' active' : '') + '" data-set-status="new">New</button>' +
        '<button type="button" class="chip' + (msg.status === 'read' ? ' active' : '') + '" data-set-status="read">Read</button>' +
        '<button type="button" class="chip' + (msg.status === 'replied' ? ' active' : '') + '" data-set-status="replied">Replied</button>' +
      '</div>' +
      '<div class="at-modal-actions">' +
        '<button type="button" class="at-btn at-btn-danger" data-action="delete">Delete</button>' +
        '<button type="button" class="at-btn at-btn-ghost" data-action="close">Close</button>' +
      '</div>';

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.classList.add('at-modal-open');
    requestAnimationFrame(function () { overlay.classList.add('in'); });

    function close() {
      document.body.classList.remove('at-modal-open');
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    modal.querySelector('[data-action="close"]').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

    Array.prototype.forEach.call(modal.querySelectorAll('[data-set-status]'), function (btn) {
      btn.addEventListener('click', async function () {
        var newStatus = btn.getAttribute('data-set-status');
        if (newStatus === msg.status) return;
        btn.disabled = true;
        try {
          var result = await window.sb.from('messages').update({ status: newStatus }).eq('id', msg.id);
          if (result.error) throw result.error;
          msg.status = newStatus;
          Array.prototype.forEach.call(modal.querySelectorAll('[data-set-status]'), function (b) {
            b.classList.toggle('active', b.getAttribute('data-set-status') === newStatus);
          });
          if (window.showToast) window.showToast('Marked as ' + newStatus + '.', 'success');
          fetchMessages();
          if (window.AdminApp.views.overview) window.AdminApp.views.overview.load();
        } catch (err) {
          console.error('[messages] status update failed:', err);
          if (window.showToast) window.showToast('Could not update status. Please try again.', 'error');
        } finally {
          btn.disabled = false;
        }
      });
    });

    modal.querySelector('[data-action="delete"]').addEventListener('click', async function () {
      var ok = await window.confirmDialog({
        title: 'Delete this message?',
        message: 'This will permanently delete the message from ' + msg.name + '. This cannot be undone.',
        confirmLabel: 'Delete'
      });
      if (!ok) return;

      try {
        var result = await window.sb.from('messages').delete().eq('id', msg.id);
        if (result.error) throw result.error;
        if (window.showToast) window.showToast('Message deleted.', 'success');
        close();
        fetchMessages();
        if (window.AdminApp.views.overview) window.AdminApp.views.overview.load();
      } catch (err) {
        console.error('[messages] delete failed:', err);
        if (window.showToast) window.showToast('Could not delete message. Please try again.', 'error');
      }
    });
  }
})();
