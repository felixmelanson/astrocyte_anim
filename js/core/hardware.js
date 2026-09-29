'use strict';
/* =====================================================================
   LAB HARDWARE
   ===================================================================== */
function drawDish(x, y, r, o = {}) {
  const a = o.a ?? 1; if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a;
  if (o.dashed) { ctx.setLineDash([8, 8]); ctx.strokeStyle = rgb(GRAYP.rim, .7); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.restore(); return; }
  const sh = ctx.createRadialGradient(x, y + 8, r * .92, x, y + 8, r * 1.13);
  sh.addColorStop(0, 'rgba(0,0,0,.55)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(x, y + 8, r * 1.13, 0, TAU); ctx.fill();
  const tint = o.tint || [15, 24, 31];
  const g = ctx.createRadialGradient(x - r * .25, y - r * .3, r * .05, x, y, r);
  g.addColorStop(0, rgb(mix(tint, [255, 255, 255], .045))); g.addColorStop(1, rgb(mix(tint, [0, 0, 0], .3)));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.restore();
}
function drawDishRim(x, y, r, o = {}) {
  const a = o.a ?? 1; if (a <= .004 || o.dashed) return;
  ctx.save(); ctx.globalAlpha *= a;
  const hl = o.hl || 0, hc = o.hlCol || [220, 235, 245];
  ctx.strokeStyle = rgb(mix([196, 214, 228], hc, hl), .36 + .3 * hl); ctx.lineWidth = 2.2 + hl; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(196,214,228,.13)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, r - 7, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y, r - 3.5, 3.6, 4.3); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.arc(x, y, r - 3.5, .5, .9); ctx.stroke();
  ctx.restore();
}
function clipCircle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip(); }

function drawPipette(x, y, fill, liq, dots, a = 1, low = 0) {
  if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a;
  if (low > 0) {            // contact shadow on the dish
    const sg = ctx.createRadialGradient(x + 16, y + 12, 0, x + 16, y + 12, 26);
    sg.addColorStop(0, `rgba(0,0,0,${.45 * low})`); sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(x + 16, y + 12, 26, 0, TAU); ctx.fill();
  }
  ctx.translate(x, y);
  const tipL = 150, wT = 17, wB = 3.4;
  const cone = () => { ctx.beginPath(); ctx.moveTo(-wB / 2, 0); ctx.lineTo(-wT / 2, -tipL); ctx.lineTo(wT / 2, -tipL); ctx.lineTo(wB / 2, 0); ctx.closePath(); };
  cone(); ctx.fillStyle = 'rgba(205,222,234,.08)'; ctx.fill();
  if (fill > 0) {
    ctx.save(); cone(); ctx.clip();
    const h = fill * tipL * .72;
    ctx.fillStyle = rgb(liq, .6); ctx.fillRect(-12, -h, 24, h);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-12, -h, 24, 1.2);
    if (dots) for (let i = 0; i < dots.length; i++) { const yy = -(i + .5) / dots.length * h * .95, xx = Math.sin(i * 2.7) * (1.5 + (-yy / tipL) * 5); ctx.fillStyle = rgb(dots[i], .95); ctx.beginPath(); ctx.arc(xx, yy, 1.7, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  cone(); ctx.strokeStyle = 'rgba(210,225,236,.55)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.moveTo(-wT / 2 + 3, -tipL + 4); ctx.lineTo(-wB / 2 + .6, -8); ctx.stroke();
  // collar
  ctx.fillStyle = 'rgb(150,160,170)'; rr(-12, -tipL - 16, 24, 16, 3); ctx.fill();
  // shaft
  const sx = -17, sw = 34, top = -tipL - 16 - 210;
  const g = ctx.createLinearGradient(sx, 0, sx + sw, 0);
  g.addColorStop(0, 'rgb(58,66,76)'); g.addColorStop(.35, 'rgb(150,160,172)'); g.addColorStop(.55, 'rgb(120,130,142)'); g.addColorStop(1, 'rgb(52,58,68)');
  ctx.fillStyle = g; rr(sx, top, sw, 210, 9); ctx.fill();
  ctx.fillStyle = 'rgb(70,78,88)'; rr(sx + 26, top + 40, 14, 90, 4); ctx.fill();            // tip ejector
  ctx.fillStyle = 'rgb(180,188,198)'; rr(-9, top - 34, 18, 34, 4); ctx.fill();              // plunger
  ctx.restore();
}
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

function drawTube(x, y, o = {}) {          // 1.5 ml microcentrifuge tube; (x,y) = liquid level point
  const a = o.a ?? 1; if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y);
  const body = () => { ctx.beginPath(); ctx.moveTo(-17, -46); ctx.lineTo(17, -46); ctx.lineTo(15, 8); ctx.quadraticCurveTo(10, 46, 0, 50); ctx.quadraticCurveTo(-10, 46, -15, 8); ctx.closePath(); };
  body(); ctx.fillStyle = 'rgba(205,222,234,.07)'; ctx.fill();
  ctx.save(); body(); ctx.clip(); ctx.fillStyle = rgb(o.liq || [60, 80, 96], .55); ctx.fillRect(-20, -12, 40, 70);
  if (o.dots) o.dots.forEach((d, i) => { ctx.fillStyle = rgb(d, .95); ctx.beginPath(); ctx.arc(-8 + (i * 7.3) % 16, 0 + (i * 11.7) % 34, 1.8, 0, TAU); ctx.fill(); });
  ctx.restore();
  body(); ctx.strokeStyle = 'rgba(210,225,236,.55)'; ctx.lineWidth = 1.3; ctx.stroke();
  ctx.fillStyle = 'rgba(210,225,236,.25)'; rr(-20, -52, 40, 7, 2); ctx.fill();
  ctx.strokeStyle = 'rgba(210,225,236,.45)'; ctx.beginPath(); ctx.ellipse(-34, -56, 15, 5, -.35, 0, TAU); ctx.stroke();  // open cap
  ctx.restore();
  if (o.label) txt(o.label, x, y + 78, { a: a, size: 16, align: 'center', col: o.labCol || COL.text, w: 500 });
  if (o.label2) txt(o.label2, x, y + 98, { a: a * .9, size: 14, align: 'center', col: COL.dim });
}
function drawClock(x, y, prog, a) {
  if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.strokeStyle = 'rgba(255,255,255,.13)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 14, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(230,240,246,.85)'; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y, 14, -Math.PI / 2, -Math.PI / 2 + TAU * prog); ctx.stroke();
  ctx.restore();
  txt(`${Math.round(prog * 24)} h`, x + 24, y + 6, { a, size: 17, w: 500, col: [220, 230, 238] });
}
function hopArc(x0, y0, x1, y1, lift, prog, ok, a) {
  if (a <= .004 || prog <= 0) return;
  const cx = (x0 + x1) / 2, cy = Math.min(y0, y1) - lift, N = 40, M = Math.max(1, Math.round(N * prog));
  const P = u => [(1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1, (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1];
  ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = 'round';
  ctx.strokeStyle = ok ? 'rgba(226,236,242,.6)' : rgb(GRAYP.rim, .85); ctx.lineWidth = 2;
  if (!ok) ctx.setLineDash([7, 7]);
  ctx.beginPath(); for (let i = 0; i <= M; i++) { const [x, y] = P(i / N); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.setLineDash([]);
  if (prog >= 1) {
    const [ex, ey] = P(1), [px, py] = P(.96), an = Math.atan2(ey - py, ex - px);
    ctx.fillStyle = ok ? 'rgba(226,236,242,.8)' : rgb(GRAYP.rim, .9);
    ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - Math.cos(an - .4) * 12, ey - Math.sin(an - .4) * 12); ctx.lineTo(ex - Math.cos(an + .4) * 12, ey - Math.sin(an + .4) * 12); ctx.closePath(); ctx.fill();
    if (!ok) { const [mx, my] = P(.5); ctx.strokeStyle = rgb(GRAYP.rim, 1); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(mx - 8, my - 8); ctx.lineTo(mx + 8, my + 8); ctx.moveTo(mx + 8, my - 8); ctx.lineTo(mx - 8, my + 8); ctx.stroke(); }
  }
  ctx.restore();
}
// pipette choreography: aspirate at src, carry, dispense at dst. Returns pose.
function hopPose(t, src, dst, sp = 1) {
  const T = [0, .8, 1.2, 1.9, 2.3, 3.5, 3.9, 4.6, 5.0, 5.8].map(v => v * sp);
  if (t < 0 || t > T[9]) return null;
  const up = 70, dn = 18;
  const P = [[src.x, -60], [src.x, src.y - up], [src.x, src.y - dn], [src.x, src.y - dn], [src.x, src.y - up], [dst.x, dst.y - up], [dst.x, dst.y - dn], [dst.x, dst.y - dn], [dst.x, dst.y - up], [dst.x, -60]];
  let i = 0; while (i < 8 && t > T[i + 1]) i++;
  const u = ease(seg(t, T[i], T[i + 1]));
  let x = lerp(P[i][0], P[i + 1][0], u), y = lerp(P[i][1], P[i + 1][1], u);
  if (i === 4) y -= Math.sin(u * Math.PI) * (dst.lift || 90);
  if (i === 0 || i === 8) y = lerp(P[i][1], P[i + 1][1], i === 0 ? eOut(seg(t, T[i], T[i + 1])) : u);
  const fill = t < T[2] ? 0 : t < T[3] ? ease(seg(t, T[2], T[3])) : t < T[6] ? 1 : t < T[7] ? 1 - ease(seg(t, T[6], T[7])) : 0;
  const near = i <= 3 ? src : dst;
  const low = clamp((y - (near.y - up)) / (up - dn));
  return { x, y, fill, low };
}
const HOPD = 3.9;   // dispense onset within a hop (×sp)
