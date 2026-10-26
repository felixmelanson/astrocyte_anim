'use strict';
/* =====================================================================
   SCENE 2 — immunopanning
   ===================================================================== */
const PLATES = [
  { x: 375, lab: 'BSL-1 lectin', kind: 'lectin' },
  { x: 765, lab: 'anti-CD45' },
  { x: 1155, lab: 'anti-O4' },
  { x: 1545, lab: 'anti-ITGB5', pos: true },
];
const NP = PLATES.length, LASTP = NP - 1;
// "deplete, deplete, deplete, select": the first three plates are one quick sweep; the suspension lingers on the ITGB5 plate
const ARR = [1.6, 2.6, 3.6, 4.6];        // suspension reaches plate k
const LEAVE = [2.1, 3.1, 4.1, 5.3];      // ... and leaves it (the last one is the exit of the flow-through)
const PY = 520, PR = 150, TNEG = LEAVE[LASTP];
const KEPT = () => COL.coral;      // positive selection / the kept plate: the same coral as the reactive astrocyte
const TYPES = ['astro', 'micro', 'endo', 'oligo', 'neuron'];
const TYPENAME = { astro: 'astrocytes', micro: 'microglia', endo: 'endothelial', oligo: 'oligodendrocyte lineage', neuron: 'neurons' };
const SUS = (() => {
  const R = rng(7), counts = { endo: 8, micro: 14, oligo: 16, neuron: 14, astro: 20 }, cells = [];
  for (const [type, n] of Object.entries(counts)) for (let i = 0; i < n; i++) {
    const c = { type, rd: new Round(type, cells.length * 31 + 5) };
    if (type === 'endo') c.cap = 0; else if (type === 'micro') c.cap = i < 7 ? 0 : 1; else if (type === 'oligo') c.cap = 2; else if (type === 'astro') c.cap = LASTP; else c.cap = -1;
    c.bx = 960 + (R() - .5) * 330; c.by = 520 + (R() - .5) * 210;
    let a = R() * TAU, r = Math.sqrt(R()); c.cx = 960 + Math.cos(a) * r * 470; c.cy = 500 + Math.sin(a) * r * 225;
    a = R() * TAU; r = Math.sqrt(R()) * 60; c.ex = 110 + Math.cos(a) * r * .8; c.ey = 520 + Math.sin(a) * r * 1.4;
    c.spots = []; for (let k = 0; k < NP; k++) { const a2 = R() * TAU, r2 = Math.sqrt(R()) * 76 * (PR / 100); c.spots.push([Math.cos(a2) * r2, Math.sin(a2) * r2]); }
    c.ph = R() * TAU; cells.push(c);
  }
  for (let i = cells.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [cells[i], cells[j]] = [cells[j], cells[i]]; }
  return cells;
})();
function susPos(c, T) {
  const A = k => ARR[k], Lv = k => LEAVE[k];
  let x, y, b = 0, a = 1;
  if (T < 1.0) { const u = ease(T); x = lerp(c.cx, c.ex, u); y = lerp(c.cy, c.ey, u); }
  else if (T < A(0)) { const u = ease(seg(T, 1.0, A(0))), s = c.spots[0]; x = lerp(c.ex, PLATES[0].x + s[0], u); y = lerp(c.ey, PY + s[1], u); }
  else {
    let k = 0; while (k < LASTP && T >= ARR[k + 1]) k++; if (c.cap >= 0 && c.cap < k) k = c.cap;
    const s = c.spots[k], px = PLATES[k].x + s[0], py = PY + s[1];
    if (c.cap === k) { b = ease(seg(T, A(k) + .3, A(k) + 1.0)); x = px; y = py; }
    else if (k === LASTP) { const u = ease(seg(T, Lv(k) + .2, Lv(k) + 1.6)); x = lerp(px, 1900, u); y = lerp(py, PY + s[1] * .3, u); a = 1 - seg(T, Lv(k) + .9, Lv(k) + 1.6); }
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
  ctx.strokeStyle = o.pos ? rgb(KEPT(), .2 * UI.gridA) : rgb(UI.grid, .12 * UI.gridA); ctx.fillStyle = rgb(UI.grid, .14 * UI.gridA); ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gy = -r; gy <= r; gy += 14) for (let gx = -r; gx <= r; gx += 14) {
    const px = x + gx + ((Math.round(gy / 14)) % 2 ? 7 : 0), py = y + gy;
    if (o.kind === 'lectin') { ctx.moveTo(px + 1.3, py); ctx.arc(px, py, 1.3, 0, TAU); }
    else { ctx.moveTo(px, py + 3); ctx.lineTo(px, py); ctx.lineTo(px - 2.4, py - 2.6); ctx.moveTo(px, py); ctx.lineTo(px + 2.4, py - 2.6); }
  }
  o.kind === 'lectin' ? ctx.fill() : ctx.stroke();
  ctx.restore();
  drawDishRim(x, y, r, { hl: o.hl || 0, hlCol: THEME.light ? COL.dim : COL.ink });
  if (o.sweep > 0) {            // the kept plate is circled: an orange ring drawn clockwise from the top
    ctx.strokeStyle = rgb(KEPT()); ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * o.sweep); ctx.stroke();
  }
  ctx.restore();
}
function typeLegend(x, y, a, sc = 1, types = TYPES) {
  if (a <= .004) return;
  let cx = x;
  const items = types.map(t => ({ t, w: (46 + TYPENAME[t].length * 10.6) * sc }));
  const gap = 24 * sc, total = items.reduce((s, i) => s + i.w, 0) + (items.length - 1) * gap; cx = x - total / 2;
  for (const it of items) {
    ctx.save(); ctx.globalAlpha *= a; const rd = LEG_RD[it.t]; rd.draw(ctx, cx + 13 * sc, y - 7 * sc, 0, { s: 1.15 * sc }); ctx.restore();
    txt(TYPENAME[it.t], cx + 38 * sc, y, { a, size: 21 * sc, col: COL.legend }); cx += it.w + gap;
  }
}
const TLEG_Y = 850, TLEG_SC = 1.3;      // panning key: bigger, and higher now that the plate captions are gone
const LEG_RD = { astro: new Round('astro', 3), micro: new Round('micro', 4), endo: new Round('endo', 5), oligo: new Round('oligo', 6), neuron: new Round('neuron', 8) };

// Step k = 0 continues straight from step 2's tissue: papain digests the extracellular matrix,
// processes retract, trituration frees rounded single cells, and that suspension is panned.
// (Methods: "cortices were enzymatically (using papain) then mechanically dissociated to
// generate a single-cell suspension".)
const DISS = 6.4;                       // dissociation beat; panning time T starts after it
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
// each suspension cell starts as a real cell of the same type in the tissue (endothelial cells
// from the vessel wall), nearest the centre first
const SUS_SRC = (() => {
  const onScreen = c => c.x > 60 && c.x < W - 60 && c.y > 60 && c.y < H - 60;
  const pools = {};
  TIS.cells.forEach((c, i) => { if (!onScreen(c)) return; (pools[c.type] ||= []).push(i); });
  for (const ty in pools) pools[ty].sort((a, b) => Math.hypot(TIS.cells[a].x - 960, TIS.cells[a].y - 520) - Math.hypot(TIS.cells[b].x - 960, TIS.cells[b].y - 520));
  const ves = VES.filter(p => p[0] > 120 && p[0] < W - 120 && p[1] > 80 && p[1] < H - 80), used = {}, R = rng(17);
  let e = 0;
  return SUS.map(c => {
    const st = R();
    if (c.type === 'endo') { const p = ves[Math.floor((e++ + .5) / 8 * ves.length)]; return { x: p[0], y: p[1], cell: -1, st }; }
    const pool = pools[c.type] || [], n = used[c.type] = (used[c.type] || 0) + 1, i = pool[(n - 1) % pool.length];
    return { x: TIS.cells[i].x, y: TIS.cells[i].y, cell: i, st };
  });
})();
const SRC_OF = new Map(SUS_SRC.filter(s => s.cell >= 0).map(s => [s.cell, s]));

function dissociate(t, gt) {
  const pt = prevStep === 1 ? prevT : STEPS[1].dur;          // how far step 2 had got
  const relax = ease(seg(t, .1, 1.3));
  const heroR0 = .36 * ease(seg(pt, 1.2, 5.5)), focus0 = ease(seg(pt, .2, 1.4));
  const bgA = 1 - ease(seg(t, 1.3, 2.9));                    // matrix / neuropil / vessel digested
  const cellQ = i => {
    const src = SRC_OF.get(i), st = src ? src.st : hash(i * 3.1);
    const sprout = 1 - ease(seg(t, 1.5 + st * .7, 2.9 + st * .7));
    const a = src ? 1 - seg(t, 3.0 + st * .6, 3.4 + st * .6) : 1 - seg(t, 2.0 + st * .6, 3.0 + st * .6);
    return { a, sprout };
  };
  const { z, dx, dy } = tisCam(gt);
  tissueView(gt, { heroR: heroR0 * (1 - relax), focus: focus0 * (1 - relax), bgA, cell: cellQ }, () => {
    if (prevStep === 1 || t < .6) {
      drawWhoOverlay(pt + t, gt, 1 - seg(t, 0, .45));
      drawFocusLabels(() => 1 - seg(t, 0, .45), seg(heroR0, .2, .3));
    }
  });
  ctx.save(); ctx.globalAlpha *= 1 - seg(t, 3.4, 4.4); edgeShade(); ctx.restore();   // step 2's heading band, kept while the tissue is there
  // papain wash: a warm front crosses the field, leaving a faint tint while it digests
  const wash = seg(t, .7, 2.3);
  if (wash > 0 && t < 4.2) {
    const xw = lerp(-500, W + 500, ease(wash)), tint = UI.serumDrop, linger = .07 * (1 - seg(t, 3.0, 4.2));
    const g = ctx.createLinearGradient(xw - 500, 0, xw + 60, 0);
    g.addColorStop(0, rgb(tint, linger)); g.addColorStop(.8, rgb(tint, .16)); g.addColorStop(1, rgb(tint, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, Math.max(0, xw + 60), H);
  }
  // rounded single cells: appear where their tissue cell was, then gather into the suspension
  SUS.forEach((c, i) => {
    const src = SUS_SRC[i], st = src.st;
    const a = src.cell >= 0 ? seg(t, 3.0 + st * .6, 3.4 + st * .6) : seg(t, 2.2 + st * .6, 2.8 + st * .6);
    if (a <= .004) return;
    const sx = W / 2 + z * (src.x - W / 2 + dx), sy = H / 2 + z * (src.y - H / 2 + dy);
    const u = ease(seg(t, 3.7 + st * .9, 5.2 + st * .9));
    const x = lerp(sx, c.cx, u) + Math.sin(gt * 1.2 + c.ph) * 3 * u, y = lerp(sy, c.cy, u) + Math.cos(gt + c.ph) * 3 * u;
    c.rd.draw(ctx, x, y, gt, { a, s: lerp(1.15, 1.4, u) });
  });
  typeLegend(960, TLEG_Y, seg(t, 5.6, 6.3), TLEG_SC);
}
// T = seconds since the suspension started moving to the first plate
function panning(T, gt, o = {}) {
  const bA = seg(T, .6, 1.4);
  const fl = LEAVE[LASTP];                                   // flow-through begins: the three depletion plates fade away
  const negA = 1 - seg(T, fl + .1, fl + .9);
  const sweep = ease(seg(T, ARR[LASTP] - .3, ARR[LASTP] + 1.1));
  bracket(PLATES[0].x - PR, PLATES[LASTP - 1].x + PR, 292, 'Negative Selection (removed)', bA * negA, UI.bracket);
  bracket(PLATES[LASTP].x - PR, PLATES[LASTP].x + PR, 292, 'Positive (Kept)', bA * lerp(.45, 1, sweep), KEPT());
  PLATES.forEach((p, i) => {
    const neg = i < LASTP, a = bA * (neg ? negA : 1);
    if (a <= .004) return;
    const act = neg ? bump(T, ARR[i] - .3, ARR[i] + .1, ARR[i] + .6, ARR[i] + 1.0) : 0;
    if (!(o.noAstro && i === LASTP)) drawPlate(p.x, PY, PR, { kind: p.kind, pos: p.pos, hl: act * .9, sweep: p.pos ? sweep : 0, a });   // (step 4 draws that plate itself)
    if (!(o.noAstro && i === LASTP)) txt(p.lab, p.x, PY - PR - 28, { a, size: 26, w: 600, align: 'center', col: p.pos ? KEPT() : COL.text });
    if (i < LASTP) chevron((p.x + PLATES[i + 1].x) / 2, PY, a * .5);
  });
  chevron(PLATES[0].x - PR - 36, PY, bA * negA * .5);
  // cells (the ones stuck on a depletion plate leave with it)
  for (const c of SUS) {
    if (o.noAstro && c.cap === LASTP) continue;
    const q = susPos(c, T), ca = q.a * (c.cap >= 0 && c.cap < LASTP ? negA : 1);
    c.rd.draw(ctx, q.x, q.y, gt, { b: q.b, a: ca, s: lerp(1.9, 1.55, ease(seg(T, 0, 1.6))) });
  }
  // flow-through
  const fa = seg(T, fl + .1, fl + .6) * (1 - seg(T, fl + 1.8, fl + 2.4)), fx = PLATES[LASTP].x + PR + 60;
  txt('flow-through', fx + 30, PY - 60, { a: fa, size: 22, it: true, align: 'center', col: COL.dim });
  chevron(fx - 10, PY, fa * .6); chevron(fx + 20, PY, fa * .4);
  typeLegend(960, TLEG_Y, 1, TLEG_SC);
}
const CULT = [
  { key: 'M', from: [330, 520, 70], lab: 'anti-CD45', src: 'cortex', name: 'Microglia', cells: MIC, rt: 'micro', pur: '' },
  { key: 'A', from: [PLATES[LASTP].x, PY, PR], lab: 'anti-ITGB5', src: 'cortex', name: 'Astrocytes', cells: AST, rt: 'astro', pur: '; >99%' },
  { key: 'N', from: [1560, 520, 70], lab: 'RGC panning', sub: 'P5 rat retina; sequential panning', src: 'P5 rat retina', name: 'Retinal ganglion cells', cells: RGC, rt: 'neuron', pur: '; >99%' },
];
const CY = DY + 44;                    // step 4's dishes sit a little lower so the group is centred in the clip band
const cultName = (d, x, a) => txt(d.name, x, CY + DR + 64, { a, size: 38, w: 600, align: 'center' });
const cultSub = (d, x, a) => txt((d.sub || `${d.src}; ${d.lab} panning`) + d.pur, x, CY + DR + 112, { a, size: 28, align: 'center', col: COL.dim });
// step 4's last frame, minus the astrocyte dish itself (step 5 carries that one): microglia and RGC dishes + all three labels, at alpha a
function culturesCarry(a, gt) {
  if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a;
  for (const i of [0, 2]) {
    const d = CULT[i], x = DX[d.key];
    drawDish(x, CY, DR); ctx.save(); clipCircle(x, CY, DR - 4); ctx.translate(x, CY); d.cells.forEach(c => c.draw(ctx, { t: gt, sprout: 1 })); ctx.restore(); drawDishRim(x, CY, DR);
  }
  CULT.forEach(d => { cultName(d, DX[d.key], 1); cultSub(d, DX[d.key], 1); });
  ctx.restore();
}
function threeCultures(t, gt, S) {
  const T = TNEG + 7;
  const fo = 1 - seg(t, 0, .7), g = ease(seg(t, .5, 2.0));      // g: plate → culture dish
  // opens on step 3's last frame: the five negative-selection plates fade, the astrocyte plate becomes its culture dish
  if (fo > 0) { ctx.save(); ctx.globalAlpha *= fo; panning(T, gt, { noAstro: true }); ctx.restore(); }
  const spr = ease(seg(t, 2.0, 5.5));
  CULT.forEach((d, i) => {
    const appear = i === 1 ? 1 : seg(t, .4, 1.1);
    const x = lerp(d.from[0], DX[d.key], g), y = lerp(d.from[1], CY, g), r = lerp(d.from[2], DR, g);
    const cult = i === 1 ? seg(t, .3, 1.1) : 1, plateA = i === 1 ? 1 - cult : 0;
    if (plateA > .004) drawPlate(x, y, r, { pos: true, sweep: 1, a: plateA });
    drawDish(x, y, r, { a: appear * cult });
    ctx.save(); ctx.globalAlpha *= appear; clipCircle(x, y, r - 4);
    // captured round cells → spreading cultured cells
    const ra = 1 - seg(t, 1.6, 2.6);
    if (ra > 0) {
      if (i === 1) { for (const c of SUS) if (c.cap === LASTP) { const q = susPos(c, T); c.rd.draw(ctx, x + (q.x - d.from[0]) * r / d.from[2], y + (q.y - d.from[1]) * r / d.from[2], gt, { b: 1, a: ra, s: lerp(1.55, 1.9, g) }); } }
      else { const R = rng(i * 77); for (let j = 0; j < 12; j++) { const a2 = R() * TAU, rr2 = Math.sqrt(R()) * .78; LEG_RD[d.rt].draw(ctx, x + Math.cos(a2) * rr2 * r, y + Math.sin(a2) * rr2 * r, gt, { b: 1, a: ra, s: lerp(1, 1.5, g) }); } }
    }
    const ca = seg(t, 1.5, 2.4);
    if (ca > 0) { ctx.translate(x, y); ctx.scale(r / DR, r / DR); d.cells.forEach(c => c.draw(ctx, { t: gt, sprout: spr, a: ca })); }
    ctx.restore();
    drawDishRim(x, y, r, { a: appear });
    txt(d.lab, x, y - r - (i === 1 ? 28 : 22), { a: appear * (1 - seg(t, 1.8, 2.4)), size: i === 1 ? 26 : 18, w: 600, align: 'center', col: i === 1 ? KEPT() : COL.text });
    cultName(d, DX[d.key], seg(t, 2.2, 3)); cultSub(d, DX[d.key], seg(t, 2.6, 3.4));
  });
  vignette();
  caption(S.cap, seg(t, 2.4, 3.2)); subcap(S.sub, seg(t, 2.8, 3.6));
}
function bracket(x0, x1, y, label, a, col) {      // a soft rule that fades out at both ends, label above
  if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a;
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, rgb(col, 0)); g.addColorStop(.12, rgb(col, .5)); g.addColorStop(.88, rgb(col, .5)); g.addColorStop(1, rgb(col, 0));
  ctx.strokeStyle = g; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.restore();
  txt(label, (x0 + x1) / 2, y - 16, { a, size: 26, w: 600, align: 'center', col });
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
