'use strict';
/* =====================================================================
   VIEWER CONTROLS — play/pause, scrub, step nav, theme toggle.
   Wires up the HTML control bar to the playback state in app.js.
   Every scene render() call is a function of (step, t, gt), so scrubbing
   just means freezing t and re-rendering — no separate "seek" logic needed.
   ===================================================================== */
(function () {
  const SCRUB_MAX = 20; // seconds; generous ceiling covering the longest per-step sequences

  const el = {
    prev: document.getElementById('ctlPrev'),
    play: document.getElementById('ctlPlay'),
    next: document.getElementById('ctlNext'),
    replay: document.getElementById('ctlReplay'),
    scrub: document.getElementById('ctlScrub'),
    stepLabel: document.getElementById('stepLabel'),
    theme: document.getElementById('ctlTheme'),
    fullscreen: document.getElementById('ctlFullscreen'),
  };

  el.scrub.max = SCRUB_MAX;
  el.scrub.step = 0.02;

  function refreshStepLabel() {
    el.stepLabel.textContent = `${step + 1} / ${STEPS.length}`;
  }
  function refreshPlayIcon() {
    el.play.querySelector('.icon-play').style.display = paused ? '' : 'none';
    el.play.querySelector('.icon-pause').style.display = paused ? 'none' : '';
    el.play.setAttribute('aria-label', paused ? 'Play' : 'Pause');
  }
  function refreshThemeIcon() {
    const light = THEME.lightFrom >= 0;
    el.theme.querySelector('.icon-sun').style.display = light ? '' : 'none';
    el.theme.querySelector('.icon-moon').style.display = light ? 'none' : '';
    el.theme.setAttribute('aria-label', light ? 'Switch to dark' : 'Switch to light');
  }

  // app.js calls these hooks on state changes so the UI stays in sync
  // whether it was a button, a key, or a URL hash jump that caused them.
  onStepChange = () => { refreshStepLabel(); el.scrub.value = 0; };
  onPlayStateChange = refreshPlayIcon;
  onThemeChange = refreshThemeIcon;

  el.prev.addEventListener('click', () => go(step - 1));
  el.next.addEventListener('click', () => go(step + 1));
  el.replay.addEventListener('click', () => {
    stepStart = performance.now(); prevStep = step; pauseT = 0; el.scrub.value = 0;
    if (paused) render(step, 0, 50);
  });
  el.play.addEventListener('click', () => setPaused(!paused));
  el.theme.addEventListener('click', () => { setThemeMode(THEME.lightFrom >= 0 ? 'dark' : 'light'); refreshThemeIcon(); });
  el.fullscreen.addEventListener('click', () => { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); });

  el.scrub.addEventListener('input', () => scrubTo(parseFloat(el.scrub.value)));

  // keep the scrub head following playback while not being dragged
  let dragging = false;
  el.scrub.addEventListener('pointerdown', () => dragging = true);
  addEventListener('pointerup', () => dragging = false);
  setInterval(() => {
    if (dragging) return;
    const t = paused ? pauseT : (performance.now() - stepStart) / 1000;
    el.scrub.value = Math.min(SCRUB_MAX, t);
  }, 80);

  // click a HUD step-dot on the canvas to jump straight to it; click elsewhere advances
  cv.addEventListener('click', e => {
    const rect = cv.getBoundingClientRect();
    const lx = (e.clientX - rect.left) * (W / rect.width);
    const ly = (e.clientY - rect.top) * (H / rect.height);
    if (hud) {
      for (let i = 0; i < STEPS.length; i++) {
        const x = W - 64 - (STEPS.length - 1 - i) * 13;
        if (Math.hypot(lx - x, ly - 1046) < 10) { go(i); return; }
      }
    }
    go(step + 1);
  });

  refreshStepLabel(); refreshPlayIcon(); refreshThemeIcon();
})();
