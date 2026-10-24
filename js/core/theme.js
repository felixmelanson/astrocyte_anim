'use strict';
/* =====================================================================
   PALETTE + THEME
   resting/healthy = teal family (type-tinted), activated/toxic = coral,
   blocked/absent = gray dashed, IL-1α amber, TNF violet, C1q chartreuse
   ===================================================================== */
// Two palettes, same semantics. Light colours are darkened / saturated for white:
// glyphs and cell rims ≥ 3:1 against #fff, text ≥ 4.5:1.
const PALETTES = {
  dark: {
    tp: {
      astro:  { rim: [104, 222, 204], body: [22, 100, 97],  fil: [186, 255, 240], nuc: [9, 44, 47] },
      micro:  { rim: [126, 228, 176], body: [24, 100, 78],  fil: [190, 255, 222], nuc: [9, 46, 37] },
      neuron: { rim: [108, 198, 234], body: [20, 80, 108],  fil: [182, 232, 255], nuc: [9, 38, 56] },
      oligo:  { rim: [144, 166, 236], body: [36, 56, 112],  fil: [205, 215, 255], nuc: [17, 25, 58] },
      endo:   { rim: [166, 180, 196], body: [50, 60, 74],   fil: [210, 220, 232], nuc: [25, 31, 41] },
    },
    coral: { rim: [255, 144, 120], body: [124, 46, 40], fil: [255, 208, 192], nuc: [56, 19, 17] },
    grayp: { rim: [116, 124, 134], body: [36, 40, 46], fil: [150, 158, 168], nuc: [22, 24, 28] },
    pc: { il1: [246, 186, 68], tnf: [166, 134, 255], c1q: [186, 228, 90], other: [116, 124, 134], lps: [232, 226, 204], ab: [226, 234, 244], tox: [255, 136, 110], gray: [124, 132, 142] },
    col: { text: [224, 232, 238], dim: [128, 142, 154], teal: [104, 222, 204], coral: [255, 144, 120], bg: [0, 0, 0], ink: [236, 242, 246], foot: [112, 126, 138], legend: [190, 202, 212] },
    ui: {
      cellMix: .32, dish: [15, 24, 31], dishHi: .045, dishLo: .3, plate: [17, 27, 35], serum: [34, 29, 20], shadow: [0, 0, 0], shadowK: 1,
      rim: [196, 214, 228], rimA: 1, glassA: .08, glare: 1, lumen: [9, 13, 18], drop: [226, 236, 242], serumDrop: [226, 206, 150], punct: [226, 250, 255],
      casp: [255, 184, 80], caspText: [255, 190, 110], midSurv: [230, 200, 170], pill: [7, 11, 15], pillA: .72, bracket: [170, 182, 194],
      heat0: [28, 34, 42], heatNeg: [46, 150, 168], heatPos: [255, 122, 96], row: [196, 206, 214], rowA1: [236, 210, 200], gene: [176, 188, 198],
      grpPan: [196, 206, 214], grpA2: [110, 132, 162], aqpDot: [238, 244, 255], small: [170, 205, 230], filtrate: [120, 160, 190], liqMix: 0,
      gridPos: [170, 235, 222], grid: [200, 214, 228], gridA: 1, neuropil: [120, 190, 200],
    },
  },
  light: {
    tp: {
      astro:  { rim: [0, 128, 116],  body: [208, 240, 234], fil: [0, 104, 94],   nuc: [112, 176, 166] },
      micro:  { rim: [16, 128, 80],  body: [210, 240, 222], fil: [10, 100, 62],  nuc: [116, 178, 140] },
      neuron: { rim: [0, 108, 160],  body: [206, 232, 246], fil: [0, 86, 130],   nuc: [110, 160, 196] },
      oligo:  { rim: [72, 88, 184],  body: [222, 226, 248], fil: [56, 70, 160],  nuc: [150, 160, 214] },
      endo:   { rim: [100, 112, 126], body: [226, 230, 236], fil: [90, 100, 114], nuc: [160, 168, 180] },
    },
    coral: { rim: [204, 66, 44], body: [252, 220, 212], fil: [176, 50, 30], nuc: [226, 140, 122] },
    grayp: { rim: [118, 126, 136], body: [234, 236, 239], fil: [128, 136, 146], nuc: [184, 190, 198] },
    pc: { il1: [184, 118, 0], tnf: [110, 76, 214], c1q: [96, 136, 0], other: [124, 132, 142], lps: [128, 104, 56], ab: [62, 76, 96], tox: [206, 66, 42], gray: [140, 148, 158] },
    col: { text: [22, 30, 38], dim: [86, 98, 110], teal: [0, 120, 108], coral: [190, 58, 36], bg: [255, 255, 255], ink: [20, 28, 36], foot: [104, 116, 128], legend: [62, 74, 86] },
    ui: {
      cellMix: .1, dish: [234, 239, 243], dishHi: .55, dishLo: .035, plate: [230, 236, 241], serum: [247, 236, 210], shadow: [30, 50, 70], shadowK: .22,
      rim: [104, 124, 140], rimA: 1.8, glassA: .14, glare: 0, lumen: [238, 242, 246], drop: [70, 130, 180], serumDrop: [196, 146, 40], punct: [0, 96, 128],
      casp: [240, 150, 30], caspText: [176, 100, 0], midSurv: [168, 100, 30], pill: [255, 255, 255], pillA: .88, bracket: [86, 98, 110],
      heat0: [238, 241, 244], heatNeg: [40, 130, 150], heatPos: [214, 72, 48], row: [52, 62, 72], rowA1: [170, 56, 34], gene: [76, 88, 100],
      grpPan: [44, 52, 60], grpA2: [76, 100, 138], aqpDot: [24, 60, 150], small: [50, 100, 150], filtrate: [90, 140, 180], liqMix: .55,
      gridPos: [0, 120, 108], grid: [70, 90, 108], gridA: 1.6, neuropil: [40, 110, 120],
    },
  },
};

// THEME is a runtime setting toggled from the viewer UI. lightFrom: -1 = always dark,
// N = light palette from step N onward (scene 1 tissue stays dark). light = the palette
// the frame being drawn uses; app.js sets it per frame.
const THEME = { lightFrom: 2, light: false };
function setThemeMode(mode) { THEME.lightFrom = mode === 'light' ? 2 : -1; }
const PAL = () => THEME.light ? PALETTES.light : PALETTES.dark;
const themed = key => new Proxy({}, { get: (_, p) => PAL()[key][p] });
// these read the active palette on every access, so cells/glyphs follow the theme per frame
const TP = themed('tp'), CORAL = themed('coral'), GRAYP = themed('grayp'), PC = themed('pc'), COL = themed('col'), UI = themed('ui');
const palMix = (p, q, t) => ({ rim: mix(p.rim, q.rim, t), body: mix(p.body, q.body, t), fil: mix(p.fil, q.fil, t), nuc: mix(p.nuc, q.nuc, t) });
const fg = (a = 1) => rgb(PAL().col.ink, a);                       // foreground strokes/fills (near-white on dark, near-black on light)
const shade = (a = 1) => rgb(UI.shadow, a * UI.shadowK);            // drop shadows
const liqC = c => mix(c, [255, 255, 255], UI.liqMix);               // medium colour in tubes / tips
const FONT = '"Inter","Helvetica Neue","Segoe UI",Helvetica,Arial,sans-serif';

/* ---------------- text ---------------- */
function txt(s, x, y, o = {}) {
  const a = o.a ?? 1; if (a <= 0.004) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.font = `${o.it ? 'italic ' : ''}${o.w || 400} ${o.size || 20}px ${FONT}`;
  ctx.fillStyle = rgb(o.col || COL.text);
  ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'alphabetic';
  if ('letterSpacing' in ctx) ctx.letterSpacing = (o.ls || 0) + 'px';
  if (o.rot) { ctx.translate(x, y); ctx.rotate(o.rot); ctx.fillText(s, 0, 0); } else ctx.fillText(s, x, y);
  ctx.restore();
}
// Caption copy lives on each STEPS entry (app.js), taken from SCRIPT.md.
function caption(s, a, y = 122, size = 30) { if (!s) return; txt(s, W / 2, y, { a, size, w: 500, align: 'center', col: COL.text }); }
function subcap(s, a, y = 156) { if (!s) return; txt(s, W / 2, y, { a, size: 19, align: 'center', col: COL.dim, ls: .5 }); }
