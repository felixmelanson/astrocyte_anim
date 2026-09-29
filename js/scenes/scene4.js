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
const DOTS = { mcm: [PC.il1, PC.tnf, PC.other, PC.c1q, PC.other, PC.il1, PC.tnf, PC.other, PC.c1q, PC.other], lps: Array(8).fill(PC.lps), cyto: [PC.il1, PC.tnf, PC.c1q, PC.il1, PC.tnf, PC.c1q, PC.il1, PC.tnf], rest: Array(5).fill(PC.other), nab: [PC.gray, PC.ab, PC.other, PC.gray, PC.ab, PC.other, PC.gray, PC.ab], acm: [PC.tox, PC.other, PC.tox, PC.tox, PC.other, PC.tox, PC.other, PC.tox], conc: Array(12).fill(0).map((_, i) => i % 3 ? PC.tox : PC.other) };
const LIQ = { mcm: [58, 72, 84], lps: [70, 76, 80], cyto: [66, 72, 70], rest: [52, 64, 74], acm: [92, 64, 62], conc: [120, 70, 64] };
const CARDS = [
  { l1: 'LPS', to: 'astrocytes', res: 'no change', k: 'a', r: 0, step: 9 },
  { l1: 'LPS-microglia medium', to: 'astrocytes', res: 'A1', k: 'a', r: 1, step: 11 },
  { l1: 'resting-microglia medium', to: 'astrocytes', res: 'no change', k: 'a', r: 0, step: 12 },
  { l1: 'IL-1α + TNF + C1q', to: 'astrocytes', res: 'A1', k: 'a', r: 1, step: 13 },
  { l1: 'LPS-microglia med. + nAbs', to: 'astrocytes', res: 'no change', k: 'a', r: 0, step: 14 },
  { l1: 'A1 astrocyte medium', to: 'RGCs', res: 'die', k: 'n', d: 1, step: 16 },
  { l1: 'LPS-microglia medium', to: 'RGCs', res: 'survive', k: 'n', d: 0, step: 18 },
  { l1: 'IL-1α + TNF + C1q', to: 'RGCs', res: 'survive', k: 'n', d: 0, step: 19 },
];
const cardX = i => 960 + (i - 3.5) * 222, CARDY = 880;

const POS = {
  M: { x: DX.M, y: DY }, A: { x: DX.A, y: DY }, N: { x: DX.N, y: DY, lift: 120 },
  vialL: { x: 660, y: 262 }, vialR: { x: 1260, y: 262 }, well: { x: 660, y: 262 }, filt: { x: 1260, y: 300 },
};
const MN = { x: DX.M, y: DY };
function scene4(k, t, gt) {
  const s = k;   // global step index 8..19
  const st = {
    m: { mode: 'act', act: 1, a: 1, fields: [] }, a: { layers: [] }, n: { layers: [] },
    hops: [], arcs: [], tubes: [], clock: null, caps: [], legend: 0, extra: [], card: null,
    mSub: '', aSub: '', nSub: '', mName: 'Microglia', aHL: 0,
  };
  const mcmSteady = { f: F.mcm, o: {} };
  const reset = (layerOld, layerNew) => [{ ...layerOld, a: (layerOld.a ?? 1) * (1 - seg(t, 0, .45)) }, { ...layerNew, a: (layerNew.a ?? 1) * seg(t, .45, .95) }];
  const H = (src, dst, t0, sp, liq, dots, ok, lift = 110, arcFrom, arcTo) => {
    st.hops.push({ src, dst, t0, sp, liq, dots });
    const td = t0 + HOPD * sp;
    st.arcs.push({ from: arcFrom || src, to: arcTo || dst, prog: seg(t, td, td + .8), ok, lift });
    return td;
  };
  const tipO = () => [0, -18];
  const cardAt = (i, tf) => st.card = { i, tf };
  let legendItems = ['il1', 'tnf', 'c1q', 'other'];

  // defaults
  st.m.act = s >= 11 ? 1 : 0; st.m.fields = s >= 11 ? [mcmSteady] : [];
  st.a.layers = [{ r: 0, fields: [] }]; st.n.layers = [{ d: 0, fields: [] }];
  st.legend = s >= 11 ? 1 : 0;
  if (s >= 12) st.mSub = '+ LPS';

  switch (s) {
    case 8: {
      st.intro = true; st.caps.push([TITLE(9), seg(t, 1.6, 2.6)]);   // was: 'Three pure cultures. Move the medium, one hop at a time.'
      break;
    }
    case 9: {
      st.tubes.push({ p: POS.vialL, label: 'LPS', a: seg(t, 0, .5), dots: DOTS.lps, liq: LIQ.lps });
      const td = H(POS.vialL, POS.A, .6, 1, LIQ.lps, DOTS.lps, false, 60);
      st.a.layers = [{ r: 0, fields: [{ f: F.lpsA, o: { t0: td, origin: tipO, stag: .6 } }] }];
      st.clock = { d: 'A', p: seg(t, td + .8, td + 4.8), a: bump(t, td + .5, td + .9, 99, 100) };
      st.aSub = t > td + .3 ? '+ LPS' : '';
      st.caps.push([TITLE(10), seg(t, .3, 1) * (1 - seg(t, td + 4.6, td + 5.1))]);   // was: 'Control: LPS straight onto astrocytes'
      st.caps.push([TITLE(11), seg(t, td + 5.1, td + 5.8)]);   // was: 'Astrocytes lack TLR4. LPS can’t act on them directly.'
      cardAt(0, td + 5.6);
      break;
    }
    case 10: {
      st.a.layers = reset({ r: 0, fields: [{ f: F.lpsA, o: {} }] }, { r: 0, fields: [] });
      st.tubes.push({ p: POS.vialL, label: 'LPS', a: 1, dots: DOTS.lps, liq: LIQ.lps });
      const td = H(POS.vialL, POS.M, .6, 1, LIQ.lps, DOTS.lps, true, 60);
      st.m.act = ease(seg(t, td + .6, td + 3.6));
      st.m.fields = [{ f: F.lpsM, o: { t0: td, origin: tipO, stag: .6, a: 1 - .65 * seg(t, td + 3, td + 4) } },
                     { f: F.mcm, o: { t0: td + 2.2, stag: 4, spread: 2.4, origin: p => { const c = MIC[p.src % MIC.length]; return [c.x, c.y]; } } }];
      st.mSub = t > td + .3 ? '+ LPS' : '';
      st.legend = seg(t, td + 2.6, td + 3.4);
      st.caps.push([TITLE(12), seg(t, .3, 1)]);   // was: 'Hop 1: LPS activates microglia'
      break;
    }
    case 11: {
      const td = H(POS.M, POS.A, .3, 1, LIQ.mcm, DOTS.mcm, true);
      const r = ease(seg(t, td + .8, td + 6.3));
      st.a.layers = [{ r, fields: [{ f: F.mcmA, o: { t0: td, origin: tipO, stag: .6 } }] }];
      st.clock = { d: 'A', p: seg(t, td + .8, td + 6.3), a: seg(t, td + .5, td + .9) };
      st.aSub = t > td + 4.5 ? 'A1 reactive' : '';
      st.inset = { r, a: seg(t, td + 1, td + 1.8) };
      st.aHL = 0;
      st.caps.push([TITLE(13), seg(t, .3, 1)]);   // was: 'Hop 2: activated-microglia medium → astrocytes'
      cardAt(1, td + 7.2);
      break;
    }
    case 12: {
      st.a.layers = reset({ r: 1, fields: [{ f: F.mcmA, o: {} }] }, { r: 0, fields: [] });
      const sw = seg(t, 0, .45), sw2 = seg(t, .45, 1);
      st.m.swap = { old: 1 - sw, neu: sw2 };
      st.mSub = t > .5 ? 'no LPS' : '+ LPS';
      const td = H(POS.M, POS.A, 1.1, 1, LIQ.rest, DOTS.rest, false);
      st.a.layers[1].fields = [{ f: F.restA, o: { t0: td, origin: tipO, stag: .6 } }];
      st.clock = { d: 'A', p: seg(t, td + .8, td + 4.8), a: seg(t, td + .5, td + .9) };
      st.caps.push([TITLE(14), seg(t, .3, 1)]);   // was: 'Control: medium from resting microglia'
      cardAt(2, td + 5.4);
      break;
    }
    case 13: {
      st.a.layers = reset({ r: 0, fields: [{ f: F.restA, o: {} }] }, { r: 0, fields: [] });
      st.m.absent = seg(t, 0, .8); st.m.mode = 'rest'; st.m.act = 0; st.m.fields = [{ f: F.restM, o: { a: 1 - seg(t, 0, .6) } }];
      st.mSub = 'none'; st.mName = 'No microglia';
      st.tubes.push({ p: POS.vialL, label: 'IL-1α + TNF + C1q', label2: '3 · 30 · 400 ng/ml', a: seg(t, .3, .8), dots: DOTS.cyto, liq: LIQ.cyto });
      const td = H(POS.vialL, POS.A, 1.0, 1, LIQ.cyto, DOTS.cyto, true, 60);
      const r = ease(seg(t, td + .8, td + 6.3));
      st.a.layers[1].r = r; st.a.layers[1].fields = [{ f: F.cyto, o: { t0: td, origin: tipO, stag: .6 } }];
      st.clock = { d: 'A', p: seg(t, td + .8, td + 6.3), a: seg(t, td + .5, td + .9) };
      st.aSub = t > td + 4.5 ? 'A1 reactive' : '';
      st.caps.push([TITLE(15), seg(t, .3, 1)]);   // was: 'Sufficient? Skip microglia. Add only the three cytokines.'
      st.sub = ['Title 15 subtitle placeholder', seg(t, 1, 1.8)];   // was: 'IL-1α 3 ng/ml  ·  TNF 30 ng/ml  ·  C1q 400 ng/ml  ·  24 h'
      cardAt(3, td + 7.0);
      break;
    }
    case 14: {
      st.a.layers = reset({ r: 1, fields: [{ f: F.cyto, o: {} }] }, { r: 0, fields: [] });
      st.m.returnA = seg(t, 0, .8); st.m.fields = [{ f: F.mcm, o: { a: seg(t, .2, .9) } }];
      const sp = .85, td1 = H(POS.M, POS.well, .9, sp, LIQ.mcm, DOTS.mcm, true, 60);
      const t2 = td1 + 3.4, td2 = H(POS.well, POS.A, t2, sp, LIQ.mcm, DOTS.nab, false, 70);
      st.well = { a: seg(t, .3, .9) * (1 - seg(t, td2 + 4, td2 + 5)), td: td1, tb: td1 + 1.0 };
      st.a.layers[1].fields = [{ f: F.nabA, o: { t0: td2, origin: tipO, stag: .6 } }];
      st.clock = { d: 'A', p: seg(t, td2 + .8, td2 + 4.8), a: seg(t, td2 + .5, td2 + .9) };
      st.legendAb = seg(t, td1 + 1, td1 + 1.8);
      st.caps.push([TITLE(16), seg(t, .3, 1)]);   // was: 'Necessary? Neutralize the three in activated-microglia medium.'
      cardAt(4, td2 + 5.3);
      break;
    }
    case 15: {
      st.a.layers = reset({ r: 0, fields: [{ f: F.nabA, o: {} }] }, { r: 1, fields: [] });
      st.aSub = 'A1 reactive';
      st.a.layers[1].fields = [{ f: F.acm, o: { t0: .9, stag: 3, spread: 2.4, origin: p => { const c = AST[p.src % AST.length]; return [c.x, c.y]; } } }];
      st.qmark = seg(t, 3.2, 4);
      st.legendTox = seg(t, 3.4, 4.2); st.legendAb = 1;
      const td = H(POS.A, POS.filt, 4.4, 1, LIQ.acm, DOTS.acm, true, 50);
      st.filter = { a: seg(t, 3.6, 4.2), fill: seg(t, td, td + .7), conc: ease(seg(t, td + 1.2, td + 5)), spin: bump(t, td + 1, td + 1.3, td + 4.8, td + 5.2), lab: seg(t, td + 4.6, td + 5.3), t };
      st.caps.push([TITLE(17), seg(t, .3, 1)]);   // was: 'Hop 3: collect A1 astrocyte medium, concentrate it'
      break;
    }
    case 16: {
      st.a.layers = [{ r: 1, fields: [{ f: F.acm, o: {} }] }]; st.aSub = 'A1 reactive'; st.legendTox = 1; st.legendAb = 1;
      st.qmark = 1;
      const td = H(POS.filt, POS.N, .3, 1, LIQ.conc, DOTS.conc, true, 50);
      st.filter = { a: 1 - seg(t, td + 2, td + 3), fill: 1 - seg(t, 1.2, 1.9), conc: 1, spin: 0, lab: 1 - seg(t, 1, 2), t, used: true };
      const d = seg(t, td + .8, td + 7.5);
      st.n.layers = [{ d, fields: [{ f: F.concN, o: { t0: td, origin: tipO, stag: .6 } }] }];
      st.clock = { d: 'N', p: d, a: seg(t, td + .5, td + .9) };
      st.nSub = t > td + .3 ? '50 µg/ml protein' : '';
      st.casp = seg(t, td + 2.4, td + 3.2);
      st.caps.push([TITLE(18), seg(t, .3, 1)]);   // was: 'Concentrated A1 astrocyte medium → purified RGCs'
      cardAt(5, td + 8);
      break;
    }
    case 17: {
      st.a.layers = [{ r: 1, fields: [{ f: F.acm, o: {} }] }]; st.aSub = 'A1 reactive'; st.legendTox = 1; st.legendAb = 1; st.qmark = 1;
      st.n.layers = [{ d: 1, fields: [{ f: F.concN, o: {} }], a: 1 - seg(t, 0, .6) }];
      st.wells = { a: seg(t, .4, 1.2), t };
      st.caps.push([TITLE(19), seg(t, .3, 1)]);   // was: 'Dose-dependent: RGC survival after 24 h'
      break;
    }
    case 18: {
      st.a.layers = [{ r: 1, fields: [{ f: F.acm, o: {} }] }]; st.aSub = 'A1 reactive'; st.legendTox = 1; st.legendAb = 1; st.qmark = 1;
      st.wells = { a: 1 - seg(t, 0, .5), t: 99 };
      st.n.layers = [{ d: 0, fields: [], a: seg(t, .45, 1) }];
      const td = H(POS.M, POS.N, 1.0, 1, LIQ.mcm, DOTS.mcm, false, 120);
      st.n.layers[0].fields = [{ f: F.mcmN, o: { t0: td, origin: tipO, stag: .6 } }];
      st.clock = { d: 'N', p: seg(t, td + .8, td + 4.8), a: seg(t, td + .5, td + .9) };
      st.nSub = t > td + 4.8 ? 'survive' : '';
      st.aBypass = seg(t, 0, .6);
      st.caps.push([TITLE(20), seg(t, .3, 1)]);   // was: 'Control: activated-microglia medium directly on RGCs'
      cardAt(6, td + 5.4);
      break;
    }
    case 19: {
      st.a.layers = [{ r: 1, fields: [{ f: F.acm, o: {} }] }]; st.aSub = 'A1 reactive'; st.legendTox = 1; st.legendAb = 1; st.qmark = 1;
      st.n.layers = reset({ d: 0, fields: [{ f: F.mcmN, o: {} }] }, { d: 0, fields: [] });
      st.tubes.push({ p: POS.vialR, label: 'IL-1α + TNF + C1q', a: seg(t, .3, .8), dots: DOTS.cyto, liq: LIQ.cyto });
      const td = H(POS.vialR, POS.N, 1.0, 1, LIQ.cyto, DOTS.cyto, false, 60);
      st.n.layers[1].fields = [{ f: F.cytoN, o: { t0: td, origin: tipO, stag: .6 } }];
      st.clock = { d: 'N', p: seg(t, td + .8, td + 4.8), a: seg(t, td + .5, td + .9) };
      st.nSub = t > td + 4.8 ? 'survive' : '';
      const fin = seg(t, td + 5.6, td + 6.4);
      st.caps.push([TITLE(21), seg(t, .3, 1) * (1 - seg(t, td + 5, td + 5.6))]);   // was: 'Control: the three cytokines directly on RGCs'
      st.caps.push([TITLE(22), fin]);   // was: 'The killer is in the astrocyte medium. Not the microglia. Not the cytokines.'
      st.aHL = fin;
      st.aBypass = 1 - fin; st.mBypass = 1 - fin;
      cardAt(7, td + 5.2);
      break;
    }
  }
  renderRelay(s, t, gt, st);
}
function renderRelay(s, t, gt, st) {
  const intro = st.intro;
  const dA = key => intro ? seg(t, { M: .2, A: .5, N: .8 }[key], { M: 1, A: 1.3, N: 1.6 }[key]) : 1;
  // --- hop arcs (under everything)
  for (const a of st.arcs) {
    const fx = a.from.x, fy = a.from === POS.M || a.from === POS.A || a.from === POS.N ? DY - DR - 6 : a.from.y - 50;
    const tx = a.to.x, ty = a.to === POS.M || a.to === POS.A || a.to === POS.N ? DY - DR - 6 : a.to.y - 60;
    hopArc(fx, fy, tx, ty, a.lift, a.prog, a.ok, 1);
  }
  // --- microglia dish
  {
    const a = dA('M') * (1 - .7 * (st.mBypass || 0)), m = st.m;
    const absent = m.absent || 0, ret = m.returnA ?? 1;
    drawDish(DX.M, DY, DR, { a: a * (1 - absent) * (s === 14 ? ret : 1) });
    if (absent > 0 || (s === 14 && ret < 1)) drawDish(DX.M, DY, DR, { dashed: true, a: s === 14 ? 1 - ret : absent });
    ctx.save(); clipCircle(DX.M, DY, DR - 4); ctx.translate(DX.M, DY);
    if (m.swap) {
      MIC.forEach(c => c.draw(ctx, { t: gt, r: 1, a: a * m.swap.old }));
      MIC.forEach(c => c.draw(ctx, { t: gt, r: 0, a: a * m.swap.neu }));
      F.mcm.draw(ctx, gt, { a: m.swap.old }); F.restM.draw(ctx, gt, { a: m.swap.neu });
    } else if (s === 13) {
      MIC.forEach(c => c.draw(ctx, { t: gt, r: 0, a: 1 - absent }));
      for (const f of m.fields) f.f.draw(ctx, gt, f.o);
    } else {
      const ca = a * (s === 14 ? ret : 1);
      MIC.forEach(c => c.draw(ctx, { t: gt, r: m.act, a: ca }));
      for (const f of m.fields) f.f.draw(ctx, gt, { ...f.o, a: (f.o.a ?? 1) * ca });
    }
    ctx.restore();
    drawDishRim(DX.M, DY, DR, { a: a * (1 - absent) * (s === 14 ? ret : 1) });
    const nameCol = s === 13 ? GRAYP.rim : COL.text;
    txt(s === 13 && absent > .5 ? 'No microglia' : 'Microglia', DX.M, DY + DR + 40, { a, size: 24, w: 600, align: 'center', col: nameCol });
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
    if (st.casp) { txt('caspase-2/3 → apoptosis', DX.N, DY + DR + 94, { a: st.casp * (1 - wa), size: 16, align: 'center', col: [255, 190, 110] }); }
  }
  // --- AQP4 inset (in vivo, Ext. Data Fig. 5a)
  if (st.inset && st.inset.a > 0) drawAQP4(1260, 440, 94, st.inset.r, st.inset.a, gt);
  // --- tubes, well, filter
  for (const tb of st.tubes) drawTube(tb.p.x, tb.p.y, { a: tb.a, label: tb.label, label2: tb.label2, dots: tb.dots, liq: tb.liq });
  if (st.well && st.well.a > 0) drawNabWell(POS.well.x, POS.well.y, 74, t, gt, st.well);
  if (st.filter && st.filter.a > 0) drawFilter(POS.filt.x, POS.filt.y, st.filter, gt);
  // --- clock
  if (st.clock) { const d = DX[st.clock.d]; drawClock(d + DR * .8, DY - DR * .92, st.clock.p, st.clock.a); }
  // --- ledger
  drawLedger(s, t, gt, st);
  // --- pipettes (top)
  for (const h of st.hops) {
    const p = hopPose(t - h.t0, h.src, h.dst, h.sp); if (!p) continue;
    // keep captions legible: the shaft ghosts out where it crosses the caption band
    const B0 = 70, B1 = 170, F = 14;
    ctx.save(); ctx.beginPath(); ctx.rect(0, -400, W, B0 + 400); ctx.rect(0, B1, W, H + 400 - B1); ctx.clip(); drawPipette(p.x, p.y, p.fill, h.liq, h.dots, 1, p.low); ctx.restore();
    for (let i = 0; i < F; i++) {        // soft edges into and out of the band
      const y0 = B0 + (B1 - B0) * i / F, y1 = B0 + (B1 - B0) * (i + 1) / F, m = Math.abs((i + .5) / F - .5) * 2;
      ctx.save(); ctx.beginPath(); ctx.rect(0, y0, W, y1 - y0 + .5); ctx.clip(); drawPipette(p.x, p.y, p.fill, h.liq, h.dots, .12 + .88 * Math.pow(m, 3), p.low); ctx.restore();
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
    txt(it[1], x + 24, y, { a: ia, size: 19, col: [190, 202, 212] });
  });
}
function drawLedger(s, t, gt, st) {
  const shown = CARDS.filter(c => c.step < s).length;
  const fly = st.card && t > st.card.tf ? st.card : null;
  CARDS.forEach((cd, i) => {
    const cx = cardX(i);
    const vis = i < shown ? 1 : (fly && fly.i === i ? seg(t, fly.tf + .7, fly.tf + 1.1) : 0);
    ctx.save(); rr(cx - 102, CARDY - 94, 204, 188, 12);
    ctx.fillStyle = `rgba(255,255,255,${.022 + .018 * vis})`; ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${.05 + .05 * vis})`; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    txt(String(i + 1).padStart(2, '0'), cx - 88, CARDY - 72, { a: .35 + .4 * vis, size: 12, w: 600, ls: 1.5, col: COL.dim });
    if (vis <= 0) return;
    txt(cd.l1, cx, CARDY - 48, { a: vis, size: 14.5, w: 500, align: 'center' });
    txt('→ ' + cd.to, cx, CARDY - 29, { a: vis, size: 13.5, align: 'center', col: COL.dim });
    miniDish(cx, CARDY + 16, cd, gt, vis);
    const good = cd.res === 'no change' || cd.res === 'survive';
    txt(cd.res, cx, CARDY + 80, { a: vis, size: 16, w: 600, align: 'center', col: good ? COL.teal : COL.coral });
  });
  if (fly) {      // result dish flies down into its ledger slot
    const u = ease(seg(t, fly.tf, fly.tf + .9)); if (u > 0 && u < 1) {
      const cd = CARDS[fly.i], src = cd.k === 'a' ? DX.A : DX.N;
      const x = lerp(src, cardX(fly.i), u), y = lerp(DY, CARDY + 16, u) - Math.sin(u * Math.PI) * 40, r = lerp(DR, 36, u);
      ctx.save(); ctx.globalAlpha *= .95 * (1 - seg(u, .85, 1)); drawDish(x, y, r);
      ctx.save(); clipCircle(x, y, r - 3); ctx.translate(x, y); ctx.scale(r / DR, r / DR);
      if (cd.k === 'a') AST.forEach(c => c.draw(ctx, { t: gt, r: cd.r })); else RGC.forEach(c => c.draw(ctx, { t: gt, d: cd.d, noPuncta: true }));
      ctx.restore(); drawDishRim(x, y, r); ctx.restore();
      ctx.save(); ctx.globalAlpha *= .6 * (1 - u); ctx.strokeStyle = 'rgba(220,235,245,.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.restore();
    }
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
    ctx.save(); ctx.globalAlpha *= sc; ctx.fillStyle = 'rgba(7,11,15,.72)'; rr(x - 36, y - 15, 72, 30, 8); ctx.fill(); ctx.restore();
    txt(D.s, x, y + 7, { a: sc, size: 19, w: 600, align: 'center', col: D.n > 15 ? COL.teal : D.n > 5 ? [230, 200, 170] : COL.coral });
  });
}
function drawAQP4(x, y, r, rr_, a, gt) {
  ctx.save(); ctx.globalAlpha *= a;
  ctx.fillStyle = 'rgb(9,14,19)'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
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
    ctx.fillStyle = 'rgba(238,244,255,.95)'; ctx.beginPath(); ctx.arc(px, py, 1.7, 0, TAU); ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(220,235,245,.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  ctx.restore();
  txt('in vivo · AQP4', x, y - r - 12, { a, size: 13, w: 600, ls: 2, align: 'center', col: COL.dim });
  txt(rr_ > .5 ? 'leaves the endfoot' : 'on the endfoot', x, y + r + 22, { a, size: 14, align: 'center', col: COL.dim });
}
function drawNabWell(x, y, r, t, gt, W_) {
  const a = W_.a;
  ctx.save(); ctx.globalAlpha *= a;
  drawDish(x, y, r, { tint: [20, 26, 34] });
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
  txt('+ anti-IL-1α / TNF / C1q', x, y + r + 22, { a: a * seg(t, W_.tb - .4, W_.tb + .3), size: 15, align: 'center', col: [210, 220, 230] });
}
function drawFilter(x, y, F_, gt) {
  const a = F_.a; if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a;
  const spinJ = F_.spin ? Math.sin(gt * 40) * .8 * F_.spin : 0;
  ctx.translate(x + spinJ, y);
  const top = -72, mem = 52, bot = 112, w = 30, wi = 22;
  // outer tube
  ctx.beginPath(); ctx.moveTo(-w, top); ctx.lineTo(w, top); ctx.lineTo(w, bot - 20); ctx.quadraticCurveTo(w, bot, 0, bot); ctx.quadraticCurveTo(-w, bot, -w, bot - 20); ctx.closePath();
  ctx.fillStyle = 'rgba(205,222,234,.05)'; ctx.fill(); ctx.strokeStyle = 'rgba(210,225,236,.5)'; ctx.lineWidth = 1.3; ctx.stroke();
  // filtrate (below membrane) rises
  const fl = F_.conc * (bot - mem - 16);
  ctx.save(); ctx.beginPath(); ctx.rect(-w + 1, bot - 4 - fl, 2 * w - 2, fl + 4); ctx.clip();
  ctx.fillStyle = 'rgba(120,160,190,.25)'; ctx.beginPath(); ctx.moveTo(-w + 1, mem); ctx.lineTo(w - 1, mem); ctx.lineTo(w - 1, bot - 20); ctx.quadraticCurveTo(w - 1, bot - 1, 0, bot - 1); ctx.quadraticCurveTo(-w + 1, bot - 1, -w + 1, bot - 20); ctx.closePath(); ctx.fill(); ctx.restore();
  // insert
  ctx.strokeStyle = 'rgba(210,225,236,.4)'; ctx.beginPath(); ctx.moveTo(-wi, top); ctx.lineTo(-wi, mem); ctx.moveTo(wi, top); ctx.lineTo(wi, mem); ctx.stroke();
  // retentate
  const lvl0 = mem - top - 20, lvl = F_.fill * lerp(lvl0, 7, F_.conc);
  if (lvl > 0) {
    ctx.fillStyle = rgb(mix([92, 64, 62], [150, 70, 60], F_.conc), .6); ctx.fillRect(-wi + 1, mem - lvl, 2 * wi - 2, lvl);
    const R = rng(77);
    for (let i = 0; i < 26; i++) { const px = (R() - .5) * (2 * wi - 8), py = mem - R() * lvl * .92; const tox = R() < .65; ctx.fillStyle = rgb(tox ? PC.tox : PC.other, F_.fill); ctx.beginPath(); ctx.arc(px, py, tox ? 2.1 : 1.6, 0, TAU); ctx.fill(); }
  }
  // small molecules pass the 30 kDa membrane
  if (F_.spin > 0) { for (let i = 0; i < 12; i++) { const u = ((gt * .9 + i / 12) % 1); ctx.fillStyle = `rgba(170,205,230,${.8 * F_.spin * Math.sin(u * Math.PI)})`; ctx.beginPath(); ctx.arc(((i * 7.1) % 36) - 18, lerp(mem - 18, mem + 34, u), 1, 0, TAU); ctx.fill(); }
    // IL-1α (~18 kDa) also passes the membrane; TNF trimer (~52 kDa) and C1q (~460 kDa) are retained
    for (let j = 0; j < 2; j++) { const u = (gt * .38 + j * .5) % 1; if (u < .6) { const v = u / .6; glyph(ctx, 'il1', j ? 7 : -8, lerp(mem - 22, mem + 30, v), 7, gt * .8 + j, F_.spin * Math.sin(v * Math.PI)); } } }
  ctx.setLineDash([3, 2]); ctx.strokeStyle = 'rgba(235,240,245,.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-wi, mem); ctx.lineTo(wi, mem); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
  txt('30 kDa', x - w - 10, y + mem + 5, { a, size: 14, align: 'right', col: [210, 220, 230] });
  if (F_.spin > 0) { ctx.save(); ctx.globalAlpha *= a * F_.spin; ctx.translate(x + w + 26, y - 10); ctx.rotate(gt * 6); ctx.strokeStyle = 'rgba(220,232,240,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 11, 0, 4.6); ctx.stroke(); ctx.fillStyle = 'rgba(220,232,240,.8)'; ctx.beginPath(); ctx.moveTo(11 * Math.cos(4.6) + 4, 11 * Math.sin(4.6) + 4); ctx.lineTo(11 * Math.cos(4.6) - 5, 11 * Math.sin(4.6) + 1); ctx.lineTo(11 * Math.cos(4.6) + 1, 11 * Math.sin(4.6) - 6); ctx.fill(); ctx.restore(); }
  txt('30–50×', x + w + 12, y + 20, { a: a * F_.lab, size: 22, w: 600, col: COL.coral });
  txt('concentrated', x + w + 12, y + 40, { a: a * F_.lab, size: 13, col: COL.dim });
}
