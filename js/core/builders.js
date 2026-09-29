'use strict';
/* ---------------- cell-type geometry builders ---------------- */
function addTw(b, R, n, sk) {
  for (let j = 0; j < n; j++) {
    const rA = R() * .12;
    b.kids.push(new Br({ at: .22 + R() * .6, ang: (R() < .5 ? -1 : 1) * (.7 + R() * .6), len: (5 + R() * 9) * sk, w0: 1.6, w1: .55, curv: (R() - .5) * 1.4, ph: R() * TAU, freq: .8, amp: .3, kind: 't', rA, rB: rA + .25, mEnd: 0, sA: .6, sB: 1 }));
  }
}
// Astrocyte: 6 primaries (Ext. Data Fig. 5: ~5.5), 4 bifurcate → 10 terminals.
// A1: 4 primaries retract fully, 2 survivors shorten, keep their fork → 2 primaries / 4 terminals.
function buildAstro(R, o) {
  const tissue = !!o.tissue, n = tissue ? 8 : 6, prims = [], base = o.base ?? R() * TAU, L = o.len || 40, W0 = o.w0 || (tissue ? 6.4 : 7.4);
  const surv = [0, 3], bif = tissue ? [0, 1, 2, 3, 4, 5, 6, 7] : [0, 1, 3, 4], order = tissue ? [1, 4, 2, 5, 6, 7] : [1, 4, 2, 5];
  let efIdx = -1;
  if (o.endfoot) { let best = 9; for (let i = 0; i < n; i++) { const d = Math.abs(angd(base + i * TAU / n, o.efAng)); if (d < best && !surv.includes(i)) { best = d; efIdx = i; } } }
  for (let i = 0; i < n; i++) {
    const ang = base + i * TAU / n + (R() - .5) * .5;
    const S = surv.includes(i), B = bif.includes(i);
    const len = L * (.8 + R() * .45) * (tissue ? .82 : 1), w0 = W0 * (.85 + R() * .3);
    const b = new Br({ ang, len, w0, w1: B ? w0 * .46 : 1.0, curv: (R() - .5) * .7, ph: R() * TAU, freq: .45 + R() * .35, amp: .16, kind: 'p', sA: 0, sB: .4 + R() * .12 });
    if (S) { b.rA = .3; b.rB = .95; b.mEnd = .66; } else { const k = Math.max(0, order.indexOf(i)); b.rA = .04 + k * (tissue ? .08 : .11); b.rB = b.rA + .4; b.mEnd = 0; }
    if (i === efIdx) {           // perivascular endfoot
      b.ang = o.efAng; b.len = o.efLen; b.curv = 0; b.amp = .03; b.w1 = 2.6; b.endfoot = true; b.kink = .05; b.kf = 4;
      b.wf = (sf, w) => sf > .9 ? w + Math.pow((sf - .9) / .1, 1.5) * 3 : w;
      for (const sg of [-1, 1]) b.kids.push(new Br({ at: 1, ang: sg * (1.45 + R() * .15), len: 11 + R() * 7, w0: 5, w1: 3.2, curv: -sg * .3, amp: 0, kind: 'k', rA: b.rA, rB: b.rB, mEnd: 0, sA: .8, sB: 1 }));
      addTw(b, R, 2, 1); prims.push(b); continue;
    }
    if (B) for (const sg of [-1, 1]) {
      const k = new Br({ ang: sg * (.3 + R() * .32), len: len * (.55 + R() * .3), w0: b.w1, w1: .85, curv: sg * R() * .5, ph: R() * TAU, freq: .55 + R() * .4, amp: .22, kind: 'k', sA: .38, sB: .82 + R() * .12 });
      if (S) { k.rA = .2; k.rB = .9; k.mEnd = .72; } else { k.rA = Math.max(0, b.rA - .04); k.rB = b.rA + .2; k.mEnd = 0; }
      if (tissue) addTw(k, R, 3, .9);
      b.kids.push(k);
    }
    addTw(b, R, tissue ? 4 : 3, 1);
    prims.push(b);
  }
  return prims;
}
// Microglia: small soma, fine highly ramified tortuous processes; amoeboid on activation.
function buildMicro(R, o) {
  const n = 4 + (R() < .55 ? 1 : 0), prims = [], base = R() * TAU, L = o.len || 16;
  const rec = (p, depth) => {
    if (depth > 3) return;
    const nk = depth < 3 ? 2 : (R() < .55 ? 2 : 1);
    for (let k = 0; k < nk; k++) {
      const sg = (k === 0 ? 1 : -1) * (R() < .5 ? 1 : -1);
      const c = new Br({ at: k === 0 ? 1 : .35 + R() * .4, ang: sg * (.3 + R() * .55), len: p.len * (.6 + R() * .25), w0: Math.max(.6, p.w1 * .95), w1: Math.max(.5, p.w1 * .6), curv: (R() - .5), kink: .15 + R() * .2, kf: 5 + R() * 7, ph: R() * TAU, freq: .35 + R() * .35, amp: .3, kind: 'k', dyn: .08, dynF: .25 + R() * .4, rA: Math.max(0, p.rA - .12 - R() * .05), rB: p.rA + .18, mEnd: 0, sA: .25 + depth * .15, sB: .55 + depth * .14 });
      p.kids.push(c); rec(c, depth + 1);
    }
  };
  for (let i = 0; i < n; i++) {
    const b = new Br({ ang: base + i * TAU / n + (R() - .5) * .9, len: L * (.8 + R() * .5), w0: 2.8, w1: 1.5, curv: (R() - .5) * .8, kink: .15 + R() * .12, kf: 4 + R() * 5, ph: R() * TAU, freq: .3 + R() * .3, amp: .2, kind: 'p', dyn: .05, dynF: .2 + R() * .3, rA: .25 + R() * .15, rB: .75 + R() * .2, mEnd: .3, sA: 0, sB: .35, wf: (sf, w, P) => w * (1 + 1.7 * P.r * (1 - sf * .6)) });
    rec(b, 1); prims.push(b);
  }
  return prims;
}
function addP(b, R) { b.puncta = []; const n = 2 + Math.floor(R() * 3); for (let i = 0; i < n; i++) b.puncta.push({ f: .2 + R() * .75, side: R() < .5 ? -1 : 1, tau: .02 + R() * .26 }); }
// Neuron: RGC (multipolar, long axon + growth cone) or cortical pyramidal (o.pyr).
function buildNeuron(R, o) {
  const prims = [], axA = o.axAng ?? R() * TAU, nd = 5, simple = !!o.simple;
  const addD = (p, depth) => {
    if (depth > (simple ? 1 : 2)) return;
    for (const sg of [-1, 1]) {
      const c = new Br({ at: 1, ang: sg * (.28 + R() * .35), len: p.len * (.7 + R() * .2), w0: p.w1, w1: Math.max(.7, p.w1 * .6), curv: sg * (R() - .3) * .5, ph: R() * TAU, freq: .25, amp: .05, kind: 'd', sA: .3 + depth * .2, sB: .65 + depth * .15 });
      addP(c, R); p.kids.push(c); addD(c, depth + 1);
    }
  };
  const basal = [-1.3, -.5, .5, 1.3];
  for (let i = 0; i < nd; i++) {
    let ang, len = (o.len || 22) * (.8 + R() * .4), w0 = 4.2;
    if (o.pyr) { if (i === 0) { ang = axA + Math.PI; len *= 2.6; w0 = 5.8; } else ang = axA + basal[i - 1] + (R() - .5) * .3; }
    else ang = axA + Math.PI + (i - (nd - 1) / 2) * (TAU * .74 / nd) + (R() - .5) * .35;
    const b = new Br({ ang, len, w0, w1: w0 * .55, curv: (R() - .5) * .5, ph: R() * TAU, freq: .25, amp: .05, kind: 'd', sA: 0, sB: .35 });
    if (o.pyr && i === 0) addTw(b, R, 3, 1.4);
    addP(b, R); addD(b, 1); prims.push(b);
  }
  const axLen = o.axLen || 170;
  const ax = new Br({ ang: axA, len: axLen, w0: 3.6, w1: 1.3, curv: (R() - .5) * .7, kink: .05, kf: 3, ph: R() * TAU, freq: .15, amp: .03, kind: 'ax', sA: .15, sB: 1, wf: (sf, w) => sf < .06 ? lerp(3.6, 1.35, sf / .06) : 1.35 });
  if (!o.pyr) for (let k = 0; k < 5; k++) ax.kids.push(new Br({ at: 1, ang: (k - 2) * .38, len: 5 + R() * 5, w0: 1.2, w1: .4, curv: (R() - .5), ph: R() * TAU, freq: 1.2, amp: .4, kind: 'gc', sA: .85, sB: 1 }));
  prims.push(ax);
  return prims;
}
