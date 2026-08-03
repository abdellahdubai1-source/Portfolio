/**
 * Projects tab: add/edit/delete the portfolio projects shown on the
 * homepage ("Featured Projects") and on portfolio.html (all published
 * projects, ordered by sort_order).
 */
(function () {
  'use strict';

  window.AdminApp = window.AdminApp || { views: {} };

  var cache = [];

  window.AdminApp.views.projects = {
    load: function () { fetchProjects(); }
  };

  document.addEventListener('admin-shell-ready', function () {
    var addBtn = document.getElementById('project-add-btn');
    if (addBtn) addBtn.addEventListener('click', function () { openForm(null); });
  });

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  async function fetchProjects() {
    var container = document.getElementById('projects-grid');
    if (!container || !window.sb) return;

    container.innerHTML = '<div class="admin-loading"><span class="spinner" aria-hidden="true"></span> Loading projects…</div>';

    try {
      var result = await window.sb.from('projects').select('*').order('sort_order', { ascending: true });
      if (result.error) {
        container.innerHTML = '<div class="admin-empty">Couldn\'t load projects. Please refresh the page.</div>';
        return;
      }
      cache = result.data || [];
      renderGrid();
    } catch (err) {
      console.error('[projects] load failed:', err);
      container.innerHTML = '<div class="admin-empty">Couldn\'t load projects. Please refresh the page.</div>';
    }
  }

  function renderGrid() {
    var container = document.getElementById('projects-grid');
    if (!container) return;

    if (!cache.length) {
      container.innerHTML = '<div class="admin-empty">No projects yet. Click "+ Add Project" to create your first one.</div>';
      return;
    }

    container.innerHTML = cache.map(function (p) {
      var thumb = p.image_url
        ? '<img src="' + escapeHtml(p.image_url) + '" alt="" loading="lazy" />'
        : escapeHtml(p.badge_text || (p.title || '').slice(0, 2).toUpperCase());
      return (
        '<div class="admin-card" data-id="' + p.id + '">' +
          '<div class="admin-card-thumb">' + thumb + '</div>' +
          '<p class="admin-card-title">' + escapeHtml(p.title) + '</p>' +
          '<p class="admin-card-meta">' + escapeHtml(p.category || '') + '</p>' +
          '<p class="admin-card-desc">' + escapeHtml(p.description || '') + '</p>' +
          '<div class="admin-card-tags">' +
            (p.featured ? '<span class="tag">Featured</span>' : '') +
            (p.is_published ? '' : '<span class="tag tag-muted">Draft</span>') +
          '</div>' +
          '<div class="admin-card-actions">' +
            '<button type="button" class="icon-btn" data-action="edit" aria-label="Edit"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>' +
            '<button type="button" class="icon-btn danger" data-action="delete" aria-label="Delete"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg></button>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    Array.prototype.forEach.call(container.querySelectorAll('.admin-card'), function (card) {
      var id = card.getAttribute('data-id');
      var item = cache.find(function (p) { return p.id === id; });
      card.querySelector('[data-action="edit"]').addEventListener('click', function () { openForm(item); });
      card.querySelector('[data-action="delete"]').addEventListener('click', function () { deleteProject(item); });
    });
  }

  async function deleteProject(item) {
    var ok = await window.confirmDialog({
      title: 'Delete this project?',
      message: '"' + item.title + '" will be permanently removed from your portfolio. This cannot be undone.',
      confirmLabel: 'Delete'
    });
    if (!ok) return;

    try {
      var result = await window.sb.from('projects').delete().eq('id', item.id);
      if (result.error) throw result.error;
      if (window.showToast) window.showToast('Project deleted.', 'success');
      fetchProjects();
      if (window.AdminApp.views.overview) window.AdminApp.views.overview.load();
    } catch (err) {
      console.error('[projects] delete failed:', err);
      if (window.showToast) window.showToast('Could not delete project. Please try again.', 'error');
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
      '<h3>' + (isEdit ? 'Edit Project' : 'Add Project') + '</h3>' +
      '<form id="project-form" novalidate>' +
        '<div class="field-row">' +
          '<div class="field"><label for="pf-title">Title</label><input type="text" id="pf-title" required maxlength="160" /></div>' +
          '<div class="field"><label for="pf-category">Category</label><input type="text" id="pf-category" maxlength="80" placeholder="e.g. Restaurant" /></div>' +
        '</div>' +
        '<div class="field"><label for="pf-description">Description</label><textarea id="pf-description" maxlength="400" rows="3"></textarea></div>' +
        '<div class="field-row">' +
          '<div class="field"><label for="pf-image">Image URL (optional)</label><input type="url" id="pf-image" placeholder="https://…" /></div>' +
          '<div class="field"><label for="pf-badge">Fallback Badge (2 letters)</label><input type="text" id="pf-badge" maxlength="3" placeholder="e.g. OT" /></div>' +
        '</div>' +
        '<div class="field"><label for="pf-url">Live Project URL</label><input type="url" id="pf-url" placeholder="https://…" /></div>' +
        '<div class="field-row">' +
          '<div class="field"><label for="pf-sort">Sort Order</label><input type="number" id="pf-sort" value="0" step="1" /></div>' +
          '<div class="field" style="display:flex;flex-direction:column;justify-content:flex-end;gap:10px;">' +
            '<label class="switch"><input type="checkbox" id="pf-featured" /><span class="track"></span> Featured on homepage</label>' +
            '<label class="switch"><input type="checkbox" id="pf-published" /><span class="track"></span> Published (visible on site)</label>' +
          '</div>' +
        '</div>' +
        '<div class="at-modal-actions">' +
          '<button type="button" class="at-btn at-btn-ghost" data-action="cancel">Cancel</button>' +
          '<button type="submit" class="at-btn at-btn-primary" id="project-save-btn">' + (isEdit ? 'Save Changes' : 'Add Project') + '</button>' +
        '</div>' +
      '</form>';

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.classList.add('at-modal-open');
    requestAnimationFrame(function () { overlay.classList.add('in'); });

    var f = {
      title: modal.querySelector('#pf-title'),
      category: modal.querySelector('#pf-category'),
      description: modal.querySelector('#pf-description'),
      image: modal.querySelector('#pf-image'),
      badge: modal.querySelector('#pf-badge'),
      url: modal.querySelector('#pf-url'),
      sort: modal.querySelector('#pf-sort'),
      featured: modal.querySelector('#pf-featured'),
      published: modal.querySelector('#pf-published')
    };

    if (isEdit) {
      f.title.value = item.title || '';
      f.category.value = item.category || '';
      f.description.value = item.description || '';
      f.image.value = item.image_url || '';
      f.badge.value = item.badge_text || '';
      f.url.value = item.project_url || '';
      f.sort.value = item.sort_order != null ? item.sort_order : 0;
      f.featured.checked = !!item.featured;
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

    modal.querySelector('#project-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var title = f.title.value.trim();
      if (!title) { if (window.showToast) window.showToast('Please enter a project title.', 'error'); return; }

      var payload = {
        title: title,
        category: f.category.value.trim(),
        description: f.description.value.trim(),
        image_url: f.image.value.trim() || null,
        badge_text: f.badge.value.trim() || null,
        project_url: f.url.value.trim() || null,
        sort_order: parseInt(f.sort.value, 10) || 0,
        featured: f.featured.checked,
        is_published: f.published.checked
      };

      var saveBtn = document.getElementById('project-save-btn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';

      try {
        var result = isEdit
          ? await window.sb.from('projects').update(payload).eq('id', item.id)
          : await window.sb.from('projects').insert([payload]);
        if (result.error) throw result.error;
        if (window.showToast) window.showToast(isEdit ? 'Project updated.' : 'Project added.', 'success');
        close();
        fetchProjects();
        if (window.AdminApp.views.overview) window.AdminApp.views.overview.load();
      } catch (err) {
        console.error('[projects] save failed:', err);
        if (window.showToast) window.showToast('Could not save project. Please try again.', 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = isEdit ? 'Save Changes' : 'Add Project';
      }
    });
  }
})();
