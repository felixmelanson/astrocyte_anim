'use strict';
/* =====================================================================
   Liddelow et al., 2017, Nature 541:481 — Methods animation
   Presenter controls:  SPACE / → / PgDn = next   ← / PgUp = back
                        R = replay step   H = hide step dots   F = fullscreen
                        L = toggle light/dark   P = play/pause   URL hash #12 jumps to step 12
   ===================================================================== */
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const RENDER_MODE = new URLSearchParams(location.search).has('render');   // tools/*.mjs: no HUD, exact 1920×1080
let SCL = 1, DPR = 1;
function resize() {
  DPR = RENDER_MODE ? 1 : Math.min(2, window.devicePixelRatio || 1);
  const w = innerWidth, h = innerHeight;
  SCL = RENDER_MODE ? 1 : Math.min(w / W, h / H);
  const cw = W * SCL, ch = H * SCL;
  cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
  cv.style.left = ((w - cw) / 2) + 'px'; cv.style.top = ((h - ch) / 2) + 'px';
  cv.width = Math.round(cw * DPR); cv.height = Math.round(ch * DPR);
}
addEventListener('resize', resize); resize();

/* =====================================================================
   STEPS — one entry per presenter "click".
   sc = scene (drives fades / dot separators), k = index inside that scene's function.
   Copy (cap / capEnd / sub) and the footer citation (cite) come from SCRIPT.md.
   ===================================================================== */
const STEPS = [
  { sc: 1, k: 0, slug: 'tissue', cap: 'In tissue, every cell talks to every other cell.',
    cite: 'Concept adapted from Liddelow et al., 2017, Nature 541:481' },
  { sc: 1, k: 1, slug: 'who-caused-it', cap: 'An astrocyte changes. Who caused it?',
    cite: 'Concept adapted from Liddelow et al., 2017; Zamanian et al., 2012' },
  { sc: 2, k: 0, slug: 'immunopanning', cap: 'Purify each cell type by immunopanning', sub: 'P5 cortex · papain · sequential antibody plates',
    cite: 'Adapted from Liddelow et al., 2017 (Methods; Extended Data Fig. 2a)' },
  { sc: 2, k: 1, slug: 'three-cultures', cap: 'Three pure cultures', sub: '>99% pure by cell-type qPCR',
    cite: 'Adapted from Liddelow et al., 2017 (Methods; Extended Data Fig. 2b)' },
  { sc: 3, k: 0, slug: 'serum-free', cap: 'Serum-free: a true resting baseline', sub: 'serum components alone push astrocytes toward reactivity',
    cite: 'Adapted from Liddelow et al., 2017 (Methods; Extended Data Fig. 2c)' },
  { sc: 5, k: 0, slug: 'readout-primer', cap: 'One row of genes per condition', sub: 'pan-reactive · A1-specific · A2-specific',
    cite: 'Adapted from Liddelow et al., 2017 (Fig. 1a); gene sets from Zamanian et al., 2012, J Neurosci 32:6391' },
  { sc: 4, k: 0, slug: 'relay-intro', cap: 'Move the medium, one hop at a time.',
    cite: 'Adapted from Liddelow et al., 2017' },
  { sc: 4, k: 1, slug: 'lps-direct', cap: 'Control: LPS straight onto astrocytes', capEnd: 'No TLR4. No response.',
    cite: 'Adapted from Liddelow et al., 2017 (Extended Data Fig. 2c)' },
  { sc: 4, k: 2, slug: 'microglia-medium', cap: 'Activated-microglia medium → A1', sub: 'resting-microglia medium: no change',
    cite: 'Adapted from Liddelow et al., 2017 (Fig. 1a; Extended Data Fig. 3b, c)' },
  { sc: 4, k: 3, slug: 'cocktail', cap: 'Sufficient? IL-1α + TNF + C1q alone', sub: '3 · 30 · 400 ng/ml · 24 h',
    cite: 'Adapted from Liddelow et al., 2017 (Fig. 1a–c; Extended Data Fig. 3d)' },
  { sc: 4, k: 4, slug: 'neutralize', cap: 'Necessary? Neutralize all three.',
    cite: 'Adapted from Liddelow et al., 2017 (Fig. 1a; Extended Data Fig. 3e)' },
  { sc: 4, k: 5, slug: 'acm-to-rgcs', cap: 'A1 astrocyte medium → purified RGCs',
    cite: 'Adapted from Liddelow et al., 2017 (Methods; Fig. 4a)' },
  { sc: 4, k: 6, slug: 'dose', cap: 'Dose-dependent RGC death within 24 h',
    cite: 'Adapted from Liddelow et al., 2017 (Fig. 4a, c; Extended Data Fig. 7a, b)' },
  { sc: 4, k: 7, slug: 'rgc-controls', cap: 'Controls: microglia medium or cytokines alone', capEnd: 'The killer comes from the astrocytes.',
    cite: 'Adapted from Liddelow et al., 2017 (Extended Data Fig. 7d)' },
  { sc: 5, k: 1, slug: 'heatmap', cap: 'Every condition, one row',
    cite: 'Adapted from Liddelow et al., 2017 (Fig. 1a)' },
];
const SCENES = [null, (...a) => scene1(...a), (...a) => scene2(...a), (...a) => scene3(...a), (...a) => scene4(...a), (...a) => scene5(...a)];

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
let step = 0, prevStep = -1, prevT = 0, stepStart = performance.now(), hud = !RENDER_MODE, frozen = null;
function go(k) {
  k = clamp(k, 0, STEPS.length - 1) | 0; if (k === step) return;
  const now = performance.now(); prevT = paused ? pauseT : (now - stepStart) / 1000;
  prevStep = step; step = k; stepStart = now; pauseT = 0;
  if (paused) pauseGT = now / 1000;
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
// the previous step's caption fades out when stepping forward inside a scene
function carryCaption(k, t) {
  if (prevStep !== k - 1 || prevStep < 0 || STEPS[prevStep].sc !== STEPS[k].sc) return;
  const P = STEPS[prevStep], S = STEPS[k], a = 1 - seg(t, 0, .45); if (a <= 0) return;
  const pc = P.capEnd || P.cap;
  if (pc && pc !== S.cap) caption(pc, a);
  if (P.sub && !P.capEnd && P.sub !== S.sub) subcap(P.sub, a);
}
function render(k, t, gt) {
  ctx.setTransform(SCL * DPR, 0, 0, SCL * DPR, 0, 0);
  const light = applyTheme(k, t);
  ctx.fillStyle = light ? '#000' : rgb(COL.bg); ctx.fillRect(0, 0, W, H);
  const S = STEPS[k], sc = S.sc;
  ctx.save(); SCENES[sc](S.k, t, gt, S); ctx.restore();
  carryCaption(k, t);
  // scene fade (from the page colour) when entering a new scene
  const enteredScene = prevStep < 0 || STEPS[prevStep].sc !== sc;
  const seamless = sc === 2 && S.k === 0 && handoffPlays() && prevStep >= 0;   // tissue hand-off replaces the fade
  if (enteredScene && !seamless) { const f = 1 - seg(t, 0, .8); if (f > 0) { ctx.fillStyle = `rgba(0,0,0,${f})`; ctx.fillRect(0, 0, W, H); } }
  // step dots (H toggles)
  if (hud) {
    for (let i = 0; i < STEPS.length; i++) {
      const x = W - 64 - (STEPS.length - 1 - i) * 13, on = i === k;
      ctx.fillStyle = on ? 'rgba(236,242,246,.9)' : i < k ? 'rgba(236,242,246,.35)' : 'rgba(236,242,246,.13)';
      ctx.beginPath(); ctx.arc(x, 1046, on ? 3.4 : 2.4, 0, TAU); ctx.fill();
      if (i > 0 && STEPS[i].sc !== STEPS[i - 1].sc) { ctx.fillStyle = 'rgba(236,242,246,.1)'; ctx.fillRect(x - 7.5, 1040, 1, 12); }
    }
  }
  txt(S.cite || '', 64, 1052, { size: 15, col: [112, 126, 138] });   // per-step citation
}

/* ---------------- playback: play / pause / scrub ----------------
   Every scene function is a pure(ish) function of (step index, local time t,
   global time gt), so freezing t and re-rendering is enough to scrub. ---- */
let paused = false, pauseT = 0, pauseGT = 0;
function setPaused(p) {
  p = !!p; if (p === paused) return;
  const now = performance.now();
  if (p) { pauseT = (now - stepStart) / 1000; pauseGT = now / 1000; }
  else stepStart = now - pauseT * 1000;
  paused = p;
  onPlayStateChange();
}
function scrubTo(t) {
  if (!paused) setPaused(true);
  pauseGT += Math.max(0, t) - pauseT;          // idle drift follows the scrub head
  pauseT = Math.max(0, t);
  onPlayStateChange();
}
function onStepChange() {}   // overridden by controls.js once the UI exists
function onPlayStateChange() {}
function onThemeChange() {}

function frame(now) {
  if (!frozen) {
    if (paused) render(step, pauseT, pauseGT);
    else render(step, (now - stepStart) / 1000, now / 1000);
  }
  requestAnimationFrame(frame);
}
(function init() {
  if (RENDER_MODE) document.body.classList.add('render');
  const h = parseInt(location.hash.slice(1)); if (!isNaN(h)) { step = clamp(h, 0, STEPS.length - 1) | 0; }
  requestAnimationFrame(frame);
})();

/* ---------------- deterministic hooks for tools/*.mjs ----------------
   gtBase(k): global (idle-drift) clock at the start of step k when every step
   before it played for exactly its `dur`, so consecutive clips line up. */
const gtBase = k => 50 + STEPS.slice(0, k).reduce((s, x) => s + (x.dur || 0), 0);
window.__seek = (k, t, gt, prev, pt) => { frozen = true; step = k; prevStep = prev ?? k; prevT = pt ?? 99; render(k, t, gt ?? (gtBase(k) + t)); };
window.__anim = {
  steps: () => STEPS.map((s, i) => ({ i, sc: s.sc, slug: s.slug, dur: s.dur, busy: s.busy, cap: s.cap })),
  gtBase, setTheme: m => { setThemeMode(m); onThemeChange(); },
};
