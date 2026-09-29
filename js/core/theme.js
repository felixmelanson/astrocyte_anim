'use strict';
/* =====================================================================
   PALETTE + THEME
   resting/healthy = teal family (type-tinted), activated/toxic = coral,
   blocked/absent = gray dashed, IL-1α amber, TNF violet, C1q chartreuse
   ===================================================================== */
const TP = {
  astro:  { rim: [104, 222, 204], body: [22, 100, 97],  fil: [186, 255, 240], nuc: [9, 44, 47] },
  micro:  { rim: [126, 228, 176], body: [24, 100, 78],  fil: [190, 255, 222], nuc: [9, 46, 37] },
  neuron: { rim: [108, 198, 234], body: [20, 80, 108],  fil: [182, 232, 255], nuc: [9, 38, 56] },
  oligo:  { rim: [144, 166, 236], body: [36, 56, 112],  fil: [205, 215, 255], nuc: [17, 25, 58] },
  endo:   { rim: [166, 180, 196], body: [50, 60, 74],   fil: [210, 220, 232], nuc: [25, 31, 41] },
};
const CORAL = { rim: [255, 144, 120], body: [124, 46, 40], fil: [255, 208, 192], nuc: [56, 19, 17] };
const GRAYP = { rim: [116, 124, 134], body: [36, 40, 46], fil: [150, 158, 168], nuc: [22, 24, 28] };
const palMix = (p, q, t) => ({ rim: mix(p.rim, q.rim, t), body: mix(p.body, q.body, t), fil: mix(p.fil, q.fil, t), nuc: mix(p.nuc, q.nuc, t) });
const PC = { il1: [246, 186, 68], tnf: [166, 134, 255], c1q: [186, 228, 90], other: [116, 124, 134], lps: [232, 226, 204], ab: [226, 234, 244], tox: [255, 136, 110], gray: [124, 132, 142] };

// THEME is a mutable runtime setting (toggled from the viewer UI) rather than
// a value baked into a separate file — both "copies" that used to exist as
// whole duplicate files differed only in this. lightFrom: -1 = never invert,
// N = invert to a white page + dark text from step N onward.
const THEME = { bg: [7, 11, 15], lightFrom: -1 };
function setThemeMode(mode) { THEME.lightFrom = mode === 'light' ? 2 : -1; }

const COL = { text: [224, 232, 238], dim: [128, 142, 154], teal: [104, 222, 204], coral: [255, 144, 120], get bg() { return THEME.bg; } };
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
// On-screen titles are placeholders for now. Each call site keeps the original wording in a
// "// was:" comment so the text can be refined later.
const TITLE = n => `Title ${n} placeholder`;
function caption(s, a, y = 122, size = 30) { txt(s, W / 2, y, { a, size, w: 500, align: 'center', col: COL.text }); }
function subcap(s, a, y = 156) { txt(s, W / 2, y, { a, size: 19, align: 'center', col: COL.dim, ls: .5 }); }
