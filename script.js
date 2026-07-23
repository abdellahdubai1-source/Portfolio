(function () {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  // Mobile menu
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

  // Header: add blur + border once the page has scrolled.
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

  // Reveal on scroll
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

  // Footer year
  const yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
