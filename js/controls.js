'use strict';
/* =====================================================================
   VIEWER CONTROLS — play/pause, scrub, step nav, theme toggle.
   Wires up the HTML control bar to the playback state in app.js.
   Every scene render() call is a function of (step, t, gt), so scrubbing
   just means freezing t and re-rendering — no separate "seek" logic needed.
   ===================================================================== */
(function () {
  const scrubMax = () => (STEPS[step].dur || 30) + 1;   // seconds; each step's settle time + a little

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

  el.scrub.max = scrubMax();
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
    const light = THEME.light;
    el.theme.querySelector('.icon-sun').style.display = light ? '' : 'none';
    el.theme.querySelector('.icon-moon').style.display = light ? 'none' : '';
    el.theme.setAttribute('aria-label', light ? 'Switch to dark' : 'Switch to light');
  }

  // app.js calls these hooks on state changes so the UI stays in sync
  // whether it was a button, a key, or a URL hash jump that caused them.
  onStepChange = () => { refreshStepLabel(); el.scrub.max = scrubMax(); el.scrub.value = 0; };
  onPlayStateChange = refreshPlayIcon;
  onThemeChange = refreshThemeIcon;

  el.prev.addEventListener('click', () => go(step - 1));
  el.next.addEventListener('click', () => go(step + 1));
  el.replay.addEventListener('click', () => {
    stepStart = performance.now(); prevStep = step; pauseT = 0; el.scrub.value = 0;
    if (paused) { pauseGT = performance.now() / 1000; render(step, 0, pauseGT); }
  });
  el.play.addEventListener('click', () => setPaused(!paused));
  el.theme.addEventListener('click', () => { setThemeMode(THEME.light ? 'dark' : 'light'); THEME.light = THEME.mode === 'light'; refreshThemeIcon(); });
  el.fullscreen.addEventListener('click', () => { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); });

  el.scrub.addEventListener('input', () => scrubTo(parseFloat(el.scrub.value)));

  // keep the scrub head following playback while not being dragged
  let dragging = false;
  el.scrub.addEventListener('pointerdown', () => dragging = true);
  addEventListener('pointerup', () => dragging = false);
  setInterval(() => {
    if (dragging) return;
    const t = paused ? pauseT : (performance.now() - stepStart) / 1000;
    el.scrub.value = Math.min(scrubMax(), t);
  }, 80);

  // click on the canvas advances
  cv.addEventListener('click', () => go(step + 1));

  refreshStepLabel(); refreshPlayIcon(); refreshThemeIcon();
})();
