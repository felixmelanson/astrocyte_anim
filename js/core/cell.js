'use strict';
/* ---------------- Cell (procedural, animated) ---------------- */
let CID = 0;
class Cell {
  constructor(type, x, y, seed, sc = 1, o = {}) {
    this.type = type; this.x = x; this.y = y; this.sc = sc; this.o = o; this.id = ++CID;
    const R = rng(seed * 7919 + 13);
    this.ph = R() * TAU; this.drift = o.drift ?? 7;
    this.harm = [0, 1, 2].map(() => ({ k: 2 + Math.floor(R() * 3), a: .03 + R() * .05, p: R() * TAU, f: .2 + R() * .3 }));
    if (type === 'astro') { this.R0 = o.R0 || 13; this.prims = buildAstro(R, o); }
    else if (type === 'micro') { this.R0 = o.R0 || 6.2; this.prims = buildMicro(R, o); this.elong = 1.35; }
    else if (type === 'neuron') { this.R0 = o.R0 || (o.pyr ? 11.5 : 11); this.prims = buildNeuron(R, o); this.apA = (o.axAng ?? 0) + Math.PI; }
    else if (type === 'oligo') { this.R0 = 8.5; this.buildOligo(R, o); }
    this.nuc = [(R() - .5) * this.R0 * .22, (R() - .5) * this.R0 * .22, R() * TAU];
    let id = 0; const tag = b => { b.id = this.id * 1000 + (id++); b.kids.forEach(tag); }; this.prims.forEach(tag);
  }
  buildOligo(R, o) {
    this.prims = []; this.sheaths = [];
    const n = o.nSheath || 4, A = o.axAng ?? R() * Math.PI, ax = [Math.cos(A), Math.sin(A)], nm = [-ax[1], ax[0]];
    const offs = [-54, -24, 26, 56];
    for (let i = 0; i < n; i++) {
      const d = offs[i % 4] + (R() - .5) * 10, along = (R() - .5) * 110;
      const cx = nm[0] * d + ax[0] * along, cy = nm[1] * d + ax[1] * along, len = 44 + R() * 44;
      this.sheaths.push({ cx, cy, A: A + (R() - .5) * .1, len });
      const pa = Math.atan2(cy, cx), pl = Math.hypot(cx, cy) - this.R0 * .45, cv = (R() - .5) * .9;
      this.prims.push(new Br({ ang: pa - cv / 2, len: pl * 1.03, w0: 2.0, w1: 1.1, curv: cv, ph: R() * TAU, freq: .3, amp: .02, kind: 'p', sA: 0, sB: .5 }));
    }
  }
  somaFn(P, ms, r, pyk, d) {
    const t = P.t, h = this.harm, R0 = this.R0, ty = this.type;
    return th => {
      let f = 1;
      for (const q of h) f += q.a * Math.sin(q.k * th + q.p + t * q.f * .5);
      for (const [a, m, w] of ms) { const dd = angd(th, a); f += (w / R0) * .7 * m * Math.exp(-dd * dd / .12); }
      if (ty === 'micro' && r > 0) f += r * (.11 * Math.sin(7 * th + t * 1.3) + .07 * Math.sin(11 * th - t * 1.7));
      if (ty === 'neuron') {
        if (this.o.pyr) { const c = Math.max(0, Math.cos(th - this.apA)); f += .5 * c * c * c; }
        if (pyk > 0) f += pyk * .09 * Math.sin(13 * th + d * 9) + pyk * .06 * Math.sin(19 * th);
      }
      return f;
    };
  }
  draw(c, P) {
    const r = P.r || 0, d = P.d || 0, t = P.t, a = P.a ?? 1;
    if (a <= .004) return;
    const ty = this.type;
    const mot = ty === 'astro' ? 1 - .75 * r : ty === 'micro' ? 1 - .6 * r : 1;   // A1: ~75% less motile
    const dr = this.drift * mot * (1 - d);
    const dx = dr * (Math.sin(t * .11 + this.ph) + .5 * Math.sin(t * .23 + this.ph * 2)), dy = dr * (Math.cos(t * .09 + this.ph * 1.3) + .5 * Math.sin(t * .19 + this.ph));
    c.save(); c.translate(this.x + dx, this.y + dy); c.scale(this.sc, this.sc); c.globalAlpha *= a;
    const bead = sstep(seg(d, .3, .6)), frag = sstep(seg(d, .5, .85)), pyk = sstep(seg(d, .55, .9)), eth = sstep(seg(d, .66, .92));
    const casp = sstep(seg(d, .18, .42)) * (1 - .55 * sstep(seg(d, .8, 1)));
    const Pp = { t, r, sprout: P.sprout ?? 1, lenK: 1 - .22 * frag, waveK: (ty === 'astro' ? 1 - .7 * r : 1) * (1 - d), bead, d };
    const strands = [], ms = [];
    const R0base = this.R0;
    for (const b of this.prims) {
      const sx = Math.cos(b.ang) * R0base * .45, sy = Math.sin(b.ang) * R0base * .45;
      evalBr(b, sx, sy, 0, Pp, strands);
      if (b.kind !== 'ax' && ty !== 'oligo') ms.push([b.ang, b.ext(Pp), b.w0]);
    }
    let pal = this.o.pal || TP[ty];
    const ct = P.colR ?? sstep(seg(r, .05, .6)); if (ct > 0) pal = palMix(pal, CORAL, ct);
    const gt = sstep(seg(d, .5, .95)); if (gt > 0) pal = palMix(pal, GRAYP, gt * .85);
    const spr = P.sprout ?? 1;
    const R0 = R0base * (1 - .3 * pyk) * (ty === 'micro' ? 1 + .8 * r : 1) * (ty === 'astro' ? 1 - .06 * r : 1) * (P.somaK || 1) * (spr < 1 ? lerp(.8, 1, spr) : 1);
    const fn0 = this.somaFn(Pp, ms, r, pyk, d), fn = new Float32Array(SOMA_N + 1);
    for (let i = 0; i <= SOMA_N; i++) fn[i] = fn0(-i / SOMA_N * TAU);
    const rimW = Math.min(2.4, 1.4 / this.sc);
    const el = ty === 'micro' ? lerp(this.elong, 1.05, r) : 1;
    const body = ex => {
      c.beginPath(); addSoma(c, R0, fn, el, ex);
      for (const s of strands) { if (frag > 0 && s.b.kind !== 'p' || frag > 0 && ty === 'neuron') addFrag(c, s, ex, frag); else addStrand(c, s, ex); }
      if (this.sheaths) for (const sh of this.sheaths) {
        const hx = Math.cos(sh.A) * sh.len / 2, hy = Math.sin(sh.A) * sh.len / 2;
        addStrand(c, { pts: [sh.cx - hx, sh.cy - hy, sh.cx + hx, sh.cy + hy], ws: [5.6, 5.6], n: 1 }, ex);
      }
    };
    if (P.dashed) {
      body(0); c.setLineDash([4 / this.sc, 4 / this.sc]); c.lineWidth = 1.3 / this.sc; c.strokeStyle = rgb(GRAYP.rim, .8); c.stroke(); c.restore(); return;
    }
    body(rimW); c.fillStyle = rgb(pal.rim); c.fill();
    body(0);
    const g = c.createRadialGradient(0, 0, R0 * .2, 0, 0, R0 * 5.5);
    g.addColorStop(0, rgb(mix(pal.body, pal.rim, .32))); g.addColorStop(1, rgb(pal.body));
    c.fillStyle = g; c.fill();

    c.lineCap = 'round'; c.lineJoin = 'round';
    if (ty === 'astro') {
      // GFAP cytoskeleton: brightens ~3x as the cell becomes reactive (Fig. 1g)
      const ga = Math.min(1, .2 * (1 + 2 * r)) * (P.gK ?? 1);
      c.strokeStyle = rgb(pal.fil, ga);
      for (const s of strands) {
        if (s.b.kind === 't') continue;
        const p = s.pts, n = s.n;
        c.lineWidth = Math.max(.45, (s.ws[0] + s.ws[n]) * .15 * (1 + .5 * r));
        c.beginPath(); c.moveTo(p[0], p[1]);
        for (let i = 1; i < n; i++) c.quadraticCurveTo(p[i * 2], p[i * 2 + 1], (p[i * 2] + p[i * 2 + 2]) / 2, (p[i * 2 + 1] + p[i * 2 + 3]) / 2);
        c.lineTo(p[n * 2], p[n * 2 + 1]); c.stroke();
      }
      c.lineWidth = .75 * (1 + .5 * r);
      for (const s of strands) if (s.b.kind === 'p') {
        const p = s.pts, a0 = Math.atan2(p[1], p[0]);
        c.beginPath(); c.moveTo(Math.cos(a0 + 1) * R0 * .5, Math.sin(a0 + 1) * R0 * .5);
        c.quadraticCurveTo(Math.cos(a0) * R0 * .75, Math.sin(a0) * R0 * .75, p[0], p[1]); c.stroke();
      }
      this.nucleus(c, R0, pal, .5, .4, 0);
    } else if (ty === 'micro') {
      c.save(); c.scale(el, 1); this.nucleus(c, R0, pal, .62, .4, 0); c.restore();
      if (r > .2) { c.fillStyle = rgb(pal.fil, .5 * r); for (let k = 0; k < 7; k++) { const an = k * 2.4 + this.ph, rr = R0 * (.55 + .25 * hash(k + this.id)); c.beginPath(); c.arc(Math.cos(an) * rr * el, Math.sin(an) * rr, .9, 0, TAU); c.fill(); } }
    } else if (ty === 'neuron') {
      // synapse puncta (wink out first)
      if (!P.noPuncta) for (const s of strands) {
        const b = s.b; if (!b.puncta) continue;
        for (const q of b.puncta) {
          if (q.f > s.m) continue;
          const pa = 1 - sstep(seg(d, q.tau, q.tau + .035)); if (pa <= 0) continue;
          const fl = Math.exp(-Math.pow((d - q.tau) / .02, 2)) * (d > 0 ? 1 : 0);
          const fi = q.f / s.m * s.n, i0 = Math.min(s.n - 1, Math.floor(fi)), u = fi - i0, p = s.pts;
          const x = lerp(p[i0 * 2], p[i0 * 2 + 2], u), y = lerp(p[i0 * 2 + 1], p[i0 * 2 + 3], u);
          const dx2 = p[i0 * 2 + 2] - p[i0 * 2], dy2 = p[i0 * 2 + 3] - p[i0 * 2 + 1], dl = Math.hypot(dx2, dy2) || 1;
          const off = s.ws[i0] * .5 + 1.2;
          const px = x - dy2 / dl * off * q.side, py = y + dx2 / dl * off * q.side;
          c.fillStyle = rgb([226, 250, 255], .9 * pa * a); c.beginPath(); c.arc(px, py, (1.5 + 1.6 * fl) / Math.sqrt(this.sc), 0, TAU); c.fill();
        }
      }
      if (casp > 0) {     // caspase-2/3 activation
        const cg = c.createRadialGradient(0, 0, 0, 0, 0, R0 * 1.25);
        const pul = .85 + .15 * Math.sin(t * 3);
        cg.addColorStop(0, rgb([255, 184, 80], .8 * casp * pul)); cg.addColorStop(1, rgb([255, 184, 80], 0));
        c.fillStyle = cg; c.beginPath(); c.arc(0, 0, R0 * 1.25, 0, TAU); c.fill();
      }
      this.nucleus(c, R0, pal, .52, .48, eth);
    } else {
      if (this.sheaths) { c.strokeStyle = rgb(pal.fil, .35); c.lineWidth = .8; for (const sh of this.sheaths) { const hx = Math.cos(sh.A) * (sh.len / 2 - 3), hy = Math.sin(sh.A) * (sh.len / 2 - 3); c.beginPath(); c.moveTo(sh.cx - hx, sh.cy - hy); c.lineTo(sh.cx + hx, sh.cy + hy); c.stroke(); } }
      this.nucleus(c, R0, pal, .5, .45, 0);
    }
    c.restore();
  }
  nucleus(c, R0, pal, rx, ry, eth) {
    const [ox, oy, rot] = this.nuc;
    const k = 1 - .38 * eth;
    c.beginPath(); c.ellipse(ox * (1 - eth), oy * (1 - eth), R0 * rx * k, R0 * ry * k, rot, 0, TAU);
    if (eth > 0) {
      c.fillStyle = rgb(mix(pal.nuc, [238, 44, 66], eth)); c.fill();
      c.strokeStyle = rgb([255, 90, 100], .35 * eth); c.lineWidth = 2.2; c.stroke();
    } else {
      c.fillStyle = rgb(pal.nuc, .92); c.fill();
      c.strokeStyle = rgb(pal.rim, .22); c.lineWidth = .7; c.stroke();
      if (this.type === 'neuron') { c.fillStyle = rgb(pal.fil, .55); c.beginPath(); c.arc(ox + R0 * .12, oy - R0 * .08, R0 * .1, 0, TAU); c.fill(); }
    }
  }
}
