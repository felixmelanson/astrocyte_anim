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
// step = the scene-4 step (k) whose result produces this ledger card
const CARDS = [
  { l1: 'LPS', to: 'astrocytes', res: 'no change', k: 'a', r: 0, step: 1 },
  { l1: 'LPS-microglia medium', to: 'astrocytes', res: 'A1', k: 'a', r: 1, step: 2 },
  { l1: 'resting-microglia medium', to: 'astrocytes', res: 'no change', k: 'a', r: 0, step: 2 },
  { l1: 'IL-1α + TNF + C1q', to: 'astrocytes', res: 'A1', k: 'a', r: 1, step: 3 },
  { l1: 'LPS-microglia med. + nAbs', to: 'astrocytes', res: 'no change', k: 'a', r: 0, step: 4 },
  { l1: 'A1 astrocyte medium', to: 'RGCs', res: 'die', k: 'n', d: 1, step: 5 },
  { l1: 'LPS-microglia medium', to: 'RGCs', res: 'survive', k: 'n', d: 0, step: 7 },
  { l1: 'IL-1α + TNF + C1q', to: 'RGCs', res: 'survive', k: 'n', d: 0, step: 7 },
];
const cardX = i => 960 + (i - 3.5) * 222, CARDY = 880;

const POS = {
  M: { x: DX.M, y: DY }, A: { x: DX.A, y: DY }, N: { x: DX.N, y: DY, lift: 120 },
  vialL: { x: 660, y: 262 }, vialR: { x: 1260, y: 262 }, well: { x: 660, y: 262 }, filt: { x: 1260, y: 300 },
};
const MN = { x: DX.M, y: DY };
// in vivo AQP4 inset (Ext. Data Fig. 5a) during the microglia-medium step; off since the declutter pass
// (an in vivo marker squeezed between two in vitro dishes). Set true to bring it back.
const SHOW_AQP4_INSET = false;
// k = scene-4 step: 0 intro · 1 LPS direct · 2 LPS→microglia→astrocytes (+ resting control) · 3 cocktail
//                    4 nAbs · 5 concentrate ACM → RGCs · 6 dose wells · 7 both RGC controls
function scene4(k, t, gt, S) {
  const st = {
    m: { mode: 'act', act: 1, a: 1, fields: [] }, a: { layers: [] }, n: { layers: [] },
    hops: [], arcs: [], tubes: [], clock: null, caps: [], legend: 0, extra: [], cards: [],
    mSub: '', aSub: '', nSub: '', mName: 'Microglia', aHL: 0,
  };
  const mcmSteady = { f: F.mcm, o: {} };
  const reset = (layerOld, layerNew, t0 = 0) => [{ ...layerOld, a: (layerOld.a ?? 1) * (1 - seg(t, t0, t0 + .45)) }, { ...layerNew, a: (layerNew.a ?? 1) * seg(t, t0 + .45, t0 + .95) }];
  // one pipette hop; returns the dispense time. o.arcA fades the arc (e.g. before a second hop to the same dish)
  const H = (src, dst, t0, sp, liq, dots, ok, lift = 110, o = {}) => {
    st.hops.push({ src, dst, t0, sp, liq, dots });
    const td = t0 + HOPD * sp;
    st.arcs.push({ from: o.arcFrom || src, to: o.arcTo || dst, prog: seg(t, td, td + .8), ok, lift, a: o.arcA ?? 1 });
    return td;
  };
  const tipO = () => [0, -18];
  const fly = (i, tf) => st.cards.push({ i, tf });
  const fromMicro = p => { const c = MIC[p.src % MIC.length]; return [c.x, c.y]; };
  const fromAstro = p => { const c = AST[p.src % AST.length]; return [c.x, c.y]; };

  // defaults: from step 3 on, microglia are LPS-activated and their medium is in the dish
  st.m.act = k >= 3 ? 1 : 0; st.m.fields = k >= 3 ? [mcmSteady] : [];
  st.a.layers = [{ r: 0, fields: [] }]; st.n.layers = [{ d: 0, fields: [] }];
  st.legend = k >= 3 ? 1 : 0;
  if (k >= 3) st.mSub = '+ LPS';

  switch (k) {
    case 0: {
      st.intro = true; st.caps.push([S.cap, seg(t, 1.6, 2.6)]);
      break;
    }
    case 1: {
      st.tubes.push({ p: POS.vialL, label: 'LPS', a: seg(t, 0, .5), dots: DOTS.lps, liq: LIQ.lps });
      const td = H(POS.vialL, POS.A, .6, 1, LIQ.lps, DOTS.lps, false, 60);
      st.a.layers = [{ r: 0, fields: [{ f: F.lpsA, o: { t0: td, origin: tipO, stag: .6 } }] }];
      st.clock = { d: 'A', p: seg(t, td + .8, td + 4.8), a: bump(t, td + .5, td + .9, 99, 100) };
      st.aSub = t > td + .3 ? '+ LPS' : '';
      st.caps.push([S.cap, seg(t, .3, 1) * (1 - seg(t, td + 4.6, td + 5.1))]);
      st.caps.push([S.capEnd, seg(t, td + 5.1, td + 5.8)]);
      fly(0, td + 5.6);
      break;
    }
    case 2: {
      // beat A: LPS activates microglia, which start secreting
      const sp = .8;
      st.tubes.push({ p: POS.vialL, label: 'LPS', a: 1 - seg(t, 4.6, 5.2), dots: DOTS.lps, liq: LIQ.lps });
      const tdA = H(POS.vialL, POS.M, .5, sp, LIQ.lps, DOTS.lps, true, 60, { arcA: 1 - seg(t, 6.0, 6.6) });
      st.m.act = ease(seg(t, tdA + .4, tdA + 2.6));
      st.m.fields = [{ f: F.lpsM, o: { t0: tdA, origin: tipO, stag: .6, a: 1 - seg(t, tdA + 2, tdA + 3) } },
                     { f: F.mcm, o: { t0: tdA + 1.2, stag: 2.6, spread: 2, origin: fromMicro } }];
      st.legend = seg(t, tdA + 1.6, tdA + 2.4);
      // beat B: their medium → astrocytes → A1
      const t0C = 15.0;                       // beat C start
      const tdB = H(POS.M, POS.A, 6.2, sp, LIQ.mcm, DOTS.mcm, true, 110, { arcA: 1 - seg(t, t0C, t0C + .6) });
      const rB = ease(seg(t, tdB + .6, tdB + 4.4));
      // beat C: control, medium from resting microglia → no change
      const tdC = H(POS.M, POS.A, t0C + .4, .7, LIQ.rest, DOTS.rest, false);
      if (t < t0C) {
        st.mSub = t > tdA + .3 ? '+ LPS' : '';
        st.a.layers = reset({ r: 0, fields: [{ f: F.lpsA, o: {} }] }, { r: rB, fields: [{ f: F.mcmA, o: { t0: tdB, origin: tipO, stag: .6 } }] });
        st.clock = { d: 'A', p: seg(t, tdB + .6, tdB + 4.4), a: seg(t, tdB + .3, tdB + .7) };
        st.aSub = t > tdB + 3.4 ? 'A1 reactive' : '';
        st.inset = { r: rB, a: seg(t, tdB + 1, tdB + 1.8) };
      } else {
        st.m.swap = { old: 1 - seg(t, t0C, t0C + .5), neu: seg(t, t0C + .5, t0C + 1.1) };
        st.mSub = t > t0C + .5 ? 'no LPS' : '+ LPS';
        st.a.layers = reset({ r: 1, fields: [{ f: F.mcmA, o: {} }] }, { r: 0, fields: [{ f: F.restA, o: { t0: tdC, origin: tipO, stag: .6 } }] }, t0C);
        st.clock = { d: 'A', p: seg(t, tdC + .4, tdC + 2.4), a: seg(t, tdC + .1, tdC + .5) };
        st.inset = { r: 1, a: 1 - seg(t, t0C, t0C + .5) };
      }
      st.caps.push([S.cap, seg(t, .3, 1)]);
      st.sub = [S.sub, seg(t, t0C + .3, t0C + 1.1)];
      fly(1, tdB + 4.8); fly(2, tdC + 2.6);
      break;
    }
    case 3: {
      st.a.layers = reset({ r: 0, fields: [{ f: F.restA, o: {} }] }, { r: 0, fields: [] });
      st.m.absent = seg(t, 0, .8); st.m.mode = 'rest'; st.m.act = 0; st.m.fields = [{ f: F.restM, o: { a: 1 - seg(t, 0, .6) } }];
      st.mSub = 'none'; st.mName = 'No microglia';
      st.tubes.push({ p: POS.vialL, label: 'IL-1α + TNF + C1q', a: seg(t, .3, .8), dots: DOTS.cyto, liq: LIQ.cyto });
      const td = H(POS.vialL, POS.A, 1.0, 1, LIQ.cyto, DOTS.cyto, true, 60);
      const r = ease(seg(t, td + .8, td + 6.3));
      st.a.layers[1].r = r; st.a.layers[1].fields = [{ f: F.cyto, o: { t0: td, origin: tipO, stag: .6 } }];
      st.clock = { d: 'A', p: seg(t, td + .8, td + 6.3), a: seg(t, td + .5, td + .9) };
      st.aSub = t > td + 4.5 ? 'A1 reactive' : '';
      st.caps.push([S.cap, seg(t, .3, 1)]);
      st.sub = [S.sub, seg(t, 1, 1.8)];
      fly(3, td + 7.0);
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
      break;
    }
    case 5: {
      // A1 astrocyte medium → 30 kDa concentrator → purified RGCs, which die
      st.a.layers = reset({ r: 0, fields: [{ f: F.nabA, o: {} }] }, { r: 1, fields: [] });
      st.aSub = t > .6 ? 'A1 reactive' : '';
      st.a.layers[1].fields = [{ f: F.acm, o: { t0: .5, stag: 1.6, spread: 1.8, origin: fromAstro } }];
      st.qmark = seg(t, 1.4, 2.2);
      st.legendTox = seg(t, 1.2, 2.0); st.legendAb = 1;
      const sp = .75;
      const tdF = H(POS.A, POS.filt, 2.0, sp, LIQ.acm, DOTS.acm, true, 50);
      const t0N = tdF + 2.7;
      const tdN = H(POS.filt, POS.N, t0N, sp, LIQ.conc, DOTS.conc, true, 50);
      st.arcs[0].a = 1 - seg(t, t0N + .5, t0N + 1.2);
      st.filter = {
        a: seg(t, 1.6, 2.2) * (1 - seg(t, tdN + 1, tdN + 1.8)),
        fill: seg(t, tdF, tdF + .5) * (1 - seg(t, t0N + 1.2 * sp, t0N + 1.9 * sp)),
        conc: ease(seg(t, tdF + .6, tdF + 2.4)), spin: bump(t, tdF + .5, tdF + .8, tdF + 2.2, tdF + 2.5),
        lab: seg(t, tdF + 2, tdF + 2.6), t,
      };
      const d = seg(t, tdN + .5, tdN + 5.0);
      st.n.layers = [{ d, fields: [{ f: F.concN, o: { t0: tdN, origin: tipO, stag: .6 } }] }];
      st.clock = { d: 'N', p: d, a: seg(t, tdN + .2, tdN + .6) };
      st.nSub = t > tdN + .3 ? '50 µg/ml protein' : '';
      st.casp = seg(t, tdN + 2, tdN + 2.8);
      st.caps.push([S.cap, seg(t, .3, 1)]);
      fly(5, tdN + 5.2);
      break;
    }
    case 6: {
      st.a.layers = [{ r: 1, fields: [{ f: F.acm, o: {} }] }]; st.aSub = 'A1 reactive'; st.legendTox = 1; st.legendAb = 1; st.qmark = 1;
      st.n.layers = [{ d: 1, fields: [{ f: F.concN, o: {} }], a: 1 - seg(t, 0, .6) }];
      st.wells = { a: seg(t, .4, 1.2), t };
      st.caps.push([S.cap, seg(t, .3, 1)]);
      break;
    }
    case 7: {
      // both controls straight onto RGCs: activated-microglia medium, then the three cytokines
      st.a.layers = [{ r: 1, fields: [{ f: F.acm, o: {} }] }]; st.aSub = 'A1 reactive'; st.legendTox = 1; st.legendAb = 1; st.qmark = 1;
      st.wells = { a: 1 - seg(t, 0, .5), t: 99 };
      const sp = .8, t0C = 6.0;
      const tdM = H(POS.M, POS.N, .9, sp, LIQ.mcm, DOTS.mcm, false, 120, { arcA: 1 - seg(t, t0C, t0C + .6) });
      st.tubes.push({ p: POS.vialR, label: 'IL-1α + TNF + C1q', a: seg(t, t0C - .6, t0C - .1), dots: DOTS.cyto, liq: LIQ.cyto });
      const tdC = H(POS.vialR, POS.N, t0C, sp, LIQ.cyto, DOTS.cyto, false, 60);
      const dishA = seg(t, .45, 1), sw = t0C + .2;
      st.n.layers = reset({ d: 0, fields: [{ f: F.mcmN, o: { t0: tdM, origin: tipO, stag: .6 } }], a: dishA }, { d: 0, fields: [{ f: F.cytoN, o: { t0: tdC, origin: tipO, stag: .6 } }], a: dishA }, sw);
      st.clock = t < sw + .4 ? { d: 'N', p: seg(t, tdM + .4, tdM + 2.4), a: seg(t, tdM + .1, tdM + .5) * (1 - seg(t, sw, sw + .4)) }
                             : { d: 'N', p: seg(t, tdC + .4, tdC + 2.4), a: seg(t, tdC + .1, tdC + .5) };
      st.nSub = (t > tdM + 2.4 && t < sw) || t > tdC + 2.4 ? 'survive' : '';
      const fin = seg(t, tdC + 3.4, tdC + 4.2);
      st.caps.push([S.cap, seg(t, .3, 1) * (1 - seg(t, tdC + 2.8, tdC + 3.4))]);
      st.caps.push([S.capEnd, fin]);
      st.aHL = fin;
      st.aBypass = seg(t, 0, .6) * (1 - fin); st.mBypass = seg(t, t0C, t0C + .6) * (1 - fin);
      fly(6, tdM + 2.6); fly(7, tdC + 2.6);
      break;
    }
  }
  renderRelay(k, t, gt, st);
}
function renderRelay(s, t, gt, st) {   // s = scene-4 step k
  const intro = st.intro;
  const dA = key => intro ? seg(t, { M: .2, A: .5, N: .8 }[key], { M: 1, A: 1.3, N: 1.6 }[key]) : 1;
  // --- hop arcs (under everything)
  for (const a of st.arcs) {
    const fx = a.from.x, fy = a.from === POS.M || a.from === POS.A || a.from === POS.N ? DY - DR - 6 : a.from.y - 50;
    const tx = a.to.x, ty = a.to === POS.M || a.to === POS.A || a.to === POS.N ? DY - DR - 6 : a.to.y - 60;
    hopArc(fx, fy, tx, ty, a.lift, a.prog, a.ok, a.a ?? 1);
  }
  // --- microglia dish
  {
    const a = dA('M') * (1 - .7 * (st.mBypass || 0)), m = st.m;
    const absent = m.absent || 0, ret = m.returnA ?? 1;
    drawDish(DX.M, DY, DR, { a: a * (1 - absent) * (s === 4 ? ret : 1) });
    if (absent > 0 || (s === 4 && ret < 1)) drawDish(DX.M, DY, DR, { dashed: true, a: s === 4 ? 1 - ret : absent });
    ctx.save(); clipCircle(DX.M, DY, DR - 4); ctx.translate(DX.M, DY);
    if (m.swap) {
      MIC.forEach(c => c.draw(ctx, { t: gt, r: 1, a: a * m.swap.old }));
      MIC.forEach(c => c.draw(ctx, { t: gt, r: 0, a: a * m.swap.neu }));
      F.mcm.draw(ctx, gt, { a: m.swap.old }); F.restM.draw(ctx, gt, { a: m.swap.neu });
    } else if (s === 3) {
      MIC.forEach(c => c.draw(ctx, { t: gt, r: 0, a: 1 - absent }));
      for (const f of m.fields) f.f.draw(ctx, gt, f.o);
    } else {
      const ca = a * (s === 4 ? ret : 1);
      MIC.forEach(c => c.draw(ctx, { t: gt, r: m.act, a: ca }));
      for (const f of m.fields) f.f.draw(ctx, gt, { ...f.o, a: (f.o.a ?? 1) * ca });
    }
    ctx.restore();
    drawDishRim(DX.M, DY, DR, { a: a * (1 - absent) * (s === 4 ? ret : 1) });
    const nameCol = s === 3 ? GRAYP.rim : COL.text;
    txt(s === 3 && absent > .5 ? 'No microglia' : 'Microglia', DX.M, DY + DR + 40, { a, size: 24, w: 600, align: 'center', col: nameCol });
    const subCol = st.mSub === '+ LPS' ? COL.coral : COL.dim;
    txt(st.mSub === 'none' ? 'skipped entirely' : st.mSub, DX.M, DY + DR + 66, { a: a * (st.mSub ? 1 : 0), size: 17, align: 'center', col: subCol });
  }
  // --- astrocyte dish
  {
    const byp = st.aBypass || 0, a = dA('A') * (1 - .7 * byp);
    drawDish(DX.A, DY, DR, { a });
    ctx.save(); clipCircle(DX.A, DY, DR - 4); ctx.translate(DX.A, DY); ctx.globalAlpha *= a;
    // layers: when a layer is flagged "only", previous fresh layer is hidden to avoid double-drawing cells
    const L = st.a.layers;
    L.forEach((ly, i) => {
      const la = ly.a ?? 1; if (la <= .004) return;
      AST.forEach(c => c.draw(ctx, { t: gt, r: ly.r, a: la }));
      for (const f of ly.fields) f.f.draw(ctx, gt, { ...f.o, a: (f.o.a ?? 1) * la });
    });
    if (st.qmark) txt('?', 0, 30, { a: st.qmark * .55, size: 150, w: 200, align: 'center', col: COL.coral });
    ctx.restore();
    drawDishRim(DX.A, DY, DR, { a, hl: st.aHL, hlCol: COL.coral });
    txt('Astrocytes', DX.A, DY + DR + 40, { a, size: 24, w: 600, align: 'center' });
    txt(st.aSub, DX.A, DY + DR + 66, { a: a * (st.aSub ? 1 : 0) * (1 - byp), size: 17, align: 'center', col: st.aSub.startsWith('A1') ? COL.coral : COL.dim });
    if (byp > 0) txt('bypassed', DX.A, DY + DR + 66, { a: a * byp, size: 17, align: 'center', col: GRAYP.rim });
  }
  // --- RGC dish / dose wells
  {
    const a = dA('N');
    const wa = st.wells ? st.wells.a : 0;
    const L = st.n.layers, dishA = a * Math.max(1 - wa, ...L.map(l => l.a ?? 1)) ;
    drawDish(DX.N, DY, DR, { a: a * (1 - wa) });
    ctx.save(); clipCircle(DX.N, DY, DR - 4); ctx.translate(DX.N, DY); ctx.globalAlpha *= a;
    L.forEach((ly, i) => {
      const la = ly.a ?? 1; if (la <= .004) return;
      RGC.forEach(c => c.draw(ctx, { t: gt, d: ly.d, a: la }));
      for (const f of ly.fields) f.f.draw(ctx, gt, { ...f.o, a: (f.o.a ?? 1) * la });
    });
    ctx.restore();
    drawDishRim(DX.N, DY, DR, { a: a * (1 - wa) });
    if (wa > 0) drawWells(st.wells.t, gt, wa);
    txt('Retinal ganglion cells', DX.N, DY + DR + 40, { a: a * (1 - wa), size: 24, w: 600, align: 'center' });
    txt(st.nSub, DX.N, DY + DR + 66, { a: a * (1 - wa) * (st.nSub ? 1 : 0), size: 17, align: 'center', col: st.nSub === 'survive' ? COL.teal : COL.dim });
    if (st.casp) { txt('caspase-2/3 → apoptosis', DX.N, DY + DR + 94, { a: st.casp * (1 - wa), size: 16, align: 'center', col: UI.caspText }); }
  }
  // --- AQP4 inset (in vivo, Ext. Data Fig. 5a)
  if (SHOW_AQP4_INSET && st.inset && st.inset.a > 0) drawAQP4(1260, 440, 94, st.inset.r, st.inset.a, gt);
  // --- tubes, well, filter
  for (const tb of st.tubes) drawTube(tb.p.x, tb.p.y, { a: tb.a, label: tb.label, label2: tb.label2, dots: tb.dots, liq: tb.liq });
  if (st.well && st.well.a > 0) drawNabWell(POS.well.x, POS.well.y, 74, t, gt, st.well);
  if (st.filter && st.filter.a > 0) drawFilter(POS.filt.x, POS.filt.y, st.filter, gt);
  // --- clock
  if (st.clock) { const d = DX[st.clock.d]; drawClock(d + DR * .8, DY - DR * .92, st.clock.p, st.clock.a); }
  // --- ledger
  drawLedger(s, t, gt, st);
  // --- pipettes (top). The shaft ghosts out across the whole top band (caption, sub-caption,
  // legend) so text stays legible; full strength again below y = B1.
  for (const h of st.hops) {
    const p = hopPose(t - h.t0, h.src, h.dst, h.sp); if (!p) continue;
    const B0 = 168, B1 = 200, F = 8, G = .12;
    ctx.save(); ctx.beginPath(); ctx.rect(0, B1, W, H); ctx.clip(); drawPipette(p.x, p.y, p.fill, h.liq, h.dots, 1, p.low); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(0, -400, W, B0 + 400); ctx.clip(); drawPipette(p.x, p.y, p.fill, h.liq, h.dots, G, p.low); ctx.restore();
    for (let i = 0; i < F; i++) {        // soft edge out of the band
      const y0 = B0 + (B1 - B0) * i / F, y1 = B0 + (B1 - B0) * (i + 1) / F, m = (i + .5) / F;
      ctx.save(); ctx.beginPath(); ctx.rect(0, y0, W, y1 - y0 + .5); ctx.clip(); drawPipette(p.x, p.y, p.fill, h.liq, h.dots, G + (1 - G) * m * m, p.low); ctx.restore();
    }
  }
  vignette();
  // --- legend + captions
  drawLegend(st);
  st.caps.forEach(c => caption(c[0], c[1]));
  if (st.sub) subcap(st.sub[0], st.sub[1]);
}
function drawLegend(st) {
  const a = st.legend; if (!a || a <= .004) return;
  const items = [['il1', 'IL-1α', 1], ['tnf', 'TNF', 1], ['c1q', 'C1q', 1], ['other', 'other secreted', 1], ['ab', 'neutralizing Ab', st.legendAb || 0], ['tox', 'unknown factor', st.legendTox || 0]];
  items.forEach((it, i) => {
    const col = i % 3, row = (i / 3) | 0, x = 1250 + col * 222, y = 50 + row * 40;
    const ia = a * it[2]; if (ia <= .004) return;
    glyph(ctx, it[0], x, y - 7, GSIZE[it[0]] * 1.35 * (it[0] === 'other' ? 1.3 : 1), it[0] === 'ab' ? 0 : 0, ia);
    txt(it[1], x + 24, y, { a: ia, size: 19, col: COL.legend });
  });
}
function drawLedger(s, t, gt, st) {
  const shown = CARDS.filter(c => c.step < s).length;     // cards are ordered by step
  const flyOf = i => st.cards.find(c => c.i === i && t > c.tf);
  CARDS.forEach((cd, i) => {
    const cx = cardX(i), f = flyOf(i);
    const vis = i < shown ? 1 : f ? seg(t, f.tf + .7, f.tf + 1.1) : 0;
    ctx.save(); rr(cx - 102, CARDY - 94, 204, 188, 12);
    ctx.fillStyle = fg(.022 + .018 * vis); ctx.fill();
    ctx.strokeStyle = fg((.05 + .05 * vis) * UI.rimA); ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    txt(String(i + 1).padStart(2, '0'), cx - 88, CARDY - 72, { a: .35 + .4 * vis, size: 12, w: 600, ls: 1.5, col: COL.dim });
    if (vis <= 0) return;
    txt(cd.l1, cx, CARDY - 48, { a: vis, size: 14.5, w: 500, align: 'center' });
    txt('→ ' + cd.to, cx, CARDY - 29, { a: vis, size: 13.5, align: 'center', col: COL.dim });
    miniDish(cx, CARDY + 16, cd, gt, vis);
    const good = cd.res === 'no change' || cd.res === 'survive';
    txt(cd.res, cx, CARDY + 80, { a: vis, size: 16, w: 600, align: 'center', col: good ? COL.teal : COL.coral });
  });
  for (const fl of st.cards) {      // result dish flies down into its ledger slot
    const u = ease(seg(t, fl.tf, fl.tf + .9)); if (u <= 0 || u >= 1) continue;
    const cd = CARDS[fl.i], src = cd.k === 'a' ? DX.A : DX.N;
    const x = lerp(src, cardX(fl.i), u), y = lerp(DY, CARDY + 16, u) - Math.sin(u * Math.PI) * 40, r = lerp(DR, 36, u);
    ctx.save(); ctx.globalAlpha *= .95 * (1 - seg(u, .85, 1)); drawDish(x, y, r);
    ctx.save(); clipCircle(x, y, r - 3); ctx.translate(x, y); ctx.scale(r / DR, r / DR);
    if (cd.k === 'a') AST.forEach(c => c.draw(ctx, { t: gt, r: cd.r })); else RGC.forEach(c => c.draw(ctx, { t: gt, d: cd.d, noPuncta: true }));
    ctx.restore(); drawDishRim(x, y, r); ctx.restore();
    ctx.save(); ctx.globalAlpha *= .6 * (1 - u); ctx.strokeStyle = fg(.8); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.restore();
  }
}
function miniDish(x, y, cd, gt, a) {
  ctx.save(); ctx.globalAlpha *= a; drawDish(x, y, 36);
  ctx.save(); clipCircle(x, y, 33); ctx.translate(x, y);
  if (cd.k === 'a') MINI_A.draw(ctx, { t: gt, r: cd.r }); else MINI_N.draw(ctx, { t: gt, d: cd.d, noPuncta: true });
  ctx.restore(); drawDishRim(x, y, 36); ctx.restore();
}
function drawWells(t, gt, a) {
  const offs = [[-98, -98], [98, -98], [-98, 98], [98, 98]], wr = 90;
  offs.forEach((o, w) => {
    const x = DX.N + o[0], y = DY + o[1];
    ctx.save(); ctx.globalAlpha *= a;
    drawDish(x, y, wr);
    ctx.save(); clipCircle(x, y, wr - 3); ctx.translate(x, y);
    WELLS[w].forEach(q => q.c.draw(ctx, { t: gt, d: q.dies ? ease(seg(t, 1.3 + q.st * 1.5, 4.8 + q.st * 1.5)) : 0, noPuncta: true }));
    ctx.restore(); drawDishRim(x, y, wr);
    ctx.restore();
    const D = DOSES[w];
    txt(D.d + ' µg/ml', x, y - wr - 10, { a: a * (w < 2 ? 1 : 0), size: 15, w: 600, align: 'center' });
    if (w >= 2) txt(D.d + ' µg/ml', x, y + wr + 22, { a, size: 15, w: 600, align: 'center' });
    const sc = seg(t, 5.5, 6.3) * a;
    ctx.save(); ctx.globalAlpha *= sc; ctx.fillStyle = rgb(UI.pill, UI.pillA); rr(x - 36, y - 15, 72, 30, 8); ctx.fill(); ctx.restore();
    txt(D.s, x, y + 7, { a: sc, size: 19, w: 600, align: 'center', col: D.n > 15 ? COL.teal : D.n > 5 ? UI.midSurv : COL.coral });
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
  drawDish(x, y, r, { tint: UI.dish });
  ctx.save(); clipCircle(x, y, r - 3); ctx.translate(x, y);
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
  ctx.restore(); drawDishRim(x, y, r); ctx.restore();
  txt('+ anti-IL-1α / TNF / C1q', x, y + r + 22, { a: a * seg(t, W_.tb - .4, W_.tb + .3), size: 15, align: 'center', col: COL.legend });
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
  txt('30 kDa', x - w - 10, y + mem + 5, { a, size: 14, align: 'right', col: COL.legend });
  if (F_.spin > 0) { ctx.save(); ctx.globalAlpha *= a * F_.spin; ctx.translate(x + w + 26, y - 10); ctx.rotate(gt * 6); ctx.strokeStyle = fg(.8); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 11, 0, 4.6); ctx.stroke(); ctx.fillStyle = fg(.8); ctx.beginPath(); ctx.moveTo(11 * Math.cos(4.6) + 4, 11 * Math.sin(4.6) + 4); ctx.lineTo(11 * Math.cos(4.6) - 5, 11 * Math.sin(4.6) + 1); ctx.lineTo(11 * Math.cos(4.6) + 1, 11 * Math.sin(4.6) - 6); ctx.fill(); ctx.restore(); }
  txt('30–50×', x, y + bot + 30, { a: a * F_.lab, size: 22, w: 600, align: 'center', col: COL.coral });
  txt('concentrated', x, y + bot + 50, { a: a * F_.lab, size: 13, align: 'center', col: COL.dim });
}
