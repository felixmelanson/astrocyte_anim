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
const HROWS = [
  { name: 'Resting astrocytes', a1: false }, { name: '+ LPS', a1: false }, { name: '+ resting-microglia medium', a1: false },
  { name: '+ LPS-microglia medium', a1: true }, { name: '+ IL-1α + TNF + C1q', a1: true }, { name: '+ LPS-microglia medium + nAbs', a1: false },
];
(() => { const R = rng(55); HROWS.forEach(row => { row.z = GLIST.map(([g, grp]) => row.a1 ? (grp === 0 ? .8 + R() * 1.2 : grp === 1 ? 1.0 + R() * 1.0 : -1.1 + R() * 1.5) : (-1.5 + R() * 1.25)); }); })();

function heatCol(z) { return z < 0 ? mix(UI.heat0, UI.heatNeg, clamp(-z / 2)) : mix(UI.heat0, UI.heatPos, clamp(z / 2)); }
const HM = { x0: 640, cw: 28, cg: 8, rh: 42 };
const hx = (col, grp) => HM.x0 + col * HM.cw + grp * HM.cg;
const HGROUPS = [[0, 12, 'Pan-reactive'], [13, 24, 'A1-specific'], [25, 36, 'A2-specific']];
// group bars + names + gene names. grow(gi) = bar sweep 0..1, nameA(gi) / geneA(gi) = label alphas
function drawHeatHeader(y0, grow, nameA, geneA) {
  const gc = [UI.grpPan, COL.coral, UI.grpA2];
  HGROUPS.forEach(([c0, c1, name], gi) => {
    const x0 = hx(c0, gi), x1 = hx(c1, gi) + HM.cw - 1.5, g = grow(gi);
    if (g > 0) { ctx.save(); ctx.fillStyle = rgb(gc[gi]); ctx.fillRect(x0, y0 - 92, (x1 - x0) * g, 10); ctx.restore(); }
    txt(name, (x0 + x1) / 2, y0 - 102, { a: nameA(gi), size: 16, w: 600, align: 'center', col: gc[gi] });
  });
  GLIST.forEach(([g, grp], col) => txt(g, hx(col, grp) + 18, y0 - 8, { a: geneA(grp), size: 12.5, it: true, rot: -Math.PI / 2, col: UI.gene }));
}
// one row: fill = 0 → empty outlined cells, 1 → z-score colours
function drawHeatRow(y, z, a, fill, label, labA, labCol) {
  if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a;
  GLIST.forEach(([g, grp], col) => {
    const on = z ? sstep(seg(fill, col / 37 * .6, col / 37 * .6 + .4)) : 0;
    rr(hx(col, grp), y, HM.cw - 1.5, HM.rh - 2, 1.5);
    if (on > 0) { ctx.fillStyle = rgb(heatCol(z[col]), on); ctx.fill(); }
    if (on < 1) { ctx.strokeStyle = fg(.22 * (1 - on) * UI.rimA); ctx.lineWidth = 1; ctx.stroke(); }
  });
  ctx.restore();
  txt(label, HM.x0 - 16, y + 27, { a: a * labA, size: 16, align: 'right', col: labCol || UI.row });
}
function scene5(k, t, gt, S) {
  if (k === 0) {
    // readout primer: the gene panel, one empty row, no conditions yet
    const y0 = 560;
    drawHeatHeader(y0, gi => ease(seg(t, .5 + gi * .3, 1.2 + gi * .3)), gi => seg(t, .8 + gi * .3, 1.4 + gi * .3), gi => seg(t, 1.4 + gi * .3, 2.0 + gi * .3));
    drawHeatRow(y0, null, seg(t, 2.6, 3.2), 0, 'Resting astrocytes', seg(t, 2.9, 3.5));
    vignette();
    caption(S.cap, seg(t, .3, 1.1)); subcap(S.sub, seg(t, .9, 1.7));
    return;
  }
  // every condition, one row
  const y0 = 440, hA = seg(t, .2, .8);
  drawHeatHeader(y0, () => hA, () => hA, () => hA);
  HROWS.forEach((row, ri) => {
    const t0 = ri === 0 ? .4 : 1.0 + ri * .45, ra = seg(t, t0, t0 + .5);
    drawHeatRow(y0 + ri * HM.rh + (1 - ra) * 30, row.z, ra, seg(t, t0 + .2, t0 + 1.2), row.name, 1, row.a1 ? UI.rowA1 : UI.row);
  });
  const labA = seg(t, 4.0, 4.8);
  if (labA > 0) {   // colour bar
    const bx = hx(36, 2) + HM.cw - 1.5 - 260, by = y0 + 6 * HM.rh + 34;
    for (let i = 0; i < 52; i++) { const z = -2 + 4 * i / 51; ctx.save(); ctx.globalAlpha *= labA; ctx.fillStyle = rgb(heatCol(z)); ctx.fillRect(bx + i * 5, by, 5.2, 12); ctx.restore(); }
    txt('−2', bx, by + 32, { a: labA, size: 13, align: 'center', col: COL.dim }); txt('0', bx + 130, by + 32, { a: labA, size: 13, align: 'center', col: COL.dim }); txt('+2', bx + 260, by + 32, { a: labA, size: 13, align: 'center', col: COL.dim });
    txt('ΔΔCt z-score', bx - 14, by + 11, { a: labA, size: 14, align: 'right', col: COL.dim });
    txt('illustrative values · real data: Fig. 1a', HM.x0 - 16, y0 + 6 * HM.rh + 46, { a: labA, size: 16, it: true, align: 'right', col: COL.dim });
  }
  vignette();
  caption(S.cap, seg(t, .3, 1.1));
}
