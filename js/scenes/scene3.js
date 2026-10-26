'use strict';
/* =====================================================================
   SCENE 3 — serum-free culture
   ===================================================================== */
const AST3b = [[-100, -84], [104, -92], [-92, 104], [112, 96]].map((p, i) => new Cell('astro', p[0], p[1], 640 + i * 5, 1.2, { drift: 9 }));

// A culture dish tilting back from the top-down view into a petri dish seen from above-front: glass side wall, thick
// rim, the far inside wall, and the medium and cells on the floor *inside* it. Everything is the tilted view of one
// cylinder: rim ellipse at (x, y), floor ellipse H lower. tilt 0 cross-fades to exactly the flat dish.
const TILT = .9;                          // radians at tilt = 1 (about 52 degrees)
const tiltK = tilt => Math.cos(TILT * tilt), tiltWall = (r, tilt) => r * .34 * Math.sin(TILT * tilt);
function tiltDish(x, y, r, tilt, a, tint, content, o = {}) {     // o.hl / o.hlCol: tint the rim (e.g. a highlighted dish)
  if (a <= .004) return;
  const ky = tiltK(tilt), H = tiltWall(r, tilt), ry = r * ky, fy = y + H, b = ease(seg(tilt, 0, .3));
  const ri = r - 7, rin = ri * ky, light = THEME.light;
  ctx.save(); ctx.globalAlpha *= a;
  if (b < 1) {                                          // the flat dish while the tilt is just starting
    ctx.save(); ctx.globalAlpha *= 1 - b; ctx.translate(x, fy); ctx.scale(1, ky); drawDish(0, 0, r, { tint }); ctx.restore();
  }
  if (b > 0) {
    ctx.save(); ctx.globalAlpha *= b;
    const sh = ctx.createRadialGradient(x, fy + 10, ry * .9, x, fy + 10, ry * 1.2);           // shadow on the table
    sh.addColorStop(0, shade(.45)); sh.addColorStop(1, shade(0));
    ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(x, fy + 10, r * 1.2, ry * 1.2, 0, 0, TAU); ctx.fill();
    // far inside wall: between the rim's back arc and the floor's back edge
    const bw = ctx.createLinearGradient(0, y - ry, 0, fy);
    bw.addColorStop(0, rgb(mix(tint, [110, 126, 142], .22), .9)); bw.addColorStop(1, rgb(mix(tint, [255, 255, 255], .25), .9));
    ctx.beginPath(); ctx.ellipse(x, y, r, ry, 0, Math.PI, TAU, false); ctx.lineTo(x + ri, fy); ctx.ellipse(x, fy, ri, rin, 0, TAU, Math.PI, true); ctx.closePath();
    ctx.fillStyle = bw; ctx.fill();
    // floor with the medium on it
    ctx.save(); ctx.translate(x, fy); ctx.scale(1, ky);
    const g = ctx.createRadialGradient(-ri * .25, -ri * .3, ri * .05, 0, 0, ri);
    g.addColorStop(0, rgb(mix(tint, [255, 255, 255], UI.dishHi))); g.addColorStop(1, rgb(mix(tint, [0, 0, 0], UI.dishLo)));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, ri, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgb(UI.rim, .4 * UI.rimA); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    ctx.restore();
  }
  // cells: on the floor, squashed with the view
  ctx.save(); ctx.translate(x, fy); ctx.scale(1, ky); clipCircle(0, 0, r - 8); content(); ctx.restore();
  if (b > 0) {
    ctx.save(); ctx.globalAlpha *= b;
    // front glass wall, with the medium showing through it
    const fw = ctx.createLinearGradient(0, y + ry, 0, fy + ry);
    fw.addColorStop(0, rgb(mix(tint, [255, 255, 255], .5), .3)); fw.addColorStop(1, rgb(mix(tint, [90, 130, 170], .3), .5));
    const wall = () => { ctx.moveTo(x - r, y); ctx.lineTo(x - r, fy); ctx.ellipse(x, fy, r, ry, 0, Math.PI, 0, true); ctx.lineTo(x + r, y); };
    ctx.beginPath(); wall(); ctx.ellipse(x, y, r, ry, 0, 0, Math.PI, false); ctx.closePath(); ctx.fillStyle = fw; ctx.fill();
    ctx.strokeStyle = rgb(UI.rim, Math.min(1, .7 * UI.rimA)); ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.beginPath(); wall(); ctx.stroke();
    // the rim: outline, pale band, inner line
    ctx.beginPath(); ctx.ellipse(x, y, r, ry, 0, 0, TAU);
    ctx.strokeStyle = rgb(mix(UI.rim, o.hlCol || UI.rim, o.hl || 0), Math.min(1, (.75 + .25 * (o.hl || 0)) * UI.rimA)); ctx.lineWidth = 12 + 2 * (o.hl || 0); ctx.stroke();
    ctx.strokeStyle = light ? 'rgba(255,255,255,.96)' : 'rgba(210,225,238,.28)'; ctx.lineWidth = 8; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y, r - 8, ry * (r - 8) / r, 0, 0, TAU); ctx.strokeStyle = rgb(UI.rim, .5 * UI.rimA); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
  if (b < 1) { ctx.save(); ctx.globalAlpha *= 1 - b; ctx.translate(x, fy); ctx.scale(1, ky); drawDishRim(0, 0, r); ctx.restore(); }
  ctx.restore();
}
// One continuous step: the astrocyte culture dish of step 4 grows to centre stage while tilting back into a 3D dish
// (as the other two dishes fade), serum makes it reactive, then it slides aside for the serum-free dish.
const MORPH = 1.3;                      // step 4's last frame → this scene's dish
const SLIDE = 5.6;                      // when the serum dish starts sliding left (after the morph)
function scene3(k, t, gt, S) {
  const fromCult = prevStep === STEPS.findIndex(q => q.slug === 'three-cultures');
  const m = fromCult ? ease(seg(t, 0, MORPH)) : 1;
  if (fromCult) { culturesCarry(1 - seg(t, 0, 1.0), gt); t = Math.max(0, t - MORPH + .2); }   // the drop starts as the dish settles
  const u = t - SLIDE, slide = ease(seg(u, 0, 1.4));
  const lx = lerp(fromCult ? DX.A : 960, 960, m), y = lerp(fromCult ? CY : 470, 470, m), r = lerp(fromCult ? DR : 270, 270, m);
  const lx2 = lerp(lx, 600, slide), ky = tiltK(m), H = tiltWall(r, m), ry = r * ky;
  const rF = .45 * ease(seg(t, 2.4, 5.4));
  const tint = mix(UI.dish, UI.serum, seg(t, 1.6, 3));
  tiltDish(lx2, y, r, m, 1, tint, () => {
    ctx.scale(r / DR, r / DR);          // the same astrocytes as step 4, just carried along (no cross-fade)
    AST.forEach(c => c.draw(ctx, { t: gt, r: rF, colR: 0 }));
  });
  // serum drop
  const du = seg(t, .8, 1.7);
  if (du > 0 && du < 1) { const yy = lerp(y - 380, y + H, du * du); ctx.fillStyle = rgb(UI.serumDrop, .85); ctx.beginPath(); ctx.moveTo(lx2, yy - 14); ctx.quadraticCurveTo(lx2 + 8, yy, lx2, yy + 6); ctx.quadraticCurveTo(lx2 - 8, yy, lx2, yy - 14); ctx.fill(); }
  const rip = seg(t, 1.7, 3.2); if (rip > 0 && rip < 1) { ctx.strokeStyle = rgb(UI.serumDrop, .5 * (1 - rip)); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(lx2, y + H, rip * 200, rip * 200 * ky, 0, 0, TAU); ctx.stroke(); }
  const ty = y + ry + H;                // labels sit under the dish's front edge
  txt('+ serum (FCS)', lx2, ty + 76, { a: seg(t, 1, 1.8), size: 46, w: 600, align: 'center', col: COL.coral });
  txt('reactive (not the A1 profile)', lx2, ty + 124, { a: seg(t, 4.6, 5.4), size: 34, align: 'center', col: COL.dim });
  if (u > 0) {
    const rx = lerp(1500, 1320, ease(seg(u, .3, 1.6))), a = seg(u, .3, 1.2);
    tiltDish(rx, y, r, 1, a, UI.dish, () => { ctx.scale(1.1 * r / 270, 1.1 * r / 270); AST3b.forEach(c => c.draw(ctx, { t: gt, r: 0 })); });
    txt('serum-free + HBEGF', rx, ty + 76, { a: seg(u, 1, 1.8), size: 46, w: 600, align: 'center', col: COL.teal });
    txt('resting', rx, ty + 124, { a: seg(u, 1.4, 2.2), size: 34, align: 'center', col: COL.dim });
  }
  vignette();
  caption(S.cap, seg(u, 2, 3)); subcap(S.sub, seg(u, 2.4, 3.4));
}
