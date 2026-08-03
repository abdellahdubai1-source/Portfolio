/**
 * Overview tab: basic content statistics pulled straight from the database
 * (message counts by status, project counts, testimonial counts). This is
 * separate from — and a nice complement to — the Google Analytics /
 * Microsoft Clarity traffic tracking already embedded in the public site.
 */
(function () {
  'use strict';

  window.AdminApp = window.AdminApp || { views: {} };

  var loaded = false;

  window.AdminApp.views.overview = {
    load: function () { fetchStats(); }
  };

  function statCard(num, label) {
    return '<div class="stat-card"><p class="num">' + num + '</p><p class="label">' + label + '</p></div>';
  }

  async function fetchStats() {
    var container = document.getElementById('overview-stats');
    if (!container || !window.sb) return;

    container.innerHTML = '<div class="admin-loading"><span class="spinner" aria-hidden="true"></span> Loading stats…</div>';

    try {
      var results = await Promise.all([
        window.sb.from('messages').select('*', { count: 'exact', head: true }),
        window.sb.from('messages').select('*', { count: 'exact', head: true }).eq('status', 'new'),
        window.sb.from('messages').select('*', { count: 'exact', head: true }).eq('status', 'replied'),
        window.sb.from('projects').select('*', { count: 'exact', head: true }),
        window.sb.from('projects').select('*', { count: 'exact', head: true }).eq('featured', true),
        window.sb.from('testimonials').select('*', { count: 'exact', head: true })
      ]);

      var anyError = results.some(function (r) { return r.error; });
      if (anyError) {
        container.innerHTML = '<div class="admin-empty">Couldn\'t load statistics. Please refresh the page.</div>';
        return;
      }

      var totalMessages = results[0].count || 0;
      var newMessages = results[1].count || 0;
      var repliedMessages = results[2].count || 0;
      var totalProjects = results[3].count || 0;
      var featuredProjects = results[4].count || 0;
      var totalTestimonials = results[5].count || 0;

      container.innerHTML = [
        statCard(totalMessages, 'Total Messages'),
        statCard(newMessages, 'New / Unread'),
        statCard(repliedMessages, 'Replied'),
        statCard(totalProjects, 'Portfolio Projects'),
        statCard(featuredProjects, 'Featured on Homepage'),
        statCard(totalTestimonials, 'Testimonials')
      ].join('');

      updateNavBadge(newMessages);
    } catch (err) {
      console.error('[overview] failed to load stats:', err);
      container.innerHTML = '<div class="admin-empty">Couldn\'t load statistics. Please refresh the page.</div>';
    }
  }

  function updateNavBadge(count) {
    var badge = document.getElementById('messages-nav-badge');
    if (!badge) return;
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  }

  // Let messages.js call this too, so the badge/overview stay in sync
  // after a status change without waiting for a full reload.
  window.AdminApp.refreshOverviewBadge = function (count) { updateNavBadge(count); };
})();
