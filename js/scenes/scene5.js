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
  { name: 'Control astrocytes', a1: false }, { name: '+ LPS', a1: false }, { name: '+ resting-microglia medium', a1: false },
  { name: '+ LPS-microglia medium', a1: true }, { name: '+ IL-1α + TNF + C1q', a1: true }, { name: '+ LPS-microglia medium + nAbs', a1: false },
];
(() => { const R = rng(55); HROWS.forEach(row => { row.z = GLIST.map(([g, grp]) => row.a1 ? (grp === 0 ? .8 + R() * 1.2 : grp === 1 ? 1.0 + R() * 1.0 : -1.1 + R() * 1.5) : (-1.5 + R() * 1.25)); }); })();

const BIG_R = new Cell('astro', 0, 0, 777, 2.0, { drift: 4 });
const BIG_A = new Cell('astro', 0, 0, 778, 2.0, { drift: 4 });
function heatCol(z) { return z < 0 ? mix([28, 34, 42], [46, 150, 168], clamp(-z / 2)) : mix([28, 34, 42], [255, 122, 96], clamp(z / 2)); }
function lightCol(z, on) { const L = clamp((z + .2) / 1.7) * on; return mix([34, 42, 52], [255, 146, 118], L); }
function scene5(k, t, gt) {
  const LW = 12, LG = 3, GG = 14, rowW = 37 * (LW + LG) - LG + 2 * GG;
  const HX0 = 640, HY0 = 440, CW = 28, CG = 8, RH = 42;
  const lx = (col, grp, x0) => x0 + col * (LW + LG) + grp * GG;
  const hx = (col, grp) => HX0 + col * CW + grp * CG;
  const pull = k === 1 ? ease(seg(t, 0, 1.6)) : 0;
  const morph = k === 1 ? ease(seg(t, .8, 2.6)) : 0;
  const hcol = k === 1 ? ease(seg(t, 1.8, 3.2)) : 0;
  const labA = k === 1 ? seg(t, 2.8, 3.8) : 0;
  // astrocytes
  const cells = [[BIG_R, 620, 0, 'Resting'], [BIG_A, 1300, 1, 'A1']];
  cells.forEach(([c, x, r, lab]) => {
    const a = 1 - pull, yy = lerp(430, 250, pull), sc = lerp(1, .6, pull);
    if (a <= .004) return;
    ctx.save(); ctx.translate(x, yy); ctx.scale(sc, sc); c.draw(ctx, { t: gt, r, a }); ctx.restore();
    txt(lab, x, 215 + (1 - a) * -40, { a: a * seg(t, k ? 0 : .3, k ? .1 : 1), size: 26, w: 600, align: 'center', col: r ? COL.coral : COL.teal });
  });
  // rows: resting → heatmap row 0, A1 → heatmap row 3; others fly in
  const rowsDef = [{ hr: 0, x0: 620 - rowW / 2, on: 0 }, { hr: 3, x0: 1300 - rowW / 2, on: 1 }];
  HROWS.forEach((row, ri) => {
    const main = rowsDef.find(d => d.hr === ri);
    let ra, yOff = 0;
    if (main) ra = 1; else { ra = k === 1 ? seg(t, 1.6 + ri * .12, 2.3 + ri * .12) : 0; yOff = (1 - ra) * 40; }
    if (ra <= .004) return;
    // cassette frame
    if (main && morph < 1) {
      ctx.save(); ctx.globalAlpha *= (1 - morph); rr(main.x0 - 12, 700, rowW + 24, 44, 10); ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.stroke(); ctx.restore();
      ['PAN-REACTIVE', 'A1-SPECIFIC', 'ISCHEMIA-INDUCED'].forEach((g, gi) => {
        const c0 = [0, 13, 25][gi], c1 = [12, 24, 36][gi];
        txt(g, (lx(c0, gi, main.x0) + lx(c1, gi, main.x0) + LW) / 2, 690, { a: (1 - morph) * seg(t, k ? 0 : .5, k ? .1 : 1.2), size: 12, w: 600, ls: 1.8, align: 'center', col: gi === 1 ? COL.coral : COL.dim });
      });
    }
    GLIST.forEach(([g, grp], col) => {
      const z = row.z[col];
      let on = 1;
      if (main && main.on && k === 0) on = sstep(seg(t, 1.4 + col * .05, 1.7 + col * .05));
      if (main && !main.on) on = 1;
      const x = main ? lerp(lx(col, grp, main.x0), hx(col, grp), morph) : hx(col, grp);
      const y = main ? lerp(710, HY0 + ri * RH, morph) : HY0 + ri * RH + yOff;
      const w = lerp(LW, CW - 1.5, main ? morph : 1), h = lerp(24, RH - 2, main ? morph : 1);
      const c = mix(lightCol(z, main ? on : 1), heatCol(z), main ? hcol : 1);
      ctx.save(); ctx.globalAlpha *= ra;
      rr(x, y, w, h, lerp(3, 1.5, main ? morph : 1)); ctx.fillStyle = rgb(c); ctx.fill();
      if (main && hcol < 1 && z > 0 && on > 0) { const L = clamp((z + .2) / 1.7) * on * (1 - hcol); if (L > .3) { ctx.shadowColor = rgb([255, 140, 110], .6 * L); ctx.shadowBlur = 8; ctx.fill(); } }
      ctx.restore();
    });
    txt(row.name, HX0 - 16, HY0 + ri * RH + 27, { a: labA * ra, size: 16, align: 'right', col: row.a1 ? [236, 210, 200] : [196, 206, 214] });
  });
  // heatmap labels
  if (labA > 0) {
    const gx = [[0, 12, 0], [13, 24, 1], [25, 36, 2]];
    const gc = [[196, 206, 214], COL.coral, [110, 132, 162]], gn = ['Pan-reactive', 'A1-specific', 'Ischemia-induced'];
    gx.forEach(([c0, c1, gi]) => {
      const x0 = hx(c0, gi), x1 = hx(c1, gi) + CW - 1.5;
      ctx.save(); ctx.globalAlpha *= labA; ctx.fillStyle = rgb(gc[gi]); ctx.fillRect(x0, HY0 - 92, x1 - x0, 10); ctx.restore();
      txt(gn[gi], (x0 + x1) / 2, HY0 - 102, { a: labA, size: 16, w: 600, align: 'center', col: gc[gi] });
    });
    GLIST.forEach(([g, grp], col) => txt(g, hx(col, grp) + 18, HY0 - 8, { a: labA, size: 12.5, it: true, rot: -Math.PI / 2 + .0, col: [176, 188, 198] }));
    // colour bar
    const bx = hx(36, 2) + CW - 1.5 - 260, by = HY0 + 6 * RH + 34;
    for (let i = 0; i < 52; i++) { const z = -2 + 4 * i / 51; ctx.save(); ctx.globalAlpha *= labA; ctx.fillStyle = rgb(heatCol(z)); ctx.fillRect(bx + i * 5, by, 5.2, 12); ctx.restore(); }
    txt('−2', bx, by + 32, { a: labA, size: 13, align: 'center', col: COL.dim }); txt('0', bx + 130, by + 32, { a: labA, size: 13, align: 'center', col: COL.dim }); txt('+2', bx + 260, by + 32, { a: labA, size: 13, align: 'center', col: COL.dim });
    txt('ΔΔCt z-score', bx - 14, by + 11, { a: labA, size: 14, align: 'right', col: COL.dim });
    txt('illustrative values · real data: Fig. 1a', HX0 - 16, HY0 + 6 * RH + 46, { a: labA, size: 16, it: true, align: 'right', col: COL.dim });
  }
  vignette();
  if (k === 0) caption(TITLE(23), seg(t, .4, 1.2));   // was: 'Readout: reactive gene cassettes by microfluidic qPCR'
  else caption(TITLE(24), seg(t, 2.8, 3.6) * (1 - seg(t, 7, 8)));   // was: 'Every condition becomes one row.'
}
