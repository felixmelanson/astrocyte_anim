'use strict';
/* =====================================================================
   Liddelow et al., 2017, Nature 541:481 — Methods animation
   Presenter controls:  SPACE / → / PgDn = next   ← / PgUp = back
                        R = replay step   H = hide step dots   F = fullscreen
                        L = toggle light/dark   P = play/pause   URL hash #12 jumps to step 12
   ===================================================================== */
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
let SCL = 1, DPR = 1;
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  const w = innerWidth, h = innerHeight;
  SCL = Math.min(w / W, h / H);
  const cw = W * SCL, ch = H * SCL;
  cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
  cv.style.left = ((w - cw) / 2) + 'px'; cv.style.top = ((h - ch) / 2) + 'px';
  cv.width = Math.round(cw * DPR); cv.height = Math.round(ch * DPR);
}
addEventListener('resize', resize); resize();

/* =====================================================================
   STEPS — one entry per presenter "click", tagged with its scene number
   ===================================================================== */
const STEPS = [
  { sc: 1 }, { sc: 1 },
  { sc: 2 }, { sc: 2 }, { sc: 2 }, { sc: 2 },
  { sc: 3 }, { sc: 3 },
  { sc: 4 }, { sc: 4 }, { sc: 4 }, { sc: 4 }, { sc: 4 }, { sc: 4 }, { sc: 4 }, { sc: 4 }, { sc: 4 }, { sc: 4 }, { sc: 4 }, { sc: 4 },
  { sc: 5 }, { sc: 5 },
];
// Section headers (top-left label) were removed from the screen. Kept here for reference:
//   scene 1 — 01 WHY PURIFY          · problem · in tissue, cause is ambiguous
//   scene 2 — 02 IMMUNOPANNING       · isolates · each cell type
//   scene 3 — 03 SERUM-FREE CULTURE  · isolates · a true resting baseline
//   scene 4 — 04 THE RELAY           · isolates · one signal per hop
//   scene 5 — 05 READOUT             · measures · the reactive gene signature

/* =====================================================================
   FRAME / HUD
   ===================================================================== */
let VIG = null, EDG = null;
function edgeShade() {
  if (!EDG) { const E = THEME.bg.map(v => Math.round(v * .57)).join(','); const g = ctx.createLinearGradient(0, 0, 0, 210); g.addColorStop(0, `rgba(${E},.86)`); g.addColorStop(.55, `rgba(${E},.5)`); g.addColorStop(1, `rgba(${E},0)`); const g2 = ctx.createLinearGradient(0, 950, 0, 1080); g2.addColorStop(0, `rgba(${E},0)`); g2.addColorStop(.6, `rgba(${E},.75)`); g2.addColorStop(1, `rgba(${E},.92)`); EDG = [g, g2]; }
  ctx.fillStyle = EDG[0]; ctx.fillRect(0, 0, W, 210); ctx.fillStyle = EDG[1]; ctx.fillRect(0, 950, W, 130);
}
function vignette() {
  if (!VIG) { VIG = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * 1.02); VIG.addColorStop(0, 'rgba(0,0,0,0)'); VIG.addColorStop(1, 'rgba(0,0,0,.55)'); }
  ctx.fillStyle = VIG; ctx.fillRect(0, 0, W, H);
}
let step = 0, prevStep = -1, prevT = 0, stepStart = performance.now(), hud = true, frozen = null;
function go(k) {
  k = clamp(k, 0, STEPS.length - 1) | 0; if (k === step) return;
  const now = performance.now(); prevT = paused ? pauseT : (now - stepStart) / 1000;
  prevStep = step; step = k; stepStart = now; pauseT = 0;
  history.replaceState(null, '', '#' + step);
  onStepChange();
}
addEventListener('keydown', e => {
  if (['ArrowRight', ' ', 'PageDown', 'Enter'].includes(e.key)) { e.preventDefault(); go(step + 1); }
  else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); go(step - 1); }
  else if (e.key === 'r' || e.key === 'R') { stepStart = performance.now(); prevStep = step; pauseT = 0; }
  else if (e.key === 'h' || e.key === 'H') hud = !hud;
  else if (e.key === 'f' || e.key === 'F') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }
  else if (e.key === 'l' || e.key === 'L') { setThemeMode(THEME.lightFrom >= 0 ? 'dark' : 'light'); onThemeChange(); }
  else if (e.key === 'p' || e.key === 'P') { setPaused(!paused); }
});
let idleT; addEventListener('mousemove', () => { document.body.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(() => document.body.classList.add('idle'), 1800); });

// light theme: the canvas is drawn exactly as usual and inverted by CSS (bg → white, text → near-black)
const FLASH = document.getElementById('flash');
let THEME_ON = null, FLASH_A = -1;
function applyTheme(k, t) {
  const lf = THEME.lightFrom; if (lf < 0) { if (THEME_ON !== false) { THEME_ON = false; cv.style.filter = 'none'; document.body.style.background = '#000'; } return false; }
  const viaHandoff = k === lf && lf === 2 && handoffPlays();
  const on = k > lf || (k === lf && (!viaHandoff || t >= TR - .28));
  const fl = viaHandoff ? .85 * bump(t, TR - .62, TR - .3, TR - .24, TR + .35) : 0;
  if (on !== THEME_ON) { THEME_ON = on; cv.style.filter = on ? 'invert(1) hue-rotate(180deg)' : 'none'; document.body.style.background = on ? '#fff' : '#000'; }
  if (Math.abs(fl - FLASH_A) > .002) { FLASH_A = fl; FLASH.style.opacity = fl.toFixed(3); }
  return on;
}
function render(k, t, gt) {
  ctx.setTransform(SCL * DPR, 0, 0, SCL * DPR, 0, 0);
  const light = applyTheme(k, t);
  ctx.fillStyle = light ? '#000' : rgb(COL.bg); ctx.fillRect(0, 0, W, H);
  const sc = STEPS[k].sc;
  const firstOfScene = k === 0 || STEPS[k - 1].sc !== sc;
  const si = k - STEPS.findIndex(s => s.sc === sc);
  ctx.save();
  if (sc === 1) scene1(si, t, gt);
  else if (sc === 2) scene2(si, t, gt);
  else if (sc === 3) scene3(si, t, gt);
  else if (sc === 4) scene4(k, t, gt);
  else scene5(si, t, gt);
  ctx.restore();
  // scene fade from black when entering a new scene
  const enteredScene = prevStep < 0 || STEPS[prevStep].sc !== sc;
  const seamless = sc === 2 && si === 0 && handoffPlays() && prevStep >= 0;   // tissue hand-off replaces the fade
  if (enteredScene && !seamless) { const f = 1 - seg(t, 0, .8); if (f > 0) { ctx.fillStyle = `rgba(0,0,0,${f})`; ctx.fillRect(0, 0, W, H); } }
  // step dots (H toggles). The old top-left section header was drawn here:
  //   txt(num, 64, 58, …coral…); txt(name, 98, 58, …); txt(sub, 64, 82, …italic…)  — see section list above
  if (hud) {
    for (let i = 0; i < STEPS.length; i++) {
      const x = W - 64 - (STEPS.length - 1 - i) * 13, on = i === k;
      ctx.fillStyle = on ? 'rgba(236,242,246,.9)' : i < k ? 'rgba(236,242,246,.35)' : 'rgba(236,242,246,.13)';
      ctx.beginPath(); ctx.arc(x, 1046, on ? 3.4 : 2.4, 0, TAU); ctx.fill();
      if (i > 0 && STEPS[i].sc !== STEPS[i - 1].sc) { ctx.fillStyle = 'rgba(236,242,246,.1)'; ctx.fillRect(x - 7.5, 1040, 1, 12); }
    }
  }
  txt('Adapted from Liddelow et al., 2017, Nature 541:481 (Methods; Figs 1a, 4c; Extended Data Figs 2, 5, 7, 9)', 64, 1052, { size: 15, col: [112, 126, 138] });
}

/* ---------------- playback: play / pause / scrub ----------------
   Every scene function is a pure(ish) function of (step index, local time t,
   global time gt), so freezing t and re-rendering is enough to scrub. ---- */
let paused = false, pauseT = 0;
function setPaused(p) {
  p = !!p; if (p === paused) return;
  if (p) pauseT = (performance.now() - stepStart) / 1000;
  else stepStart = performance.now() - pauseT * 1000;
  paused = p;
  onPlayStateChange();
}
function scrubTo(t) {
  pauseT = Math.max(0, t);
  if (!paused) setPaused(true); else onPlayStateChange();
}
function onStepChange() {}   // overridden by controls.js once the UI exists
function onPlayStateChange() {}
function onThemeChange() {}

function frame(now) {
  if (!frozen) {
    if (paused) render(step, pauseT, pauseT + 50);
    else render(step, (now - stepStart) / 1000, now / 1000);
  }
  requestAnimationFrame(frame);
}
(function init() {
  const h = parseInt(location.hash.slice(1)); if (!isNaN(h)) { step = clamp(h, 0, STEPS.length - 1) | 0; }
  requestAnimationFrame(frame);
})();
// test hook: render step k at time t (deterministic)
window.__seek = (k, t, gt, prev, pt) => { frozen = true; step = k; prevStep = prev ?? k; prevT = pt ?? 99; render(k, t, gt ?? (t + 50)); };
