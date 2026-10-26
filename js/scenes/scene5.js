'use strict';
/* =====================================================================
   SCENE 5 — readout → heatmap
   ===================================================================== */
const GENES = {
  pan: ['Lcn2', 'Steap4', 'S1pr3', 'Timp1', 'Hspb1', 'Cxcl10', 'Cd44', 'Osmr', 'Cp', 'Serpina3n', 'Aspg', 'Vim', 'Gfap'],
  a1: ['H2-T23', 'Serping1', 'H2-D1', 'Ggta1', 'Iigp1', 'Gbp2', 'Fbln5', 'Ugt1a1', 'Fkbp5', 'Psmb8', 'Srgn', 'Amigo2'],
  oth: ['Clcf1', 'Tgm1', 'Ptx3', 'S100a10', 'Sphk1', 'Cd109', 'Ptgs2', 'Emp1', 'Slc10a6', 'Tm4sf1', 'B3gnt5', 'Cd14'],
};
const GLIST = [...GENES.pan.map(g => [g, 0]), ...GENES.a1.map(g => [g, 1]), ...GENES.oth.map(g => [g, 2])];
// Replot of Fig. 1a (data in fig1a.js): black / red / green block bars, the figure's 15-step
// blue–white–red scale, significance stars, row labels on the right, blocks of rows as spaced in print.
const FA = { x0: 250, cw: 30, rh: 26, gap: 14, top: 308 };      // top: the whole figure sits inside the clip band (CROP)
const FA_ROWY = (() => { const ys = []; let y = 0; FIG1A_GROUPS.forEach((n, g) => { for (let i = 0; i < n; i++) { ys.push(y); y += FA.rh; } y += FA.gap; }); return ys; })();
const faX = col => FA.x0 + col * FA.cw;
const FA_LABX = FA.x0 + 37 * FA.cw + 16;
const FA_BLOCKS = [[0, 12, 'Pan reactive'], [13, 24, 'A1 specific'], [25, 36, 'A2 specific']];
const faBlockCol = gi => THEME.light ? [[24, 24, 24], [237, 32, 36], [62, 178, 73]][gi] : [[214, 220, 226], [237, 62, 56], [72, 190, 86]][gi];
function faCell(zi) {
  const c = FIG1A_STEPS[zi];
  if (THEME.light) return c;
  const k = Math.pow(1 - Math.abs(zi - 7) / 7, 1.5) * .88;      // dark slides: neutral cells sink into the page
  return mix(c, [34, 40, 48], k);
}
// header: block bars (sweep), block names, gene names, colour key. All alphas 0..1.
function faHeader(a) {
  const y = FA.top;
  FA_BLOCKS.forEach(([c0, c1, name], gi) => {
    const x0 = faX(c0), x1 = faX(c1 + 1), g = a.bar(gi);
    if (g > 0) { ctx.save(); ctx.fillStyle = rgb(faBlockCol(gi)); ctx.fillRect(x0, y - 118, (x1 - x0) * g, 24); ctx.restore(); }
    txt(name, (x0 + x1) / 2, y - 128, { a: a.name(gi), size: 20, w: 500, align: 'center' });
  });
  GLIST.forEach(([g, grp], col) => txt(g, faX(col) + FA.cw / 2 + 5, y - 10, { a: a.gene(grp), size: 15, it: true, rot: -1.15 }));
  const ka = a.key; if (ka > .004) {
    const kx = FA_LABX, kw = 15 * 17;
    txt('ΔΔCt z score', kx + kw / 2, y - 128, { a: ka, size: 18, align: 'center' });
    ctx.save(); ctx.globalAlpha *= ka;
    for (let i = 0; i < 15; i++) { ctx.fillStyle = rgb(faCell(i)); ctx.fillRect(kx + i * 17, y - 118, 17.5, 24); }
    ctx.strokeStyle = fg(.25 * UI.rimA); ctx.lineWidth = 1; ctx.strokeRect(kx, y - 118, kw, 24); ctx.restore();
    [['−2', 0], ['0', kw / 2], ['+2', kw]].forEach(([s, dx]) => txt(s, kx + dx, y - 74, { a: ka, size: 16, align: 'center', col: COL.dim }));
  }
}
// one row: fill sweeps the cells in left → right; stars arrive with their cell
function faRow(r, a, fill, labA, bold) {
  if (a <= .004) return;
  const R = FIG1A[r], y = FA.top + FA_ROWY[r];
  ctx.save(); ctx.globalAlpha *= a;
  for (let col = 0; col < 37; col++) {
    const on = sstep(seg(fill, col / 37 * .7, col / 37 * .7 + .3)); if (on <= 0) continue;
    const zi = R.z[col];
    ctx.fillStyle = rgb(faCell(zi), on); ctx.fillRect(faX(col), y, FA.cw + .5, FA.rh + .5);
    if (R.star[col] && on > .6) { const dark = zi <= 2 || zi >= 12 || THEME.light; txt('*', faX(col) + FA.cw / 2, y + FA.rh / 2 + 10, { a: on, size: 21, w: 700, align: 'center', col: dark ? [0, 0, 0] : [236, 242, 246] }); }
  }
  ctx.restore();
  txt(R.name, FA_LABX, y + FA.rh / 2 + 6, { a: a * labA, size: 18, w: bold ? 700 : 500, it: R.name.startsWith('Csf1r') });
}
// scene-4 results that are rows of Fig. 1a: ledger item → row
const FA_LINK = [[1, 16], [2, 15], [3, 14], [4, 20]];

// ---- step 6: where the two reference rows come from, then what to look at ----
// P6: heatmap geometry for this step (wider than the final figure of step 15): bars at y 620, rows below.
const P6 = { x0: 128, cw: 38, rh: 34, pitch: 38, bar: 620, barH: 34, top: 752, labX: 128 + 37 * 38 + 16 };
const p6x = c => P6.x0 + c * P6.cw, P6W = 37 * P6.cw;
const P6_LPS = 480, P6_MCAO = 1182, P6_PANEL_Y = 362;
function p6Rows(r, i, fill, a, labA) {           // reference row r drawn in slot i; cells sweep in left → right (as in the first version)
  const y = P6.top + i * P6.pitch; if (fill <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  for (let c = 0; c < 37; c++) {
    const on = sstep(seg(fill, c / 37 * .7, c / 37 * .7 + .3)); if (on <= 0) continue;
    ctx.fillStyle = rgb(faCell(FIG1A[r].z[c]), on); ctx.fillRect(p6x(c), y, P6.cw + .5, P6.rh);
    if (FIG1A[r].star[c] && on > .6) txt('*', p6x(c) + P6.cw / 2, y + P6.rh / 2 + 11, { a: on, size: 26, w: 700, align: 'center', col: [0, 0, 0] });
  }
  ctx.restore();
  txt(FIG1A[r].name, P6.labX, y + P6.rh / 2 + 8, { a: a * labA, size: 24, w: 600 });
}
function readoutPrimer(t, S) {
  // --- 1. the chart reveal: category bars sweep in, block names, gene names block by block, key, then the two reference rows
  FA_BLOCKS.forEach(([c0, c1, name], gi) => {
    const x0 = p6x(c0), x1 = p6x(c1 + 1), g = ease(seg(t, .4 + gi * .25, 1.2 + gi * .25));
    if (g > 0) { ctx.fillStyle = rgb(faBlockCol(gi)); ctx.fillRect(x0, P6.bar, (x1 - x0) * g, P6.barH); }
    txt(name, (x0 + x1) / 2, P6.bar + 25, { a: seg(t, .6 + gi * .25, 1.2 + gi * .25), size: 24, w: 600, align: 'center', col: [255, 255, 255] });
  });
  GLIST.forEach(([g, grp], c) => txt(g, p6x(c) + P6.cw / 2 + 6, P6.top - 12, { a: seg(t, 1.0 + grp * .25, 1.6 + grp * .25), size: 18, it: true, rot: -1.15 }));
  const ka = seg(t, 1.8, 2.4);
  [[FIG1A_STEPS[2], 'down', 0], [FIG1A_STEPS[12], 'up', 124]].forEach(([c, l, dx]) => {
    ctx.save(); ctx.globalAlpha *= ka; ctx.fillStyle = rgb(c); ctx.fillRect(P6.labX + dx, P6.bar + 4, 26, 26); ctx.restore();
    txt(l, P6.labX + dx + 36, P6.bar + 27, { a: ka, size: 24, col: COL.dim });
  });
  txt('ΔΔCt z score; reference profiles from Zamanian et al., 2012', P6.x0, 920, { a: seg(t, 2.4, 3.0), size: 22, col: COL.dim });
  p6Rows(0, 0, seg(t, 2.2, 3.2), 1, seg(t, 2.6, 3.2));
  p6Rows(1, 1, seg(t, 3.0, 4.0), 1, seg(t, 3.4, 4.0));
  // --- 2. where the two rows come from: rat + LPS, brain + MCAO (colour tabs tie each to its row)
  const pa = [seg(t, 4.4, 5.3), seg(t, 4.9, 5.8)].map(v => v * (1 - seg(t, 7.6, 8.1)));
  const rise = v => (1 - ease(v)) * 22, ty = P6.top;
  [[0, '#c', COL.coral], [1, '#g', [62, 178, 73]]].forEach(([i, , col]) => {
    const a = pa[i] * 1; if (a <= .004) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = rgb(col); rr(P6.x0 - 20, ty + i * P6.pitch + 2, 8, P6.rh - 4, 3); ctx.fill(); ctx.restore();
  });
  ctx.save(); ctx.translate(0, rise(pa[0] ? seg(t, 4.4, 5.3) : 0)); drawLpsRat(360, 392, pa[0]); ctx.restore();
  ctx.save(); ctx.translate(0, rise(seg(t, 4.9, 5.8))); drawStrokeBrain(1000, 395, pa[1], seg(t, 6.0, 7.2)); ctx.restore();
  [[0, 520, 'Systemic LPS', 'neuroinflammation', COL.coral], [1, 1135, 'MCAO', 'ischemic stroke', [62, 178, 73]]].forEach(([i, x, l1, l2, col]) => {
    const a = pa[i]; if (a <= .004) return;
    txt(l1, x, 372, { a, size: 36, w: 600 });
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = rgb(col); rr(x, 386, 54, 5, 2.5); ctx.fill(); ctx.restore();
    txt(l2, x, 426, { a, size: 26, col: COL.dim });
    txt('astrocytes purified', x, 470, { a, size: 24, w: 600, col: COL.teal });
  });
  // --- 3. zero in: one spotlight slides from block to block (pan reactive → A1 → A2), dimming everything else
  const rowsBottom = P6.top + P6.pitch + P6.rh + 6, bx = gi => [p6x(FA_BLOCKS[gi][0]), p6x(FA_BLOCKS[gi][1] + 1)];
  const u1 = ease(seg(t, 9.0, 9.6)), u2 = ease(seg(t, 10.2, 10.8));
  const sx0 = lerp(lerp(bx(0)[0], bx(1)[0], u1), bx(2)[0], u2), sx1 = lerp(lerp(bx(0)[1], bx(1)[1], u1), bx(2)[1], u2);
  const dim = ease(seg(t, 7.9, 8.5)) * (1 - ease(seg(t, 11.8, 12.4)));
  if (dim > .004) {
    ctx.save(); ctx.globalAlpha *= dim * .68; ctx.fillStyle = rgb(COL.bg);
    const y0 = P6.bar - 8, hh = rowsBottom - y0 + 4;
    ctx.fillRect(P6.x0 - 30, y0, sx0 - P6.x0 + 30, hh); ctx.fillRect(sx1, y0, 1800 - sx1, hh); ctx.restore();
    ctx.save(); ctx.globalAlpha *= dim; ctx.strokeStyle = fg(.8); ctx.lineWidth = 2.5; rr(sx0 - 4, P6.bar - 6, sx1 - sx0 + 8, rowsBottom - P6.bar + 8, 8); ctx.stroke(); ctx.restore();
    [['up in both', 8.3, 9.1], ['LPS only', 9.6, 10.3], ['stroke only', 10.8, 11.8]].forEach(([cap, a0, a1], n) => {
      const a = seg(t, a0, a0 + .4) * (1 - seg(t, a1 - .1, a1 + .3)) * dim; if (a <= .004) return;
      const [c0, c1] = bx(n);
      txt(cap, (c0 + c1) / 2, P6.bar - 24 + (1 - ease(seg(t, a0, a0 + .4))) * 8, { a, size: 32, w: 600, align: 'center' });
    });
  }
  // --- 4. the test row, with the A1 block outlined
  const ta = seg(t, 12.4, 13.1), y3 = P6.top + 2 * P6.pitch;
  if (ta > .004) {
    ctx.save(); ctx.globalAlpha *= ta; ctx.translate(0, (1 - ease(ta)) * -10);
    ctx.fillStyle = rgb(COL.bg); ctx.fillRect(P6.x0, y3, P6W, P6.rh);
    ctx.strokeStyle = fg(.22); ctx.lineWidth = 1.2; ctx.beginPath(); for (let c = 1; c < 37; c++) { ctx.moveTo(p6x(c), y3); ctx.lineTo(p6x(c), y3 + P6.rh); } ctx.stroke();
    ctx.strokeStyle = fg(.5); ctx.lineWidth = 1.8; ctx.strokeRect(P6.x0, y3, P6W, P6.rh); ctx.restore();
    txt('test condition', P6.labX, y3 + P6.rh / 2 + 8, { a: ta, size: 24, w: 600, col: COL.dim });
  }
  const oa = ease(seg(t, 13.1, 13.8));
  if (oa > .004) {
    const [c0, c1] = FA_BLOCKS[1], x0 = p6x(c0) - 3, x1 = p6x(c1 + 1) + 3, w = x1 - x0, h = P6.rh + 6, per = 2 * (w + h);
    ctx.save(); ctx.strokeStyle = rgb(COL.coral); ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.setLineDash([per * oa, per]);
    rr(x0, y3 - 3, w, h, 8); ctx.stroke(); ctx.restore();
    txt('A1 = this block up', (x0 + x1) / 2, y3 + P6.rh + 36, { a: seg(t, 13.6, 14.2), size: 26, w: 600, align: 'center', col: COL.coral });
  }
  vignette();
  caption(S.cap, seg(t, .3, 1.1)); subcap(S.sub, seg(t, .7, 1.5));
}

function scene5(k, t, gt, S) {
  if (k === 0) { readoutPrimer(t, S); return; }
  // summary: step 14's relay gives way to the full Fig. 1a; four of its results land on their rows
  const P = STEPS[k === 1 ? STEPS.findIndex(s => s.slug === 'rgc-controls') : 0];
  const fromRelay = prevStep === STEPS.indexOf(S) - 1;
  const ra = fromRelay ? 1 - seg(t, .2, 1.0) : 0;
  if (ra > .004) {
    RELAY_SKIP.ledger = RELAY_SKIP.caps = true;
    ctx.save(); ctx.globalAlpha *= ra; scene4(P.k, P.dur, gt, P); ctx.restore();
    RELAY_SKIP.ledger = RELAY_SKIP.caps = false;
  }
  const linked = new Map(FA_LINK);
  if (fromRelay) drawFlow(() => 1, 1 - seg(t, .2, .8));     // step 14's flowchart steps aside for the figure
  const hA = seg(t, .8, 1.5);
  faHeader({ bar: () => hA, name: () => hA, gene: () => hA, key: seg(t, 3.4, 4.0) });
  const rowStart = new Array(FIG1A.length).fill(0);
  FA_LINK.forEach(([i, r], j) => rowStart[r] = 1.5 + j * .15);
  let n = 0; FIG1A.forEach((_, r) => { if (!rowStart[r]) rowStart[r] = 2.3 + (n++) * .07; });
  FIG1A.forEach((_, r) => faRow(r, seg(t, rowStart[r], rowStart[r] + .25), seg(t, rowStart[r], rowStart[r] + .8), 1, linked.size && [...linked.values()].includes(r)));
  vignette();
  caption(S.cap, seg(t, .6, 1.4));
}
