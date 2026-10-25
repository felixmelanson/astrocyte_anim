'use strict';
/* =====================================================================
   SCENE 2 — immunopanning
   ===================================================================== */
const PLATES = [
  { x: 330, lab: 'BSL-1 lectin', rem: ['endothelial cells', 'microglia'], kind: 'lectin' },
  { x: 590, lab: '2° antibody only', rem: ['microglia /', 'macrophages'] },
  { x: 850, lab: 'anti-CD45', rem: ['microglia /', 'macrophages'] },
  { x: 1110, lab: 'anti-O4', rem: ['oligodendrocyte', 'lineage'] },
  { x: 1370, lab: 'anti-O4', rem: ['oligodendrocyte', 'lineage'] },
  { x: 1630, lab: 'anti-ITGB5', rem: ['astrocytes'], pos: true },
];
const PY = 520, PR = 100, PD = 2.0, PA0 = 1.6, TNEG = PA0 + 4 * PD + 1.4;
const TYPES = ['astro', 'micro', 'endo', 'oligo', 'neuron'];
const TYPENAME = { astro: 'astrocytes', micro: 'microglia', endo: 'endothelial', oligo: 'oligodendrocyte lineage', neuron: 'neurons' };
const SUS = (() => {
  const R = rng(7), counts = { endo: 8, micro: 14, oligo: 16, neuron: 14, astro: 20 }, cells = [];
  for (const [type, n] of Object.entries(counts)) for (let i = 0; i < n; i++) {
    const c = { type, rd: new Round(type, cells.length * 31 + 5) };
    if (type === 'endo') c.cap = 0; else if (type === 'micro') c.cap = i < 7 ? 0 : i < 11 ? 1 : 2; else if (type === 'oligo') c.cap = i < 11 ? 3 : 4; else if (type === 'astro') c.cap = 5; else c.cap = -1;
    c.bx = 960 + (R() - .5) * 330; c.by = 520 + (R() - .5) * 210;
    let a = R() * TAU, r = Math.sqrt(R()); c.cx = 960 + Math.cos(a) * r * 470; c.cy = 500 + Math.sin(a) * r * 225;
    a = R() * TAU; r = Math.sqrt(R()) * 60; c.ex = 110 + Math.cos(a) * r * .8; c.ey = 520 + Math.sin(a) * r * 1.4;
    c.spots = []; for (let k = 0; k < 6; k++) { const a2 = R() * TAU, r2 = Math.sqrt(R()) * 76; c.spots.push([Math.cos(a2) * r2, Math.sin(a2) * r2]); }
    c.ph = R() * TAU; cells.push(c);
  }
  for (let i = cells.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [cells[i], cells[j]] = [cells[j], cells[i]]; }
  return cells;
})();
function susPos(c, T) {
  const A = k => PA0 + k * PD, Lv = k => A(k) + 1.4;
  let x, y, b = 0, a = 1;
  if (T < 1.0) { const u = ease(T); x = lerp(c.cx, c.ex, u); y = lerp(c.cy, c.ey, u); }
  else if (T < A(0)) { const u = ease(seg(T, 1.0, A(0))), s = c.spots[0]; x = lerp(c.ex, PLATES[0].x + s[0], u); y = lerp(c.ey, PY + s[1], u); }
  else {
    let k = Math.min(5, Math.floor((T - A(0)) / PD)); if (c.cap >= 0 && c.cap < k) k = c.cap;
    const s = c.spots[k], px = PLATES[k].x + s[0], py = PY + s[1];
    if (c.cap === k) { b = ease(seg(T, A(k) + .3, A(k) + 1.0)); x = px; y = py; }
    else if (k === 5) { const u = ease(seg(T, Lv(5) + .2, Lv(5) + 1.6)); x = lerp(px, 1900, u); y = lerp(py, PY + s[1] * .3, u); a = 1 - seg(T, Lv(5) + .9, Lv(5) + 1.6); }
    else if (T < Lv(k)) { x = px; y = py; }
    else { const u = ease(seg(T, Lv(k), A(k + 1))), s2 = c.spots[k + 1]; x = lerp(px, PLATES[k + 1].x + s2[0], u); y = lerp(py, PY + s2[1], u) - Math.sin(u * Math.PI) * 55; }
  }
  x += Math.sin(T * 1.7 + c.ph) * 3 * (1 - b); y += Math.cos(T * 1.3 + c.ph) * 3 * (1 - b);
  return { x, y, b, a };
}
function drawPlate(x, y, r, o = {}) {
  const a = o.a ?? 1; if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a;
  drawDish(x, y, r, { tint: UI.plate });
  ctx.save(); clipCircle(x, y, r - 6);
  ctx.strokeStyle = o.pos ? rgb(UI.gridPos, .16 * UI.gridA) : rgb(UI.grid, .12 * UI.gridA); ctx.fillStyle = rgb(UI.grid, .14 * UI.gridA); ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gy = -r; gy <= r; gy += 14) for (let gx = -r; gx <= r; gx += 14) {
    const px = x + gx + ((Math.round(gy / 14)) % 2 ? 7 : 0), py = y + gy;
    if (o.kind === 'lectin') { ctx.moveTo(px + 1.3, py); ctx.arc(px, py, 1.3, 0, TAU); }
    else { ctx.moveTo(px, py + 3); ctx.lineTo(px, py); ctx.lineTo(px - 2.4, py - 2.6); ctx.moveTo(px, py); ctx.lineTo(px + 2.4, py - 2.6); }
  }
  o.kind === 'lectin' ? ctx.fill() : ctx.stroke();
  ctx.restore();
  drawDishRim(x, y, r, { hl: o.hl || 0, hlCol: o.pos ? COL.teal : THEME.light ? COL.dim : COL.ink });
  ctx.restore();
}
function typeLegend(x, y, a, types = TYPES) {
  if (a <= .004) return;
  let cx = x;
  const items = types.map(t => ({ t, w: 46 + TYPENAME[t].length * 10.6 }));
  const total = items.reduce((s, i) => s + i.w, 0) + (items.length - 1) * 24; cx = x - total / 2;
  for (const it of items) {
    ctx.save(); ctx.globalAlpha *= a; const rd = LEG_RD[it.t]; rd.draw(ctx, cx + 13, y - 7, 0, { s: 1.15 }); ctx.restore();
    txt(TYPENAME[it.t], cx + 38, y, { a, size: 21, col: COL.legend }); cx += it.w + 24;
  }
}
const LEG_RD = { astro: new Round('astro', 3), micro: new Round('micro', 4), endo: new Round('endo', 5), oligo: new Round('oligo', 6), neuron: new Round('neuron', 8) };

// Step k = 0: dissociation (Methods: "cortices were enzymatically (using papain) then mechanically
// dissociated to generate a single-cell suspension") → negative plates → positive plate.
// Three numbered stages, one idea at a time: 1 dissect cortex · 2 papain digest · 3 triturate.
const DISS = 9.5;                       // dissociation beat; panning time T starts after it
function scene2(k, t, gt, S) {
  if (k === 0) {
    if (t < DISS) dissociate(t, gt); else panning(t - DISS, gt);
    vignette();
    caption(S.cap, seg(t, .6, 1.4)); subcap(S.sub, seg(t, 1, 1.8));
    return;
  }
  threeCultures(t, gt, S);
}

/* ---------------- dissociation ---------------- */
const BRAIN = { x: 600, y: 560, s: 1.25 };               // lateral view, rostral left; local units ×s
function cerebrumPath(c) {
  c.moveTo(-160, 20);
  c.bezierCurveTo(-170, -70, -60, -130, 40, -120);
  c.bezierCurveTo(110, -112, 140, -60, 130, 0);
  c.bezierCurveTo(125, 40, 80, 60, 20, 62);
  c.bezierCurveTo(-60, 64, -140, 58, -160, 20);
  c.closePath();
}
function cortexPath(c) {                 // the cortical shell over the cerebrum
  c.moveTo(-160, 20);
  c.bezierCurveTo(-170, -70, -60, -130, 40, -120);
  c.bezierCurveTo(110, -112, 140, -60, 130, 0);
  c.lineTo(94, 4);
  c.bezierCurveTo(100, -40, 80, -78, 35, -80);
  c.bezierCurveTo(-40, -86, -116, -48, -120, 24);
  c.closePath();
}
function brainBack(c, fill, line) {       // olfactory bulb, cerebellum, brainstem, cerebrum (no cortex)
  c.fillStyle = fill; c.strokeStyle = line;
  c.beginPath(); c.moveTo(66, 48); c.bezierCurveTo(120, 58, 160, 70, 198, 92); c.bezierCurveTo(204, 104, 194, 112, 180, 108); c.bezierCurveTo(130, 94, 88, 86, 48, 70); c.closePath(); c.fill(); c.stroke();   // brainstem
  c.beginPath(); c.ellipse(158, 12, 54, 50, 0, 0, TAU); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(-190, 18, 34, 24, -.25, 0, TAU); c.fill(); c.stroke();
  c.beginPath(); cerebrumPath(c); c.fill(); c.stroke();
}
const CORTEX_C = [-10, -70];             // rough centre of the cortex shape (local)
const SPECKS = (() => { const R = rng(73), out = [], pc = document.createElement('canvas').getContext('2d'); pc.beginPath(); cortexPath(pc); while (out.length < 40) { const x = -170 + R() * 310, y = -130 + R() * 155; if (pc.isPointInPath(x, y)) out.push([x, y, .8 + R() * .9]); } return out; })();
const TUBE = { x: 1270, y: 560, s: 3.8 };                // big 1.5 ml tube; (x, y) = liquid level
function tubeBody(c) { c.moveTo(-17, -46); c.lineTo(17, -46); c.lineTo(15, 8); c.quadraticCurveTo(10, 46, 0, 50); c.quadraticCurveTo(-10, 46, -15, 8); c.closePath(); }
const tubePt = (lx, ly) => [TUBE.x + lx * TUBE.s, TUBE.y + ly * TUBE.s];
const PIECES = [[-7, 4], [5, 2], [-1, 11], [8, 13], [-9, 18], [2, 22], [-3, 30]].map(([x, y], i) => { const R = rng(90 + i); return { x, y, r: 3.4 + R() * 1.2, ph: R() * TAU, st: R(), h: [0, 1, 2].map(() => ({ k: 2 + (R() * 3 | 0), a: .08 + R() * .08, p: R() * TAU })) }; });
const TUBE_HOME = SUS.map((c, i) => { const R = rng(500 + i), y = -6 + R() * 44, half = 12.5 * (y < 8 ? 1 : 1 - (y - 8) / 46); return [(R() * 2 - 1) * half, y]; });
const breakT = j => 6.2 + j * .2;

function stageLabel(x, y, num, title, sub, a) {
  if (a <= .004) return;
  ctx.font = `600 24px ${FONT}`; const tw = ctx.measureText(title).width, w = 40 + tw, x0 = x - w / 2;
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = rgb(COL.teal); ctx.beginPath(); ctx.arc(x0 + 14, y - 8, 14, 0, TAU); ctx.fill(); ctx.restore();
  txt(num, x0 + 14, y - 2, { a, size: 17, w: 700, align: 'center', col: COL.bg });
  txt(title, x0 + 40, y, { a, size: 24, w: 600 });
  if (sub) txt(sub, x, y + 30, { a, size: 18, align: 'center', col: COL.dim });
}
function drawPiece(p, x, y, r, a, soft) {
  const pal = TP.astro;
  const fn = th => { let f = 1; for (const q of p.h) f += q.a * (1 - soft) * Math.sin(q.k * th + q.p); return f; };
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(p.ph);
  ctx.beginPath(); addSoma(ctx, r, fn, 1, 1.6); ctx.fillStyle = rgb(pal.rim); ctx.fill();
  ctx.beginPath(); addSoma(ctx, r, fn, 1, 0); ctx.fillStyle = rgb(mix(pal.body, pal.rim, .12)); ctx.fill();
  ctx.fillStyle = rgb(pal.rim, .45); for (let i = 0; i < 4; i++) { const an = i * 1.7, rr2 = r * .45; ctx.beginPath(); ctx.arc(Math.cos(an) * rr2, Math.sin(an) * rr2, r * .13, 0, TAU); ctx.fill(); }
  ctx.restore();
}

function dissociate(t, gt) {
  const pal = TP.astro, rest = THEME.light ? [234, 236, 239] : [34, 40, 48];
  const B = BRAIN, sB = B.s;
  // ---- 1 · brain, cortex lifts off
  const brainA = seg(t, .3, 1.0) * (1 - seg(t, 7.4, 8.0));
  const liftU = ease(seg(t, 1.4, 2.2));
  const fly = ease(seg(t, 2.6, 3.5));                    // cortex → tube mouth
  if (brainA > 0) {
    ctx.save(); ctx.globalAlpha *= brainA; ctx.translate(B.x, B.y); ctx.scale(sB, sB);
    ctx.lineWidth = 1.6 / sB; brainBack(ctx, rgb(rest), fg(.4));
    ctx.strokeStyle = fg(.22); for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(120, -22 + i * 18); ctx.quadraticCurveTo(160, -30 + i * 20, 206, -10 + i * 16); ctx.stroke(); }   // cerebellar folia
    if (liftU > 0) { ctx.save(); ctx.globalAlpha *= liftU; ctx.setLineDash([5 / sB, 5 / sB]); ctx.beginPath(); cortexPath(ctx); ctx.strokeStyle = fg(.35); ctx.stroke(); ctx.restore(); }
    ctx.restore();
  }
  // the cortex itself (in the brain → lifted → flying into the tube)
  if (t < 3.5 && brainA > 0) {
    const [mx, my] = tubePt(0, -50);
    const lx = B.x + CORTEX_C[0] * sB, ly = B.y + (CORTEX_C[1] - 46 * liftU) * sB;
    const x = lerp(lx, mx, fly), y = lerp(ly, my, fly) - Math.sin(fly * Math.PI) * 120, sc = sB * lerp(1, .22, fly);
    ctx.save(); ctx.globalAlpha *= seg(t, .3, 1.0) * (1 - seg(fly, .85, 1)); ctx.translate(x, y); ctx.rotate(-.06 * liftU + .5 * fly); ctx.scale(sc, sc); ctx.translate(-CORTEX_C[0], -CORTEX_C[1]);
    ctx.beginPath(); cortexPath(ctx); ctx.fillStyle = rgb(mix(pal.body, pal.rim, .1)); ctx.fill();
    ctx.fillStyle = rgb(pal.rim, .5); for (const [px, py, r] of SPECKS) { ctx.beginPath(); ctx.arc(px, py, r * 1.6, 0, TAU); ctx.fill(); }
    ctx.beginPath(); cortexPath(ctx); ctx.strokeStyle = rgb(pal.rim); ctx.lineWidth = 2.2 / sc; ctx.stroke();
    ctx.restore();
  }
  stageLabel(B.x, 820, '1', 'Dissect cortex', 'P5 rat or mouse', seg(t, .8, 1.4) * (1 - seg(t, 7.4, 8.0)));
  // arrow brain → tube
  const arA = seg(t, 2.2, 2.6) * (1 - seg(t, 7.4, 8.0));
  if (arA > 0) {
    ctx.save(); ctx.globalAlpha *= arA; ctx.strokeStyle = fg(.3); ctx.fillStyle = fg(.3); ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(880, 560); ctx.lineTo(1120, 560); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1132, 560); ctx.lineTo(1118, 552); ctx.lineTo(1118, 568); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // ---- 2 · tube: papain digest
  const tubeA = seg(t, 2.0, 2.6) * (1 - seg(t, 8.4, 9.0));
  const papain = seg(t, 3.9, 4.6), soft = ease(seg(t, 4.4, 5.8));
  if (tubeA > 0) {
    ctx.save(); ctx.globalAlpha *= tubeA; ctx.translate(TUBE.x, TUBE.y); ctx.scale(TUBE.s, TUBE.s);
    ctx.beginPath(); tubeBody(ctx); ctx.fillStyle = rgb(UI.rim, UI.glassA); ctx.fill();
    ctx.save(); ctx.beginPath(); tubeBody(ctx); ctx.clip();
    ctx.fillStyle = rgb(mix(liqC([70, 86, 100]), UI.serumDrop, .35 * papain), .45); ctx.fillRect(-20, -12, 40, 70);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-20, -12, 40, .5);
    ctx.restore();
    ctx.lineWidth = 1.4 / TUBE.s; ctx.beginPath(); tubeBody(ctx); ctx.strokeStyle = rgb(UI.rim, Math.min(1, .6 * UI.rimA)); ctx.stroke();
    ctx.fillStyle = rgb(UI.rim, .3 * UI.rimA); rr(-20, -52, 40, 7, 2); ctx.fill();
    ctx.restore();
    // papain drops
    for (let i = 0; i < 3; i++) {
      const u = seg(t, 3.9 + i * .16, 4.3 + i * .16); if (u <= 0 || u >= 1) continue;
      const x = TUBE.x + (i - 1) * 12, y = lerp(TUBE.y - 330, TUBE.y - 20, u * u);
      ctx.fillStyle = rgb(UI.serumDrop, .9); ctx.beginPath(); ctx.moveTo(x, y - 11); ctx.quadraticCurveTo(x + 6, y, x, y + 5); ctx.quadraticCurveTo(x - 6, y, x, y - 11); ctx.fill();
    }
  }
  // pieces: the cortex splits as it enters, falls into the liquid, softens, then breaks up
  if (t > 3.3) PIECES.forEach((p, j) => {
    const u = ease(seg(t, 3.3 + p.st * .3, 4.0 + p.st * .3)), ba = 1 - seg(t, breakT(j), breakT(j) + .35);
    if (ba <= 0) return;
    const [mx, my] = tubePt(0, -46), wob = soft * 1.2;
    const [hx, hy] = tubePt(p.x + Math.sin(gt * 1.3 + p.ph) * wob, p.y + Math.cos(gt * 1.1 + p.ph) * wob);
    const x = lerp(mx, hx, u), y = lerp(my, hy, u);
    drawPiece(p, x, y, p.r * TUBE.s * (1 - .28 * soft) * lerp(.6, 1, ba), tubeA * ba, soft);
  });
  // ---- 3 · trituration pipette
  const pIn = seg(t, 5.8, 6.2), pOut = seg(t, 7.4, 7.8);
  if (pIn > 0 && pOut < 1) {
    const u = seg(t, 6.2, 7.4), stroke = .5 - .5 * Math.cos(u * TAU * 3);
    const tipY = lerp(TUBE.y - 330, TUBE.y + 110, eOut(pIn)) - stroke * 90 - eOut(pOut) * 520;
    drawPipette(TUBE.x + 4, tipY, u > 0 && u < 1 ? .2 + .6 * stroke : .2, liqC([70, 86, 100]), null, 1 - pOut, 0);
  }
  const lab2 = seg(t, 2.8, 3.4) * (1 - seg(t, 5.8, 6.2)), lab3 = seg(t, 6.0, 6.5) * (1 - seg(t, 8.0, 8.6));
  stageLabel(TUBE.x, 820, '2', 'Papain digest', '34 °C · enzyme loosens the tissue', lab2);
  stageLabel(TUBE.x, 820, '3', 'Triturate', 'pipetting frees single cells', lab3);
  // ---- single cells: freed by trituration, then poured into the suspension
  SUS.forEach((c, i) => {
    const j = i % PIECES.length, a0 = seg(t, breakT(j) + .05, breakT(j) + .45); if (a0 <= 0) return;
    const p = PIECES[j], home = TUBE_HOME[i];
    const [bx, by] = tubePt(p.x, p.y), [hx, hy] = tubePt(home[0] + Math.sin(gt * .9 + c.ph) * 1, home[1] + Math.cos(gt * .7 + c.ph) * 1);
    const m = ease(seg(t, breakT(j) + .05, breakT(j) + .9));
    let x = lerp(bx, hx, m), y = lerp(by, hy, m), s = .9;
    const st = hash(i * 1.37), u = ease(seg(t, 7.9 + st * .6, 8.8 + st * .6));
    if (u > 0) {
      const mx = TUBE.x, my = TUBE.y - 280;
      x = (1 - u) * (1 - u) * x + 2 * (1 - u) * u * mx + u * u * c.cx; y = (1 - u) * (1 - u) * y + 2 * (1 - u) * u * my + u * u * c.cy; s = lerp(.9, 1.4, u);
    }
    if (u >= 1) { x += Math.sin(gt * 1.2 + c.ph) * 3; y += Math.cos(gt + c.ph) * 3; }
    c.rd.draw(ctx, x, y, gt, { a: a0, s });
  });
  typeLegend(960, 880, seg(t, 8.9, 9.5));
}
// T = seconds since the suspension started moving to the first plate
function panning(T, gt) {
  const t4 = T - TNEG;                  // time into the positive-selection beat
  const bA = seg(T, .6, 1.4);
  const posA = lerp(.45, 1, seg(T, PA0 + 5 * PD - .6, PA0 + 5 * PD));
  bracket(PLATES[0].x - PR, PLATES[4].x + PR, 318, 'NEGATIVE SELECTION  ·  removed', bA, UI.bracket);
  bracket(PLATES[5].x - PR, PLATES[5].x + PR, 318, 'POSITIVE  ·  kept', bA * posA, COL.teal);
  PLATES.forEach((p, i) => {
    const act = i === 5 ? (T > PA0 + 5 * PD - .3 ? 1 : 0) : bump(T, PA0 + i * PD - .3, PA0 + i * PD + .1, PA0 + i * PD + 1.4, PA0 + i * PD + 2);
    drawPlate(p.x, PY, PR, { kind: p.kind, pos: p.pos, hl: act * .9, a: bA });
    txt(p.lab, p.x, PY - PR - 26, { a: bA, size: 20, w: 600, align: 'center', col: p.pos ? COL.teal : COL.text });
    p.rem.forEach((l, j) => txt(l, p.x, PY + PR + 34 + j * 21, { a: bA * .95, size: 16, align: 'center', col: p.pos ? COL.teal : COL.dim }));
    if (i < 5) chevron((p.x + PLATES[i + 1].x) / 2, PY, bA * .5);
  });
  chevron(210, PY, bA * .5);
  // cells
  let wsum = {}, tot = 0; TYPES.forEach(ty => wsum[ty] = 0);
  for (const c of SUS) {
    const q = susPos(c, T);
    c.rd.draw(ctx, q.x, q.y, gt, { b: q.b, a: q.a, s: lerp(1.4, 1.1, ease(seg(T, 0, 1.6))) });
    const w = (1 - q.b) * (c.cap === -1 && T > PA0 + 5 * PD + 1.6 ? 0 : 1);
    wsum[c.type] += w; tot += w;
  }
  // flow-through
  const fa = seg(t4, 2.6, 3.4) * (1 - seg(t4, 5.5, 6.2));
  txt('flow-through', 1830, PY - 60, { a: fa, size: 16, it: true, align: 'center', col: COL.dim });
  chevron(1800, PY, fa * .6); chevron(1830, PY, fa * .4);
  // composition bar: what is still in suspension → what the positive plate caught
  compBar(560, 830, 800, 18, wsum, tot, 'cells still in suspension', seg(T, 1, 1.8) * (1 - seg(t4, 3.2, 4)));
  const pa = seg(t4, 3.6, 4.4), fillU = ease(seg(t4, 3.8, 5.6));
  const ws = { astro: 99.3 * fillU, micro: .25 * fillU, oligo: .25 * fillU, neuron: .2 * fillU, endo: 0 };
  compBar(560, 830, 800, 18, ws, 100, 'bound to the anti-ITGB5 plate', pa, true);
  txt('> 99% astrocytes', 960, 900, { a: seg(t4, 5.2, 5.9), size: 34, w: 600, align: 'center', col: COL.teal });
  typeLegend(960, lerp(880, 975, ease(seg(T, 0, .9))), 1);
}
// step k = 1: same trick → three pure cultures
function threeCultures(t, gt, S) {
  const T = TNEG + 7;
  const fo = 1 - seg(t, 0, .7);
  if (fo > 0) {
    ctx.save(); ctx.globalAlpha *= fo;
    PLATES.slice(0, 5).forEach(p => drawPlate(p.x, PY, PR, { kind: p.kind }));
    for (const c of SUS) if (c.cap >= 0 && c.cap < 5) { const q = susPos(c, T); c.rd.draw(ctx, q.x, q.y, gt, { b: 1, s: 1.1 }); }
    typeLegend(960, 975, 1);
    ctx.restore();
  }
  const g = ease(seg(t, .5, 2.0));      // plate → culture dish
  const dishes = [
    { key: 'M', from: [360, 520, 70], lab: 'anti-CD45', src: 'cortex', name: 'Microglia', cells: MIC, rt: 'micro', pur: '' },
    { key: 'A', from: [PLATES[5].x, PY, PR], lab: 'anti-ITGB5', src: 'cortex', name: 'Astrocytes', cells: AST, rt: 'astro', pur: ' · >99%' },
    { key: 'N', from: [1560, 520, 70], lab: 'RGC panning', sub: 'P5 rat retina · sequential panning', src: 'P5 rat retina', name: 'Retinal ganglion cells', cells: RGC, rt: 'neuron', pur: ' · >99%' },
  ];
  const spr = ease(seg(t, 2.0, 5.5));
  dishes.forEach((d, i) => {
    const appear = i === 1 ? 1 : seg(t, .4, 1.1);
    const x = lerp(d.from[0], DX[d.key], g), y = lerp(d.from[1], DY, g), r = lerp(d.from[2], DR, g);
    drawDish(x, y, r, { a: appear });
    ctx.save(); ctx.globalAlpha *= appear; clipCircle(x, y, r - 4);
    // captured round cells → spreading cultured cells
    const ra = 1 - seg(t, 1.6, 2.6);
    if (ra > 0) {
      if (i === 1) { for (const c of SUS) if (c.cap === 5) { const q = susPos(c, T); c.rd.draw(ctx, x + (q.x - d.from[0]) * r / d.from[2], y + (q.y - d.from[1]) * r / d.from[2], gt, { b: 1, a: ra, s: lerp(1.1, 1.5, g) }); } }
      else { const R = rng(i * 77); for (let j = 0; j < 12; j++) { const a2 = R() * TAU, rr2 = Math.sqrt(R()) * .78; LEG_RD[d.rt].draw(ctx, x + Math.cos(a2) * rr2 * r, y + Math.sin(a2) * rr2 * r, gt, { b: 1, a: ra, s: lerp(1, 1.5, g) }); } }
    }
    const ca = seg(t, 1.5, 2.4);
    if (ca > 0) { ctx.translate(x, y); ctx.scale(r / DR, r / DR); d.cells.forEach(c => c.draw(ctx, { t: gt, sprout: spr, a: ca })); }
    ctx.restore();
    drawDishRim(x, y, r, { a: appear });
    txt(d.lab, x, y - r - 22, { a: appear * (1 - seg(t, 1.8, 2.4)), size: 18, w: 600, align: 'center', col: i === 1 ? COL.teal : COL.text });
    txt(d.name, DX[d.key], DY + DR + 42, { a: seg(t, 2.2, 3), size: 24, w: 600, align: 'center' });
    txt((d.sub || `${d.src} · ${d.lab} panning`) + d.pur, DX[d.key], DY + DR + 70, { a: seg(t, 2.6, 3.4), size: 17, align: 'center', col: COL.dim });
  });
  vignette();
  caption(S.cap, seg(t, 2.4, 3.2)); subcap(S.sub, seg(t, 2.8, 3.6));
}
function bracket(x0, x1, y, label, a, col) {
  if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = rgb(col, .55); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(x0, y + 10); ctx.lineTo(x0, y); ctx.lineTo(x1, y); ctx.lineTo(x1, y + 10); ctx.stroke(); ctx.restore();
  txt(label, (x0 + x1) / 2, y - 12, { a, size: 14, w: 600, ls: 2.5, align: 'center', col });
}
function chevron(x, y, a) { if (a <= .004) return; ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = fg(.9); ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - 5, y - 9); ctx.lineTo(x + 5, y); ctx.lineTo(x - 5, y + 9); ctx.stroke(); ctx.restore(); }
function compBar(x, y, w, h, ws, tot, label, a, final) {
  if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a;
  rr(x, y, w, h, h / 2); ctx.fillStyle = fg(.06); ctx.fill();
  ctx.save(); rr(x, y, w, h, h / 2); ctx.clip();
  let cx = x;
  for (const ty of TYPES) { const ww = tot > 0 ? w * ws[ty] / tot : 0; if (ww <= 0) continue; ctx.fillStyle = rgb(ty === 'astro' ? TP.astro.rim : mix(TP[ty].rim, [0, 0, 0], .15)); ctx.fillRect(cx, y, ww, h); cx += ww; }
  ctx.restore(); ctx.restore();
  txt(label, x, y - 12, { a, size: 15, ls: 1, col: COL.dim });
}
