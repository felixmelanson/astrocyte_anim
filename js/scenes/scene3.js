'use strict';
/* =====================================================================
   SCENE 3 — serum-free culture
   ===================================================================== */
const AST3a = [[-100, -84], [104, -92], [-92, 104], [112, 96]].map((p, i) => new Cell('astro', p[0], p[1], 610 + i * 5, 1.2, { drift: 9 }));
const AST3b = [[-100, -84], [104, -92], [-92, 104], [112, 96]].map((p, i) => new Cell('astro', p[0], p[1], 640 + i * 5, 1.2, { drift: 9 }));

// One continuous step: serum makes the dish reactive, then it slides aside for the serum-free dish.
const SLIDE = 5.6;                      // when the serum dish starts sliding left
function scene3(k, t, gt, S) {
  const u = t - SLIDE, slide = ease(seg(u, 0, 1.4));
  const lx = lerp(960, 600, slide), y = 500, r = 270;
  const rF = .45 * ease(seg(t, 2.4, 5.4));
  const tint = mix(UI.dish, UI.serum, seg(t, 1.6, 3));
  drawDish(lx, y, r, { tint });
  ctx.save(); clipCircle(lx, y, r - 4); ctx.translate(lx, y); AST3a.forEach(c => c.draw(ctx, { t: gt, r: rF, colR: 0 })); ctx.restore();
  drawDishRim(lx, y, r);
  // serum drop
  const du = seg(t, .8, 1.7);
  if (du > 0 && du < 1) { const yy = lerp(y - 380, y - 40, du * du); ctx.fillStyle = rgb(UI.serumDrop, .85); ctx.beginPath(); ctx.moveTo(lx, yy - 14); ctx.quadraticCurveTo(lx + 8, yy, lx, yy + 6); ctx.quadraticCurveTo(lx - 8, yy, lx, yy - 14); ctx.fill(); }
  const rip = seg(t, 1.7, 3.2); if (rip > 0 && rip < 1) { ctx.strokeStyle = rgb(UI.serumDrop, .5 * (1 - rip)); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(lx, y - 40, rip * 200, 0, TAU); ctx.stroke(); }
  txt('+ serum (FCS)', lx, y + r + 44, { a: seg(t, 1, 1.8), size: 24, w: 600, align: 'center', col: COL.coral });
  txt('reactive (not the A1 profile)', lx, y + r + 72, { a: seg(t, 4.6, 5.4), size: 17, align: 'center', col: COL.dim });
  if (u > 0) {
    const rx = lerp(1500, 1320, ease(seg(u, .3, 1.6))), a = seg(u, .3, 1.2);
    drawDish(rx, y, r, { a });
    ctx.save(); ctx.globalAlpha *= a; clipCircle(rx, y, r - 4); ctx.translate(rx, y); AST3b.forEach(c => c.draw(ctx, { t: gt, r: 0 })); ctx.restore();
    drawDishRim(rx, y, r, { a });
    txt('serum-free + HBEGF', rx, y + r + 44, { a: seg(u, 1, 1.8), size: 24, w: 600, align: 'center', col: COL.teal });
    txt('resting', rx, y + r + 72, { a: seg(u, 1.4, 2.2), size: 17, align: 'center', col: COL.dim });
  }
  vignette();
  caption(S.cap, seg(u, 2, 3)); subcap(S.sub, seg(u, 2.4, 3.4));
}
