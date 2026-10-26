'use strict';
/* =====================================================================
   MODELS — the two in-vivo origin panels of step 6 (flat canvas drawing, plus assets/rat.png for the rat)
   Every draw function takes (x, y) = centre of the artwork and a = alpha.
   ===================================================================== */
// rat with a syringe at its flank: systemic LPS. h = height of the rat in px
function drawLpsRat(x, y, a, h = 285) {
  if (a <= .004) return;
  const im = IMG.rat, s = h / im.naturalHeight, w = im.naturalWidth * s, k = h / 215;
  ctx.save(); ctx.globalAlpha *= a;
  const sh = ctx.createRadialGradient(x, y + h * .44, 4, x, y + h * .44, w * .45);          // contact shadow
  sh.addColorStop(0, shade(.35)); sh.addColorStop(1, shade(0));
  ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(x, y + h * .44, w * .42, 12, 0, 0, TAU); ctx.fill();
  ctx.drawImage(im, x - w / 2, y - h / 2, w, h);
  // syringe coming in from the right, needle in the flank
  ctx.translate(x + w * .12, y + h * .06); ctx.rotate(-.62); ctx.scale(k, k);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = rgb(UI.rim); ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(34, 0); ctx.stroke();                       // needle
  rr(34, -12, 86, 24, 5); ctx.fillStyle = rgb(COL.bg); ctx.fill(); ctx.stroke();            // barrel
  rr(40, -8, 52, 16, 3); ctx.fillStyle = rgb(COL.coral, .8); ctx.fill();                    // LPS in the barrel
  ctx.beginPath(); ctx.moveTo(120, 0); ctx.lineTo(150, 0); ctx.stroke();                    // plunger rod
  ctx.beginPath(); ctx.moveTo(150, -14); ctx.lineTo(150, 14); ctx.lineWidth = 5; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(60, -12); ctx.lineTo(60, -20); ctx.moveTo(100, -12); ctx.lineTo(100, -20); ctx.lineWidth = 3; ctx.stroke();   // finger flange
  ctx.restore();
}
// side-view brain: a bumpy cerebrum (union of lobes, outline only on the outside), cerebellum, brainstem,
// one artery drawn as a line with an occlusion bar, and the tissue downstream of it in green
const BRAIN_LOBES = [[-82, 8, 38], [-70, -34, 40], [-34, -58, 42], [12, -66, 44], [58, -52, 42], [94, -22, 38], [100, 20, 32], [70, 38, 36], [30, 40, 40], [-14, 38, 42], [-52, 36, 38], [-18, -10, 62], [34, -14, 66]];
function drawStrokeBrain(x, y, a, green, sc = .8) {
  if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(sc, sc); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const ink = rgb(mix(COL.bg, COL.text, .6)), fill = rgb(mix(COL.bg, COL.text, .07)), lobes = () => { ctx.beginPath(); BRAIN_LOBES.forEach(([cx, cy, r]) => { ctx.moveTo(cx + r, cy); ctx.arc(cx, cy, r, 0, TAU); }); };
  ctx.fillStyle = shade(.16); ctx.beginPath(); ctx.ellipse(0, 112, 110, 9, 0, 0, TAU); ctx.fill();
  // brainstem and cerebellum
  ctx.strokeStyle = ink; ctx.fillStyle = fill; ctx.lineWidth = 3.4;
  rr(8, 52, 26, 56, 10); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(70, 70, 44, 26, .15, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.ellipse(70, 70, 41, 23, .15, 0, TAU); ctx.clip(); ctx.lineWidth = 1.8; ctx.strokeStyle = rgb(mix(COL.bg, COL.text, .3));
  for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(26, 70 + i * 9); ctx.quadraticCurveTo(70, 62 + i * 9 + 6, 114, 70 + i * 9); ctx.stroke(); } ctx.restore();
  // cerebrum: stroke fat, then fill over it, so only the outer outline remains
  lobes(); ctx.strokeStyle = ink; ctx.lineWidth = 7; ctx.stroke(); lobes(); ctx.fillStyle = fill; ctx.fill();
  ctx.save(); lobes(); ctx.clip(); ctx.fillStyle = rgb([62, 178, 73], .5 * green); ctx.beginPath(); ctx.ellipse(46, -22, 68, 56, -.2, 0, TAU); ctx.fill();
  ctx.strokeStyle = rgb(mix(COL.bg, COL.text, .3)); ctx.lineWidth = 2.4;          // gyri
  [[-96, 12, -70, -22, -40, -2], [-62, -44, -30, -30, -8, -52], [10, -70, 30, -44, 60, -58], [-30, 22, 0, 0, 34, 18], [44, 6, 70, -14, 96, 4], [-56, 40, -30, 24, -8, 40], [60, 34, 82, 22, 100, 34]].forEach(([x0, y0, cx, cy, x1, y1]) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke(); });
  ctx.restore();
  // middle cerebral artery
  ctx.strokeStyle = rgb(COL.coral); ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(6, 56); ctx.bezierCurveTo(8, 24, 28, 8, 40, -10); ctx.bezierCurveTo(52, -28, 54, -46, 50, -66); ctx.stroke();
  ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(42, -12); ctx.bezierCurveTo(64, -10, 84, -20, 98, -34); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(34, 0); ctx.bezierCurveTo(48, 18, 70, 22, 88, 14); ctx.stroke();
  ctx.strokeStyle = rgb(COL.ink); ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(14, 22); ctx.lineTo(34, 6); ctx.stroke();      // occlusion
  ctx.restore();
}
