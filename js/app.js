'use strict';
/* =====================================================================
   Liddelow et al., 2017, Nature 541:481 — Methods animation
   Presenter controls:  SPACE / → / PgDn = next   ← / PgUp = back
                        R = replay step   F = fullscreen
                        L = toggle light/dark   P = play/pause   URL hash #12 jumps to step 12
   ===================================================================== */
const cv = document.getElementById('c'); let ctx = cv.getContext('2d');   // ctx is swapped for an offscreen layer while a scene transition is composed
const RENDER_MODE = new URLSearchParams(location.search).has('render');   // tools/*.mjs: no HUD, exact 1920×1080, no titles / footer
// Video clips are a horizontal band of the 1920×1080 stage (titles are set on the slide, so top and bottom are trimmed).
// Every scene keeps its content inside this band; the same band is used for every clip so consecutive clips line up.
const CROP = { y: 160, h: 768 };
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
   dur = seconds until the step has settled + 0.5 s (one video clip); busy = a crowded moment, for review.
   joins = opens on the previous step's last frame (no scene fade, previous heading fades out).
   morph = the step itself carries the previous step's last frame into its own (no generic cross-fade).
   t0 = first frame of the video clip (default 0); video:false = no clip (step 1 is a still).
   Copy (cap / capEnd / sub) and the footer citation (cite) come from SCRIPT.md.
   ===================================================================== */
const STEPS = [
  { sc: 1, k: 0, slug: 'tissue', video: false, dur: 2.5, busy: 3.0 },   // no on-screen title: narration carries steps 1-2
  { sc: 1, k: 1, slug: 'who-caused-it', t0: 1.4, dur: 5.5, busy: 2.5 },   // clip opens already blurred (focus is complete at 1.4 s)
  { sc: 2, k: 0, slug: 'immunopanning', joins: true, dur: 14.7, busy: 2.6, cap: 'Cell-type purification by immunopanning', sub: 'P5 cortex · papain dissociation · sequential panning plates',
    cite: 'Adapted from Liddelow et al., 2017 (Methods; Extended Data Fig. 2a)' },
  { sc: 2, k: 1, slug: 'three-cultures', dur: 5.5, busy: 2.0, cap: 'Purified primary cultures', sub: 'astrocytes and RGCs >99% pure',
    cite: 'Adapted from Liddelow et al., 2017 (Methods; Extended Data Fig. 2b)' },
  { sc: 3, k: 0, slug: 'serum-free', morph: true, dur: 10.7, busy: 6.8, cap: 'Serum-free culture preserves a resting baseline', sub: 'serum components alone induce astrocyte reactivity',
    cite: 'Adapted from Liddelow et al., 2017 (Methods; Extended Data Fig. 2c)' },
  { sc: 5, k: 0, slug: 'readout-primer', dur: 14.8, busy: 3.0, cap: 'Readout: reactive-astrocyte transcript panel', sub: 'microfluidic qPCR · reference A1 and A2 profiles',
    cite: 'Adapted from Liddelow et al., 2017 (Fig. 1a); gene sets from Zamanian et al., 2012' },
  { sc: 4, k: 0, slug: 'relay-intro', dur: 3.1, busy: 1.2, cap: 'Conditioned-medium transfer between purified cultures',
    cite: 'Adapted from Liddelow et al., 2017' },
  { sc: 4, k: 1, slug: 'lps-direct', dur: 11.7, busy: 5.5, cap: 'LPS applied directly to astrocytes', capEnd: 'No response: astrocytes lack TLR4',
    cite: 'Adapted from Liddelow et al., 2017 (Extended Data Fig. 2c)' },
  { sc: 4, k: 2, slug: 'microglia-medium', dur: 22.4, busy: 10.5, cap: 'LPS-activated microglia induce A1 astrocytes', sub: 'medium from resting microglia has no effect',
    cite: 'Adapted from Liddelow et al., 2017 (Fig. 1a; Extended Data Fig. 3)' },
  { sc: 4, k: 3, slug: 'cocktail', dur: 13.5, busy: 6.0, cap: 'IL-1α, TNF and C1q are sufficient', sub: '3, 30 and 400 ng/ml · 24 h',
    cite: 'Adapted from Liddelow et al., 2017 (Fig. 1a to c; Extended Data Fig. 3d)' },
  { sc: 4, k: 4, slug: 'neutralize', dur: 17.9, busy: 9.5, cap: 'IL-1α, TNF and C1q are necessary', sub: 'neutralizing antibodies block induction by activated-microglia medium',
    cite: 'Adapted from Liddelow et al., 2017 (Fig. 1a; Extended Data Fig. 3e)' },
  { sc: 4, k: 5, slug: 'acm-to-rgcs', dur: 7.2, busy: 10.8, cap: 'A1 astrocyte-conditioned medium on purified RGCs',
    cite: 'Adapted from Liddelow et al., 2017 (Methods; Fig. 4a)' },
  { sc: 4, k: 6, slug: 'dose', dur: 6.8, busy: 3.5, cap: 'Dose-dependent RGC death at 24 h',
    cite: 'Adapted from Liddelow et al., 2017 (Fig. 4a, c; Extended Data Fig. 7)' },
  { sc: 4, k: 7, slug: 'rgc-controls', dur: 13.8, busy: 10.0, cap: 'Controls: activated-microglia medium or cytokines alone', capEnd: 'Neurotoxicity originates from A1 astrocytes',
    cite: 'Adapted from Liddelow et al., 2017 (Extended Data Fig. 7d)' },
  { sc: 5, k: 1, slug: 'heatmap', joins: true, dur: 4.8, busy: 1.2, cap: 'Reactive-transcript profiles across conditions',
    cite: 'Reproduced from Liddelow et al., 2017 (Fig. 1a)' },
];
const SCENES = [null, (...a) => scene1(...a), (...a) => scene2(...a), (...a) => scene3(...a), (...a) => scene4(...a), (...a) => scene5(...a)];

/* =====================================================================
   FRAME / HUD
   ===================================================================== */
let VIG = null, EDG = null;
// scene 1: deepens (dark) or whitens (light) the caption / footer bands over the busy tissue
function edgeShade() {
  const L = THEME.light;
  if (!EDG || EDG.light !== L) {
    const E = L ? '255,255,255' : '0,0,0', k = 1;
    // top: white that deepens toward the top of the clip band (CROP), so the tissue melts into the slide
    const top = CROP.y + 230, p = CROP.y / top, g = ctx.createLinearGradient(0, 0, 0, top);
    g.addColorStop(0, `rgba(${E},1)`); g.addColorStop(p, `rgba(${E},.96)`); g.addColorStop(p + (1 - p) * .35, `rgba(${E},.62)`); g.addColorStop(p + (1 - p) * .7, `rgba(${E},.22)`); g.addColorStop(1, `rgba(${E},0)`);
    const g2 = ctx.createLinearGradient(0, 950, 0, 1080); g2.addColorStop(0, `rgba(${E},0)`); g2.addColorStop(.6, `rgba(${E},${.75 * k})`); g2.addColorStop(1, `rgba(${E},${.92 * k})`);
    EDG = [g, g2]; EDG.light = L;
  }
  ctx.fillStyle = EDG[0]; ctx.fillRect(0, 0, W, CROP.y + 230); ctx.fillStyle = EDG[1]; ctx.fillRect(0, 950, W, 130);
}
function vignette() {
  if (THEME.light) return;
  if (!VIG) { VIG = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * 1.02); VIG.addColorStop(0, 'rgba(0,0,0,0)'); VIG.addColorStop(1, 'rgba(0,0,0,.55)'); }
  ctx.fillStyle = VIG; ctx.fillRect(0, 0, W, H);
}
let step = 0, prevStep = -1, prevT = 0, stepStart = performance.now(), frozen = null;
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
  else if (e.key === 'f' || e.key === 'F') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }
  else if (e.key === 'l' || e.key === 'L') { setThemeMode(THEME.light ? 'dark' : 'light'); onThemeChange(); }
  else if (e.key === 'p' || e.key === 'P') { setPaused(!paused); }
});
let idleT; addEventListener('mousemove', () => { document.body.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(() => document.body.classList.add('idle'), 1800); });

function applyTheme() {
  THEME.light = THEME.mode === 'light';
  const bg = THEME.light ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)'; if (document.body.style.background !== bg) document.body.style.background = bg;
}
// the previous step's caption fades out when stepping forward inside a scene
function carryCaption(k, t) {
  if (prevStep !== k - 1 || prevStep < 0 || (STEPS[prevStep].sc !== STEPS[k].sc && !STEPS[k].joins)) return;
  const P = STEPS[prevStep], S = STEPS[k], a = 1 - seg(t, 0, .45); if (a <= 0) return;
  const pc = P.capEnd || P.cap;
  if (pc && pc !== S.cap) caption(pc, a);
  if (P.sub && !P.capEnd && P.sub !== S.sub) subcap(P.sub, a);
}
// the previous step's final frame, drawn as an opaque layer at alpha a: lets a new scene open on the
// exact last frame of the clip before it and dissolve from there
let XLAYER = null;
function previousFinal(k, gt, a) {
  const P = STEPS[k - 1], saved = [prevStep, prevT];
  if (!XLAYER) { XLAYER = document.createElement('canvas'); }
  if (XLAYER.width !== cv.width || XLAYER.height !== cv.height) { XLAYER.width = cv.width; XLAYER.height = cv.height; }
  const main = ctx; ctx = XLAYER.getContext('2d');
  prevStep = k - 2; prevT = k >= 2 ? STEPS[k - 2].dur : 0;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, XLAYER.width, XLAYER.height);
  paintStep(k - 1, P.dur, gt);
  [prevStep, prevT] = saved; ctx = main;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a; ctx.drawImage(XLAYER, 0, 0); ctx.restore();
}
function paintStep(k, t, gt) {
  ctx.setTransform(SCL * DPR, 0, 0, SCL * DPR, 0, 0);
  ctx.fillStyle = rgb(COL.bg); ctx.fillRect(0, 0, W, H);
  const S = STEPS[k];
  ctx.save(); SCENES[S.sc](S.k, t, gt, S); ctx.restore();
  carryCaption(k, t);
  if (!RENDER_MODE) txt(S.cite || '', 64, 1052, { size: 15, col: COL.foot });   // per-step citation
}
function render(k, t, gt) {
  applyTheme();
  paintStep(k, t, gt);
  const S = STEPS[k], sc = S.sc;
  // Renders: every clip opens on the previous clip's last frame and dissolves from there (a step whose own code
  // already carries the previous frame, joins / morph, is left alone). Live: entering a scene fades up from the page colour.
  const consecutive = k > 0 && prevStep === k - 1, carried = consecutive && (S.joins || S.morph);
  const enteredScene = prevStep < 0 || STEPS[prevStep].sc !== sc;
  if (RENDER_MODE) {
    if (consecutive && !carried) {
      const f = 1 - seg(t, 0, enteredScene ? .8 : .6);
      if (f > 0) { ctx.setTransform(SCL * DPR, 0, 0, SCL * DPR, 0, 0); previousFinal(k, gt, f); }
    }
  } else if (enteredScene && !carried) {
    const f = 1 - seg(t, 0, .8);
    if (f > 0) { ctx.setTransform(SCL * DPR, 0, 0, SCL * DPR, 0, 0); ctx.fillStyle = rgb(COL.bg, f); ctx.fillRect(0, 0, W, H); }
  }
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
  crop: CROP, ready: IMG_READY,
  steps: () => STEPS.map((s, i) => ({ i, sc: s.sc, slug: s.slug, dur: s.dur, t0: s.t0 || 0, video: s.video !== false, busy: s.busy, cap: s.cap })),
  gtBase, setTheme: m => { setThemeMode(m); onThemeChange(); },
};
