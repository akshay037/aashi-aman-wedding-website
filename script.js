'use strict';

/* ══════════════════════════════════════════════════════
   PROGRESSIVE BG IMAGE LOADING
   1. On page load, each .section-bg already has the LQIP
      (tiny blurred thumbnail) set as its background-image
      via the data-lqip attribute (PHP-generated).
   2. An IntersectionObserver starts loading the full image
      200 px before the section enters the viewport.
   3. When the full image finishes loading, swap it in and
      remove the blur so it fades in smoothly.
══════════════════════════════════════════════════════ */
(function () {
  const bgEls = document.querySelectorAll('.section-bg[data-bg]');
  if (!bgEls.length) return;

  /* set LQIP immediately so something warm shows even before IO fires */
  bgEls.forEach(el => {
    const lqip = el.dataset.lqip;
    if (lqip) el.style.backgroundImage = `url("${lqip}")`;
  });

  const io = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el    = entry.target;
      const full  = el.dataset.bg;
      if (!full) return;

      const img = new Image();
      img.onload = () => {
        el.style.backgroundImage = `url("${full}")`;
        el.classList.add('is-loaded');
      };
      img.onerror = () => el.classList.add('is-loaded'); /* reveal even on error */
      img.src = full;

      observer.unobserve(el);
    });
  }, { rootMargin: '200px 0px' }); /* start loading 200 px before entering view */

  bgEls.forEach(el => io.observe(el));
}());

/* ── Nav: frosted-glass on scroll ── */
const nav = document.querySelector('.site-nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

/* ── "Check Events" — scroll to ceremony (animated) section first ── */
document.querySelector('.hero__cta')?.addEventListener('click', e => {
  e.preventDefault();
  document.getElementById('ceremony')?.scrollIntoView({ behavior: 'smooth' });
});

/* ── "View Events" — scroll to events section ── */
document.querySelector('.ceremony__cta')?.addEventListener('click', e => {
  e.preventDefault();
  document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
});

/* ── Nudge the hero CTA after 5 s if the user hasn't scrolled yet ── */
setTimeout(() => {
  const cta = document.getElementById('heroCta');
  if (!cta) return;
  cta.classList.add('hero__cta--nudge');
  /* remove class after animation so it can re-trigger if needed */
  cta.addEventListener('animationend', () => {
    cta.classList.remove('hero__cta--nudge');
  }, { once: true });
}, 5000);

/* ──────────────────────────────────────────────────────
   Hero reveal
   Called once: either after the envelope closes, or
   immediately if the intro element isn't on the page.
─────────────────────────────────────────────────────── */
function revealHero() {
  const inner = document.querySelector('.hero__inner');
  if (!inner) return;

  if (window.gsap) {
    /* fade + lift the whole block */
    gsap.to(inner, {
      opacity: 1,
      duration: 0.9,
      ease: 'power2.out',
    });
    /* stagger each child element for an elegant cascade */
    gsap.from(Array.from(inner.children), {
      opacity: 0,
      y: 20,
      duration: 0.75,
      stagger: 0.12,
      ease: 'power2.out',
      delay: 0.15,
    });
  } else {
    /* CSS fallback if GSAP didn't load */
    inner.style.transition = 'opacity 1s ease';
    inner.style.opacity = '1';
  }
}

/* ──────────────────────────────────────────────────────
   Ceremony confetti
─────────────────────────────────────────────────────── */
function playCeremonyConfetti() {
  if (typeof window.confetti !== 'function') return;

  const duration = 1800;
  const end = Date.now() + duration;
  const colors = ['#c99a2e', '#d9b84f', '#f8efd2', '#ffffff', '#1d1a16', '#38332d'];
  const paperShapes = [];

  if (typeof confetti.shapeFromPath === 'function') {
    paperShapes.push(
      confetti.shapeFromPath({ path: 'M0 0 H14 V4 H0 Z' }),
      confetti.shapeFromPath({ path: 'M0 0 H9 V3 H0 Z' }),
      confetti.shapeFromPath({ path: 'M0 0 H5 V5 H0 Z' }),
    );
  }

  const shapes = paperShapes.length ? paperShapes : ['square', 'circle'];
  const defaults = {
    colors,
    shapes,
    disableForReducedMotion: true,
    scalar: 0.58,
    ticks: 230,
    gravity: 0.34,
    drift: 0.1,
    decay: 0.976,
    flat: false,
    zIndex: 9999,
  };

  let frame = 0;
  const rain = setInterval(() => {
    frame++;
    const timeLeft = end - Date.now();
    if (timeLeft <= 0) {
      clearInterval(rain);
      return;
    }

    const progress = 1 - (timeLeft / duration);
    const easeInOut = Math.sin(progress * Math.PI);
    const intensity = 0.25 + easeInOut * 0.75;

    confetti({
      ...defaults,
      particleCount: Math.round(3 + 7 * intensity),
      spread: 28 + 10 * intensity,
      startVelocity: 5 + 4 * intensity,
      scalar: 0.42 + Math.random() * 0.14,
      drift: (Math.random() - 0.5) * 0.34,
      angle: 270,
      origin: { x: Math.random(), y: -0.04 },
    });

    if (frame % 3 === 0) {
      confetti({
        ...defaults,
        particleCount: Math.round(2 + 3 * intensity),
        spread: 22,
        startVelocity: 4 + 2 * intensity,
        scalar: 0.40 + Math.random() * 0.12,
        drift: (Math.random() - 0.5) * 0.3,
        angle: 270,
        origin: { x: 0.18 + Math.random() * 0.64, y: -0.05 },
      });
    }
  }, 360);

  window.setTimeout(() => {
    if (typeof confetti.reset === 'function') confetti.reset();
  }, duration + 650);
}

/* ──────────────────────────────────────────────────────
   Ceremony entrance
─────────────────────────────────────────────────────── */
function initCeremonyScene() {
  const ceremony = document.getElementById('ceremony');
  const groom = document.querySelector('.ceremony__person--groom');
  const bride = document.querySelector('.ceremony__person--bride');
  const glow = document.querySelector('.ceremony__glow');
  const actions = document.querySelector('.ceremony__actions');
  if (!ceremony || !groom || !bride || !glow || !actions) return;

  if (!window.gsap || !window.ScrollTrigger) {
    groom.style.transform = 'translate3d(-36vw, 26px, 0)';
    bride.style.transform = 'translate3d(36vw, 26px, 0)';
    glow.style.transform = 'translate(-50%, 16px) scale(0.86)';
    actions.style.opacity = '0';
    actions.style.transform = 'translate3d(-50%, 12px, 0)';

    const showCeremony = () => {
      groom.style.transition = 'opacity 1s ease, transform 1.45s cubic-bezier(0.16, 1, 0.3, 1)';
      bride.style.transition = 'opacity 1s ease, transform 1.45s cubic-bezier(0.16, 1, 0.3, 1)';
      glow.style.transition = 'opacity 1s ease, transform 1.2s ease';
      actions.style.transition = 'opacity 0.9s ease 1.05s, transform 0.9s ease 1.05s';
      groom.style.opacity = '1';
      bride.style.opacity = '1';
      glow.style.opacity = '1';
      actions.style.opacity = '1';
      groom.style.transform = 'translate3d(0, 0, 0)';
      bride.style.transform = 'translate3d(0, 0, 0)';
      glow.style.transform = 'translate(-50%, 0) scale(1)';
      actions.style.transform = 'translate3d(-50%, 0, 0)';
      window.setTimeout(playCeremonyConfetti, 900);
    };

    if (!('IntersectionObserver' in window)) {
      showCeremony();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      showCeremony();
      observer.disconnect();
    }, { threshold: 0.38 });

    observer.observe(ceremony);
    return;
  }

  const MAX_REPLAYS = 4;
  let replayCount = 0;
  let activeTl = null;
  let inView = false;

  function setCeremonyFinal(isMobile) {
    if (activeTl) activeTl.kill();
    gsap.set(glow, { opacity: 1, y: 0, scale: 1 });
    gsap.set([groom, bride], {
      xPercent: 0,
      y: 0,
      rotation: 0,
      opacity: isMobile ? 0.98 : 1,
    });
    gsap.set(actions, { opacity: 1, xPercent: -50, y: 0 });
  }

  function playCeremonyTimeline(isMobile) {
    if (replayCount >= MAX_REPLAYS) {
      setCeremonyFinal(isMobile);
      return;
    }

    replayCount++;
    if (activeTl) activeTl.kill();

    activeTl = gsap.timeline();

    if (isMobile) {
      activeTl
        .set(actions, { opacity: 0, xPercent: -50, y: 12 })
        .fromTo(glow,
          { opacity: 0, y: 18, scale: 0.84 },
          { opacity: 1, y: 0, scale: 1, duration: 1.55, ease: 'power2.out' })
        .fromTo(groom,
          { xPercent: -58, y: 22, rotation: -1.8, opacity: 0 },
          { xPercent: 0, y: 0, rotation: 0, opacity: 0.98, duration: 1.85, ease: 'power3.out' },
          '-=1.05')
        .fromTo(bride,
          { xPercent: 58, y: 22, rotation: 1.8, opacity: 0 },
          { xPercent: 0, y: 0, rotation: 0, opacity: 0.98, duration: 1.85, ease: 'power3.out' },
          '<')
        .call(playCeremonyConfetti, null, '-=0.15')
        .to(actions,
          { opacity: 1, xPercent: -50, y: 0, duration: 0.95, ease: 'power2.out' },
          '-=0.55');
      return;
    }

    activeTl
      .set(actions, { opacity: 0, xPercent: -50, y: 12 })
      .fromTo(glow,
        { opacity: 0, y: 28, scale: 0.82 },
        { opacity: 1, y: 0, scale: 1, duration: 1.6, ease: 'power2.out' })
      .fromTo(groom,
        { xPercent: -64, y: 26, rotation: -2.1, opacity: 0 },
        { xPercent: 0, y: 0, rotation: 0, opacity: 1, duration: 2.05, ease: 'power3.out' },
        '-=1.12')
      .fromTo(bride,
        { xPercent: 64, y: 26, rotation: 2.1, opacity: 0 },
        { xPercent: 0, y: 0, rotation: 0, opacity: 1, duration: 2.05, ease: 'power3.out' },
        '<')
      .call(playCeremonyConfetti, null, '-=0.18')
      .to(actions,
        { opacity: 1, xPercent: -50, y: 0, duration: 1, ease: 'power2.out' },
        '-=0.55')
      .to([groom, bride], {
        y: -8,
        duration: 2.8,
        yoyo: true,
        repeat: 1,
        ease: 'sine.inOut',
      }, '-=0.45');
  }

  function handleCeremonyVisit() {
    playCeremonyTimeline(window.matchMedia('(max-width: 520px)').matches);
  }

  function checkCeremonyVisibility() {
    const rect = ceremony.getBoundingClientRect();
    const visible = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
    const ratio = Math.max(0, visible) / Math.min(window.innerHeight, rect.height || window.innerHeight);

    if (ratio >= 0.55 && !inView) {
      inView = true;
      handleCeremonyVisit();
      return;
    }

    if (ratio <= 0.12) {
      inView = false;
    }
  }

  let ticking = false;
  function requestVisibilityCheck() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      checkCeremonyVisibility();
    });
  }

  window.addEventListener('scroll', requestVisibilityCheck, { passive: true });
  window.addEventListener('resize', requestVisibilityCheck);
  window.setTimeout(checkCeremonyVisibility, 0);
}


/* ──────────────────────────────────────────────────────
   Envelope intro
─────────────────────────────────────────────────────── */
const intro   = document.getElementById('intro');
const envEl   = document.getElementById('env');
const skipBtn = document.getElementById('envSkip');

if (!intro || !envEl) {
  /* No intro on the page — reveal hero straight away */
  revealHero();
} else {

  let opened = false;

  /* ── Dismiss intro without animation (skip / fallback) ── */
  function dismissIntro() {
    if (intro) intro.style.display = 'none';
    revealHero();
  }

  /* ── Full envelope opening animation ── */
  function openEnvelope() {
    if (opened) return;
    opened = true;

    /* play wedding song — triggered inside user gesture so autoplay is allowed */
    const song = new Audio('song/wedding_song_after_envelope_clicked.mp3');
    song.volume = 0.75;
    song.loop   = true;
    song.play().catch(() => { /* silently ignore if browser still blocks */ });

    /* stop idle animations immediately */
    envEl.style.animation = 'none';
    const seal = document.getElementById('envSeal');
    if (seal) seal.style.animation = 'none';

    /* ── GSAP unavailable: skip straight to hero ── */
    if (!window.gsap) {
      dismissIntro();
      return;
    }

    const tl = gsap.timeline({ onComplete: dismissIntro });

    tl

      /* 1. Tap hint and skip button fade out */
      .to(['#envHint', '#envSkip'], {
        opacity: 0,
        y: 6,
        duration: 0.3,
        ease: 'power1.in',
      })

      /* 2. Wax seal "breaks" — scales to zero with a spring pop */
      .to('#envSeal', {
        scale: 0,
        opacity: 0,
        duration: 0.45,
        ease: 'back.in(3.5)',
      }, '-=0.1')

      /*
       * 3. Flap folds fully backward — rotateX(-180°) with transform-origin
       *    at the top edge, so the tip arcs away from the viewer exactly like
       *    a physical envelope flap.  power2.inOut gives a natural slow-fast-slow
       *    hinge feel.
       *
       *    At the midpoint (-90°, edge-on) the flap is a hairline — imperceptible.
       *    We use that moment to drop its z-index from 3 → 0 via a .call(), which
       *    tucks it silently behind the pocket layer (z:1). The second half of the
       *    rotation (-90° → -180°) continues invisibly behind the envelope body,
       *    exactly like a real flap folding flat against the back of an envelope.
       *    No opacity fade — the flap is not "disappearing", it is going behind.
       */
      .to('#envFlap', {
        rotateX: -180,
        transformPerspective: 450,
        duration: 1.0,
        ease: 'power2.inOut',
      }, '-=0.15')
      /* fires at the midpoint of the flap tween (0.5 s after its start = −90°) */
      .call(() => gsap.set('#envFlap', { zIndex: 0 }), null, '<+=0.5')

      /*
       * 4. Card slides up a natural amount — just enough to feel like a letter
       *    being gently lifted from an envelope, not yanked out.
       *    '-=0.50' starts the card at the same moment the flap reaches -90°
       *    and tucks behind, so the letter rises from the newly open pocket.
       */
      .to('.env__card', {
        y: '-28%',
        duration: 0.8,
        ease: 'power2.out',
      }, '-=0.50')

      /* 5. Brief pause so the open envelope is admired */
      .to({}, { duration: 0.55 })

      /*
       * 6. The whole intro screen zooms toward the viewer and fades.
       *    Because #intro background matches the page background (#faf7f2),
       *    the transition is seamless — no flash of white.
       */
      .to('#intro', {
        scale: 1.45,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.in',
      });
  }

  /* ── Event listeners ── */
  envEl.addEventListener('click', openEnvelope);
  envEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openEnvelope();
    }
  });

  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opened = true; /* prevent double-fire */
      dismissIntro();
    });
  }
}

/* ──────────────────────────────────────────────────────
   Events section — ScrollTrigger reveal animations
   Registered on window 'load' so ScrollTrigger is
   guaranteed to be available (GSAP loads with async).
─────────────────────────────────────────────────────── */
window.addEventListener('load', () => {
  if (!window.gsap || !window.ScrollTrigger) {
    initCeremonyScene();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  initCeremonyScene();

  const evSection = document.getElementById('events');
  if (!evSection) return;

  const st = (start) => ({
    trigger: evSection,
    start: start || 'top 80%',
    toggleActions: 'play none none none',
  });

  /* 1. eyebrow + top rule */
  gsap.from(['#events .ev-eyebrow', '#events .ev-rule:first-of-type'], {
    scrollTrigger: st('top 85%'),
    opacity: 0, y: 12,
    duration: 0.65, stagger: 0.15,
    ease: 'power2.out',
  });

  /* 2. day headers — slide up */
  gsap.from('#events .ev-day-hdr', {
    scrollTrigger: st('top 80%'),
    opacity: 0, y: 16,
    duration: 0.6, stagger: 0.2,
    delay: 0.2,
    ease: 'power2.out',
  });

  /* 3. event cards — staggered fade + lift */
  gsap.from('#events .ev-card', {
    scrollTrigger: st('top 78%'),
    opacity: 0, y: 20,
    duration: 0.5, stagger: 0.1,
    delay: 0.35,
    ease: 'power2.out',
  });

  /* 4. gap rule — grow from centre */
  gsap.from('#events .ev-rule--gap', {
    scrollTrigger: st('top 78%'),
    opacity: 0, scaleX: 0,
    duration: 0.55,
    delay: 0.3,
    ease: 'power2.out',
    transformOrigin: 'center',
  });
}, { once: true });
