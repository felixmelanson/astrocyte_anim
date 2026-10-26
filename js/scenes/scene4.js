'use strict';
/* =====================================================================
   SCENE 4 — the relay
   ===================================================================== */
const MINI_A = new Cell('astro', 0, 0, 411, .3, { drift: 0 });
const MINI_N = new Cell('neuron', 0, 0, 522, .28, { axAng: .6, axLen: 120, drift: 0 });
// dose-response wells: 20 RGCs each; survivors 20/19/11/0 ≈ 100/97/55/2 %
const DOSES = [{ d: '0', s: '~100%', n: 20 }, { d: '1', s: '~97%', n: 19 }, { d: '15', s: '~55%', n: 11 }, { d: '50', s: '~2%', n: 0 }];
const WELLS = DOSES.map((D, w) => { const R = rng(900 + w), cells = []; for (let i = 0; i < 20; i++) { const a = R() * TAU, r = Math.sqrt(R()) * 66; cells.push({ c: new Cell('neuron', Math.cos(a) * r, Math.sin(a) * r, 2000 + w * 50 + i, .26, { axAng: R() * TAU, axLen: 70, simple: true, drift: 0 }), dies: false, st: R() }); } const idx = cells.map((_, i) => i).sort(() => 0).slice(0, 20 - D.n); idx.forEach(i => cells[i].dies = true); return cells; });

const FR = 176;
const F = {
  lpsA: new Field(11, [['lps', 16]], FR), lpsM: new Field(12, [['lps', 16]], FR),
  mcm: new Field(13, [['il1', 9], ['tnf', 9], ['c1q', 7], ['other', 22]], FR),
  mcmA: new Field(14, [['il1', 9], ['tnf', 9], ['c1q', 7], ['other', 22]], FR),
  restM: new Field(15, [['other', 12]], FR), restA: new Field(16, [['other', 10]], FR),
  cyto: new Field(17, [['il1', 10], ['tnf', 10], ['c1q', 8]], FR),
  cytoN: new Field(18, [['il1', 10], ['tnf', 10], ['c1q', 8]], FR),
  well: new Field(19, [['il1', 4], ['tnf', 4], ['c1q', 3], ['other', 8]], 50),
  nabA: new Field(20, [['il1b', 7], ['tnfb', 7], ['c1qb', 6], ['other', 18]], FR),
  acm: new Field(21, [['tox', 26], ['other', 18], ['il1', 3], ['tnf', 3], ['c1q', 3]], FR),
  concN: new Field(22, [['tox', 34], ['other', 16], ['tnf', 4], ['c1q', 4]], FR),
  mcmN: new Field(23, [['il1', 9], ['tnf', 9], ['c1q', 7], ['other', 22]], FR),
};
// molecule dots in tips / tubes, as PC keys so they follow the theme
const DOTS = { mcm: ['il1', 'tnf', 'other', 'c1q', 'other', 'il1', 'tnf', 'other', 'c1q', 'other'], lps: Array(8).fill('lps'), cyto: ['il1', 'tnf', 'c1q', 'il1', 'tnf', 'c1q', 'il1', 'tnf'], rest: Array(5).fill('other'), nab: ['gray', 'ab', 'other', 'gray', 'ab', 'other', 'gray', 'ab'], acm: ['tox', 'other', 'tox', 'tox', 'other', 'tox', 'other', 'tox'], conc: Array(12).fill(0).map((_, i) => i % 3 ? 'tox' : 'other') };
const LIQ = {   // dark-theme medium colours; liqC() lightens them for the light theme
  mcm: [58, 72, 84], lps: [70, 76, 80], cyto: [66, 72, 70], rest: [52, 64, 74], acm: [92, 64, 62], conc: [120, 70, 64] };
// Results panel along the bottom: two groups (astrocyte response, RGC survival).
// step = the scene-4 step (k) whose result produces the item.
const CARDS = [
  { l: 'LPS directly', res: 'No change', step: 1 },
  { l: 'Activated microglia medium', res: 'A1', step: 2 },
  { l: 'Resting microglia medium', res: 'No change', step: 2 },
  { l: 'IL-1α + TNF + C1q', res: 'A1', step: 3 },
  { l: 'Activated microglia medium + nAbs', res: 'No change', step: 4 },
  { l: 'A1 astrocyte medium', res: 'Death', step: 5 },
  { l: 'Activated microglia medium', res: 'Survival', step: 7 },
  { l: 'IL-1α + TNF + C1q', res: 'Survival', step: 7 },
];
// Dishes are the same tilted petri dishes as step 5 (tiltDish in scene3.js). DYR = centre of the rim ellipse of a
// full-size dish; contents are drawn on the floor, FY, one wall-height below it.
const RT = 1.08;                                   // tilt, in tiltDish units (about 56 degrees)
const rKy = () => tiltK(RT), rWall = r => tiltWall(r, RT), rRy = r => r * rKy();
const DYR = 350, FY = DYR + rWall(DR);             // floor centre of the full-size dishes
const rimTop = r => FY - rWall(r) - rRy(r);         // top of a dish's rim ellipse
const NAME_Y = FY + rRy(DR) + 46;                  // dish names sit under the front glass
// results table under the dishes: one row per earned result, newest row at full strength
const STAGE = { s: 1, y: 178 };
const sx = x => x, sy = y => y;
function stageBegin() { ctx.save(); }

const POS = {
  M: { x: DX.M, y: FY }, A: { x: DX.A, y: FY }, N: { x: DX.N, y: FY, lift: 120 },
  vialL: { x: 660, y: 280, arcUp: 100 }, vialR: { x: 1260, y: 290 }, well: { x: 660, y: 300 }, filt: { x: 1260, y: 300 },
  R: { x: 660, y: FY },                            // the small resting-microglia dish of step 9
};
const MN = { x: DX.M, y: FY };
// in vivo AQP4 inset (Ext. Data Fig. 5a) during the microglia-medium step; off since the declutter pass
// (an in vivo marker squeezed between two in vitro dishes). Set true to bring it back.
const SHOW_AQP4_INSET = false;
// k = scene-4 step: 0 intro · 1 LPS direct · 2 LPS→microglia→astrocytes (+ resting control) · 3 cocktail
//                    4 nAbs · 5 concentrate ACM → RGCs · 6 dose wells · 7 both RGC controls
function scene4(k, t, gt, S) {
  const st = {
    m: { mode: 'act', act: 1, a: 1, fields: [] }, a: { layers: [] }, n: { layers: [] },
    hops: [], arcs: [], tubes: [], clock: null, caps: [], leg: { sec: 0, names: 0 }, extra: [], cards: [],
    aSub: '', nSub: '', mName: 'Microglia', aHL: 0,
  };
  const mcmSteady = { f: F.mcm, o: {} };
  const reset = (layerOld, layerNew, t0 = 0) => [{ ...layerOld, a: (layerOld.a ?? 1) * (1 - seg(t, t0, t0 + .45)) }, { ...layerNew, a: (layerNew.a ?? 1) * seg(t, t0 + .45, t0 + .95) }];
  // one pipette hop; returns the dispense time. o.arcA fades the arc (e.g. before a second hop to the same dish)
  const H = (src, dst, t0, sp, liq, dots, ok, lift = 110, o = {}) => {
    st.hops.push({ src, dst, t0, sp, liq, dots });
    const td = t0 + HOPD * sp;
    st.arcs.push({ from: o.arcFrom || src, to: o.arcTo || dst, prog: seg(t, td, td + .8), ok, lift: Math.min(lift, 48), a: o.arcA ?? 1 });
    return td;
  };
  const tipO = () => [0, -18];
  const fly = (i, tf) => st.cards.push({ i, tf });
  const fromMicro = p => { const c = MIC[p.src % MIC.length]; return [c.x, c.y]; };
  const fromAstro = p => { const c = AST[p.src % AST.length]; return [c.x, c.y]; };

  // defaults: from step 3 on, microglia are LPS-activated and their medium is in the dish
  st.m.act = k >= 3 ? 1 : 0; st.m.fields = k >= 3 ? [mcmSteady] : [];
  st.a.layers = [{ r: 0, fields: [] }]; st.n.layers = [{ d: 0, fields: [] }];
  st.leg = { sec: k >= 3 ? 1 : 0, names: k >= 4 ? 1 : 0 };      // legend entries appear when their glyph first does
  if (k >= 4) st.leg.sec = 0;

  switch (k) {
    case 0: {
      st.intro = true; st.caps.push([S.cap, seg(t, 1.6, 2.6)]);
      break;
    }
    case 1: {
      st.tubes.push({ p: POS.vialL, label: 'LPS', a: seg(t, 0, .5), dots: DOTS.lps, liq: LIQ.lps, s: 1.6 });
      const td = H(POS.vialL, POS.A, .6, 1, LIQ.lps, DOTS.lps, false, 60);
      st.a.layers = [{ r: 0, fields: [{ f: F.lpsA, o: { t0: td, origin: tipO, stag: .6 } }] }];
      st.clock = { d: 'A', p: seg(t, td + .8, td + 4.8), a: bump(t, td + .5, td + .9, 99, 100) };
      st.caps.push([S.cap, seg(t, .3, 1) * (1 - seg(t, td + 4.6, td + 5.1))]);
      st.caps.push([S.capEnd, seg(t, td + 5.1, td + 5.8)]);
      fly(0, td + 5.6);
      st.fl = { AST: [.3], LPSd: [.3, td + .3, td + 5.6] };
      break;
    }
    case 2: {
      // beat A: LPS activates microglia, which start secreting
      const sp = .8;
      st.tubes.push({ p: POS.vialL, label: 'LPS', a: 1 - seg(t, 4.6, 5.2), dots: DOTS.lps, liq: LIQ.lps, s: 1.6 });
      const tdA = H(POS.vialL, POS.M, .5, sp, LIQ.lps, DOTS.lps, true, 60, { arcA: 1 - seg(t, 6.0, 6.6) });
      st.m.act = ease(seg(t, tdA + .4, tdA + 2.6));
      st.m.fields = [{ f: F.lpsM, o: { t0: tdA, origin: tipO, stag: .6, a: 1 - seg(t, tdA + 2, tdA + 3) } },
                     { f: F.mcm, o: { t0: tdA + 1.2, stag: 2.6, spread: 2, origin: fromMicro } }];
      st.leg.sec = seg(t, tdA + 1.6, tdA + 2.4);
      // beat B: their medium → astrocytes → A1
      const t0C = 15.0;                       // beat C start
      const tdB = H(POS.M, POS.A, 6.2, sp, LIQ.mcm, DOTS.mcm, true, 110, { arcA: 1 - seg(t, t0C, t0C + .6) });
      const rB = ease(seg(t, tdB + .6, tdB + 4.4));
      // beat C: control, medium from resting microglia → no change
      const tdC = H(POS.R, POS.A, t0C + .4, .7, LIQ.rest, DOTS.rest, false, 70);
      st.rest = seg(t, t0C - .6, t0C + .3);       // a second, small resting-microglia dish slides in between
      if (t < t0C) {
        st.a.layers = reset({ r: 0, fields: [{ f: F.lpsA, o: {} }] }, { r: rB, fields: [{ f: F.mcmA, o: { t0: tdB, origin: tipO, stag: .6 } }] });
        st.clock = { d: 'A', p: seg(t, tdB + .6, tdB + 4.4), a: seg(t, tdB + .3, tdB + .7) };
        st.inset = { r: rB, a: seg(t, tdB + 1, tdB + 1.8) };
      } else {
        st.a.layers = reset({ r: 1, fields: [{ f: F.mcmA, o: {} }] }, { r: 0, fields: [{ f: F.restA, o: { t0: tdC, origin: tipO, stag: .6 } }] }, t0C);
        st.clock = { d: 'A', p: seg(t, tdC + .4, tdC + 2.4), a: seg(t, tdC + .1, tdC + .5) };
        st.inset = { r: 1, a: 1 - seg(t, t0C, t0C + .5) };
      }
      st.caps.push([S.cap, seg(t, .3, 1)]);
      st.sub = [S.sub, seg(t, t0C + .3, t0C + 1.1)];
      fly(1, tdB + 4.8); fly(2, tdC + 2.6);
      st.fl = { LPS: [.4], MG: [.4], e_LPS_MG: [tdA - .2], SEC: [tdA + 1.6], e_MG_SEC: [tdA + 2.2], e_SEC_AST: [tdB], b_AST: [tdB + 4.8], RM: [t0C - .6, tdC, tdC + 2.6] };
      break;
    }
    case 3: {
      st.a.layers = reset({ r: 0, fields: [{ f: F.restA, o: {} }] }, { r: 0, fields: [] });
      st.m.absent = seg(t, 0, .8); st.m.mode = 'rest'; st.m.act = 0; st.m.fields = [{ f: F.restM, o: { a: 1 - seg(t, 0, .6) } }];
      st.mName = 'No microglia';
      st.tubes.push({ p: POS.vialL, label: 'IL-1α + TNF + C1q', lsz: 21, a: seg(t, .3, .8), dots: DOTS.cyto, liq: LIQ.cyto });
      const td = H(POS.vialL, POS.A, 1.0, 1, LIQ.cyto, DOTS.cyto, true, 60);
      st.leg.names = seg(t, td + .2, td + 1.0); st.leg.sec = 1 - st.leg.names;
      const r = ease(seg(t, td + .8, td + 6.3));
      st.a.layers[1].r = r; st.a.layers[1].fields = [{ f: F.cyto, o: { t0: td, origin: tipO, stag: .6 } }];
      st.clock = { d: 'A', p: seg(t, td + .8, td + 6.3), a: seg(t, td + .5, td + .9) };
      st.caps.push([S.cap, seg(t, .3, 1)]);
      st.sub = [S.sub, seg(t, 1, 1.8)];
      fly(3, td + 7.0);
      st.fl = { CK: [.3, td, td + 7.0] };
      break;
    }
    case 4: {
      st.a.layers = reset({ r: 1, fields: [{ f: F.cyto, o: {} }] }, { r: 0, fields: [] });
      st.m.returnA = seg(t, 0, .8); st.m.fields = [{ f: F.mcm, o: { a: seg(t, .2, .9) } }];
      const sp = .85, td1 = H(POS.M, POS.well, .9, sp, LIQ.mcm, DOTS.mcm, true, 60);
      const t2 = td1 + 3.4, td2 = H(POS.well, POS.A, t2, sp, LIQ.mcm, DOTS.nab, false, 70);
      st.well = { a: seg(t, .3, .9), td: td1, tb: td1 + 1.0 };
      st.a.layers[1].fields = [{ f: F.nabA, o: { t0: td2, origin: tipO, stag: .6 } }];
      st.clock = { d: 'A', p: seg(t, td2 + .8, td2 + 4.8), a: seg(t, td2 + .5, td2 + .9) };
      st.legendAb = seg(t, td1 + 1, td1 + 1.8);
      st.caps.push([S.cap, seg(t, .3, 1)]);
      fly(4, td2 + 5.3);
      st.fl = { NAB: [.3, td2, td2 + 5.3] };
      break;
    }
    case 5: {
      // A1 astrocyte medium → 30 kDa concentrator → purified RGCs, which die. Static arrows, no pipette.
      st.a.layers = reset({ r: 0, fields: [{ f: F.nabA, o: {} }] }, { r: 1, fields: [] });
      st.a.layers[1].fields = [{ f: F.acm, o: { t0: .3, stag: 1.0, spread: 1.4, origin: fromAstro } }];
      st.legendTox = seg(t, .8, 1.5); st.legendAb = 1;
      const tF = .4, tN = 2.2, gone = 1 - seg(t, tN, tN + .5);        // filter and both arrows appear together and leave together
      st.arrows = [{ x0: DX.A + DR + 8, x1: POS.filt.x - 36, y: FY - rWall(DR) - 4, a: seg(t, tF, tF + .3) * gone }, { x0: POS.filt.x + 36, x1: DX.N - DR - 8, y: FY - rWall(DR) - 4, a: seg(t, tF, tF + .3) * gone }];
      st.filter = { a: seg(t, tF, tF + .3) * gone, fill: 1, conc: 1, spin: 0, lab: 0, t };
      const d = seg(t, tN + .4, tN + 3.8);
      st.n.layers = [{ d, fields: [{ f: F.concN, o: { t0: tN, origin: () => [-DR, 0], stag: .8 } }] }];
      st.clock = { d: 'N', p: d, a: seg(t, tN + .2, tN + .6) };
      st.caps.push([S.cap, seg(t, .3, 1)]);
      fly(5, tN + 4.0);
      st.fl = { RGC: [tN], e_AST_RGC: [tN], b_RGC: [tN + 4.0] };
      break;
    }
    case 6: {
      st.a.layers = [{ r: 1, fields: [{ f: F.acm, o: {} }] }]; st.legendTox = 1; st.legendAb = 1;
      st.n.layers = [{ d: 1, fields: [{ f: F.concN, o: {} }], a: 1 - seg(t, 0, .6) }];
      st.wells = { a: seg(t, .4, 1.2), t };
      st.caps.push([S.cap, seg(t, .3, 1)]);
      break;
    }
    case 7: {
      // both controls straight onto RGCs: activated-microglia medium, then the three cytokines
      st.a.layers = [{ r: 1, fields: [{ f: F.acm, o: {} }] }]; st.legendTox = 1; st.legendAb = 1;
      st.wells = { a: 1 - seg(t, 0, .5), t: 99 };
      const sp = .8, t0C = 6.0;
      const tdM = H(POS.M, POS.N, .9, sp, LIQ.mcm, DOTS.mcm, false, 120, { arcA: 1 - seg(t, t0C, t0C + .6) });
      st.tubes.push({ p: POS.vialR, label: 'IL-1α + TNF + C1q', lsz: 21, a: seg(t, t0C - .6, t0C - .1), dots: DOTS.cyto, liq: LIQ.cyto });
      const tdC = H(POS.vialR, POS.N, t0C, sp, LIQ.cyto, DOTS.cyto, false, 60);
      const dishA = seg(t, .45, 1), sw = t0C + .2;
      st.n.layers = reset({ d: 0, fields: [{ f: F.mcmN, o: { t0: tdM, origin: tipO, stag: .6 } }], a: dishA }, { d: 0, fields: [{ f: F.cytoN, o: { t0: tdC, origin: tipO, stag: .6 } }], a: dishA }, sw);
      st.clock = t < sw + .4 ? { d: 'N', p: seg(t, tdM + .4, tdM + 2.4), a: seg(t, tdM + .1, tdM + .5) * (1 - seg(t, sw, sw + .4)) }
                             : { d: 'N', p: seg(t, tdC + .4, tdC + 2.4), a: seg(t, tdC + .1, tdC + .5) };
      const fin = seg(t, tdC + 3.4, tdC + 4.2);
      st.caps.push([S.cap, seg(t, .3, 1) * (1 - seg(t, tdC + 2.8, tdC + 3.4))]);
      st.caps.push([S.capEnd, fin]);
      st.aHL = fin;
      st.aBypass = seg(t, 0, .6) * (1 - fin); st.mBypass = seg(t, t0C, t0C + .6) * (1 - fin);
      fly(6, tdM + 2.6); fly(7, tdC + 2.6);
      st.fl = { AMM: [.6, tdM, tdM + 2.6], CK2: [t0C - .6, tdC, tdC + 2.6] };
      break;
    }
  }
  renderRelay(k, t, gt, st);
}
// set by step 15 to reuse step 14's last frame without its results panel / heading
const RELAY_SKIP = { ledger: false, caps: false };
const ghostDish = (x, r, a) => {               // dashed outline: a dish that is absent
  if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.setLineDash([9, 9]); ctx.strokeStyle = rgb(GRAYP.rim, .75); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, FY - rWall(r), r, rRy(r), 0, 0, TAU); ctx.stroke(); ctx.restore();
};
function renderRelay(s, t, gt, st) {   // s = scene-4 step k
  const intro = st.intro;
  // field release times (o.t0) are step-local; Field.pos compares them with the global clock
  const gO = o => o.t0 === undefined ? o : { ...o, t0: o.t0 + gt - t };
  const dA = key => intro ? seg(t, { M: .2, A: .5, N: .8 }[key], { M: 1, A: 1.3, N: 1.6 }[key]) : 1;
  const dish = (x, r, a, content, o) => tiltDish(x, FY - rWall(r), r, RT, a, UI.dish, content, o);
  const name = (str, x, a, col, y = NAME_Y) => txt(str, x, y, { a, size: 28, w: 600, align: 'center', col: col || COL.text });
  const state = (str, x, a, col) => txt(str, x, NAME_Y + 36, { a, size: 26, align: 'center', col });
  // --- hop arcs (under everything)
  const top = p => p === POS.R ? rimTop(86) - 6 : rimTop(DR) - 6;
  for (const a of st.arcs) {
    const dishy = p => p === POS.M || p === POS.A || p === POS.N || p === POS.R;
    const fx = a.from.x, fy = dishy(a.from) ? top(a.from) : a.from.y - (a.from.arcUp ?? 50);
    const tx = a.to.x, ty = dishy(a.to) ? top(a.to) : a.to.y - 60;
    hopArc(fx, fy, tx, ty, a.lift, a.prog, a.ok, a.a ?? 1);
  }
  // --- microglia dish
  {
    const a = dA('M') * (1 - .7 * (st.mBypass || 0)), m = st.m;
    const absent = m.absent || 0, ret = m.returnA ?? 1, da = a * (1 - absent) * (s === 4 ? ret : 1);
    dish(DX.M, DR, da, () => {
      if (s === 3) {
        MIC.forEach(c => c.draw(ctx, { t: gt, r: 0, a: 1 - absent }));
        for (const f of m.fields) f.f.draw(ctx, gt, gO(f.o));
      } else {
        MIC.forEach(c => c.draw(ctx, { t: gt, r: m.act }));
        for (const f of m.fields) f.f.draw(ctx, gt, gO(f.o));
      }
    });
    ghostDish(DX.M, DR, s === 4 ? a * (1 - ret) : a * absent);
    name(s === 3 && absent > .5 ? 'No microglia' : 'Microglia', DX.M, a, s === 3 ? GRAYP.rim : COL.text);
  }
  // --- step 9 control: a second, small dish of resting microglia slides in between the dishes
  if (st.rest > .004) {
    const r = 86, u = ease(st.rest), x = POS.R.x, dy = (1 - u) * -70;
    ctx.save(); ctx.translate(0, dy);
    tiltDish(x, FY - rWall(r), r, RT, u, UI.dish, () => {
      ctx.scale(r / DR, r / DR);
      MIC.forEach(c => c.draw(ctx, { t: gt, r: 0 }));
      F.restM.draw(ctx, gt, {});
    });
    txt('Resting microglia', x, FY + rRy(r) + 40, { a: u, size: 26, w: 600, align: 'center' });
    ctx.restore();
  }
  // --- astrocyte dish
  {
    const byp = st.aBypass || 0, a = dA('A') * (1 - .7 * byp);
    dish(DX.A, DR, a, () => {
      st.a.layers.forEach(ly => {
        const la = ly.a ?? 1; if (la <= .004) return;
        AST.forEach(c => c.draw(ctx, { t: gt, r: ly.r, a: la }));
        for (const f of ly.fields) f.f.draw(ctx, gt, { ...gO(f.o), a: (f.o.a ?? 1) * la });
      });
    }, { hl: st.aHL || 0, hlCol: COL.coral });
    name('Astrocytes', DX.A, a);
  }
  // --- RGC dish / dose wells
  {
    const a = dA('N'), wa = st.wells ? st.wells.a : 0;
    dish(DX.N, DR, a * (1 - wa), () => {
      st.n.layers.forEach(ly => {
        const la = ly.a ?? 1; if (la <= .004) return;
        RGC.forEach(c => c.draw(ctx, { t: gt, d: ly.d, a: la }));
        for (const f of ly.fields) f.f.draw(ctx, gt, { ...gO(f.o), a: (f.o.a ?? 1) * la });
      });
    });
    if (wa > 0) drawWells(st.wells.t, gt, wa);
    name('Retinal ganglion cells', DX.N, a * (1 - wa));
  }
  // --- tubes, well, filter
  for (const tb of st.tubes) drawTube(tb.p.x, tb.p.y, { a: tb.a, label: tb.label, lsz: tb.lsz, label2: tb.label2, dots: tb.dots, liq: tb.liq, s: tb.s });
  if (st.well && st.well.a > 0) drawNabWell(POS.well.x, POS.well.y, 74, t, gt, st.well);
  if (st.filter && st.filter.a > 0) drawFilter(POS.filt.x, POS.filt.y, st.filter, gt);
  for (const ar of st.arrows || []) staticArrow(ar.x0, ar.y, ar.x1, ar.y, ar.a);
  // --- clock
  if (st.clock) { const d = DX[st.clock.d]; drawClock(d + DR * .84, FY - rWall(DR) - rRy(DR) - 6, st.clock.p, st.clock.a); }
  // --- results table (step 15 animates it itself)
  if (!RELAY_SKIP.ledger) drawFlow(flowProg(s, t, st), 1);
  // --- pipettes
  for (const h of st.hops) {
    const p = hopPose(t - h.t0, h.src, h.dst, h.sp); if (!p) continue;
    drawPipette(p.x, p.y, p.fill, h.liq, h.dots, 1, p.low);
  }
  vignette();
  drawLegend(st);
  if (RELAY_SKIP.caps) return;
  st.caps.forEach(c => caption(c[0], c[1]));
  if (st.sub) subcap(st.sub[0], st.sub[1]);
}
// legend: an entry exists only from the moment its glyph first appears; the strip re-centres smoothly as entries come and go
const LEGEND = [
  { g: 'sec', label: 'secreted factors', v: st => st.leg.sec },
  { g: 'il1', label: 'IL-1α', v: st => st.leg.names }, { g: 'tnf', label: 'TNF', v: st => st.leg.names }, { g: 'c1q', label: 'C1q', v: st => st.leg.names },
  { g: 'other', label: 'other secreted', v: st => st.leg.names },
  { g: 'ab', label: 'neutralizing Ab', v: st => st.legendAb || 0 }, { g: 'tox', label: 'unknown factor', v: st => st.legendTox || 0 },
];
const LEGEND_Y = 655;                     // halfway between the dish names and the top of the flowchart
function drawLegend(st) {
  ctx.font = `500 27px ${FONT}`;
  const gap = 44, items = LEGEND.map(l => ({ l, v: l.v(st), iw: l.g === 'sec' ? 92 : 50 }));
  items.forEach(it => it.w = it.iw + ctx.measureText(it.l.label).width);
  const total = items.reduce((p, it) => p + (it.w + gap) * it.v, 0) - gap * Math.max(...items.map(it => it.v), 0);
  let x = 960 - total / 2;
  for (const it of items) {
    if (it.v <= .004) continue;
    const g = it.l.g, y = LEGEND_Y;
    if (g === 'sec') [['il1', 12, -12], ['tnf', 46, -2], ['c1q', 76, -12], ['other', 28, 8]].forEach(([q, dx, dy]) => glyph(ctx, q, x + dx, y - 8 + dy, GSIZE[q] * (q === 'other' ? 2.4 : 1.8), 0, it.v));
    else glyph(ctx, g, x + 18, y - 9, GSIZE[g] * (g === 'other' ? 2.8 : 2.2), 0, it.v);
    txt(it.l.label, x + it.iw, y, { a: it.v, size: 27, col: COL.legend, halo: 6 });
    x += (it.w + gap) * it.v;
  }
}
// ---- flowchart under the dishes: builds step by step, one idea per addition ----
// main lane: LPS → Microglia → secreted factors → Astrocytes → (unknown factor) → RGCs.
// lower lane: every treatment applied straight to a dish, pointing at it, with its result underneath.
const FLY = { A: 748, B: 852, bus: 802 };
const FLOW = {
  nodes: { LPS: ['LPS', 150, 2], MG: ['Microglia', 430, 2], SEC: ['secreted factors', 790, 2], AST: ['Astrocytes', 1150, 1], RGC: ['RGCs', 1650, 5] },
  chips: {
    LPSd: ['LPS directly', 140, 1, 'No change', 'AST'], RM: ['Resting medium', 395, 2, 'No change', 'AST'], NAB: ['Activated medium + nAbs', 705, 4, 'No change', 'AST'],
    CK: ['IL-1α + TNF + C1q', 1030, 3, 'A1', 'AST'], AMM: ['Activated medium', 1385, 7, 'Survival', 'RGC'], CK2: ['IL-1α + TNF + C1q', 1705, 7, 'Survival', 'RGC'],
  },
  edges: { e_LPS_MG: ['LPS', 'MG', 2], e_MG_SEC: ['MG', 'SEC', 2], e_SEC_AST: ['SEC', 'AST', 2], e_AST_RGC: ['AST', 'RGC', 5] },
  badges: { b_AST: ['A1', 'AST', 2], b_RGC: ['Death', 'RGC', 5] },
};
// progress of element id, phase j (0 appear · 1 arrow · 2 result), within step k at time t
function flowProg(k, t, st) {
  const stepOf = id => (FLOW.nodes[id] || FLOW.chips[id] || FLOW.edges[id] || FLOW.badges[id])[2];
  return (id, j = 0, dur = .5) => {
    const S = stepOf(id); if (k > S) return 1; if (k < S) return 0;
    const T = st.fl && st.fl[id]; return T && T[j] !== undefined ? seg(t, T[j], T[j] + dur) : 0;
  };
}
const flowFont = sz => `${sz === 26 ? 600 : 500} ${sz}px ${FONT}`;
function flowBox(label, x, y, a, sz, strong, col, k = 0) {      // col, k: outline colour and how far it has taken over from neutral
  ctx.font = flowFont(sz); const w = ctx.measureText(label).width + 40, h = 50;
  ctx.save(); ctx.globalAlpha *= a; rr(x - w / 2, y - h / 2, w, h, 12);
  ctx.fillStyle = rgb(COL.bg); ctx.fill();
  ctx.strokeStyle = k > 0 ? rgb(mix(mix(COL.bg, COL.text, strong ? .5 : .3), col, k)) : fg(strong ? .5 : .3); ctx.lineWidth = (strong ? 2.4 : 2) + 1.6 * k; ctx.stroke(); ctx.restore();
  txt(label, x, y + sz * .35, { a, size: sz, w: strong ? 600 : 500, align: 'center', col: COL.text });
  return w;
}
function flowArrow(x0, y0, x1, y1, p, o = {}) {       // o.col, o.blocked (dashed, grey, with a cross once complete)
  if (p <= .004) return;
  const col = o.blocked ? GRAYP.rim : (o.col || fg(.6)), q = ease(p), ex = lerp(x0, x1, q), ey = lerp(y0, y1, q);
  ctx.save(); ctx.strokeStyle = typeof col === 'string' ? col : rgb(col); ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 3; ctx.lineCap = 'round';
  if (o.blocked) ctx.setLineDash([8, 7]);
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]);
  if (p >= .98) {
    const an = Math.atan2(y1 - y0, x1 - x0);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - Math.cos(an - .45) * 15, y1 - Math.sin(an - .45) * 15); ctx.lineTo(x1 - Math.cos(an + .45) * 15, y1 - Math.sin(an + .45) * 15); ctx.closePath(); ctx.fill();
    if (o.blocked) { const mx = (x0 + x1) / 2, my = (y0 + y1) / 2; ctx.setLineDash([]); ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(mx - 9, my - 9); ctx.lineTo(mx + 9, my + 9); ctx.moveTo(mx + 9, my - 9); ctx.lineTo(mx - 9, my + 9); ctx.stroke(); }
  }
  ctx.restore();
}
function staticArrow(x0, y, x1, _y, a) {               // a plain arrow that just fades in (steps with no pipette)
  if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = fg(.65); ctx.fillStyle = fg(.65); ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1 - 6, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 - 16, y - 9); ctx.lineTo(x1 - 16, y + 9); ctx.closePath(); ctx.fill(); ctx.restore();
}
function drawFlow(P, am) {
  const W_ = {};      // node half widths for arrow endpoints
  for (const [id, [l, x]] of Object.entries(FLOW.nodes)) {
    const a = P(id) * am; ctx.font = flowFont(26); W_[id] = ctx.measureText(l).width / 2 + 20;
    const k = id === 'SEC' ? 1 : id === 'AST' ? P('b_AST', 0, .5) : id === 'RGC' ? P('b_RGC', 0, .5) : 0;
    if (a > .004) flowBox(l, x, FLY.A, a, 26, true, COL.coral, k);
  }
  const nx = id => FLOW.nodes[id][1];
  for (const [id, [f, t_]] of Object.entries(FLOW.edges)) {
    const p = P(id, 0, .6) * am; if (p <= .004) continue;
    const bad = id === 'e_SEC_AST' || id === 'e_AST_RGC';
    flowArrow(nx(f) + W_[f] + 8, FLY.A, nx(t_) - W_[t_] - 10, FLY.A, p, { col: bad ? COL.coral : null });
    if (id === 'e_AST_RGC') flowBox('unknown factor', (nx(f) + nx(t_)) / 2, FLY.A, p, 24, false, COL.coral, 1);
  }
  // lower lane: treatments applied straight to a dish feed one bus per target; the result sits under each chip
  const busCol = rgb(mix(COL.bg, COL.text, .42)), junction = {};
  for (const [id, [l, x, , res, tgt]] of Object.entries(FLOW.chips)) {
    const a = P(id, 0, .5) * am; if (a <= .004) continue;
    const jx = nx(tgt), p = P(id, 1, .6) * am;
    ctx.save(); ctx.strokeStyle = busCol; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (p > .004) {
      const q = ease(p), yb = FLY.bus;       // stub up from the chip, then along the bus to the target's column
      ctx.beginPath(); ctx.moveTo(x, FLY.B - 25); ctx.lineTo(x, lerp(FLY.B - 25, yb, Math.min(1, q * 2)));
      if (q > .5) { ctx.lineTo(lerp(x, jx, (q - .5) * 2), yb); } ctx.stroke();
      if (q >= .999) junction[tgt] = true;
    }
    ctx.restore();
    const ra = P(id, 2, .4), good = res === 'No change' || res === 'Survival';
    flowBox(l, x, FLY.B, a, 24, false, good ? COL.teal : COL.coral, ra);
  }
  for (const tgt of Object.keys(junction)) {          // the bus rises into its target with an arrowhead
    const x = nx(tgt), y0 = FLY.bus, y1 = FLY.A + 27;
    ctx.save(); ctx.strokeStyle = busCol; ctx.fillStyle = busCol; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1 + 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x - 9, y1 + 15); ctx.lineTo(x + 9, y1 + 15); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // the result: the chip's path is drawn out again in green (nothing happens) or red (A1 / death), chip to target
  for (const [id, [, x, , res, tgt]] of Object.entries(FLOW.chips)) {
    const p = P(id, 2, .9) * am; if (p <= .004) continue;
    const col = rgb(res === 'No change' || res === 'Survival' ? COL.teal : COL.coral), jx = nx(tgt), y1 = FLY.A + 27;
    const pts = [[x, FLY.B - 25], [x, FLY.bus], [jx, FLY.bus], [jx, y1 + 6]], lens = [];
    let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); lens.push(d); tot += d; }
    let left = ease(p) * tot;
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length && left > 0; i++) { const f = Math.min(1, left / Math.max(lens[i - 1], 1e-6)); ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)); left -= lens[i - 1]; }
    ctx.stroke();
    if (p >= .995) { ctx.beginPath(); ctx.moveTo(jx, y1); ctx.lineTo(jx - 10, y1 + 16); ctx.lineTo(jx + 10, y1 + 16); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
}
function pill(x, y, res, a, center) {
  if (a <= .004) return;
  const good = res === 'No change' || res === 'Survival', col = good ? COL.teal : COL.coral;
  ctx.save(); ctx.globalAlpha *= a; ctx.font = `700 24px ${FONT}`;
  const w = ctx.measureText(res).width + 36, h = 34, px = center ? x - w / 2 : x;
  rr(px, y - h + 8, w, h, h / 2);
  if (good) { ctx.fillStyle = rgb(COL.bg); ctx.fill(); ctx.strokeStyle = rgb(col); ctx.lineWidth = 2.4; ctx.stroke(); } else { ctx.fillStyle = rgb(col); ctx.fill(); }
  ctx.restore();
  txt(res, px + w / 2, y, { a, size: 24, w: 700, align: 'center', col: good ? col : [255, 255, 255] });
}
function drawWells(t, gt, a) {
  // four dose wells in one row where the RGC dish was: dose above, survival printed plainly underneath
  const wr = 72, ry = rRy(wr), Hw = rWall(wr), fy = FY, sc = seg(t, 5.5, 6.3) * a;
  [0, 1, 2, 3].forEach(w => {
    const x = 1320 + w * 160;
    tiltDish(x, fy - Hw, wr, RT, a, UI.dish, () => {
      ctx.scale(wr / 90, wr / 90);
      WELLS[w].forEach(q => q.c.draw(ctx, { t: gt, d: q.dies ? ease(seg(t, 1.3 + q.st * 1.5, 4.8 + q.st * 1.5)) : 0, noPuncta: true }));
    });
    const D = DOSES[w];
    txt(D.d + ' µg/ml', x, fy - Hw - ry - 14, { a, size: 24, w: 600, align: 'center' });
    txt(D.s, x, fy + ry + 46, { a: sc, size: 34, w: 700, align: 'center', col: D.n > 15 ? COL.teal : D.n > 5 ? UI.midSurv : COL.coral });
  });
}
function drawAQP4(x, y, r, rr_, a, gt) {
  ctx.save(); ctx.globalAlpha *= a;
  ctx.fillStyle = rgb(UI.lumen); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.save(); clipCircle(x, y, r - 1);
  const vx = x - 16, vy = y + 24, vr = 36;
  ctx.strokeStyle = rgb(TP.endo.rim); ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(vx, vy, vr, 0, TAU); ctx.stroke();
  ctx.strokeStyle = rgb(TP.endo.body); ctx.lineWidth = 6.5; ctx.beginPath(); ctx.arc(vx, vy, vr, 0, TAU); ctx.stroke();
  const pal = palMix(TP.astro, CORAL, sstep(seg(rr_, .05, .6)));
  const sx = x + 46, sy = y - 52;
  const endA0 = -3.55, endA1 = -.05, er = vr + 8;
  const shape = ex => {
    ctx.beginPath();
    const pts = []; for (let i = 0; i <= 18; i++) { const an = lerp(endA0, endA1, i / 18); pts.push(vx + Math.cos(an) * er, vy + Math.sin(an) * er); }
    addStrand(ctx, { pts, ws: Array(19).fill(0).map((_, i) => 7 + 2 * Math.sin(i / 18 * Math.PI)), n: 18 }, ex);
    const mx = vx + Math.cos(-1.05) * er, my = vy + Math.sin(-1.05) * er;
    const pp = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pp.push(lerp(mx, sx, u) + Math.sin(u * Math.PI) * 8, lerp(my, sy, u)); }
    addStrand(ctx, { pts: pp, ws: Array(11).fill(0).map((_, i) => lerp(5, 7, i / 10)), n: 10 }, ex);
    ctx.moveTo(sx + 12 + ex, sy); ctx.arc(sx, sy, 12 + ex, 0, TAU);
  };
  shape(1.4); ctx.fillStyle = rgb(pal.rim); ctx.fill(); shape(0); ctx.fillStyle = rgb(pal.body); ctx.fill();
  ctx.fillStyle = rgb(pal.nuc); ctx.beginPath(); ctx.ellipse(sx, sy, 6, 5, .4, 0, TAU); ctx.fill();
  const R = rng(4242), k = ease(rr_);
  for (let i = 0; i < 44; i++) {
    const an = lerp(endA0 + .1, endA1 - .1, R()), home = [vx + Math.cos(an) * (er + (R() - .5) * 4), vy + Math.sin(an) * (er + (R() - .5) * 4)];
    const u = R(), dsp = u < .45 ? [sx + (R() - .5) * 20, sy + (R() - .5) * 20] : [lerp(vx + Math.cos(-1.05) * er, sx, R()) + (R() - .5) * 8, lerp(vy + Math.sin(-1.05) * er, sy, R()) + (R() - .5) * 6];
    const px = lerp(home[0], dsp[0], k), py = lerp(home[1], dsp[1], k);
    ctx.fillStyle = rgb(UI.aqpDot, .95); ctx.beginPath(); ctx.arc(px, py, 1.7, 0, TAU); ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = fg(.45); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  ctx.restore();
  txt('in vivo · AQP4', x, y - r - 12, { a, size: 13, w: 600, ls: 2, align: 'center', col: COL.dim });
  txt(rr_ > .5 ? 'leaves the endfoot' : 'on the endfoot', x, y + r + 22, { a, size: 14, align: 'center', col: COL.dim });
}
function drawNabWell(x, y, r, t, gt, W_) {
  const a = W_.a;
  ctx.save(); ctx.globalAlpha *= a;
  tiltDish(x, y - rWall(r), r, RT, 1, UI.dish, () => {
  const f = F.well, o = { t0: W_.td, origin: () => [0, -18], stag: .4, wander: .6 };
  const cyt = f.ps.filter(p => p.type !== 'other');
  for (const p of f.ps) {
    const q = f.pos(p, gt - (gt - t) * 0, o.t0 !== undefined ? { ...o, t0: W_.td - t + gt } : o); if (!q) continue;
    const ci = cyt.indexOf(p);
    let bnd = 0, abPos = null;
    if (ci >= 0) {
      const t0 = W_.tb + ci * .12, u = ease(seg(t, t0, t0 + 1.1));
      bnd = seg(t, t0 + .9, t0 + 1.2);
      const S = 15, tip = [-.4 * S, -.45 * S], hx = q[0] - tip[0] + p.sz * 2, hy = q[1] - tip[1] + GSIZE[p.type] * .5;
      const sx = (ci - 5) * 14, sy = -r - 30;
      if (u > 0) abPos = [lerp(sx, hx, u), lerp(sy, hy, u)];
    }
    const type = bnd > .5 ? p.type + 'b' : p.type;
    glyph(ctx, bnd > .5 ? p.type + 'b' : p.type, q[0], q[1], GSIZE[p.type] * p.sz * .9, p.rot, q[2]);
    if (abPos && bnd <= .5) { ctx.save(); ctx.translate(abPos[0], abPos[1]); gAb(ctx, 15, 1); ctx.restore(); }
  }
  });
  ctx.restore();
  txt('+ anti-IL-1α / TNF / C1q', x, y - rWall(r) - rRy(r) - 16, { a: a * seg(t, W_.tb - .4, W_.tb + .3), size: 22, align: 'center', col: COL.legend });
}
function drawFilter(x, y, F_, gt) {
  const a = F_.a; if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a;
  const spinJ = F_.spin ? Math.sin(gt * 40) * .8 * F_.spin : 0;
  ctx.translate(x + spinJ, y);
  const top = -72, mem = 52, bot = 112, w = 30, wi = 22;
  // outer tube
  ctx.beginPath(); ctx.moveTo(-w, top); ctx.lineTo(w, top); ctx.lineTo(w, bot - 20); ctx.quadraticCurveTo(w, bot, 0, bot); ctx.quadraticCurveTo(-w, bot, -w, bot - 20); ctx.closePath();
  ctx.fillStyle = rgb(UI.rim, UI.glassA * .6); ctx.fill(); ctx.strokeStyle = rgb(UI.rim, Math.min(1, .5 * UI.rimA)); ctx.lineWidth = 1.3; ctx.stroke();
  // filtrate (below membrane) rises
  const fl = F_.conc * (bot - mem - 16);
  ctx.save(); ctx.beginPath(); ctx.rect(-w + 1, bot - 4 - fl, 2 * w - 2, fl + 4); ctx.clip();
  ctx.fillStyle = rgb(UI.filtrate, .25); ctx.beginPath(); ctx.moveTo(-w + 1, mem); ctx.lineTo(w - 1, mem); ctx.lineTo(w - 1, bot - 20); ctx.quadraticCurveTo(w - 1, bot - 1, 0, bot - 1); ctx.quadraticCurveTo(-w + 1, bot - 1, -w + 1, bot - 20); ctx.closePath(); ctx.fill(); ctx.restore();
  // insert
  ctx.strokeStyle = rgb(UI.rim, Math.min(1, .4 * UI.rimA)); ctx.beginPath(); ctx.moveTo(-wi, top); ctx.lineTo(-wi, mem); ctx.moveTo(wi, top); ctx.lineTo(wi, mem); ctx.stroke();
  // retentate
  const lvl0 = mem - top - 20, lvl = F_.fill * lerp(lvl0, 7, F_.conc);
  if (lvl > 0) {
    ctx.fillStyle = rgb(liqC(mix([92, 64, 62], [150, 70, 60], F_.conc)), .6); ctx.fillRect(-wi + 1, mem - lvl, 2 * wi - 2, lvl);
    const R = rng(77);
    for (let i = 0; i < 26; i++) { const px = (R() - .5) * (2 * wi - 8), py = mem - R() * lvl * .92; const tox = R() < .65; ctx.fillStyle = rgb(tox ? PC.tox : PC.other, F_.fill); ctx.beginPath(); ctx.arc(px, py, tox ? 2.1 : 1.6, 0, TAU); ctx.fill(); }
  }
  // small molecules pass the 30 kDa membrane
  if (F_.spin > 0) { for (let i = 0; i < 12; i++) { const u = ((gt * .9 + i / 12) % 1); ctx.fillStyle = rgb(UI.small, .8 * F_.spin * Math.sin(u * Math.PI)); ctx.beginPath(); ctx.arc(((i * 7.1) % 36) - 18, lerp(mem - 18, mem + 34, u), 1, 0, TAU); ctx.fill(); }
    // IL-1α (~18 kDa) also passes the membrane; TNF trimer (~52 kDa) and C1q (~460 kDa) are retained
    for (let j = 0; j < 2; j++) { const u = (gt * .38 + j * .5) % 1; if (u < .6) { const v = u / .6; glyph(ctx, 'il1', j ? 7 : -8, lerp(mem - 22, mem + 30, v), 7, gt * .8 + j, F_.spin * Math.sin(v * Math.PI)); } } }
  ctx.setLineDash([3, 2]); ctx.strokeStyle = fg(.85); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-wi, mem); ctx.lineTo(wi, mem); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
  if (F_.spin > 0) { ctx.save(); ctx.globalAlpha *= a * F_.spin; ctx.translate(x + w + 26, y - 10); ctx.rotate(gt * 6); ctx.strokeStyle = fg(.8); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 11, 0, 4.6); ctx.stroke(); ctx.fillStyle = fg(.8); ctx.beginPath(); ctx.moveTo(11 * Math.cos(4.6) + 4, 11 * Math.sin(4.6) + 4); ctx.lineTo(11 * Math.cos(4.6) - 5, 11 * Math.sin(4.6) + 1); ctx.lineTo(11 * Math.cos(4.6) + 1, 11 * Math.sin(4.6) - 6); ctx.fill(); ctx.restore(); }
}
