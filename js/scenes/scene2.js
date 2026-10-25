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
  const { z, dx } = tisCam(gt);
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
    const sx = W / 2 + z * (src.x - W / 2 + dx), sy = H / 2 + z * (src.y - H / 2);
    const u = ease(seg(t, 3.7 + st * .9, 5.2 + st * .9));
    const x = lerp(sx, c.cx, u) + Math.sin(gt * 1.2 + c.ph) * 3 * u, y = lerp(sy, c.cy, u) + Math.cos(gt + c.ph) * 3 * u;
    c.rd.draw(ctx, x, y, gt, { a, s: lerp(1.15, 1.4, u) });
  });
  // what is happening, as a lower third
  const l1 = seg(t, .9, 1.5) * (1 - seg(t, 3.4, 3.9)), l2 = seg(t, 3.7, 4.2) * (1 - seg(t, 5.7, 6.2));
  txt('Papain digestion, 34 °C', W / 2, 990, { a: l1, size: 24, w: 600, align: 'center', halo: 8 });
  txt('Trituration into a single-cell suspension', W / 2, 990, { a: l2, size: 24, w: 600, align: 'center', halo: 8 });
  typeLegend(960, 880, seg(t, 5.6, 6.3));
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
  for (const c of SUS) {
    const q = susPos(c, T);
    c.rd.draw(ctx, q.x, q.y, gt, { b: q.b, a: q.a, s: lerp(1.4, 1.1, ease(seg(T, 0, 1.6))) });
  }
  // flow-through
  const fa = seg(t4, 2.6, 3.4) * (1 - seg(t4, 5.5, 6.2));
  txt('flow-through', 1830, PY - 60, { a: fa, size: 16, it: true, align: 'center', col: COL.dim });
  chevron(1800, PY, fa * .6); chevron(1830, PY, fa * .4);
  txt('> 99% astrocytes', 960, 840, { a: seg(t4, 4.4, 5.1), size: 34, w: 600, align: 'center', col: COL.teal });
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
