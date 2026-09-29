'use strict';
/* =====================================================================
   MOLECULE GLYPHS
   ===================================================================== */
function gIL1(c, s, a, col = PC.il1) {       // IL-1α: β-trefoil fold
  c.fillStyle = rgb(col, a); c.beginPath();
  for (let k = 0; k < 3; k++) { const an = k * TAU / 3 - Math.PI / 2, x = Math.cos(an) * s * .28, y = Math.sin(an) * s * .28; c.moveTo(x + s * .36, y); c.arc(x, y, s * .36, 0, TAU); }
  c.fill(); c.strokeStyle = rgb(mix(col, [0, 0, 0], .55), a * .7); c.lineWidth = .8; c.stroke();
}
function gTNF(c, s, a, col = PC.tnf) {       // TNF: homotrimer
  for (let k = 0; k < 3; k++) {
    const an = k * TAU / 3 - Math.PI / 2; c.save(); c.rotate(an); c.translate(s * .25, 0);
    c.beginPath(); c.ellipse(0, 0, s * .4, s * .23, 0, 0, TAU); c.fillStyle = rgb(col, a); c.fill();
    c.strokeStyle = rgb(mix(col, [0, 0, 0], .55), a * .7); c.lineWidth = .8; c.stroke(); c.restore();
  }
}
function gC1q(c, s, a, col = PC.c1q) {       // C1q: "bouquet of tulips" — collagen stalk + 6 globular heads
  c.strokeStyle = rgb(col, a); c.fillStyle = rgb(col, a); c.lineCap = 'round';
  c.lineWidth = s * .15; c.beginPath(); c.moveTo(0, s * .55); c.lineTo(0, s * .05); c.stroke();
  c.lineWidth = s * .07;
  const heads = [];
  for (let k = 0; k < 6; k++) {
    const an = -Math.PI / 2 + (k - 2.5) * .34, hx = Math.cos(an) * s * .62, hy = s * .05 + Math.sin(an) * s * .62;
    c.beginPath(); c.moveTo(0, s * .05); c.quadraticCurveTo(Math.cos(an) * s * .22, s * .05 + Math.sin(an) * s * .32, hx, hy); c.stroke(); heads.push([hx, hy]);
  }
  for (const [hx, hy] of heads) { c.beginPath(); c.arc(hx, hy, s * .14, 0, TAU); c.fill(); }
}
function gLPS(c, s, a) {                     // LPS: lipid A (acyl chains) + core + O-antigen chain
  const col = rgb(PC.lps, a); c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round';
  c.beginPath(); c.arc(-s * .12, s * .2, s * .11, 0, TAU); c.arc(s * .12, s * .2, s * .11, 0, TAU); c.fill();
  c.lineWidth = s * .05;
  for (let k = 0; k < 4; k++) { const x = -s * .2 + k * s * .133; c.beginPath(); c.moveTo(x, s * .3); c.lineTo(x + (k % 2 ? 1 : -1) * s * .03, s * .62); c.stroke(); }
  let x = 0, y = s * .1;
  for (let k = 0; k < 5; k++) { const nx = x + Math.sin(k * .9) * s * .1, ny = y - s * .16; c.lineWidth = s * .04; c.beginPath(); c.moveTo(x, y); c.lineTo(nx, ny); c.stroke(); c.beginPath(); c.arc(nx, ny, s * .072, 0, TAU); c.fill(); x = nx; y = ny; }
}
function gAb(c, s, a, col = PC.ab) {         // IgG: Fc stem + 2 Fab arms (heavy) + light chains
  c.lineCap = 'round';
  const dom = (x0, y0, x1, y1) => { const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, gx = (x1 - x0) * .07, gy = (y1 - y0) * .07; c.beginPath(); c.moveTo(x0, y0); c.lineTo(mx - gx, my - gy); c.moveTo(mx + gx, my + gy); c.lineTo(x1, y1); c.stroke(); };
  c.strokeStyle = rgb(col, a); c.lineWidth = s * .15;
  dom(0, s * .06, 0, s * .6); dom(-s * .05, -s * .02, -s * .4, -s * .45); dom(s * .05, -s * .02, s * .4, -s * .45);
  c.lineWidth = s * .065; c.strokeStyle = rgb(col, a * .7);
  c.beginPath(); c.moveTo(-s * .2, -s * .0); c.lineTo(-s * .53, -s * .38); c.moveTo(s * .2, 0); c.lineTo(s * .53, -s * .38); c.stroke();
}
function gOther(c, s, a) { c.fillStyle = rgb(PC.other, a * .9); c.beginPath(); c.ellipse(0, 0, s * .3, s * .22, 0, 0, TAU); c.fill(); }
function gTox(c, s, a) { c.fillStyle = rgb(PC.tox, a); c.beginPath(); for (let k = 0; k < 6; k++) { const an = k * TAU / 6, r = s * (.28 + .1 * Math.sin(k * 2.3)); k ? c.lineTo(Math.cos(an) * r, Math.sin(an) * r) : c.moveTo(r, 0); } c.closePath(); c.fill(); }
function gBound(c, base, s, a) {             // neutralized cytokine: gray + dashed + IgG attached
  const g = mix(PC[base], PC.gray, .68);            // hue still hints which cytokine was caught
  c.save(); c.translate(0, -s * .18);
  if (base === 'il1') gIL1(c, s * .9, a, g); else if (base === 'tnf') gTNF(c, s * .9, a, g); else gC1q(c, s * 1.15, a, g);
  c.setLineDash([2.2, 2.2]); c.strokeStyle = rgb(PC.gray, a * .6); c.lineWidth = .9; c.beginPath(); c.arc(0, 0, s * .66, 0, TAU); c.stroke(); c.setLineDash([]);
  c.restore();
  const S = s * 1.25; c.save(); c.translate(0, s * .3 + S * .45); gAb(c, S, a); c.restore();   // Fab arms cradle the ligand
}
function glyph(c, type, x, y, s, rot, a) {
  if (a <= .01) return;
  c.save(); c.translate(x, y); c.rotate(rot);
  switch (type) {
    case 'il1': gIL1(c, s, a); break; case 'tnf': gTNF(c, s, a); break; case 'c1q': gC1q(c, s * 1.35, a); break;
    case 'lps': gLPS(c, s * 1.1, a); break; case 'other': gOther(c, s, a); break; case 'tox': gTox(c, s, a); break;
    case 'ab': gAb(c, s * 1.2, a); break;
    case 'il1b': gBound(c, 'il1', s, a); break; case 'tnfb': gBound(c, 'tnf', s, a); break; case 'c1qb': gBound(c, 'c1q', s, a); break;
  }
  c.restore();
}
const GSIZE = { il1: 11, tnf: 12, c1q: 13, other: 9, lps: 12, tox: 11, ab: 13, il1b: 11, tnfb: 12, c1qb: 12 };
