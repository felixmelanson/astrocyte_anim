'use strict';
/* =====================================================================
   SCENE 1 — tissue: "why purify"
   ===================================================================== */
const VES = (() => { const P = [[-80, 930], [500, 760], [1200, 520], [2000, 380]], pts = []; for (let i = 0; i <= 90; i++) { const s = i / 90, a = (1 - s) ** 3, b = 3 * (1 - s) ** 2 * s, c = 3 * (1 - s) * s * s, d = s ** 3; pts.push([a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0], a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1]]); } return pts; })();
const VW = 44;
function vesNear(x, y) { let best = 1e9, bp = null; for (const p of VES) { const d = Math.hypot(p[0] - x, p[1] - y); if (d < best) { best = d; bp = p; } } return [best, bp]; }
const TIS = { cells: [], pairs: [], axons: [], hero: null, nb: [], bg: null };
(function buildTissue() {
  const R = rng(42), pts = [[960, 470]];
  for (let tries = 0; tries < 8000; tries++) {
    const x = -40 + R() * 2000, y = -40 + R() * 1160;
    if (vesNear(x, y)[0] < 64) continue;
    if (pts.every(p => Math.hypot(p[0] - x, p[1] - y) > 136)) pts.push([x, y]);
  }
  pts.forEach((p, i) => {
    let type; if (i === 0) type = 'astro'; else { const u = R(); type = u < .3 ? 'astro' : u < .56 ? 'micro' : u < .8 ? 'neuron' : 'oligo'; }
    const [dv, vp] = vesNear(p[0], p[1]); const o = { tissue: true, drift: 2.5 };
    if (type === 'astro') { o.len = 46; if (dv < 200) { o.endfoot = true; o.efAng = Math.atan2(vp[1] - p[1], vp[0] - p[0]); o.efLen = dv - VW / 2 - 13 * .45 + 2; } }
    if (type === 'neuron') { o.pyr = true; o.axAng = Math.PI / 2 + (R() - .5) * .5; o.axLen = 240; o.drift = 1.2; }
    if (type === 'oligo') { o.axAng = -.33 + (R() - .5) * .3; o.nSheath = 4; o.drift = 1; }
    if (type === 'micro') o.len = 17;
    const c = new Cell(type, p[0], p[1], 1000 + i * 17, i === 0 ? 1.3 : type === 'micro' ? 1.05 : 1, o);
    TIS.cells.push(c); if (i === 0) TIS.hero = c;
    if (type === 'oligo') for (const sh of c.sheaths) TIS.axons.push({ x: p[0] + sh.cx, y: p[1] + sh.cy, A: sh.A, len: 520 + R() * 300 });
  });
  const cs = TIS.cells;
  cs.forEach((c, i) => {
    const d = cs.map((o, j) => [j, Math.hypot(o.x - c.x, o.y - c.y)]).filter(q => q[0] !== i).sort((a, b) => a[1] - b[1]);
    for (let k = 0; k < 2; k++) { const j = d[k][0]; if (d[k][1] < 300 && !TIS.pairs.some(p => (p.a === i && p.b === j) || (p.a === j && p.b === i))) TIS.pairs.push({ a: i, b: j, per: 2.2 + R() * 1.6, ph: R(), bend: (R() - .5) * .5 }); }
  });
  const h = TIS.hero;
  TIS.nb = cs.map((o, j) => [j, Math.hypot(o.x - h.x, o.y - h.y)]).filter(q => q[0] !== 0).sort((a, b) => a[1] - b[1]).slice(0, 8).map(q => q[0]);
  TIS.order = cs.map((c, i) => i).sort((a, b) => { const r = { neuron: 0, oligo: 1, astro: 2, micro: 3 }; return r[cs[a].type] - r[cs[b].type]; });
  // blurred deep-focus layer + neuropil, one per palette (the cortex block in scene 2 can be light)
  const keep = THEME.light;
  TIS.bg = {};
  for (const light of [false, true]) { THEME.light = light; TIS.bg[light ? 'light' : 'dark'] = tissueBg(); }
  THEME.light = keep;
})();
function tissueBg() {
  const bg = document.createElement('canvas'); bg.width = W; bg.height = H; const b = bg.getContext('2d');
  const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const tc = tmp.getContext('2d');
  const R2 = rng(99);
  for (let i = 0; i < 46; i++) {
    const types = ['astro', 'micro', 'neuron', 'micro', 'astro', 'oligo'], ty = types[i % 6];
    const cell = new Cell(ty, R2() * W, R2() * H, 5000 + i, .85, { tissue: true, pyr: true, axAng: Math.PI / 2, axLen: 200, len: ty === 'micro' ? 16 : 42, nSheath: 2 });
    cell.draw(tc, { t: 0, a: .9 });
  }
  b.filter = 'blur(5px)'; b.globalAlpha = .26; b.drawImage(tmp, 0, 0); b.filter = 'none'; b.globalAlpha = 1;
  b.lineCap = 'round';
  for (let i = 0; i < 900; i++) {
    const x = R2() * W, y = R2() * H, a = R2() * TAU, l = 20 + R2() * 70;
    b.strokeStyle = rgb(UI.neuropil, .03 + R2() * .04); b.lineWidth = .6 + R2() * .8;
    b.beginPath(); b.moveTo(x, y); b.quadraticCurveTo(x + Math.cos(a + .6) * l * .5, y + Math.sin(a + .6) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); b.stroke();
  }
  for (let i = 0; i < 1400; i++) { b.fillStyle = rgb(mix(UI.neuropil, [255, 255, 255], THEME.light ? 0 : .2), .03 + R2() * .05); b.beginPath(); b.arc(R2() * W, R2() * H, .6 + R2() * 1.1, 0, TAU); b.fill(); }
  return bg;
}
function drawVessel(c, t, a = 1) {
  c.save(); c.globalAlpha *= a; c.lineCap = 'round'; c.lineJoin = 'round';
  const path = () => { c.beginPath(); VES.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); };
  path(); c.strokeStyle = rgb(TP.endo.rim); c.lineWidth = VW + 3; c.stroke();
  path(); c.strokeStyle = rgb(TP.endo.body); c.lineWidth = VW; c.stroke();
  path(); c.strokeStyle = rgb(UI.lumen); c.lineWidth = VW - 11; c.stroke();
  path(); c.strokeStyle = rgb(TP.endo.rim, .1); c.lineWidth = VW - 22; c.stroke();
  for (let i = 3; i < VES.length - 2; i += 6) {       // endothelial nuclei, flattened along the wall
    const p = VES[i], q = VES[i + 1], an = Math.atan2(q[1] - p[1], q[0] - p[0]), side = (i / 6) % 2 ? 1 : -1;
    const ox = -Math.sin(an) * side * (VW / 2 - 3), oy = Math.cos(an) * side * (VW / 2 - 3);
    c.save(); c.translate(p[0] + ox, p[1] + oy); c.rotate(an); c.beginPath(); c.ellipse(0, 0, 15, 3.6, 0, 0, TAU);
    c.fillStyle = rgb(TP.endo.nuc); c.fill(); c.strokeStyle = rgb(TP.endo.rim, .5); c.lineWidth = .8; c.stroke(); c.restore();
  }
  c.restore();
}
// o.focus (0..1): the hero astrocyte and its neighbours stay sharp; everything else goes out of focus
// o.bgA fades neuropil, axons and vessel; o.cell(i) → { a, sprout } per cell (step 3 dissolves the tissue)
function tissueLayer(c, t, o, backOnly, backA = 1) {
  const bgA = o.bgA ?? 1;
  if (bgA > .004) {
    c.save(); c.globalAlpha *= bgA;
    c.drawImage(TIS.bg[THEME.light ? 'light' : 'dark'], 0, 0);
    c.lineCap = 'round'; c.strokeStyle = rgb(TP.neuron.rim, .42); c.lineWidth = 2.2;
    for (const ax of TIS.axons) { const dx = Math.cos(ax.A) * ax.len / 2, dy = Math.sin(ax.A) * ax.len / 2; c.beginPath(); c.moveTo(ax.x - dx, ax.y - dy); c.lineTo(ax.x + dx, ax.y + dy); c.stroke(); }
    c.restore();
    drawVessel(c, t, bgA);
  }
  for (const i of TIS.order) {
    const inFocus = i === 0 || TIS.nb.includes(i);
    if (backOnly && inFocus) continue;
    tissueCell(c, i, t, o, inFocus ? 1 : backA);
  }
}
function tissueCell(c, i, t, o, a) {
  const isHero = i === 0, q = o.cell ? o.cell(i) : null;
  if (q) { a *= q.a; if (a <= .004) return; }
  TIS.cells[i].draw(c, { t, r: isHero ? (o.heroR || 0) : 0, a, sprout: q ? q.sprout : 1, colR: isHero && o.heroR ? Math.min(1, o.heroR / .36) : undefined });
}
const DEFOC = { s: null, b: null, M: 10 };          // 1/4-size offscreen: sharp → blurred
function drawTissue(c, t, o = {}) {
  const f = o.focus || 0;
  if (f <= 0) { tissueLayer(c, t, o, false); return; }
  if (f < 1) tissueLayer(c, t, o, true, lerp(1, .55, f));
  const M = DEFOC.M, sw = W / 4 + 2 * M, sh = H / 4 + 2 * M;
  if (!DEFOC.s) for (const k of ['s', 'b']) { DEFOC[k] = document.createElement('canvas'); DEFOC[k].width = sw; DEFOC[k].height = sh; }
  const bg = rgb(COL.bg), sc = DEFOC.s.getContext('2d'), bc = DEFOC.b.getContext('2d');
  const key = Math.floor(t * 10) + '|' + COL.bg;    // out-of-focus motion is invisible → refresh at 10 Hz
  if (DEFOC.key !== key || c !== ctx) { DEFOC.key = c === ctx ? key : '';
  sc.setTransform(1, 0, 0, 1, 0, 0); sc.fillStyle = bg; sc.fillRect(0, 0, sw, sh);
  sc.setTransform(.25, 0, 0, .25, M, M); tissueLayer(sc, t, o, true);
  bc.setTransform(1, 0, 0, 1, 0, 0); bc.fillStyle = bg; bc.fillRect(0, 0, sw, sh);
  bc.filter = 'blur(2.6px)'; bc.drawImage(DEFOC.s, 0, 0); bc.filter = 'none';   // (no ctx.filter in Safari → soft downscale only)
  bc.fillStyle = rgb(COL.bg, .42); bc.fillRect(0, 0, sw, sh);                   // push it back
  }
  c.save(); c.globalAlpha *= f; c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  c.drawImage(DEFOC.b, -4 * M, -4 * M, sw * 4, sh * 4); c.restore();
  for (const i of TIS.order) if (i === 0 || TIS.nb.includes(i)) tissueCell(c, i, t, o, 1);
}

/* ---- step 2: labels for the few cells left in focus, set outside the cluster on leader lines ---- */
const FLAB = (() => {
  const h = TIS.hero, names = { astro: 'Astrocyte', micro: 'Microglia', neuron: 'Neuron', oligo: 'Oligodendrocyte' };
  const picks = [], seen = new Set();
  for (const j of TIS.nb) { const ty = TIS.cells[j].type; if (seen.has(ty)) continue; seen.add(ty); picks.push({ i: j, name: names[ty] }); }
  const L = [], R = [];
  picks.forEach(p => (TIS.cells[p.i].x < h.x ? L : R).push(p));
  (L.length <= R.length ? L : R).push({ i: 0, name: 'Astrocyte', hero: true });
  const out = [];
  for (const [arr, side] of [[L, -1], [R, 1]]) {
    arr.sort((a, b) => TIS.cells[a.i].y - TIS.cells[b.i].y);
    let prev = -1e9;
    arr.forEach(p => { const c = TIS.cells[p.i]; p.side = side; p.lx = h.x + side * 450; p.ly = Math.max(c.y, prev + 60); prev = p.ly; out.push(p); });
    const shift = (arr.reduce((s, p) => s + p.ly - TIS.cells[p.i].y, 0) / Math.max(1, arr.length));
    arr.forEach(p => p.ly -= shift * .5);
  }
  out.forEach((p, n) => p.n = n);
  return out;
})();
// al(n) = alpha of label n; heroCol: the central astrocyte's label turns coral as it becomes reactive
function drawFocusLabels(al, heroCol = 0) {
  for (const p of FLAB) {
    const a = al(p.n); if (a <= .004) continue;
    const c = TIS.cells[p.i], r0 = c.R0 * c.sc + 6, ex = p.lx - p.side * 14;
    const an = Math.atan2(p.ly - c.y, ex - c.x), sx = c.x + Math.cos(an) * r0, sy = c.y + Math.sin(an) * r0;
    const grow = eOut(seg(a, 0, .7));
    ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = fg(.55); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(lerp(sx, ex, grow), lerp(sy, p.ly, grow)); ctx.stroke();
    ctx.fillStyle = fg(.85); ctx.beginPath(); ctx.arc(sx, sy, 2.8, 0, TAU); ctx.fill(); ctx.restore();
    const col = p.hero ? mix(COL.text, COL.coral, heroCol) : COL.text;
    txt(p.hero && heroCol > .5 ? 'Reactive astrocyte' : p.name, p.lx, p.ly + 7, { a: a * seg(a, .3, 1), size: 30, w: 600, align: p.side < 0 ? 'right' : 'left', col, halo: 8 });
  }
}
// the tissue as seen through the scene-1 camera; steps 1–3 all draw through this
const tisCam = gt => ({ z: 1.02 + .02 * Math.sin(gt * .045), dx: Math.sin(gt * .03) * 10, dy: 70 });   // dy: the cluster sits lower, clear of the clip band's top edge
function tissueView(gt, o, overlay) {
  const { z, dx, dy } = tisCam(gt);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2 + dx, -H / 2 + dy);
  drawTissue(ctx, gt, o);
  if (overlay) overlay();
  ctx.restore();
}
// the "who caused it?" overlay of Title 2; tt = time into step 1, fa = extra fade
function drawWhoOverlay(tt, gt, fa) {
  if (fa <= .004) return;
  const cs = TIS.cells, h = TIS.hero;
  const genA = (1 - seg(tt, 0, .8)) * fa;
  if (genA > 0) for (const p of TIS.pairs) drawSignal(cs[p.a], cs[p.b], p, gt, genA);
  TIS.nb.forEach((j, n) => {
    const c = cs[j], a = seg(tt, .6 + n * .15, 1.4 + n * .15) * fa;
    drawSignal(c, h, { per: 1.8, ph: n * .13, bend: (n % 2 ? .25 : -.25) }, gt, a, true);
  });
}
function scene1(k, t, gt, S) {
  const heroR = k === 1 ? .36 * ease(seg(t, 1.2, 5.5)) : 0;
  const focus = k === 1 ? ease(seg(t, .2, 1.4)) : 0;
  tissueView(gt, { heroR, focus }, () => {
    const cs = TIS.cells;
    if (k === 0) { const genA = seg(t, .6, 2); if (genA > 0) for (const p of TIS.pairs) drawSignal(cs[p.a], cs[p.b], p, gt, genA); }
    else { drawWhoOverlay(t, gt, 1); drawFocusLabels(n => ease(seg(t, 1.5 + n * .18, 2.1 + n * .18)), seg(heroR, .2, .3)); }
  });
  vignette(); edgeShade();
  caption(S.cap, seg(t, .8, 1.8));
}
function drawSignal(A, B, p, gt, a, toward) {
  if (a <= .004) return;
  const x0 = A.x, y0 = A.y, x1 = B.x, y1 = B.y, dx = x1 - x0, dy = y1 - y0;
  const cx = (x0 + x1) / 2 - dy * p.bend, cy = (y0 + y1) / 2 + dx * p.bend;
  const P = u => [(1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1, (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1];
  ctx.save(); ctx.globalAlpha *= a;
  ctx.strokeStyle = toward ? fg(.22 * UI.rimA) : fg(.09 * UI.rimA); ctx.lineWidth = toward ? 1.4 : 1;
  ctx.setLineDash(toward ? [] : [2, 5]);
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke(); ctx.setLineDash([]);
  const u0 = ((gt / p.per + p.ph) % 1);
  for (let q = 0; q < 2; q++) {
    let u = (u0 + q * .5) % 1; if (!toward && q === 1) u = 1 - u;       // bidirectional in tissue
    for (let k = 0; k < 5; k++) {
      const uu = u - (toward || q === 0 ? k * .012 : -k * .012); if (uu < 0 || uu > 1) continue;
      const [x, y] = P(uu); ctx.fillStyle = fg((1 - k / 5) * .85 * Math.sin(u * Math.PI));
      ctx.beginPath(); ctx.arc(x, y, 2.6 - k * .35, 0, TAU); ctx.fill();
    }
  }
  ctx.restore();
}

