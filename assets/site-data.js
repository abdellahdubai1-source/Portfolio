/**
 * Loads projects + testimonials from Supabase and renders them into the
 * SAME containers/markup the static site already uses, so the design never
 * changes. If Supabase isn't configured, or the query fails, or a table is
 * simply empty, the existing hardcoded HTML in index.html / portfolio.html
 * is left completely untouched — the site never breaks or shows blank
 * sections because of this script.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    loadFeaturedProjects();
    loadPortfolioProjects();
    loadTestimonials();
  });

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function badgeFromTitle(title) {
    var words = String(title || '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '•';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  function projectCardHtml(project, linkLabel) {
    var badge = escapeHtml(project.badge_text || badgeFromTitle(project.title));
    var thumb = project.image_url
      ? '<img src="' + escapeHtml(project.image_url) + '" alt="' + escapeHtml(project.title) + '" loading="lazy" decoding="async" />'
      : '<div class="work-thumb-fallback" aria-hidden="true">' + badge + '</div>';
    var link = project.project_url
      ? '<a class="work-link" href="' + escapeHtml(project.project_url) + '" target="_blank" rel="noopener noreferrer">' +
          linkLabel +
          '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg>' +
        '</a>'
      : '';

    return (
      '<article class="work-item in" data-reveal>' +
        '<div class="work-thumb">' + thumb + '</div>' +
        '<div class="work-body">' +
          '<div class="work-heading">' +
            '<h3>' + escapeHtml(project.title) + '</h3>' +
            (project.category ? '<span class="work-cat">' + escapeHtml(project.category) + '</span>' : '') +
          '</div>' +
          (project.description ? '<p class="work-desc">' + escapeHtml(project.description) + '</p>' : '') +
          link +
        '</div>' +
      '</article>'
    );
  }

  function testimonialCardHtml(t) {
    var letter = escapeHtml(t.avatar_letter || (t.name ? t.name.trim().charAt(0).toUpperCase() : '•'));
    return (
      '<article class="testimonial-card in" data-reveal>' +
        '<span class="testimonial-quote-icon" aria-hidden="true">&ldquo;</span>' +
        '<p class="testimonial-text">' + escapeHtml(t.quote) + '</p>' +
        '<div class="testimonial-author">' +
          '<span class="testimonial-avatar" aria-hidden="true">' + letter + '</span>' +
          '<div>' +
            '<p class="testimonial-name">' + escapeHtml(t.name) + '</p>' +
            (t.role ? '<p class="testimonial-role">' + escapeHtml(t.role) + '</p>' : '') +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  // Homepage: featured projects only, replaces .work-list inside #work
  function loadFeaturedProjects() {
    var container = document.querySelector('#work .work-list');
    if (!container || !window.sb) return;

    window.sb.from('projects')
      .select('*')
      .eq('is_published', true)
      .eq('featured', true)
      .order('sort_order', { ascending: true })
      .limit(6)
      .then(function (result) {
        if (result.error || !result.data || !result.data.length) return;
        container.innerHTML = result.data.map(function (p) { return projectCardHtml(p, 'View Case Study'); }).join('');
      })
      .catch(function (err) { console.warn('[site-data] featured projects load failed, keeping static fallback:', err); });
  }

  // portfolio.html: full project archive, replaces .portfolio-grid
  function loadPortfolioProjects() {
    var container = document.querySelector('.portfolio-grid');
    if (!container || !window.sb) return;

    window.sb.from('projects')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .then(function (result) {
        if (result.error || !result.data || !result.data.length) return;
        container.innerHTML = result.data.map(function (p) { return projectCardHtml(p, 'View Live Project'); }).join('');
      })
      .catch(function (err) { console.warn('[site-data] portfolio projects load failed, keeping static fallback:', err); });
  }

  // Homepage: testimonials, replaces .testimonials-grid
  function loadTestimonials() {
    var container = document.querySelector('.testimonials-grid');
    if (!container || !window.sb) return;

    window.sb.from('testimonials')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .then(function (result) {
        if (result.error || !result.data || !result.data.length) return;
        container.innerHTML = result.data.map(testimonialCardHtml).join('');
      })
      .catch(function (err) { console.warn('[site-data] testimonials load failed, keeping static fallback:', err); });
  }
})();
