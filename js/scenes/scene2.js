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
const PY = 520, PR = 100, PD = 2.2, PA0 = 1.6, TNEG = PA0 + 4 * PD + 1.4;
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
  drawDish(x, y, r, { tint: [17, 27, 35] });
  ctx.save(); clipCircle(x, y, r - 6);
  ctx.strokeStyle = o.pos ? 'rgba(170,235,222,.16)' : 'rgba(200,214,228,.12)'; ctx.fillStyle = 'rgba(200,214,228,.14)'; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gy = -r; gy <= r; gy += 14) for (let gx = -r; gx <= r; gx += 14) {
    const px = x + gx + ((Math.round(gy / 14)) % 2 ? 7 : 0), py = y + gy;
    if (o.kind === 'lectin') { ctx.moveTo(px + 1.3, py); ctx.arc(px, py, 1.3, 0, TAU); }
    else { ctx.moveTo(px, py + 3); ctx.lineTo(px, py); ctx.lineTo(px - 2.4, py - 2.6); ctx.moveTo(px, py); ctx.lineTo(px + 2.4, py - 2.6); }
  }
  o.kind === 'lectin' ? ctx.fill() : ctx.stroke();
  ctx.restore();
  drawDishRim(x, y, r, { hl: o.hl || 0, hlCol: o.pos ? COL.teal : [230, 240, 248] });
  ctx.restore();
}
function typeLegend(x, y, a, types = TYPES) {
  if (a <= .004) return;
  let cx = x;
  const items = types.map(t => ({ t, w: 46 + TYPENAME[t].length * 10.6 }));
  const total = items.reduce((s, i) => s + i.w, 0) + (items.length - 1) * 24; cx = x - total / 2;
  for (const it of items) {
    ctx.save(); ctx.globalAlpha *= a; const rd = LEG_RD[it.t]; rd.draw(ctx, cx + 13, y - 7, 0, { s: 1.15 }); ctx.restore();
    txt(TYPENAME[it.t], cx + 38, y, { a, size: 21, col: [190, 202, 212] }); cx += it.w + 24;
  }
}
const LEG_RD = { astro: new Round('astro', 3), micro: new Round('micro', 4), endo: new Round('endo', 5), oligo: new Round('oligo', 6), neuron: new Round('neuron', 8) };

/* ---- Title 2 → Title 3 hand-off lives in scene1.js (tissueHandoff) since it reuses the tissue snapshot ---- */
function scene2(k, t, gt) {
  if (k === 0) {
    if (handoffPlays()) { if (t < TR) { tissueHandoff(t, gt); return; } t -= TR; }
    // P5 cortex block → papain → single-cell suspension
    const bx = 960, by = 520, bw = 420, bh = 270;
    const blockA = 1 - seg(t, 2.0, 3.2);
    if (blockA > 0) {
      ctx.save(); ctx.globalAlpha *= blockA;
      const loosen = seg(t, 1.4, 3.0);
      ctx.save(); rr(bx - bw / 2 - loosen * 20, by - bh / 2 - loosen * 14, bw + loosen * 40, bh + loosen * 28, 26 + loosen * 60); ctx.clip();
      ctx.translate(bx, by); ctx.scale(.36, .36); ctx.translate(-W / 2, -H / 2); drawTissue(ctx, gt); ctx.restore();
      rr(bx - bw / 2 - loosen * 20, by - bh / 2 - loosen * 14, bw + loosen * 40, bh + loosen * 28, 26 + loosen * 60);
      ctx.strokeStyle = 'rgba(200,220,230,.35)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    }
    txt('P5 rodent cortex', bx, by - bh / 2 - 34, { a: seg(t, .2, .8) * blockA, size: 22, w: 500, align: 'center' });
    // papain drops
    for (let i = 0; i < 5; i++) {
      const t0 = .5 + i * .18, u = seg(t, t0, t0 + .7); if (u <= 0 || u >= 1) continue;
      const x = bx - 120 + i * 60, y = lerp(by - 260, by - bh / 2 + 20, eOut(u) * u);
      ctx.fillStyle = `rgba(226,236,242,${.8 * (1 - seg(u, .85, 1))})`;
      ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.quadraticCurveTo(x + 5, y, x, y + 4); ctx.quadraticCurveTo(x - 5, y, x, y - 9); ctx.fill();
    }
    txt('papain', bx + 190, by - 210, { a: bump(t, .5, 1, 2.4, 3), size: 18, it: true, col: COL.dim });
    const ca = seg(t, 1.9, 2.8);
    for (const c of SUS) {
      const u = ease(seg(t, 2.1, 4.2)), x = lerp(c.bx, c.cx, u), y = lerp(c.by, c.cy, u);
      c.rd.draw(ctx, x + Math.sin(gt * 1.2 + c.ph) * 3 * u, y + Math.cos(gt + c.ph) * 3 * u, gt, { a: ca, s: lerp(.8, 1.4, ca) });
    }
    caption(TITLE(3), seg(t, 3.4, 4.2));   // was: 'Dissociate: papain → single-cell suspension'
    typeLegend(960, 880, seg(t, 4, 4.8));
    vignette(); return;
  }
  if (k === 1 || k === 2) {
    const T = k === 1 ? Math.min(t, TNEG + 1.2) : TNEG + t;
    const fadeOther = 1;
    // bracket labels
    const bA = k === 1 ? seg(t, .6, 1.4) : 1;
    bracket(PLATES[0].x - PR, PLATES[4].x + PR, 318, 'NEGATIVE SELECTION  ·  removed', bA, [170, 182, 194]);
    bracket(PLATES[5].x - PR, PLATES[5].x + PR, 318, 'POSITIVE  ·  kept', bA * (k === 2 ? 1 : .45), COL.teal);
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
    if (k === 2) {
      const fa = seg(t, 2.6, 3.4) * (1 - seg(t, 5.5, 6.2));
      txt('flow-through', 1830, PY - 60, { a: fa, size: 16, it: true, align: 'center', col: COL.dim });
      chevron(1800, PY, fa * .6); chevron(1830, PY, fa * .4);
    }
    // composition bar of remaining suspension
    const barA = k === 1 ? seg(t, 1, 1.8) : 1 - seg(t, 3.2, 4);
    compBar(560, 830, 800, 18, wsum, tot, 'cells still in suspension', barA);
    if (k === 2) {
      const pa = seg(t, 3.6, 4.4), fillU = ease(seg(t, 3.8, 5.6));
      const ws = { astro: 99.3 * fillU, micro: .25 * fillU, oligo: .25 * fillU, neuron: .2 * fillU, endo: 0 };
      compBar(560, 830, 800, 18, ws, 100, 'bound to the anti-ITGB5 plate', pa, true);
      txt('> 99% astrocytes', 960, 900, { a: seg(t, 5.2, 5.9), size: 34, w: 600, align: 'center', col: COL.teal });
    }
    typeLegend(960, k === 1 && prevStep < 3 ? lerp(880, 975, ease(seg(t, 0, .9))) : 975, 1);
    caption(k === 1 ? TITLE(4) : TITLE(5), seg(t, .3, 1.1));
    // was: TITLE(4) = 'Each plate grabs one cell type. The rest flow on.'
    //      TITLE(5) = 'The last plate keeps the astrocytes.'
    vignette(); return;
  }
  // k === 3 : same trick → three pure cultures
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
    if (i !== 1) drawPlateTexture(x, y, r, appear * (1 - g));
    drawDishRim(x, y, r, { a: appear });
    txt(d.lab, x, y - r - 22, { a: appear * (1 - seg(t, 1.8, 2.4)), size: 18, w: 600, align: 'center', col: i === 1 ? COL.teal : COL.text });
    txt(d.name, DX[d.key], DY + DR + 42, { a: seg(t, 2.2, 3), size: 24, w: 600, align: 'center' });
    txt((d.sub || `${d.src} · ${d.lab} panning`) + d.pur, DX[d.key], DY + DR + 70, { a: seg(t, 2.6, 3.4), size: 17, align: 'center', col: COL.dim });
  });
  caption(TITLE(6), seg(t, 2.4, 3.2));   // was: 'Same trick, three pure cultures.'
  vignette();
}
function drawPlateTexture() { }
function bracket(x0, x1, y, label, a, col) {
  if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = rgb(col, .55); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(x0, y + 10); ctx.lineTo(x0, y); ctx.lineTo(x1, y); ctx.lineTo(x1, y + 10); ctx.stroke(); ctx.restore();
  txt(label, (x0 + x1) / 2, y - 12, { a, size: 14, w: 600, ls: 2.5, align: 'center', col });
}
function chevron(x, y, a) { if (a <= .004) return; ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = 'rgba(220,232,240,.9)'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - 5, y - 9); ctx.lineTo(x + 5, y); ctx.lineTo(x - 5, y + 9); ctx.stroke(); ctx.restore(); }
function compBar(x, y, w, h, ws, tot, label, a, final) {
  if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a;
  rr(x, y, w, h, h / 2); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
  ctx.save(); rr(x, y, w, h, h / 2); ctx.clip();
  let cx = x;
  for (const ty of TYPES) { const ww = tot > 0 ? w * ws[ty] / tot : 0; if (ww <= 0) continue; ctx.fillStyle = rgb(ty === 'astro' ? TP.astro.rim : mix(TP[ty].rim, [0, 0, 0], .15)); ctx.fillRect(cx, y, ww, h); cx += ww; }
  ctx.restore(); ctx.restore();
  txt(label, x, y - 12, { a, size: 15, ls: 1, col: COL.dim });
}
