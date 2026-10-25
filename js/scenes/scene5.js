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
const FA = { x0: 250, cw: 30, rh: 26, gap: 14, top: 330 };
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

function scene5(k, t, gt, S) {
  if (k === 0) {
    // readout primer: the panel of Fig. 1a with its two reference rows (in vivo A1 and A2 profiles)
    ctx.save(); ctx.translate(-196, 205); ctx.scale(1.2, 1.2);
    faHeader({ bar: gi => ease(seg(t, .4 + gi * .25, 1.2 + gi * .25)), name: gi => seg(t, .6 + gi * .25, 1.2 + gi * .25), gene: g => seg(t, 1.0 + g * .25, 1.6 + g * .25), key: seg(t, 1.8, 2.4) });
    faRow(0, 1, seg(t, 2.2, 3.2), seg(t, 2.6, 3.2));
    faRow(1, 1, seg(t, 3.0, 4.0), seg(t, 3.4, 4.0));
    const ny = FA.top + FA.rh * 2 + 40;
    txt('Reference profiles from purified astrocytes in vivo: A1 after LPS, A2 after ischaemia (MCAO)', FA.x0, ny, { a: seg(t, 3.8, 4.4), size: 17, col: COL.dim });
    ctx.restore();
    vignette();
    caption(S.cap, seg(t, .3, 1.1)); subcap(S.sub, seg(t, .7, 1.5));
    return;
  }
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
  if (fromRelay) {
    const fa = 1 - seg(t, .2, .8);
    drawLedgerFrame(fa);
    CARDS.forEach((cd, i) => { if (!linked.has(i)) ledgerItem(i, cardX(i), LEDGER.y, gt, fa); });
  }
  const hA = seg(t, .8, 1.5);
  faHeader({ bar: () => hA, name: () => hA, gene: () => hA, key: seg(t, 3.4, 4.0) });
  const rowStart = new Array(FIG1A.length).fill(0);
  FA_LINK.forEach(([i, r], j) => rowStart[r] = 1.5 + j * .15);
  let n = 0; FIG1A.forEach((_, r) => { if (!rowStart[r]) rowStart[r] = 2.3 + (n++) * .07; });
  FIG1A.forEach((_, r) => faRow(r, seg(t, rowStart[r], rowStart[r] + .25), seg(t, rowStart[r], rowStart[r] + .8), 1, linked.size && [...linked.values()].includes(r)));
  // result markers: the ledger dish travels to the left of its row
  FA_LINK.forEach(([i, r], j) => {
    const u = fromRelay ? ease(seg(t, .5 + j * .15, 1.5 + j * .15)) : 1;
    const x = lerp(cardX(i), FA.x0 - 30, u), y = lerp(LEDGER.y, FA.top + FA_ROWY[r] + FA.rh / 2, u);
    const sc = lerp(1, .42, u);
    if (u < 1) {
      const cd = CARDS[i], good = cd.res === 'No change';
      cd.l.forEach((line, q) => txt(line, x, y + 46 + q * 18, { a: 1 - seg(u, 0, .4), size: 15, align: 'center' }));
      txt(cd.res, x, y + 46 + 18 * cd.l.length + 8, { a: 1 - seg(u, 0, .4), size: 16, w: 700, align: 'center', col: good ? COL.teal : COL.coral });
    }
    miniDish(x, y, CARDS[i], gt, 1, LEDGER.r * sc);
  });
  vignette();
  caption(S.cap, seg(t, .6, 1.4));
}
