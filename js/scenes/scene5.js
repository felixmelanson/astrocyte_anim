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
  { name: 'Resting astrocytes', a1: false, tag: 'baseline' }, { name: '+ LPS', a1: false, tag: 'no change' },
  { name: '+ resting-microglia medium', a1: false, tag: 'no change' }, { name: '+ LPS-microglia medium', a1: true, tag: 'A1' },
  { name: '+ IL-1α + TNF + C1q', a1: true, tag: 'A1' }, { name: '+ LPS-microglia medium + nAbs', a1: false, tag: 'no change' },
];
// illustrative z-scores (real data: Fig. 1a): non-A1 rows sit below baseline, A1 rows light up pan + A1 blocks
(() => { const R = rng(55); HROWS.forEach(row => { row.z = GLIST.map(([g, grp]) => row.a1 ? (grp === 0 ? 1.0 + R() * .9 : grp === 1 ? 1.3 + R() * .7 : -.6 + R() * 1.0) : (-1.25 + R() * .8)); }); })();

function heatCol(z) { return z < 0 ? mix(UI.heat0, UI.heatNeg, clamp(-z / 2)) : mix(UI.heat0, UI.heatPos, clamp(z / 2)); }
// grid geometry: row labels | 37 gene columns in 3 blocks | result tag. Centred on the 1920 canvas.
const HM = { x0: 410, cw: 34, cg: 16, rh: 60 };
const hx = (col, grp) => HM.x0 + col * HM.cw + grp * HM.cg;
const HX1 = hx(36, 2) + HM.cw;                   // right edge of the grid
const HGROUPS = [[0, 12, 'Pan-reactive', 'up in any reactive astrocyte'], [13, 24, 'A1-specific', 'up after LPS · neuroinflammation'], [25, 36, 'A2-specific', 'up after stroke · ischaemia']];
const grpCol = gi => [UI.grpPan, COL.coral, UI.grpA2][gi];
// group names + bars + gene names. grow(gi) = bar sweep 0..1, nameA(gi) / geneA(gi) = label alphas
function drawHeatHeader(y0, grow, nameA, geneA) {
  HGROUPS.forEach(([c0, c1, name], gi) => {
    const x0 = hx(c0, gi), x1 = hx(c1, gi) + HM.cw - 3, g = grow(gi);
    if (g > 0) { ctx.save(); ctx.fillStyle = rgb(grpCol(gi)); rr(x0, y0 - 104, Math.max(8, (x1 - x0) * g), 8, 4); ctx.fill(); ctx.restore(); }
    txt(name, (x0 + x1) / 2, y0 - 118, { a: nameA(gi), size: 21, w: 600, align: 'center', col: grpCol(gi) });
  });
  GLIST.forEach(([g, grp], col) => txt(g, hx(col, grp) + (HM.cw - 3) / 2 + 5, y0 - 10, { a: geneA(grp), size: 14, it: true, rot: -Math.PI / 2, col: UI.gene }));
}
// one row: fill 0 → empty outlined cells, 1 → z-score colours (sweeps left to right)
function drawHeatRow(y, z, a, fill, label, labA, labCol, w = 400) {
  if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a;
  GLIST.forEach(([g, grp], col) => {
    const on = z ? sstep(seg(fill, col / 37 * .6, col / 37 * .6 + .4)) : 0;
    rr(hx(col, grp), y, HM.cw - 3, HM.rh - 3, 3);
    if (on > 0) { ctx.fillStyle = rgb(heatCol(z[col]), on); ctx.fill(); }
    if (on < 1) { ctx.strokeStyle = fg(.18 * (1 - on) * UI.rimA); ctx.lineWidth = 1; ctx.stroke(); }
  });
  ctx.restore();
  txt(label, HM.x0 - 20, y + HM.rh / 2 + 6, { a: a * labA, size: 19, w, align: 'right', col: labCol || COL.text });
}
function heatTag(y, row, a) {
  if (a <= .004) return;
  const good = !row.a1, col = row.tag === 'baseline' ? COL.dim : good ? COL.teal : COL.coral;
  txt(row.tag, HX1 + 22, y + HM.rh / 2 + 6, { a, size: 18, w: row.a1 ? 700 : 500, col });
}
function colourKey(x, y, a) {      // right-aligned at x
  if (a <= .004) return;
  const bw = 240, bx = x - bw;
  ctx.save(); ctx.globalAlpha *= a;
  const g = ctx.createLinearGradient(bx, 0, x, 0);
  for (let i = 0; i <= 8; i++) g.addColorStop(i / 8, rgb(heatCol(-2 + i / 2)));
  ctx.fillStyle = g; rr(bx, y, bw, 12, 6); ctx.fill(); ctx.restore();
  txt('below resting', bx, y + 34, { a, size: 14, col: COL.dim });
  txt('above resting', x, y + 34, { a, size: 14, align: 'right', col: COL.dim });
  txt('ΔΔCt z-score', bx - 16, y + 11, { a, size: 15, align: 'right', col: COL.dim });
}
function scene5(k, t, gt, S) {
  if (k === 0) {
    // readout primer: the gene panel and what each block means; one baseline row, no conditions yet
    const y0 = 540;
    drawHeatHeader(y0, gi => ease(seg(t, .5 + gi * .3, 1.2 + gi * .3)), gi => seg(t, .7 + gi * .3, 1.3 + gi * .3), gi => seg(t, 1.2 + gi * .3, 1.8 + gi * .3));
    drawHeatRow(y0, HROWS[0].z, seg(t, 2.2, 2.7), seg(t, 2.6, 3.6), HROWS[0].name, seg(t, 2.4, 3.0), COL.text, 600);
    HGROUPS.forEach(([c0, c1, , what], gi) => {
      const x0 = hx(c0, gi), x1 = hx(c1, gi) + HM.cw - 3, a = seg(t, 3.4 + gi * .25, 4.0 + gi * .25);
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = rgb(grpCol(gi), .5); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x0, y0 + HM.rh + 14); ctx.lineTo(x0, y0 + HM.rh + 22); ctx.lineTo(x1, y0 + HM.rh + 22); ctx.lineTo(x1, y0 + HM.rh + 14); ctx.stroke(); ctx.restore();
      txt(what, (x0 + x1) / 2, y0 + HM.rh + 52, { a, size: 18, align: 'center', col: gi === 1 ? COL.coral : COL.dim, w: gi === 1 ? 600 : 400 });
    });
    vignette();
    caption(S.cap, seg(t, .3, 1.1)); subcap(S.sub, seg(t, .9, 1.7));
    return;
  }
  // every condition, one row (the header and baseline row carry over from the primer)
  const y0 = 360, hA = seg(t, .1, .7);
  drawHeatHeader(y0, () => 1, () => hA, () => hA);
  HROWS.forEach((row, ri) => {
    const t0 = ri === 0 ? 0 : .7 + ri * .5, ra = ri === 0 ? hA : seg(t, t0, t0 + .45), fill = ri === 0 ? 1 : seg(t, t0 + .15, t0 + 1.0);
    const y = y0 + ri * HM.rh, dx = (1 - eOut(ra)) * -40;
    ctx.save(); ctx.translate(dx, 0);
    drawHeatRow(y, row.z, ra, fill, row.name, 1, row.a1 ? COL.coral : COL.text, row.a1 ? 600 : 400);
    ctx.restore();
    heatTag(y, row, seg(t, t0 + .8, t0 + 1.2));
  });
  const yb = y0 + 6 * HM.rh + 36, la = seg(t, 4.0, 4.6);
  colourKey(HX1, yb, la);
  txt('illustrative values · real data: Fig. 1a', HM.x0, yb + 11, { a: la, size: 16, it: true, col: COL.dim });
  vignette();
  caption(S.cap, seg(t, .3, 1.1));
}
