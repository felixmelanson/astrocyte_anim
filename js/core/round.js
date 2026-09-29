'use strict';
/* ---------------- dissociated (round) cells ---------------- */
const RND = { astro: { R: 9.5, stubs: 4, sw: .24, sa: .32 }, micro: { R: 6.2, stubs: 6, sw: .16, sa: .5 }, oligo: { R: 7.6, stubs: 3, sw: .18, sa: .3 }, neuron: { R: 8.6, stubs: 1, sw: .14, sa: 1.1 }, endo: { R: 8.5, stubs: 0 } };
class Round {
  constructor(type, seed) {
    const R = rng(seed); this.type = type; const P = RND[type];
    this.R0 = P.R * (.9 + R() * .2); this.st = [];
    for (let i = 0; i < P.stubs; i++) this.st.push({ a: R() * TAU, w: P.sw * (.7 + R() * .6), h: P.sa * (.7 + R() * .6) });
    this.h = [0, 1].map(() => ({ k: 2 + ((R() * 3) | 0), a: .05 + R() * .05, p: R() * TAU }));
    this.rot = R() * TAU; this.no = [(R() - .5) * .3, (R() - .5) * .3];
  }
  draw(c, x, y, t, o = {}) {
    const a = o.a ?? 1; if (a <= .004) return;
    const pal = TP[this.type], b = o.b || 0, R0 = this.R0 * (o.s || 1) * (1 + .1 * b);
    c.save(); c.translate(x, y); c.rotate(this.rot + t * .04 * (1 - b)); c.globalAlpha *= a;
    if (this.type === 'endo') c.scale(1.6, .62);
    const fn = th => { let f = 1; for (const q of this.h) f += q.a * Math.sin(q.k * th + q.p + t * .6); for (const s of this.st) { const d = angd(th, s.a); f += s.h * Math.exp(-d * d / (s.w * s.w)); } return f; };
    c.beginPath(); addSoma(c, R0, fn, 1, 1.4); c.fillStyle = rgb(pal.rim); c.fill();
    c.beginPath(); addSoma(c, R0, fn, 1, 0);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, R0 * 1.3); g.addColorStop(0, rgb(mix(pal.body, pal.rim, .35))); g.addColorStop(1, rgb(pal.body)); c.fillStyle = g; c.fill();
    c.beginPath(); c.ellipse(this.no[0] * R0, this.no[1] * R0, R0 * .5, R0 * .42, 0, 0, TAU); c.fillStyle = rgb(pal.nuc, .9); c.fill();
    if (b > 0) { c.setLineDash([2, 2.5]); c.strokeStyle = rgb(pal.rim, .55 * b); c.lineWidth = 1; c.beginPath(); c.arc(0, 0, R0 * 1.45, 0, TAU); c.stroke(); }
    c.restore();
  }
}
