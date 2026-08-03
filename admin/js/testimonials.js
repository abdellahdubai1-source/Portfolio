/**
 * Testimonials tab: add/edit/delete client testimonials shown on the
 * homepage. Same UX pattern as the Projects tab.
 */
(function () {
  'use strict';

  window.AdminApp = window.AdminApp || { views: {} };

  var cache = [];

  window.AdminApp.views.testimonials = {
    load: function () { fetchTestimonials(); }
  };

  document.addEventListener('admin-shell-ready', function () {
    var addBtn = document.getElementById('testimonial-add-btn');
    if (addBtn) addBtn.addEventListener('click', function () { openForm(null); });
  });

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  async function fetchTestimonials() {
    var container = document.getElementById('testimonials-grid');
    if (!container || !window.sb) return;

    container.innerHTML = '<div class="admin-loading"><span class="spinner" aria-hidden="true"></span> Loading testimonials…</div>';

    try {
      var result = await window.sb.from('testimonials').select('*').order('sort_order', { ascending: true });
      if (result.error) {
        container.innerHTML = '<div class="admin-empty">Couldn\'t load testimonials. Please refresh the page.</div>';
        return;
      }
      cache = result.data || [];
      renderGrid();
    } catch (err) {
      console.error('[testimonials] load failed:', err);
      container.innerHTML = '<div class="admin-empty">Couldn\'t load testimonials. Please refresh the page.</div>';
    }
  }

  function renderGrid() {
    var container = document.getElementById('testimonials-grid');
    if (!container) return;

    if (!cache.length) {
      container.innerHTML = '<div class="admin-empty">No testimonials yet. Click "+ Add Testimonial" to create your first one.</div>';
      return;
    }

    container.innerHTML = cache.map(function (t) {
      var letter = escapeHtml(t.avatar_letter || (t.name ? t.name.charAt(0).toUpperCase() : '•'));
      return (
        '<div class="admin-card" data-id="' + t.id + '">' +
          '<div class="admin-card-thumb" style="aspect-ratio:auto;height:56px;width:56px;border-radius:50%;">' + letter + '</div>' +
          '<p class="admin-card-title">' + escapeHtml(t.name) + '</p>' +
          '<p class="admin-card-meta">' + escapeHtml(t.role || '') + '</p>' +
          '<p class="admin-card-desc">&ldquo;' + escapeHtml(t.quote) + '&rdquo;</p>' +
          '<div class="admin-card-tags">' + (t.is_published ? '' : '<span class="tag tag-muted">Hidden</span>') + '</div>' +
          '<div class="admin-card-actions">' +
            '<button type="button" class="icon-btn" data-action="edit" aria-label="Edit"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>' +
            '<button type="button" class="icon-btn danger" data-action="delete" aria-label="Delete"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg></button>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    Array.prototype.forEach.call(container.querySelectorAll('.admin-card'), function (card) {
      var id = card.getAttribute('data-id');
      var item = cache.find(function (t) { return t.id === id; });
      card.querySelector('[data-action="edit"]').addEventListener('click', function () { openForm(item); });
      card.querySelector('[data-action="delete"]').addEventListener('click', function () { deleteTestimonial(item); });
    });
  }

  async function deleteTestimonial(item) {
    var ok = await window.confirmDialog({
      title: 'Delete this testimonial?',
      message: 'The testimonial from "' + item.name + '" will be permanently removed. This cannot be undone.',
      confirmLabel: 'Delete'
    });
    if (!ok) return;

    try {
      var result = await window.sb.from('testimonials').delete().eq('id', item.id);
      if (result.error) throw result.error;
      if (window.showToast) window.showToast('Testimonial deleted.', 'success');
      fetchTestimonials();
      if (window.AdminApp.views.overview) window.AdminApp.views.overview.load();
    } catch (err) {
      console.error('[testimonials] delete failed:', err);
      if (window.showToast) window.showToast('Could not delete testimonial. Please try again.', 'error');
    }
  }

  function openForm(item) {
    var isEdit = !!item;
    var overlay = document.createElement('div');
    overlay.className = 'at-modal-overlay';

    var modal = document.createElement('div');
    modal.className = 'at-modal admin-modal-lg';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    modal.innerHTML =
      '<h3>' + (isEdit ? 'Edit Testimonial' : 'Add Testimonial') + '</h3>' +
      '<form id="testimonial-form" novalidate>' +
        '<div class="field-row">' +
          '<div class="field"><label for="tf-name">Client Name</label><input type="text" id="tf-name" required maxlength="120" /></div>' +
          '<div class="field"><label for="tf-role">Role / Business</label><input type="text" id="tf-role" maxlength="120" placeholder="e.g. Restaurant Owner" /></div>' +
        '</div>' +
        '<div class="field"><label for="tf-quote">Testimonial</label><textarea id="tf-quote" required maxlength="800" rows="4"></textarea></div>' +
        '<div class="field-row">' +
          '<div class="field"><label for="tf-letter">Avatar Letter</label><input type="text" id="tf-letter" maxlength="1" placeholder="Auto from name if left blank" /></div>' +
          '<div class="field"><label for="tf-sort">Sort Order</label><input type="number" id="tf-sort" value="0" step="1" /></div>' +
        '</div>' +
        '<label class="switch" style="margin-bottom:8px;"><input type="checkbox" id="tf-published" /><span class="track"></span> Published (visible on site)</label>' +
        '<div class="at-modal-actions">' +
          '<button type="button" class="at-btn at-btn-ghost" data-action="cancel">Cancel</button>' +
          '<button type="submit" class="at-btn at-btn-primary" id="testimonial-save-btn">' + (isEdit ? 'Save Changes' : 'Add Testimonial') + '</button>' +
        '</div>' +
      '</form>';

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.classList.add('at-modal-open');
    requestAnimationFrame(function () { overlay.classList.add('in'); });

    var f = {
      name: modal.querySelector('#tf-name'),
      role: modal.querySelector('#tf-role'),
      quote: modal.querySelector('#tf-quote'),
      letter: modal.querySelector('#tf-letter'),
      sort: modal.querySelector('#tf-sort'),
      published: modal.querySelector('#tf-published')
    };

    if (isEdit) {
      f.name.value = item.name || '';
      f.role.value = item.role || '';
      f.quote.value = item.quote || '';
      f.letter.value = item.avatar_letter || '';
      f.sort.value = item.sort_order != null ? item.sort_order : 0;
      f.published.checked = item.is_published !== false;
    } else {
      f.published.checked = true;
    }

    function close() {
      document.body.classList.remove('at-modal-open');
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
    modal.querySelector('[data-action="cancel"]').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

    modal.querySelector('#testimonial-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var name = f.name.value.trim();
      var quote = f.quote.value.trim();
      if (!name || !quote) { if (window.showToast) window.showToast('Please fill in the name and testimonial text.', 'error'); return; }

      var payload = {
        name: name,
        role: f.role.value.trim(),
        quote: quote,
        avatar_letter: f.letter.value.trim() || name.charAt(0).toUpperCase(),
        sort_order: parseInt(f.sort.value, 10) || 0,
        is_published: f.published.checked
      };

      var saveBtn = document.getElementById('testimonial-save-btn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';

      try {
        var result = isEdit
          ? await window.sb.from('testimonials').update(payload).eq('id', item.id)
          : await window.sb.from('testimonials').insert([payload]);
        if (result.error) throw result.error;
        if (window.showToast) window.showToast(isEdit ? 'Testimonial updated.' : 'Testimonial added.', 'success');
        close();
        fetchTestimonials();
        if (window.AdminApp.views.overview) window.AdminApp.views.overview.load();
      } catch (err) {
        console.error('[testimonials] save failed:', err);
        if (window.showToast) window.showToast('Could not save testimonial. Please try again.', 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = isEdit ? 'Save Changes' : 'Add Testimonial';
      }
    });
  }
})();
