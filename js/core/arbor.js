'use strict';
/* =====================================================================
   PROCEDURAL ARBOR ENGINE
   Every process is a Br (branch). Geometry is re-evaluated each frame so
   processes undulate, extend (sprout) and retract continuously.
   ===================================================================== */
class Br {
  constructor(o) {
    this.ang = 0; this.len = 10; this.w0 = 2; this.w1 = 1; this.curv = 0; this.ph = 0; this.freq = .6; this.amp = .1;
    this.at = 1; this.rA = 2; this.rB = 3; this.mEnd = 1; this.sA = 0; this.sB = .01; this.kink = 0; this.kf = 6;
    this.dyn = 0; this.dynF = .3; this.kind = 'd'; this.kids = [];
    Object.assign(this, o);
  }
  ext(P) {
    let m = lerp(1, this.mEnd, sstep(seg(P.r, this.rA, this.rB)));
    if (P.sprout < 1) m *= sstep(seg(P.sprout, this.sA, this.sB));
    if (this.dyn) m *= 1 + this.dyn * Math.sin(P.t * this.dynF + this.ph);
    return m;
  }
}
function evalBr(b, x, y, dir, P, out, parentM) {
  let m = b.ext(P);
  if (parentM !== undefined) m *= sstep((parentM - b.at) / .12);
  const L = b.len * m * P.lenK;
  if (L < .7) return;
  const n = Math.max(3, Math.min(b.kind === 'ax' ? 44 : 16, Math.ceil(L / 6)));
  const pts = new Array((n + 1) * 2), ws = new Array(n + 1), angs = new Array(n + 1);
  let px = x, py = y; const ds = L / n, a0 = dir + b.ang, wk = P.waveK;
  for (let i = 0; i <= n; i++) {
    const sf = (i / n) * m;
    const ang = a0 + b.curv * sf + wk * b.amp * Math.sin(P.t * b.freq + b.ph - sf * 3) * sf + b.kink * Math.sin(sf * b.kf + b.ph * 1.7);
    if (i > 0) { px += Math.cos(ang) * ds; py += Math.sin(ang) * ds; }
    pts[i * 2] = px; pts[i * 2 + 1] = py; angs[i] = ang;
    let w = lerp(b.w0, b.w1, sf);
    if (b.wf) w = b.wf(sf, w, P);
    if (P.bead > 0 && (b.kind === 'd' || b.kind === 'ax')) w *= 1 + P.bead * (1.1 * Math.max(0, Math.sin(sf * b.len * .5 + b.ph)) - .4);
    ws[i] = w;
  }
  out.push({ pts, ws, b, n, m });
  for (const k of b.kids) {
    let idx;
    if (k.at >= 1) idx = n; else { if (k.at > m) continue; idx = Math.round(k.at / m * n); }
    evalBr(k, pts[idx * 2], pts[idx * 2 + 1], angs[idx], P, out, k.at < 1 ? m : undefined);
  }
}
function smoothTo(c, xs, ys, rev) {
  const n = xs.length - 1;
  if (!rev) { for (let i = 1; i < n; i++) c.quadraticCurveTo(xs[i], ys[i], (xs[i] + xs[i + 1]) / 2, (ys[i] + ys[i + 1]) / 2); c.lineTo(xs[n], ys[n]); }
  else { c.lineTo(xs[n], ys[n]); for (let i = n - 1; i > 0; i--) c.quadraticCurveTo(xs[i], ys[i], (xs[i] + xs[i - 1]) / 2, (ys[i] + ys[i - 1]) / 2); c.lineTo(xs[0], ys[0]); }
}
// Tapered, round-capped membrane outline for one process (consistent winding → clean unions)
function addStrand(c, s, ex) {
  const p = s.pts, w = s.ws, n = s.n;
  const lx = [], ly = [], rx = [], ry = [];
  let nx0 = 0, ny0 = 0, nxn = 0, nyn = 0;
  for (let i = 0; i <= n; i++) {
    const i0 = Math.max(0, i - 1), i1 = Math.min(n, i + 1);
    let dx = p[i1 * 2] - p[i0 * 2], dy = p[i1 * 2 + 1] - p[i0 * 2 + 1];
    const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const hw = w[i] * .5 + ex, nx = -dy, ny = dx;
    lx.push(p[i * 2] + nx * hw); ly.push(p[i * 2 + 1] + ny * hw);
    rx.push(p[i * 2] - nx * hw); ry.push(p[i * 2 + 1] - ny * hw);
    if (i === 0) { nx0 = nx; ny0 = ny; } if (i === n) { nxn = nx; nyn = ny; }
  }
  c.moveTo(lx[0], ly[0]); smoothTo(c, lx, ly, false);
  const an = Math.atan2(nyn, nxn); c.arc(p[n * 2], p[n * 2 + 1], w[n] * .5 + ex, an, an - Math.PI, true);
  smoothTo(c, rx, ry, true);
  const a0 = Math.atan2(ny0, nx0); c.arc(p[0], p[1], w[0] * .5 + ex, a0 + Math.PI, a0, true);
  c.lineTo(lx[0], ly[0]);
}
// Apoptotic fragmentation of neurites
function addFrag(c, s, ex, frag) {
  const n = s.n, p = s.pts, w = s.ws, ch = 3;
  for (let i = 0; i < n; i += ch) {
    const j = Math.min(n, i + ch); if (j - i < 1) break;
    if (hash(s.b.id * 3.17 + i * 1.91) < frag * .5) continue;
    const cx = (p[i * 2] + p[j * 2]) / 2, cy = (p[i * 2 + 1] + p[j * 2 + 1]) / 2, k = 1 - .55 * frag;
    const pts = [], ws = [];
    for (let q = i; q <= j; q++) { pts.push(cx + (p[q * 2] - cx) * k, cy + (p[q * 2 + 1] - cy) * k); ws.push(w[q]); }
    addStrand(c, { pts, ws, n: j - i }, ex);
  }
}
const SOMA_N = 52, SOMA_C = [], SOMA_S = [];
for (let i = 0; i <= SOMA_N; i++) { SOMA_C.push(Math.cos(-i / SOMA_N * TAU)); SOMA_S.push(Math.sin(-i / SOMA_N * TAU)); }
function addSoma(c, R0, fn, el, ex) {
  const N = SOMA_N;
  if (typeof fn === 'function') { const v = new Float32Array(N + 1); for (let i = 0; i <= N; i++) v[i] = fn(-i / N * TAU); fn = v; }
  for (let i = 0; i <= N; i++) {
    const r = R0 * fn[i] + ex;
    const x = SOMA_C[i] * r * el, y = SOMA_S[i] * r;
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.closePath();
}
