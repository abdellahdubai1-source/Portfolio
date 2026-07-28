(function () {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  // ============ Mobile menu ============
  const burger = $('#burger');
  const navLinks = $('#nav-links');
  const closeMenu = () => {
    if (!burger) return;
    burger.classList.remove('open');
    navLinks.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
  };
  if (burger) {
    burger.addEventListener('click', () => {
      const open = burger.classList.toggle('open');
      navLinks.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
  }
  if (navLinks) {
    navLinks.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 860) closeMenu(); });

  // ============ Header: glassmorphism + gold hairline once scrolled ============
  // Passive listener + rAF throttle keeps this cheap on mobile.
  const nav = $('#nav');
  if (nav) {
    let ticking = false;
    const setNavState = () => {
      nav.classList.toggle('scrolled', window.scrollY > 8);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(setNavState); }
    }, { passive: true });
    setNavState();
  }

  // ============ Gold active nav indicator ============
  // Highlights the nav link matching the section currently in view.
  const sectionLinks = $$('.nav-links > a[href*="#"]').filter(a => a.getAttribute('href').includes('#') && !a.classList.contains('nav-cta'));
  const sectionIds = sectionLinks
    .map(a => a.getAttribute('href').split('#')[1])
    .filter(Boolean);
  const sections = sectionIds
    .map(id => document.getElementById(id))
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    const setActive = id => {
      sectionLinks.forEach(a => {
        const linkId = a.getAttribute('href').split('#')[1];
        a.classList.toggle('active', linkId === id);
      });
    };
    const navIO = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) setActive(en.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(sec => navIO.observe(sec));
  }

  // ============ Reveal on scroll ============
  const revealEls = $$('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
  }

  // ============ Animated stat counters ============
  // Counts up from 0 to data-count-to once the stat enters the viewport.
  const statEls = $$('[data-count-to]');
  const animateCount = (el) => {
    const target = parseFloat(el.getAttribute('data-count-to'));
    const suffix = el.getAttribute('data-suffix') || '';
    if (reduce || isNaN(target)) {
      el.textContent = target + suffix;
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const startVal = 0;

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      // Ease-out cubic — decelerates smoothly, feels premium rather than mechanical.
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (target - startVal) * eased);
      el.textContent = current + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(tick);
  };

  if (statEls.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      statEls.forEach(animateCount);
    } else {
      const statIO = new IntersectionObserver((entries, obs) => {
        entries.forEach(en => {
          if (en.isIntersecting) {
            animateCount(en.target);
            obs.unobserve(en.target);
          }
        });
      }, { threshold: 0.4 });
      statEls.forEach(el => statIO.observe(el));
    }
  }

  // ============ Footer year ============
  const yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
