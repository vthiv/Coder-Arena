(function () {
  'use strict';
 
  /* ── CONFIG ─────────────────────────────────────────── */
  const TOTAL    = 7;
  const INTERVAL = 9000;                              // ms per auto-slide (desktop only)
  const REG_CLOSE  = new Date('2026-06-08T23:59:59'); // countdown target
  const COMP_DATE  = new Date('2026-06-10T10:00:00');
 
  /* ── MOBILE DETECTION ────────────────────────────────── */
  function isMobile() {
    return window.innerWidth <= 768;
  }
 
  let current    = 0;
  let blocking   = false;
  let animId     = null;
  let slideStart = null;
  let statsRun   = false;
  let touchStartY = 0;
  let touchStartX = 0;
 
  const wrapper  = document.getElementById('slidesWrapper');
  const fill     = document.getElementById('autoslideFill');
  const dots     = document.querySelectorAll('.nav-dot');
  const cursor   = document.getElementById('cursorGlow');
 
  /* ── CUSTOM CURSOR (desktop only) ───────────────────── */
  if (!isMobile()) {
    document.addEventListener('mousemove', e => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top  = e.clientY + 'px';
    });
    document.addEventListener('mousedown', () => {
      cursor.style.width  = '38px';
      cursor.style.height = '38px';
      cursor.style.opacity = '.75';
    });
    document.addEventListener('mouseup', () => {
      cursor.style.width  = '22px';
      cursor.style.height = '22px';
      cursor.style.opacity = '1';
    });
    document.querySelectorAll(
      'a, button, .glass-card, .cat-card, .prize-card, .nav-dot, .soc-btn, .extra-pill'
    ).forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.style.width  = '44px';
        cursor.style.height = '44px';
        cursor.style.background = 'radial-gradient(circle,rgba(6,182,212,.85) 0%,rgba(168,85,247,.3) 55%,transparent 100%)';
      });
      el.addEventListener('mouseleave', () => {
        cursor.style.width  = '22px';
        cursor.style.height = '22px';
        cursor.style.background = 'radial-gradient(circle,rgba(168,85,247,.85) 0%,rgba(59,130,246,.3) 55%,transparent 100%)';
      });
    });
  }
 
  /* ── PUBLIC NAVIGATION (desktop only) ──────────────── */
  window.goToSection = function (idx) {
    if (isMobile()) {
      // On mobile, scroll to the section naturally
      const slide = document.getElementById('slide-' + idx);
      if (slide) {
        const topbarH = document.querySelector('.topbar')?.offsetHeight || 56;
        const y = slide.getBoundingClientRect().top + window.pageYOffset - topbarH;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      return;
    }
    if (idx < 0 || idx >= TOTAL) return;
    current = idx;
    wrapper.scrollTo({ top: idx * window.innerHeight, behavior: 'smooth' });
    setDots(idx);
    resetProgress();
    onEnter(idx);
  };
 
  function setDots(idx) {
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }
 
  dots.forEach((d, i) => d.addEventListener('click', () => window.goToSection(i)));
 
  /* ── DESKTOP: SCROLL SNAP DETECTION ─────────────────── */
  if (!isMobile()) {
    wrapper.addEventListener('scroll', () => {
      const sec = Math.round(wrapper.scrollTop / window.innerHeight);
      if (sec !== current) {
        current = sec;
        setDots(sec);
        onEnter(sec);
        resetProgress();
      }
    }, { passive: true });
 
    /* ── DESKTOP: WHEEL OVERRIDE (one slide at a time) ── */
    wrapper.addEventListener('wheel', e => {
      e.preventDefault();
      if (blocking) return;
      blocking = true;
      const dir = e.deltaY > 0 ? 1 : -1;
      window.goToSection(Math.max(0, Math.min(TOTAL - 1, current + dir)));
      setTimeout(() => { blocking = false; }, 850);
    }, { passive: false });
 
    /* ── DESKTOP: TOUCH SWIPE ────────────────────────── */
    wrapper.addEventListener('touchstart', e => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
 
    wrapper.addEventListener('touchend', e => {
      const dy = touchStartY - e.changedTouches[0].clientY;
      const dx = touchStartX - e.changedTouches[0].clientX;
      // Only trigger vertical swipe if it's clearly more vertical than horizontal
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 38) {
        window.goToSection(dy > 0
          ? Math.min(TOTAL - 1, current + 1)
          : Math.max(0, current - 1));
      }
    }, { passive: true });
 
    /* ── DESKTOP: KEYBOARD ──────────────────────────── */
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown')
        window.goToSection(Math.min(TOTAL - 1, current + 1));
      if (e.key === 'ArrowUp' || e.key === 'PageUp')
        window.goToSection(Math.max(0, current - 1));
    });
  }
 
  /* ── MOBILE: IntersectionObserver for dot sync ───────── */
  if (isMobile()) {
    const slideEls = Array.from({ length: TOTAL }, (_, i) => document.getElementById('slide-' + i)).filter(Boolean);
    const mobileIO = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && e.intersectionRatio > 0.4) {
          const idx = slideEls.indexOf(e.target);
          if (idx !== -1) {
            current = idx;
            // dots hidden on mobile so just track current
          }
        }
      });
    }, { threshold: 0.4 });
    slideEls.forEach(s => mobileIO.observe(s));
  }
 
  /* ── AUTO-SLIDE PROGRESS BAR (desktop only) ──────────── */
  function resetProgress() {
    if (isMobile()) return;
    startProgress();
  }
 
  function startProgress() {
    cancelAnimationFrame(animId);
 
    // Strictly desktop only
    if (isMobile()) {
      if (fill) fill.style.width = '0%';
      return;
    }
 
    slideStart = performance.now();
 
    function tick(now) {
      const pct = Math.min(((now - slideStart) / INTERVAL) * 100, 100);
      if (fill) fill.style.width = pct + '%';
      if (now - slideStart >= INTERVAL) {
        window.goToSection((current + 1) % TOTAL);
      } else {
        animId = requestAnimationFrame(tick);
      }
    }
    animId = requestAnimationFrame(tick);
  }
 
  /* ── SECTION ENTER HOOK ──────────────────────────────── */
  function onEnter(idx) {
    revealSlide(idx);
    if (idx === 1 && !statsRun) { animateStats(); statsRun = true; }
  }
 
  /* ── INTERSECTION OBSERVER for [data-animate] ─────────── */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el    = e.target;
        const delay = parseInt(el.dataset.delay || 0);
        setTimeout(() => el.classList.add('visible'), delay);
      }
    });
  }, { threshold: 0.12 });
 
  document.querySelectorAll('[data-animate]').forEach(el => io.observe(el));
 
  function revealSlide(idx) {
    const slide = document.getElementById('slide-' + idx);
    if (!slide) return;
    slide.querySelectorAll('[data-animate]').forEach(el => {
      if (!el.classList.contains('visible')) {
        setTimeout(() => el.classList.add('visible'), 120);
      }
    });
    slide.querySelectorAll('.about-card, .detail-card, .rules-block, .prize-card').forEach((el, i) => {
      el.style.opacity   = '0';
      el.style.transform = 'translateY(26px)';
      setTimeout(() => {
        el.style.transition = 'opacity .6s ease, transform .6s ease';
        el.style.opacity    = '1';
        el.style.transform  = 'translateY(0)';
      }, 160 + i * 90);
    });
  }
 
  /* initial reveal */
  setTimeout(() => revealSlide(0), 300);
 
  /* On mobile, reveal all slides immediately since they're all visible */
  if (isMobile()) {
    setTimeout(() => {
      for (let i = 0; i < TOTAL; i++) revealSlide(i);
      document.querySelectorAll('[data-animate]').forEach(el => {
        el.classList.add('visible');
      });
      // Also trigger stats
      if (!statsRun) { animateStats(); statsRun = true; }
    }, 400);
  }
 
  /* ── TYPING EFFECT ───────────────────────────────────── */
  const phrases = [
    'Code, Compete, Conquer.',
    'Win SEGi Scholarships!',
    'Open to the Public.',
    'Limited to 10 Groups Only.',
    "It's Not Just About Winning.",
    'Prove Yourself — June 10, 2026!',
  ];
  let pi = 0, ci = 0, del = false, tDelay = 90;
  const tEl = document.getElementById('typingText');
 
  function type() {
    if (!tEl) return;
    const phrase = phrases[pi];
    if (!del) {
      tEl.textContent = phrase.slice(0, ci + 1);
      ci++;
      if (ci === phrase.length) { del = true; tDelay = 2400; }
      else tDelay = 80;
    } else {
      tEl.textContent = phrase.slice(0, ci - 1);
      ci--;
      if (ci === 0) { del = false; pi = (pi + 1) % phrases.length; tDelay = 420; }
      else tDelay = 38;
    }
    setTimeout(type, tDelay);
  }
  setTimeout(type, 1400);
 
  /* ── COUNTDOWN TIMER ─────────────────────────────────── */
  function pad(n) { return String(n).padStart(2, '0'); }
 
  function tick() {
    const diff = REG_CLOSE - new Date();
    if (diff <= 0) {
      ['days','hours','mins','secs'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '00';
      });
      return;
    }
    const dEl = document.getElementById('days');
    const hEl = document.getElementById('hours');
    const mEl = document.getElementById('mins');
    const sEl = document.getElementById('secs');
    if (dEl) dEl.textContent = pad(Math.floor(diff / 86400000));
    if (hEl) hEl.textContent = pad(Math.floor((diff % 86400000) / 3600000));
    if (mEl) mEl.textContent = pad(Math.floor((diff % 3600000)  / 60000));
    if (sEl) sEl.textContent = pad(Math.floor((diff % 60000)    / 1000));
  }
  tick();
  setInterval(tick, 1000);
 
  /* ── STATS COUNTER ───────────────────────────────────── */
  function animateStats() {
    document.querySelectorAll('.stat-num').forEach(el => {
      const target = parseInt(el.dataset.target || 0);
      let cur = 0;
      const step = target / (1800 / 16);
      const t = setInterval(() => {
        cur = Math.min(cur + step, target);
        el.textContent = Math.floor(cur);
        if (cur >= target) clearInterval(t);
      }, 16);
    });
  }
 
  /* ── PARALLAX HERO (desktop only) ───────────────────── */
  if (!isMobile()) {
    document.addEventListener('mousemove', e => {
      if (current !== 0) return;
      const x = (e.clientX / window.innerWidth  - .5) * 18;
      const y = (e.clientY / window.innerHeight - .5) * 18;
      const grid = document.querySelector('.hero-grid-bg');
      if (grid) grid.style.transform = `translate(${x*.4}px,${y*.4}px)`;
      const fi = document.querySelector('.float-icons');
      if (fi)   fi.style.transform   = `translate(${x*.28}px,${y*.28}px)`;
    });
 
    /* ── DETAIL / PRIZE CARD MOUSE LIGHT (desktop only) ── */
    document.querySelectorAll('.detail-card, .rules-block').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width  * 100).toFixed(1);
        const y = ((e.clientY - r.top)  / r.height * 100).toFixed(1);
        card.style.background = `radial-gradient(circle at ${x}% ${y}%,rgba(168,85,247,.1),rgba(255,255,255,.03))`;
      });
      card.addEventListener('mouseleave', () => { card.style.background = ''; });
    });
 
    document.querySelectorAll('.prize-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width  * 100).toFixed(1);
        const y = ((e.clientY - r.top)  / r.height * 100).toFixed(1);
        const col = card.classList.contains('gold')   ? '245,158,11'  :
                    card.classList.contains('silver')  ? '148,163,184' : '180,120,60';
        card.style.background = `radial-gradient(circle at ${x}% ${y}%,rgba(${col},.18),rgba(${col},.03))`;
      });
      card.addEventListener('mouseleave', () => { card.style.background = ''; });
    });
  }
 
  /* ── RESIZE FIX ──────────────────────────────────────── */
  window.addEventListener('resize', () => {
    if (!isMobile()) {
      wrapper.scrollTo({ top: current * window.innerHeight, behavior: 'instant' });
    }
  });
 
  /* ── START AUTO-SLIDE (desktop only) ─────────────────── */
  if (!isMobile()) {
    startProgress();
  }
 
  /* ── CONSOLE BRANDING ────────────────────────────────── */
  console.log('%c SEGi Coder\'s Arena 2026 ',
    'background:linear-gradient(135deg,#a855f7,#06b6d4);color:#fff;font-family:monospace;font-size:13px;padding:6px 14px;border-radius:4px;');
  console.log('%c Code, Compete, Conquer. 🚀 ',
    'color:#a855f7;font-family:monospace;font-size:11px;');
 
})();