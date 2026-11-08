import { initHeroScene } from './scene.js';

const { gsap, ScrollTrigger, Lenis } = window;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('js');
document.querySelector('[data-year]').textContent = new Date().getFullYear();

/* ---------- Smooth scroll (Lenis driven by GSAP's ticker so they never fight) ---------- */
gsap.registerPlugin(ScrollTrigger);
let lenis = null;
if (!reduced && Lenis) {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const el = id.length > 1 && document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    closeMenu();
    lenis ? lenis.scrollTo(el, { offset: -60, duration: 1.4 }) : el.scrollIntoView({ behavior: 'smooth' });
  });
});

/* ---------- Nav ---------- */
const nav = document.querySelector('[data-nav]');
const toggle = document.querySelector('[data-nav-toggle]');
const mobileMenu = document.querySelector('[data-mobile-menu]');
function closeMenu() { mobileMenu.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); }
toggle.addEventListener('click', () => {
  const open = !mobileMenu.classList.contains('is-open');
  mobileMenu.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', String(open));
});
let lastY = 0;
ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate: (self) => {
    const y = self.scroll();
    nav.classList.toggle('is-scrolled', y > 40);
    nav.classList.toggle('is-hidden', y > 600 && y > lastY && !mobileMenu.classList.contains('is-open'));
    lastY = y;
  },
});

/* ---------- Hero 3D ---------- */
const canvas = document.querySelector('[data-hero-canvas]');
let hero = null;
try { hero = initHeroScene(canvas); } catch (e) { console.warn('WebGL unavailable', e); }
if (!hero) document.documentElement.classList.add('no-webgl');

if (hero) {
  ScrollTrigger.create({
    trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true,
    onUpdate: (s) => hero.setProgress(s.progress),
  });
}

/* ---------- Loader → intro ---------- */
const bar = document.querySelector('.loader__bar span');
bar.style.width = '35%';
const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
Promise.race([fontsReady, new Promise((r) => setTimeout(r, 2500))]).then(() => {
  bar.style.width = '100%';
  setTimeout(intro, 350);
});

function intro() {
  document.body.classList.remove('is-loading');
  const tl = gsap.timeline({ delay: 0.35 });
  tl.from('.hero__title .line > span', { yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: 0.09 })
    .to('.hero [data-reveal]', { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08 }, '-=0.9')
    .from('.nav > *', { autoAlpha: 0, duration: 0.9, ease: 'power2.out', stagger: 0.06 }, '<');
  if (hero) {
    const o = { v: 0 };
    tl.to(o, { v: 1, duration: 2.2, ease: 'expo.out', onUpdate: () => hero.setIntro(o.v) }, 0);
  }
}

/* ---------- Split headings into words ---------- */
document.querySelectorAll('[data-split]').forEach((el) => {
  el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="word"><span>${w}</span></span>`).join(' ');
  gsap.from(el.querySelectorAll('.word > span'), {
    yPercent: 105, duration: 1.1, ease: 'expo.out', stagger: 0.035,
    scrollTrigger: { trigger: el, start: 'top 85%' },
  });
});

/* ---------- Generic reveals ---------- */
gsap.utils.toArray('[data-reveal]').forEach((el) => {
  if (el.closest('.hero')) return;
  gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
});

/* ---------- Parallax ---------- */
if (!reduced) {
  gsap.utils.toArray('[data-parallax]').forEach((el) => {
    const amt = parseFloat(el.dataset.parallax);
    const target = el.tagName === 'IMG' ? el : el.querySelector('img');
    gsap.fromTo(target, { yPercent: -amt }, { yPercent: amt, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // gallery strip drifts sideways with scroll
  gsap.fromTo('[data-strip]', { x: 0 }, {
    x: () => -(document.querySelector('[data-strip]').scrollWidth - window.innerWidth) * 0.6,
    ease: 'none',
    scrollTrigger: { trigger: '.strip', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
  });
}

/* ---------- Counters ---------- */
document.querySelectorAll('[data-count]').forEach((el) => {
  const o = { v: 0 }, end = +el.dataset.count;
  gsap.to(o, {
    v: end, duration: 1.8, ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 90%' },
    onUpdate: () => { el.textContent = Math.round(o.v); },
  });
});

/* ---------- Menu tabs ---------- */
const tabs = document.querySelectorAll('[data-tab]');
tabs.forEach((tab) => {
  tab.addEventListener('click', () => select(tab));
  tab.addEventListener('keydown', (e) => {
    const list = [...tabs], i = list.indexOf(tab);
    if (e.key === 'ArrowRight') { list[(i + 1) % list.length].focus(); select(list[(i + 1) % list.length]); }
    if (e.key === 'ArrowLeft') { list[(i - 1 + list.length) % list.length].focus(); select(list[(i - 1 + list.length) % list.length]); }
  });
});
function select(tab) {
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    const panel = document.getElementById(t.getAttribute('aria-controls'));
    panel.hidden = !on;
    panel.classList.toggle('is-active', on);
    if (on && !reduced) {
      gsap.fromTo(panel.querySelector('.panel__img'), { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1, ease: 'expo.out' });
      gsap.fromTo(panel.querySelectorAll('.items li'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.05 });
    }
  });
  ScrollTrigger.refresh();
}

/* ---------- Reels: pinned horizontal scroll on desktop ---------- */
const mm = gsap.matchMedia();
mm.add('(min-width: 961px)', () => {
  const track = document.querySelector('[data-reels-track]');
  const pin = document.querySelector('.reels__pin');
  const distance = () => Math.max(0, track.scrollWidth + track.getBoundingClientRect().left - window.innerWidth);
  gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + distance(), pin: true, scrub: 0.6, invalidateOnRefresh: true },
  });
});

/* ---------- Videos: load + play only when on screen ---------- */
const vio = new IntersectionObserver((entries) => {
  entries.forEach(({ target: v, isIntersecting }) => {
    if (isIntersecting) {
      if (!v.src) { v.src = v.dataset.src; }
      v.play().catch(() => {});
    } else if (!v.paused) v.pause();
  });
}, { rootMargin: '0px 200px', threshold: 0.15 });
document.querySelectorAll('.reel video').forEach((v) => vio.observe(v));

window.addEventListener('load', () => ScrollTrigger.refresh());
