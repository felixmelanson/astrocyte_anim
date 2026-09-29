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
  // blurred deep-focus layer + neuropil
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
    b.strokeStyle = `rgba(120,190,200,${.03 + R2() * .04})`; b.lineWidth = .6 + R2() * .8;
    b.beginPath(); b.moveTo(x, y); b.quadraticCurveTo(x + Math.cos(a + .6) * l * .5, y + Math.sin(a + .6) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); b.stroke();
  }
  for (let i = 0; i < 1400; i++) { b.fillStyle = `rgba(150,210,220,${.03 + R2() * .05})`; b.beginPath(); b.arc(R2() * W, R2() * H, .6 + R2() * 1.1, 0, TAU); b.fill(); }
  TIS.bg = bg;
})();
function drawVessel(c, t, a = 1) {
  c.save(); c.globalAlpha *= a; c.lineCap = 'round'; c.lineJoin = 'round';
  const path = () => { c.beginPath(); VES.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); };
  path(); c.strokeStyle = rgb(TP.endo.rim); c.lineWidth = VW + 3; c.stroke();
  path(); c.strokeStyle = rgb(TP.endo.body); c.lineWidth = VW; c.stroke();
  path(); c.strokeStyle = 'rgb(9,13,18)'; c.lineWidth = VW - 11; c.stroke();
  path(); c.strokeStyle = 'rgba(166,180,196,.1)'; c.lineWidth = VW - 22; c.stroke();
  for (let i = 3; i < VES.length - 2; i += 6) {       // endothelial nuclei, flattened along the wall
    const p = VES[i], q = VES[i + 1], an = Math.atan2(q[1] - p[1], q[0] - p[0]), side = (i / 6) % 2 ? 1 : -1;
    const ox = -Math.sin(an) * side * (VW / 2 - 3), oy = Math.cos(an) * side * (VW / 2 - 3);
    c.save(); c.translate(p[0] + ox, p[1] + oy); c.rotate(an); c.beginPath(); c.ellipse(0, 0, 15, 3.6, 0, 0, TAU);
    c.fillStyle = rgb(TP.endo.nuc); c.fill(); c.strokeStyle = rgb(TP.endo.rim, .5); c.lineWidth = .8; c.stroke(); c.restore();
  }
  c.restore();
}
// o.focus (0..1): the hero astrocyte and its neighbours stay sharp; everything else goes out of focus
function tissueLayer(c, t, o, backOnly, backA = 1) {
  c.drawImage(TIS.bg, 0, 0);
  c.save(); c.lineCap = 'round'; c.strokeStyle = rgb(TP.neuron.rim, .42); c.lineWidth = 2.2;
  for (const ax of TIS.axons) { const dx = Math.cos(ax.A) * ax.len / 2, dy = Math.sin(ax.A) * ax.len / 2; c.beginPath(); c.moveTo(ax.x - dx, ax.y - dy); c.lineTo(ax.x + dx, ax.y + dy); c.stroke(); }
  c.restore();
  drawVessel(c, t);
  for (const i of TIS.order) {
    const inFocus = i === 0 || TIS.nb.includes(i);
    if (backOnly && inFocus) continue;
    tissueCell(c, i, t, o, inFocus ? 1 : backA);
  }
}
function tissueCell(c, i, t, o, a) {
  const isHero = i === 0;
  TIS.cells[i].draw(c, { t, r: isHero ? (o.heroR || 0) : 0, a, colR: isHero && o.heroR ? Math.min(1, o.heroR / .36) : undefined });
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

/* ---- Title 1: leader-line labels on one exemplar of each cell type (set false to drop them) ---- */
const TISSUE_LABELS = true;
const TLAB = (() => {
  const want = [['astro', 'Astrocyte', 560, 330, -120, -64, 15], ['micro', 'Microglia', 1350, 660, 120, -60, 9],
                ['neuron', 'Neuron', 640, 700, -120, 40, 12], ['oligo', 'Oligodendrocyte', 1330, 300, 120, -60, 11]];
  const L = want.map(([ty, name, px, py, dx, dy, r0]) => {
    let best = null, bd = 1e9;
    TIS.cells.forEach((c, i) => { if (i === 0 || c.type !== ty) return; const d = Math.hypot(c.x - px, c.y - py); if (d < bd) { bd = d; best = c; } });
    return { x: best.x, y: best.y, dx, dy, r0, name };
  });
  let vp = VES[0], vd = 1e9; for (const p of VES) { const d = Math.hypot(p[0] - 1560, p[1] - 440); if (d < vd) { vd = d; vp = p; } }
  L.push({ x: vp[0], y: vp[1], dx: 60, dy: 150, r0: VW / 2 + 6, name: 'Blood vessel' });
  return L;
})();
function drawTissueLabels(al) {
  TLAB.forEach((L, i) => {
    const a = al(i); if (a <= .004) return;
    const lx = L.x + L.dx, ly = L.y + L.dy, an = Math.atan2(L.dy, L.dx), sx = L.x + Math.cos(an) * L.r0, sy = L.y + Math.sin(an) * L.r0;
    const grow = eOut(seg(a, 0, .7));
    ctx.save(); ctx.globalAlpha *= a;
    ctx.strokeStyle = 'rgba(236,242,246,.6)'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(lerp(sx, lx, grow), lerp(sy, ly, grow)); ctx.stroke();
    ctx.fillStyle = 'rgba(236,242,246,.9)'; ctx.beginPath(); ctx.arc(sx, sy, 2.6, 0, TAU); ctx.fill();
    ctx.font = `500 19px ${FONT}`; const tw = ctx.measureText(L.name).width, right = L.dx >= 0;
    const px = right ? lx : lx - tw - 24;
    rr(px, ly - 15, tw + 24, 30, 15); ctx.fillStyle = rgb(COL.bg, .78); ctx.fill();
    ctx.strokeStyle = 'rgba(236,242,246,.22)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
    txt(L.name, px + 12, ly + 6.5, { a: a * seg(a, .3, 1), size: 19, w: 500, col: [236, 242, 246] });
  });
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
    const qx = lerp(c.x, h.x, .22), qy = lerp(c.y, h.y, .22) - 18;
    txt('?', qx, qy, { a: a * seg(tt, 2.2 + n * .12, 2.8 + n * .12), size: 34, w: 300, align: 'center', col: [236, 242, 246] });
  });
}
function scene1(k, t, gt) {
  const z = 1.02 + .02 * Math.sin(gt * .045);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2 + Math.sin(gt * .03) * 10, -H / 2);
  const heroR = k === 1 ? .36 * ease(seg(t, 1.2, 5.5)) : 0;
  const focus = k === 1 ? ease(seg(t, .2, 1.4)) : 0;
  drawTissue(ctx, gt, { heroR, focus });
  // signalling web
  const cs = TIS.cells;
  if (k === 0) { const genA = seg(t, .6, 2); if (genA > 0) for (const p of TIS.pairs) drawSignal(cs[p.a], cs[p.b], p, gt, genA); }
  else drawWhoOverlay(t, gt, 1);
  if (TISSUE_LABELS) drawTissueLabels(i => k === 0 ? ease(seg(t, 2.2 + i * .22, 2.8 + i * .22)) : 1 - seg(t, 0, .6));
  ctx.restore();
  vignette(); edgeShade();
  if (k === 0) caption(TITLE(1), seg(t, .8, 1.8));      // was: 'In tissue, every cell talks to every other cell.'
  else caption(TITLE(2), seg(t, 1.5, 2.5));             // was: 'An astrocyte changes. Who caused it?'
}
function drawSignal(A, B, p, gt, a, toward) {
  if (a <= .004) return;
  const x0 = A.x, y0 = A.y, x1 = B.x, y1 = B.y, dx = x1 - x0, dy = y1 - y0;
  const cx = (x0 + x1) / 2 - dy * p.bend, cy = (y0 + y1) / 2 + dx * p.bend;
  const P = u => [(1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1, (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1];
  ctx.save(); ctx.globalAlpha *= a;
  ctx.strokeStyle = toward ? 'rgba(236,242,246,.22)' : 'rgba(210,232,238,.09)'; ctx.lineWidth = toward ? 1.4 : 1;
  ctx.setLineDash(toward ? [] : [2, 5]);
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke(); ctx.setLineDash([]);
  const u0 = ((gt / p.per + p.ph) % 1);
  for (let q = 0; q < 2; q++) {
    let u = (u0 + q * .5) % 1; if (!toward && q === 1) u = 1 - u;       // bidirectional in tissue
    for (let k = 0; k < 5; k++) {
      const uu = u - (toward || q === 0 ? k * .012 : -k * .012); if (uu < 0 || uu > 1) continue;
      const [x, y] = P(uu); ctx.fillStyle = `rgba(236,244,248,${(1 - k / 5) * .85 * Math.sin(u * Math.PI)})`;
      ctx.beginPath(); ctx.arc(x, y, 2.6 - k * .35, 0, TAU); ctx.fill();
    }
  }
  ctx.restore();
}

/* ---- Title 2 → Title 3 hand-off: the same tissue is cut out and lifted into the cortex block ---- */
const TR = 2.6;                                   // seconds prepended to step 2 when arriving from Scene 1
const handoffPlays = () => prevStep < 2;
const BLOCK_T = { cx: 960, cy: 540, w: 420 / .36, h: 270 / .36, r: 26 / .36 };   // block outline in tissue space
const SNAP = { key: '', f: null, u: null };
function tissueSnap(gtE) {
  const q = Math.min(1.5, SCL * DPR), pt = prevStep === 1 ? prevT : 0;
  const key = gtE.toFixed(3) + '|' + q + '|' + pt.toFixed(3);
  if (SNAP.key === key) return SNAP;
  const cw = Math.round(W * q), ch = Math.round(H * q);
  for (const k of ['f', 'u']) if (!SNAP[k] || SNAP[k].width !== cw) { SNAP[k] = document.createElement('canvas'); SNAP[k].width = cw; SNAP[k].height = ch; }
  const heroR = .36 * ease(seg(pt, 1.2, 5.5)), focus = ease(seg(pt, .2, 1.4));
  [[SNAP.f, { heroR, focus }], [SNAP.u, {}]].forEach(([cv2, o]) => {
    const c = cv2.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = rgb(COL.bg); c.fillRect(0, 0, cw, ch);
    c.setTransform(q, 0, 0, q, 0, 0); drawTissue(c, gtE, o);
  });
  SNAP.key = key; return SNAP;
}
function rrPerim(b, n) {                           // points around a rounded rect, clockwise from top-centre
  const { cx, cy, w, h, r } = b, x0 = cx - w / 2, y0 = cy - h / 2, x1 = cx + w / 2, y1 = cy + h / 2, P = [];
  const line = (ax, ay, bx, by) => { const m = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) / 8)); for (let i = 0; i < m; i++) P.push([lerp(ax, bx, i / m), lerp(ay, by, i / m)]); };
  const arc = (ox, oy, a0) => { for (let i = 0; i < 14; i++) { const a = a0 + (i / 14) * Math.PI / 2; P.push([ox + Math.cos(a) * r, oy + Math.sin(a) * r]); } };
  line(cx, y0, x1 - r, y0); arc(x1 - r, y0 + r, -Math.PI / 2); line(x1, y0 + r, x1, y1 - r); arc(x1 - r, y1 - r, 0);
  line(x1 - r, y1, x0 + r, y1); arc(x0 + r, y1 - r, Math.PI / 2); line(x0, y1 - r, x0, y0 + r); arc(x0 + r, y0 + r, Math.PI); line(x0 + r, y0, cx, y0);
  P.push([cx, y0]); return P;
}
const BLOCK_P = rrPerim(BLOCK_T);
function tissueHandoff(t, gt) {
  const S = tissueSnap(gt - t);
  const z = 1.02 + .02 * Math.sin(gt * .045), dx = Math.sin(gt * .03) * 10;     // Scene-1 camera, still running
  const relax = ease(seg(t, .05, .7));             // focus + "who?" overlay dissolve back to the plain tissue
  const cut = ease(seg(t, .5, 1.5));               // the cut traces the block outline
  const lift = ease(seg(t, 1.45, 1.9));            // the piece lifts off the section…
  const e = ease(seg(t, 1.75, TR));                // …then shrinks into the cortex block
  const snap = a => {
    if (a <= .004) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(S.u, 0, 0, W, H);
    if (relax < 1) { ctx.globalAlpha *= 1 - relax; ctx.drawImage(S.f, 0, 0, W, H); }
    ctx.restore();
  };
  const cam = () => { ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2 + dx, -H / 2); };
  // outside: stays put, dims once the cut is made, then leaves
  const outA = lerp(1, .24, ease(seg(t, .9, 1.6))) * (1 - ease(seg(t, 1.6, 2.4)));
  ctx.save(); cam(); snap(outA);
  const pt = prevStep === 1 ? prevT : 0;
  if (prevStep === 1) drawWhoOverlay(pt + t, gt, 1 - seg(t, 0, .45));
  ctx.restore();
  // inside: tissue → block mapping
  const kk = lerp(z * (1 + .035 * lift), .36, e), Cx = W / 2, Cy = lerp(H / 2, 520, e), P0x = lerp(W / 2 - dx, 960, e), P0y = 540;
  const B = BLOCK_T, bx = B.cx - B.w / 2, by = B.cy - B.h / 2;
  const toBlock = () => { ctx.translate(Cx, Cy); ctx.scale(kk, kk); ctx.translate(-P0x, -P0y); };
  if (cut > 0) {
    if (lift > 0) {                                 // lift shadow
      ctx.save(); toBlock(); rr(bx, by, B.w, B.h, B.r);
      ctx.shadowColor = `rgba(0,0,0,${.85 * lift * (1 - e)})`; ctx.shadowBlur = 60 * lift * (1 - e * .7); ctx.shadowOffsetY = 26 * lift * (1 - e);
      ctx.fillStyle = rgb(COL.bg); ctx.fill(); ctx.restore();
    }
    ctx.save(); toBlock(); rr(bx, by, B.w, B.h, B.r); ctx.clip(); snap(1);
    ctx.restore();
    // the full-strength piece shows only where the cut has passed (before that it is identical to the outside)
  }
  // cut line + outline
  if (cut > 0) {
    const n = BLOCK_P.length - 1, m = Math.round(cut * n / 2);
    const lineA = cut < 1 ? .95 : lerp(.95, .35, e), lw = lerp(2.2, 1.5, e);
    ctx.save(); toBlock(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = e > 0 ? `rgba(${lerp(240, 200, e) | 0},${lerp(246, 220, e) | 0},${lerp(250, 230, e) | 0},${lineA})` : `rgba(240,246,250,${lineA})`;
    ctx.lineWidth = lw / kk;
    ctx.beginPath(); ctx.moveTo(BLOCK_P[0][0], BLOCK_P[0][1]); for (let i = 1; i <= m; i++) ctx.lineTo(BLOCK_P[i][0], BLOCK_P[i][1]); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(BLOCK_P[n][0], BLOCK_P[n][1]); for (let i = n - 1; i >= n - m; i--) ctx.lineTo(BLOCK_P[i][0], BLOCK_P[i][1]); ctx.stroke();
    if (cut < 1) for (const p of [BLOCK_P[m], BLOCK_P[n - m]]) {
      ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(p[0], p[1], 3.6 / kk, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.arc(p[0], p[1], 9 / kk, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  ctx.save(); ctx.globalAlpha *= 1 - ease(seg(t, 1.2, 2.0)); vignette(); edgeShade(); ctx.restore();
  if (prevStep === 1) caption(TITLE(2), seg(pt, 1.5, 2.5) * (1 - seg(t, 0, .4)));
  vignette();
}
