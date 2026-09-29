'use strict';
/* ---------------- particle fields (pure functions of time) ---------------- */
class Field {
  constructor(seed, spec, rad) {
    const R = rng(seed); this.ps = []; this.rad = rad;
    for (const [type, n] of spec) for (let i = 0; i < n; i++) {
      const a = R() * TAU, rr = Math.sqrt(R()) * rad;
      this.ps.push({ type, bx: Math.cos(a) * rr, by: Math.sin(a) * rr, p1: R() * TAU, p2: R() * TAU, f1: .25 + R() * .35, f2: .2 + R() * .3, st: R(), rot: R() * TAU, sz: .85 + R() * .3, src: (R() * 1000) | 0, i: this.ps.length });
    }
    for (let i = this.ps.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [this.ps[i], this.ps[j]] = [this.ps[j], this.ps[i]]; }
  }
  pos(p, t, o = {}) {
    const wa = o.wander ?? 1;
    const wx = (Math.sin(t * p.f1 + p.p1) * 8 + Math.sin(t * p.f2 * 1.9 + p.p2) * 4) * wa, wy = (Math.cos(t * p.f1 * 1.1 + p.p2) * 8 + Math.cos(t * p.f2 * 1.6 + p.p1) * 4) * wa;
    let x = p.bx * (o.sq || 1) + wx, y = p.by * (o.sq || 1) + wy, vis = 1;
    if (o.t0 !== undefined) {
      const age = t - (o.t0 + p.st * (o.stag || 0)); if (age < 0) return null;
      const k = eOut(age / (o.spread || 1.8)); const [ox, oy] = o.origin(p);
      x = lerp(ox, x, k); y = lerp(oy, y, k); vis = clamp(age / .25);
    }
    const rr = Math.hypot(x, y), lim = this.rad + 8; if (rr > lim) { x *= lim / rr; y *= lim / rr; }
    return [x, y, vis];
  }
  draw(c, t, o = {}) {
    const a = o.a ?? 1; if (a <= .005) return;
    for (const p of this.ps) {
      if (o.filter && !o.filter(p)) continue;
      const q = this.pos(p, t, o); if (!q) continue;
      let al = a * q[2] * (o.typeA ? (o.typeA[p.type] ?? 1) : 1);
      glyph(c, p.type, q[0], q[1], GSIZE[p.type] * p.sz * (o.scale || 1), p.rot + t * .25 * (p.f1 - .4), al);
    }
  }
}
