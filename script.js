(function () {
'use strict';
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
function runLoad() {
requestAnimationFrame(() => requestAnimationFrame(() => {
const nav = $('#nav'); const hero = $('#hero');
if (nav) nav.classList.add('nav-ready');
if (hero) hero.classList.add('hero-loaded');
}));
}
document.readyState === 'loading'
? document.addEventListener('DOMContentLoaded', runLoad)
: runLoad();
const nav = $('#nav');
const onScroll = () => { if (nav) nav.classList.toggle('scrolled', window.scrollY > 24); };
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });
const burger = $('#burger'); const navLinks = $('#nav-links');
const closeMenu = () => {
if (!burger) return;
burger.classList.remove('open'); navLinks.classList.remove('open');
burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open menu');
};
if (burger) burger.addEventListener('click', () => {
const open = burger.classList.toggle('open');
navLinks.classList.toggle('open', open);
burger.setAttribute('aria-expanded', String(open));
burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
if (navLinks) navLinks.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
window.addEventListener('resize', () => { if (window.innerWidth > 860) closeMenu(); });
$$('a[href^="#"]').forEach(link => {
link.addEventListener('click', e => {
const id = link.getAttribute('href');
if (!id || id === '#') return;
const target = document.querySelector(id);
if (!target) return;
e.preventDefault();
const navH = nav ? nav.offsetHeight : 0;
const top = target.getBoundingClientRect().top + window.scrollY - navH + 1;
window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
});
});
const scrambleEl = $('#scramble');
if (scrambleEl) {
const roles = ['Web Designer', 'Frontend Developer', 'AI Automation Specialist'];
const chars = '!<>-_\\/[]{}—=+*^?#________';
let idx = 0;
if (reduce) {
setInterval(() => { idx = (idx + 1) % roles.length; scrambleEl.textContent = roles[idx]; }, 2600);
} else {
const setText = (newText) => new Promise(resolve => {
const old = scrambleEl.textContent;
const len = Math.max(old.length, newText.length);
const queue = [];
for (let i = 0; i < len; i++) {
const from = old[i] || '';
const to = newText[i] || '';
const start = Math.floor(Math.random() * 30);
const end = start + Math.floor(Math.random() * 30) + 10;
queue.push({ from, to, start, end, char: '' });
}
let frame = 0; let raf;
const update = () => {
let out = ''; let complete = 0;
for (const q of queue) {
if (frame >= q.end) { complete++; out += q.to; }
else if (frame >= q.start) {
if (!q.char || Math.random() < 0.28) q.char = chars[Math.floor(Math.random() * chars.length)];
out += `<span style="color:#475569">${q.char}</span>`;
} else out += q.from;
}
scrambleEl.innerHTML = out;
if (complete === queue.length) { cancelAnimationFrame(raf); resolve(); }
else { frame++; raf = requestAnimationFrame(update); }
};
update();
});
const cycle = () => {
idx = (idx + 1) % roles.length;
setText(roles[idx]).then(() => setTimeout(cycle, 2200));
};
setTimeout(cycle, finePointer ? 2000 : 4200);
}
}
const whenIdle = (fn) => ('requestIdleCallback' in window)
? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 1);
whenIdle(function initNonCritical () {
const revealEls = $$('[data-reveal]');
if (reduce || !('IntersectionObserver' in window)) {
revealEls.forEach(el => el.classList.add('in'));
} else {
$$('.proj-grid, .skill-grid, .serv-grid').forEach(parent => {
$$('[data-reveal]', parent).forEach((el, i) => el.style.setProperty('--stagger', (i % 4) * 90 + 'ms'));
});
const io = new IntersectionObserver((entries, obs) => {
entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); } });
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
revealEls.forEach(el => io.observe(el));
window.addEventListener('load', () => setTimeout(() => {
revealEls.forEach(el => { if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in'); });
}, 600));
}
const counters = $$('.counter');
const runCounter = el => {
const target = parseFloat(el.dataset.target) || 0;
if (reduce) { el.textContent = target; return; }
const dur = 1500, start = performance.now();
const tick = now => {
const p = Math.min((now - start) / dur, 1);
const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
el.textContent = Math.round(target * eased);
if (p < 1) requestAnimationFrame(tick); else el.textContent = target;
};
requestAnimationFrame(tick);
};
if (counters.length) {
if (!('IntersectionObserver' in window)) counters.forEach(runCounter);
else {
const co = new IntersectionObserver((entries, obs) => {
entries.forEach(en => { if (en.isIntersecting) { runCounter(en.target); obs.unobserve(en.target); } });
}, { threshold: 0.6 });
counters.forEach(c => co.observe(c));
}
}
const railLinks = $$('.rail-dots a');
if (railLinks.length && 'IntersectionObserver' in window) {
const map = {};
railLinks.forEach(a => map[a.dataset.rail] = a);
const ro = new IntersectionObserver(entries => {
entries.forEach(en => {
if (en.isIntersecting) {
railLinks.forEach(a => a.classList.remove('active'));
const a = map[en.target.id]; if (a) a.classList.add('active');
}
});
}, { threshold: 0.4, rootMargin: '-30% 0px -50% 0px' });
['hero','projects','about','skills','services','why','contact']
.map(id => document.getElementById(id)).filter(Boolean).forEach(s => ro.observe(s));
}
const filterBar = $('.proj-filter');
if (filterBar) {
const filterBtns = $$('.filter-btn', filterBar);
const projGrid = $('#proj-grid') || $('.proj-grid');
const cards = projGrid ? $$('.proj-card', projGrid) : [];
const HIDE_DELAY = reduce ? 0 : 380;
const applyFilter = (cat) => {
cards.forEach(card => {
const match = cat === 'all' || card.dataset.category === cat;
if (match) {
if (card.style.display === 'none') {
card.style.display = '';
void card.offsetWidth; // force reflow so the transition runs
}
card.classList.remove('filter-hidden');
card.removeAttribute('aria-hidden');
} else {
card.classList.add('filter-hidden');
card.setAttribute('aria-hidden', 'true');
window.setTimeout(() => {
if (card.classList.contains('filter-hidden')) card.style.display = 'none';
}, HIDE_DELAY);
}
});
};
filterBtns.forEach(btn => {
btn.addEventListener('click', () => {
if (btn.classList.contains('active')) return;
filterBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
btn.classList.add('active'); btn.setAttribute('aria-selected', 'true');
applyFilter(btn.dataset.filter);
});
});
}
$$('.proj-card').forEach(card => {
const screen = $('.screen', card);
const toggle = $('.preview-toggle', card);
if (!screen) return;
const url = screen.dataset.live;
const title = screen.dataset.title || 'Live preview';
let mounted = false;
const mount = () => {
if (mounted) return; mounted = true;
const frame = document.createElement('iframe');
frame.title = title;
frame.loading = 'lazy';
frame.setAttribute('tabindex', '-1');
frame.setAttribute('aria-hidden', 'true');
frame.src = url;
screen.appendChild(frame);
};
const show = () => { mount(); screen.classList.add('live'); if (toggle){ toggle.setAttribute('aria-pressed','true'); toggle.textContent='Live'; } };
const hide = () => { screen.classList.remove('live'); if (toggle){ toggle.setAttribute('aria-pressed','false'); toggle.textContent='Preview live'; } };
if (finePointer && !reduce) {
card.addEventListener('mouseenter', show);
card.addEventListener('mouseleave', hide);
}
if (toggle) {
toggle.addEventListener('click', e => {
e.preventDefault(); e.stopPropagation();
screen.classList.contains('live') ? hide() : show();
});
}
screen.addEventListener('click', () => { if (!finePointer) (screen.classList.contains('live') ? hide() : show()); });
});
if (finePointer && !reduce) {
$$('[data-tilt]').forEach(card => {
const max = 6;
let raf = null;
const onMove = e => {
const r = card.getBoundingClientRect();
const px = (e.clientX - r.left) / r.width - 0.5;
const py = (e.clientY - r.top) / r.height - 0.5;
if (raf) cancelAnimationFrame(raf);
raf = requestAnimationFrame(() => {
const baseY = card.matches(':nth-child(even)') ? 36 : 0; // keep desktop offset
card.style.transform =
`perspective(1000px) rotateX(${(-py*max).toFixed(2)}deg) rotateY(${(px*max).toFixed(2)}deg) translateY(${baseY}px)`;
});
};
const reset = () => { if (raf) cancelAnimationFrame(raf); card.style.transform = ''; };
card.addEventListener('mousemove', onMove);
card.addEventListener('mouseleave', reset);
});
}
if (finePointer && !reduce) {
$$('[data-magnetic]').forEach(el => {
const strength = 0.32;
el.addEventListener('mousemove', e => {
const r = el.getBoundingClientRect();
const x = (e.clientX - r.left - r.width / 2) * strength;
const y = (e.clientY - r.top - r.height / 2) * strength;
el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
});
el.addEventListener('mouseleave', () => { el.style.transform = ''; });
});
}
if (finePointer && !reduce) {
const dot = $('#cursor');
const light = $('.cursor-light');
if (dot) {
document.body.classList.add('has-cursor');
let x = 0, y = 0, cx = 0, cy = 0;
window.addEventListener('mousemove', e => {
x = e.clientX; y = e.clientY;
dot.style.opacity = '1';
if (light) {
light.style.setProperty('--mx', (x / window.innerWidth * 100) + '%');
light.style.setProperty('--my', (y / window.innerHeight * 100) + '%');
}
});
const loop = () => {
cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
dot.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
requestAnimationFrame(loop);
};
loop();
window.addEventListener('mouseleave', () => dot.style.opacity = '0');
$$('a, button, [data-magnetic], .proj-card, .tile').forEach(el => {
el.addEventListener('mouseenter', () => dot.classList.add('active'));
el.addEventListener('mouseleave', () => dot.classList.remove('active'));
});
}
}
const toTop = $('#to-top');
if (toTop) {
const s = () => toTop.classList.toggle('show', window.scrollY > 700);
s(); window.addEventListener('scroll', s, { passive: true });
toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
}
const form = $('#contact-form'); const status = $('#form-status');
if (form) {
form.addEventListener('submit', e => {
e.preventDefault();
const name = $('#c-name').value.trim();
const email = $('#c-email').value.trim();
const msg = $('#c-msg').value.trim();
const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
let ok = true;
[['#c-name', name], ['#c-email', email && emailOk], ['#c-msg', msg]].forEach(([sel, valid]) => {
$(sel).style.borderColor = valid ? '' : '#f87171';
if (!valid) ok = false;
});
if (!ok) {
if (status) { status.textContent = 'Please fill in every field with a valid email.'; status.className = 'form-status err'; }
return;
}
const subject = encodeURIComponent(`New project enquiry from ${name}`);
const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${msg}`);
window.location.href = `mailto:abdellateha7@gmail.com?subject=${subject}&body=${body}`;
if (status) { status.textContent = `Thanks, ${name.split(' ')[0]} — opening your email app to send.`; status.className = 'form-status ok'; }
form.reset();
});
form.addEventListener('input', e => {
if (e.target.matches('input,textarea') && e.target.value.trim()) e.target.style.borderColor = '';
});
}
const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
}); // end whenIdle — non-critical init
})();
