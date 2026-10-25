'use strict';
/* =====================================================================
   SCENE 2 — immunopanning
   ===================================================================== */
const PLATES = [
  { x: 330, lab: 'BSL-1 lectin', rem: ['endothelial cells', 'microglia'], kind: 'lectin' },
  { x: 590, lab: '2° antibody only', rem: ['microglia /', 'macrophages'] },
  { x: 850, lab: 'anti-CD45', rem: ['microglia /', 'macrophages'] },
  { x: 1110, lab: 'anti-O4', rem: ['oligodendrocyte', 'lineage'] },
  { x: 1370, lab: 'anti-O4', rem: ['oligodendrocyte', 'lineage'] },
  { x: 1630, lab: 'anti-ITGB5', rem: ['astrocytes'], pos: true },
];
const PY = 520, PR = 100, PD = 2.0, PA0 = 1.6, TNEG = PA0 + 4 * PD + 1.4;
const TYPES = ['astro', 'micro', 'endo', 'oligo', 'neuron'];
const TYPENAME = { astro: 'astrocytes', micro: 'microglia', endo: 'endothelial', oligo: 'oligodendrocyte lineage', neuron: 'neurons' };
const SUS = (() => {
  const R = rng(7), counts = { endo: 8, micro: 14, oligo: 16, neuron: 14, astro: 20 }, cells = [];
  for (const [type, n] of Object.entries(counts)) for (let i = 0; i < n; i++) {
    const c = { type, rd: new Round(type, cells.length * 31 + 5) };
    if (type === 'endo') c.cap = 0; else if (type === 'micro') c.cap = i < 7 ? 0 : i < 11 ? 1 : 2; else if (type === 'oligo') c.cap = i < 11 ? 3 : 4; else if (type === 'astro') c.cap = 5; else c.cap = -1;
    c.bx = 960 + (R() - .5) * 330; c.by = 520 + (R() - .5) * 210;
    let a = R() * TAU, r = Math.sqrt(R()); c.cx = 960 + Math.cos(a) * r * 470; c.cy = 500 + Math.sin(a) * r * 225;
    a = R() * TAU; r = Math.sqrt(R()) * 60; c.ex = 110 + Math.cos(a) * r * .8; c.ey = 520 + Math.sin(a) * r * 1.4;
    c.spots = []; for (let k = 0; k < 6; k++) { const a2 = R() * TAU, r2 = Math.sqrt(R()) * 76; c.spots.push([Math.cos(a2) * r2, Math.sin(a2) * r2]); }
    c.ph = R() * TAU; cells.push(c);
  }
  for (let i = cells.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [cells[i], cells[j]] = [cells[j], cells[i]]; }
  return cells;
})();
function susPos(c, T) {
  const A = k => PA0 + k * PD, Lv = k => A(k) + 1.4;
  let x, y, b = 0, a = 1;
  if (T < 1.0) { const u = ease(T); x = lerp(c.cx, c.ex, u); y = lerp(c.cy, c.ey, u); }
  else if (T < A(0)) { const u = ease(seg(T, 1.0, A(0))), s = c.spots[0]; x = lerp(c.ex, PLATES[0].x + s[0], u); y = lerp(c.ey, PY + s[1], u); }
  else {
    let k = Math.min(5, Math.floor((T - A(0)) / PD)); if (c.cap >= 0 && c.cap < k) k = c.cap;
    const s = c.spots[k], px = PLATES[k].x + s[0], py = PY + s[1];
    if (c.cap === k) { b = ease(seg(T, A(k) + .3, A(k) + 1.0)); x = px; y = py; }
    else if (k === 5) { const u = ease(seg(T, Lv(5) + .2, Lv(5) + 1.6)); x = lerp(px, 1900, u); y = lerp(py, PY + s[1] * .3, u); a = 1 - seg(T, Lv(5) + .9, Lv(5) + 1.6); }
    else if (T < Lv(k)) { x = px; y = py; }
    else { const u = ease(seg(T, Lv(k), A(k + 1))), s2 = c.spots[k + 1]; x = lerp(px, PLATES[k + 1].x + s2[0], u); y = lerp(py, PY + s2[1], u) - Math.sin(u * Math.PI) * 55; }
  }
  x += Math.sin(T * 1.7 + c.ph) * 3 * (1 - b); y += Math.cos(T * 1.3 + c.ph) * 3 * (1 - b);
  return { x, y, b, a };
}
function drawPlate(x, y, r, o = {}) {
  const a = o.a ?? 1; if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a;
  drawDish(x, y, r, { tint: UI.plate });
  ctx.save(); clipCircle(x, y, r - 6);
  ctx.strokeStyle = o.pos ? rgb(UI.gridPos, .16 * UI.gridA) : rgb(UI.grid, .12 * UI.gridA); ctx.fillStyle = rgb(UI.grid, .14 * UI.gridA); ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gy = -r; gy <= r; gy += 14) for (let gx = -r; gx <= r; gx += 14) {
    const px = x + gx + ((Math.round(gy / 14)) % 2 ? 7 : 0), py = y + gy;
    if (o.kind === 'lectin') { ctx.moveTo(px + 1.3, py); ctx.arc(px, py, 1.3, 0, TAU); }
    else { ctx.moveTo(px, py + 3); ctx.lineTo(px, py); ctx.lineTo(px - 2.4, py - 2.6); ctx.moveTo(px, py); ctx.lineTo(px + 2.4, py - 2.6); }
  }
  o.kind === 'lectin' ? ctx.fill() : ctx.stroke();
  ctx.restore();
  drawDishRim(x, y, r, { hl: o.hl || 0, hlCol: o.pos ? COL.teal : THEME.light ? COL.dim : COL.ink });
  ctx.restore();
}
function typeLegend(x, y, a, types = TYPES) {
  if (a <= .004) return;
  let cx = x;
  const items = types.map(t => ({ t, w: 46 + TYPENAME[t].length * 10.6 }));
  const total = items.reduce((s, i) => s + i.w, 0) + (items.length - 1) * 24; cx = x - total / 2;
  for (const it of items) {
    ctx.save(); ctx.globalAlpha *= a; const rd = LEG_RD[it.t]; rd.draw(ctx, cx + 13, y - 7, 0, { s: 1.15 }); ctx.restore();
    txt(TYPENAME[it.t], cx + 38, y, { a, size: 21, col: COL.legend }); cx += it.w + 24;
  }
}
const LEG_RD = { astro: new Round('astro', 3), micro: new Round('micro', 4), endo: new Round('endo', 5), oligo: new Round('oligo', 6), neuron: new Round('neuron', 8) };

// Step k = 0 is one continuous sequence: tissue → P5 brain → dissect cortex → dice → papain →
// triturate → single-cell suspension → negative plates → positive plate (Methods: "cortices were
// enzymatically (using papain) then mechanically dissociated to generate a single-cell suspension").
const DISS = 10.3;                      // dissociation beat; panning time T starts after it
function scene2(k, t, gt, S) {
  if (k === 0) {
    if (t < DISS) dissociate(t, gt); else panning(t - DISS, gt);
    vignette();
    caption(S.cap, seg(t, .6, 1.4)); subcap(S.sub, seg(t, 1, 1.8));
    return;
  }
  threeCultures(t, gt, S);
}

/* ---------------- dissociation ----------------
   Brain coordinates: origin = brain centre, dorsal view, rostral up. */
function hemiPath(c, s, dx = 0) {       // s = -1 left, +1 right cortical hemisphere
  c.moveTo(s * 6 + dx, -148);
  c.bezierCurveTo(s * 60 + dx, -170, s * 150 + dx, -150, s * 168 + dx, -40);
  c.bezierCurveTo(s * 182 + dx, 40, s * 150 + dx, 140, s * 70 + dx, 150);
  c.bezierCurveTo(s * 40 + dx, 153, s * 12 + dx, 150, s * 6 + dx, 142);
  c.closePath();
}
const TB = { x: -293, y: -170, w: 586, h: 330 };        // where the tissue texture sits in brain coordinates
const CUTS = { v: [-123, -64, 64, 123], h: [-89, -8, 72] };
// chunks after dicing: hemisphere × grid cell, kept only where the cell centre lies inside the hemisphere
const CHUNKS = (() => {
  const xs = [-190, -123, -64, -6, 6, 64, 123, 190], ys = [-175, -89, -8, 72, 158], out = [];
  const pc = document.createElement('canvas').getContext('2d');
  for (const s of [-1, 1]) {
    pc.beginPath(); hemiPath(pc, s);
    for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
      const x0 = xs[i], x1 = xs[i + 1], y0 = ys[j], y1 = ys[j + 1], cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      if (x1 - x0 < 20 || !pc.isPointInPath(cx, cy)) continue;
      out.push({ s, x0, y0, x1, y1, cx, cy });
    }
  }
  const R = rng(31); out.forEach((c, i) => { c.st = R(); c.slot = i; });
  return out;
})();
const TUBE = { x: 960, y: 740, s: 3 };                   // big 1.5 ml tube; (x, y) = liquid level
function tubeBody(c) {                  // in tube-local units (drawTube's shape)
  c.moveTo(-17, -46); c.lineTo(17, -46); c.lineTo(15, 8); c.quadraticCurveTo(10, 46, 0, 50); c.quadraticCurveTo(-10, 46, -15, 8); c.closePath();
}
const tubePt = (lx, ly) => [TUBE.x + lx * TUBE.s, TUBE.y + ly * TUBE.s];
// home of suspension cell i inside the liquid, tube-local
const TUBE_HOME = SUS.map((c, i) => { const R = rng(500 + i), y = -8 + R() * 46, half = 13 * (y < 8 ? 1 : 1 - (y - 8) / 46); return [(R() * 2 - 1) * half, y]; });
const STAGES = ['dissect cortex', 'dice', 'papain · 34 °C', 'triturate', 'single cells'];

function dissociate(t, gt) {
  const gtE = gt - t, S = tissueSnap(gtE), pt = prevStep === 1 ? prevT : 0;
  // --- camera: step 2's view (scene-1 camera) → whole P5 brain
  const z0 = 1.02 + .02 * Math.sin(gtE * .045), dx0 = Math.sin(gtE * .03) * 10;
  const R0 = { x: W / 2 - z0 * (W / 2 - dx0), y: H / 2 - z0 * H / 2, w: z0 * W };
  const lift = ease(seg(t, 2.2, 3.0)), sep = 26 * lift;
  const A1 = { x: 960, y: lerp(470, 380, lift) };
  const e = ease(seg(t, .5, 2.0));
  const w = R0.w * Math.pow(TB.w / R0.w, e), K = w / TB.w, f = (R0.w - w) / (R0.w - TB.w);
  const cx = lerp(R0.x + R0.w / 2, A1.x + TB.x + TB.w / 2, f), cy = lerp(R0.y + z0 * H / 2, A1.y + TB.y + TB.h / 2, f);
  const toBrain = c => { c.translate(cx - K * (TB.x + TB.w / 2), cy - K * (TB.y + TB.h / 2)); c.scale(K, K); };
  const tex = c => c.drawImage(S.u, TB.x, TB.y, TB.w, TB.h);
  const outA = seg(t, .8, 1.4);                         // brain outline / tint
  const tint = THEME.light ? [222, 228, 232] : [44, 54, 62];
  const brainA = 1 - seg(t, 4.5, 5.0);                  // whole cortex pieces (before they become falling chunks)
  // --- step 2 → 3: the "who?" overlay and focus fade, then the view pulls back
  const ua = 1 - seg(t, .8, 1.4);
  if (ua > 0) {
    ctx.save(); toBrain(ctx); ctx.globalAlpha *= ua; tex(ctx);
    const relax = ease(seg(t, .05, .7)); if (relax < 1) { ctx.globalAlpha *= 1 - relax; ctx.drawImage(S.f, TB.x, TB.y, TB.w, TB.h); }
    ctx.restore();
  }
  if (prevStep === 1 && t < .5) {
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z0, z0); ctx.translate(-W / 2 + dx0, -H / 2);
    drawWhoOverlay(pt + t, gt, 1 - seg(t, 0, .45)); ctx.restore();
    caption(STEPS[1].cap, seg(pt, 1.5, 2.5) * (1 - seg(t, 0, .4)));
  }
  // --- rest of the brain (olfactory bulbs, cerebellum): appears with the pull-back, then is set aside
  const pa = outA * (1 - seg(t, 2.0, 2.6));
  if (pa > 0) {
    ctx.save(); toBrain(ctx); ctx.globalAlpha *= pa; ctx.lineWidth = 2 / K; ctx.strokeStyle = fg(.55);
    ctx.fillStyle = rgb(tint);
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 32, -176, 26, 30, s * .2, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(0, 196, 116, 50, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = fg(.25); for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(-100 + Math.abs(i) * 8, 196 + i * 16); ctx.quadraticCurveTo(0, 190 + i * 18, 100 - Math.abs(i) * 8, 196 + i * 16); ctx.stroke(); }
    ctx.restore();
  }
  // --- cortical hemispheres (textured with the very tissue we were looking at)
  const explode = ease(seg(t, 4.2, 4.6)) * 7;
  if (brainA > 0) {
    for (const s of [-1, 1]) {
      ctx.save(); toBrain(ctx); ctx.globalAlpha *= brainA * (1 - ua);   // takes over as the unclipped view fades
      if (explode > 0) {               // diced: each chunk = hemisphere ∩ grid cell, pushed apart
        for (const ch of CHUNKS) if (ch.s === s) {
          const d = Math.hypot(ch.cx, ch.cy) || 1;
          ctx.save(); ctx.translate(s * sep + ch.cx / d * explode, ch.cy / d * explode);
          ctx.beginPath(); hemiPath(ctx, s); ctx.clip(); ctx.beginPath(); ctx.rect(ch.x0, ch.y0, ch.x1 - ch.x0, ch.y1 - ch.y0); ctx.clip();
          tex(ctx); ctx.fillStyle = rgb(tint, .35 * outA); ctx.fillRect(TB.x, TB.y, TB.w, TB.h); ctx.restore();
        }
      } else {
        ctx.beginPath(); hemiPath(ctx, s, s * sep); ctx.clip();
        ctx.translate(s * sep, 0); tex(ctx); ctx.fillStyle = rgb(tint, .35 * outA); ctx.fillRect(TB.x, TB.y, TB.w, TB.h);
      }
      ctx.restore();
      if (explode <= 0) { ctx.save(); toBrain(ctx); ctx.globalAlpha *= brainA * outA; ctx.beginPath(); hemiPath(ctx, s, s * sep); ctx.strokeStyle = fg(.55); ctx.lineWidth = 2 / K; ctx.stroke(); ctx.restore(); }
    }
    // dicing cuts
    ctx.save(); toBrain(ctx); ctx.globalAlpha *= brainA * (1 - seg(t, 4.2, 4.5)); ctx.strokeStyle = fg(.75); ctx.lineWidth = 1.6 / K; ctx.lineCap = 'round';
    const cuts = [...CUTS.v.map(x => ['v', x]), ...CUTS.h.map(y => ['h', y])];
    cuts.forEach(([d, v], i) => {
      const u = seg(t, 3.1 + i * .12, 3.45 + i * .12); if (u <= 0) return;
      ctx.beginPath();
      if (d === 'v') { const x = v + Math.sign(v) * sep; ctx.moveTo(x, -178); ctx.lineTo(x, lerp(-178, 160, u)); }
      else { ctx.moveTo(-200 - sep, v); ctx.lineTo(lerp(-200 - sep, 200 + sep, u), v); }
      ctx.stroke();
    });
    ctx.restore();
  }
  txt('P5 rodent cortex', A1.x, A1.y + 192, { a: seg(t, 2.4, 3.0) * (1 - seg(t, 4.2, 4.7)), size: 22, w: 500, align: 'center' });
  // --- tube
  const tubeA = seg(t, 4.2, 4.7) * (1 - seg(t, 9.1, 9.7));
  const papain = seg(t, 5.6, 6.3), soft = ease(seg(t, 6.1, 7.0));
  if (tubeA > 0) {
    ctx.save(); ctx.globalAlpha *= tubeA; ctx.translate(TUBE.x, TUBE.y); ctx.scale(TUBE.s, TUBE.s);
    ctx.beginPath(); tubeBody(ctx); ctx.fillStyle = rgb(UI.rim, UI.glassA * .9); ctx.fill();
    ctx.save(); ctx.beginPath(); tubeBody(ctx); ctx.clip();
    ctx.fillStyle = rgb(liqC(mix([60, 80, 96], [96, 90, 60], papain)), .55); ctx.fillRect(-20, -12, 40, 70); ctx.restore();
    ctx.lineWidth = 1.3 / TUBE.s; ctx.beginPath(); tubeBody(ctx); ctx.strokeStyle = rgb(UI.rim, Math.min(1, .55 * UI.rimA)); ctx.stroke();
    ctx.fillStyle = rgb(UI.rim, .25 * UI.rimA); rr(-20, -52, 40, 7, 2); ctx.fill();
    ctx.strokeStyle = rgb(UI.rim, Math.min(1, .45 * UI.rimA)); ctx.beginPath(); ctx.ellipse(-34, -56, 15, 5, -.35, 0, TAU); ctx.stroke();
    ctx.restore();
    // papain drops + 34 °C / 90 min
    for (let i = 0; i < 4; i++) {
      const u = seg(t, 5.6 + i * .14, 6.0 + i * .14); if (u <= 0 || u >= 1) continue;
      const x = TUBE.x + (i - 1.5) * 9, y = lerp(TUBE.y - 300, TUBE.y - 30, u * u);
      ctx.fillStyle = rgb(UI.drop, .85); ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.quadraticCurveTo(x + 5, y, x, y + 4); ctx.quadraticCurveTo(x - 5, y, x, y - 9); ctx.fill();
    }
    const la = seg(t, 5.7, 6.2) * (1 - seg(t, 7.2, 7.6)) * tubeA;
    txt('papain', TUBE.x + 80, TUBE.y - 40, { a: la, size: 22, w: 600, col: COL.text });
    txt('34 °C · 90 min', TUBE.x + 80, TUBE.y - 14, { a: la, size: 17, col: COL.dim });
    const clk = seg(t, 6.1, 7.0);
    if (la > 0) { ctx.save(); ctx.globalAlpha *= la; ctx.lineWidth = 3; ctx.strokeStyle = fg(.13); ctx.beginPath(); ctx.arc(TUBE.x + 94, TUBE.y + 24, 12, 0, TAU); ctx.stroke(); ctx.strokeStyle = fg(.85); ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(TUBE.x + 94, TUBE.y + 24, 12, -Math.PI / 2, -Math.PI / 2 + TAU * clk); ctx.stroke(); ctx.restore(); }
  }
  // --- chunks fall into the tube, soften in papain, break apart under trituration
  const n = CHUNKS.length, brk = j => 7.5 + (j / n) * .9;
  if (t > 4.5) {
    CHUNKS.forEach((ch, j) => {
      const tf = 4.6 + ch.st * .9, u = ease(seg(t, tf, tf + .8)), ba = 1 - seg(t, brk(j), brk(j) + .3);
      if (ba <= 0) return;
      const d = Math.hypot(ch.cx, ch.cy) || 1;
      const sx = cx + K * (ch.cx + ch.s * sep + ch.cx / d * 7), sy = cy - K * (TB.y + TB.h / 2) + K * (ch.cy + ch.cy / d * 7);
      const jig = Math.sin(gt * 2 + j) * 1.2 * soft;
      const [hx, hy] = tubePt(((j % 4) - 1.5) * 6.5 + jig, 2 + Math.floor(j / 4) * 7 + Math.cos(gt * 1.7 + j) * soft);
      const x = lerp(sx, hx, u), y = lerp(sy, hy, u) - Math.sin(u * Math.PI) * 50, sc = lerp(K, .3, u) * (1 - .25 * soft) * lerp(1, .5, 1 - ba);
      ctx.save(); ctx.globalAlpha *= ba; ctx.translate(x, y); ctx.scale(sc, sc);
      const cw = ch.x1 - ch.x0, chh = ch.y1 - ch.y0;
      ctx.beginPath(); rr(-cw / 2, -chh / 2, cw, chh, lerp(3, Math.min(cw, chh) / 2, soft)); ctx.save(); ctx.clip();
      ctx.beginPath(); ctx.translate(-ch.cx, -ch.cy); hemiPath(ctx, ch.s); if (soft < .6) ctx.clip();
      tex(ctx); ctx.fillStyle = rgb(tint, .45 + .3 * u); ctx.fillRect(TB.x, TB.y, TB.w, TB.h); ctx.restore();
      if (u > 0) { ctx.beginPath(); rr(-cw / 2, -chh / 2, cw, chh, lerp(3, Math.min(cw, chh) / 2, soft)); ctx.strokeStyle = fg(.45 * u); ctx.lineWidth = 1.4 / sc; ctx.stroke(); }
      ctx.restore();
    });
  }
  // --- trituration pipette
  const pIn = seg(t, 7.0, 7.4), pOut = seg(t, 8.4, 8.8);
  if (pIn > 0 && pOut < 1) {
    const u = seg(t, 7.4, 8.4), stroke = .5 - .5 * Math.cos(u * TAU * 3);
    const tipY = lerp(TUBE.y - 260, TUBE.y + 70, eOut(pIn)) - stroke * 60 - eOut(pOut) * 420;
    drawPipette(TUBE.x + 6, tipY, .3 + .5 * stroke * (u > 0 && u < 1 ? 1 : 0), liqC([60, 80, 96]), null, 1 - pOut, 0);
  }
  // --- single cells: appear as the chunks break, mill about in the tube, then pour into suspension
  SUS.forEach((c, i) => {
    const j = i % n, a0 = seg(t, brk(j) + .1, brk(j) + .5); if (a0 <= 0) return;
    const ch = CHUNKS[j], home = TUBE_HOME[i];
    const [bx, by] = tubePt(((j % 4) - 1.5) * 6.5, 2 + Math.floor(j / 4) * 7), [hx, hy] = tubePt(home[0] + Math.sin(gt * .9 + c.ph) * 1.2, home[1] + Math.cos(gt * .7 + c.ph) * 1.2);
    const m = ease(seg(t, brk(j) + .1, brk(j) + .8));
    let x = lerp(bx, hx, m), y = lerp(by, hy, m), s = .5;
    const st = hash(i * 1.37), u = ease(seg(t, 8.9 + st * .5, 9.7 + st * .5));
    if (u > 0) {                       // pour: tube mouth → place in the suspension cloud
      const mx = TUBE.x, my = TUBE.y - 200;
      x = (1 - u) * (1 - u) * x + 2 * (1 - u) * u * mx + u * u * c.cx; y = (1 - u) * (1 - u) * y + 2 * (1 - u) * u * my + u * u * c.cy; s = lerp(.5, 1.4, u);
    }
    if (u > .99) { x += Math.sin(gt * 1.2 + c.ph) * 3 * u; y += Math.cos(gt + c.ph) * 3 * u; }
    c.rd.draw(ctx, x, y, gt, { a: a0, s });
  });
  // --- process strip
  const stripA = seg(t, 1.8, 2.4) * (1 - seg(t, 9.4, 10.0));
  if (stripA > 0) {
    const starts = [2.0, 3.1, 5.6, 7.0, 8.9];
    ctx.font = `500 18px ${FONT}`;
    const ws = STAGES.map(s => ctx.measureText(s).width), gap = 54, tot = ws.reduce((a, b) => a + b, 0) + gap * (STAGES.length - 1);
    let x = W / 2 - tot / 2;
    STAGES.forEach((s, i) => {
      const on = seg(t, starts[i], starts[i] + .4), cur = on * (1 - (i < 4 ? seg(t, starts[i + 1], starts[i + 1] + .4) : 0));
      txt(s, x, 958, { a: stripA * (.28 + .72 * on), size: 18, w: cur > .5 ? 600 : 500, col: cur > .5 ? COL.text : COL.dim });
      if (i < STAGES.length - 1) txt('→', x + ws[i] + gap / 2, 958, { a: stripA * .4, size: 18, align: 'center', col: COL.dim });
      x += ws[i] + gap;
    });
  }
  typeLegend(960, 880, seg(t, 9.6, 10.3));
}
// T = seconds since the suspension started moving to the first plate
function panning(T, gt) {
  const t4 = T - TNEG;                  // time into the positive-selection beat
  const bA = seg(T, .6, 1.4);
  const posA = lerp(.45, 1, seg(T, PA0 + 5 * PD - .6, PA0 + 5 * PD));
  bracket(PLATES[0].x - PR, PLATES[4].x + PR, 318, 'NEGATIVE SELECTION  ·  removed', bA, UI.bracket);
  bracket(PLATES[5].x - PR, PLATES[5].x + PR, 318, 'POSITIVE  ·  kept', bA * posA, COL.teal);
  PLATES.forEach((p, i) => {
    const act = i === 5 ? (T > PA0 + 5 * PD - .3 ? 1 : 0) : bump(T, PA0 + i * PD - .3, PA0 + i * PD + .1, PA0 + i * PD + 1.4, PA0 + i * PD + 2);
    drawPlate(p.x, PY, PR, { kind: p.kind, pos: p.pos, hl: act * .9, a: bA });
    txt(p.lab, p.x, PY - PR - 26, { a: bA, size: 20, w: 600, align: 'center', col: p.pos ? COL.teal : COL.text });
    p.rem.forEach((l, j) => txt(l, p.x, PY + PR + 34 + j * 21, { a: bA * .95, size: 16, align: 'center', col: p.pos ? COL.teal : COL.dim }));
    if (i < 5) chevron((p.x + PLATES[i + 1].x) / 2, PY, bA * .5);
  });
  chevron(210, PY, bA * .5);
  // cells
  let wsum = {}, tot = 0; TYPES.forEach(ty => wsum[ty] = 0);
  for (const c of SUS) {
    const q = susPos(c, T);
    c.rd.draw(ctx, q.x, q.y, gt, { b: q.b, a: q.a, s: lerp(1.4, 1.1, ease(seg(T, 0, 1.6))) });
    const w = (1 - q.b) * (c.cap === -1 && T > PA0 + 5 * PD + 1.6 ? 0 : 1);
    wsum[c.type] += w; tot += w;
  }
  // flow-through
  const fa = seg(t4, 2.6, 3.4) * (1 - seg(t4, 5.5, 6.2));
  txt('flow-through', 1830, PY - 60, { a: fa, size: 16, it: true, align: 'center', col: COL.dim });
  chevron(1800, PY, fa * .6); chevron(1830, PY, fa * .4);
  // composition bar: what is still in suspension → what the positive plate caught
  compBar(560, 830, 800, 18, wsum, tot, 'cells still in suspension', seg(T, 1, 1.8) * (1 - seg(t4, 3.2, 4)));
  const pa = seg(t4, 3.6, 4.4), fillU = ease(seg(t4, 3.8, 5.6));
  const ws = { astro: 99.3 * fillU, micro: .25 * fillU, oligo: .25 * fillU, neuron: .2 * fillU, endo: 0 };
  compBar(560, 830, 800, 18, ws, 100, 'bound to the anti-ITGB5 plate', pa, true);
  txt('> 99% astrocytes', 960, 900, { a: seg(t4, 5.2, 5.9), size: 34, w: 600, align: 'center', col: COL.teal });
  typeLegend(960, lerp(880, 975, ease(seg(T, 0, .9))), 1);
}
// step k = 1: same trick → three pure cultures
function threeCultures(t, gt, S) {
  const T = TNEG + 7;
  const fo = 1 - seg(t, 0, .7);
  if (fo > 0) {
    ctx.save(); ctx.globalAlpha *= fo;
    PLATES.slice(0, 5).forEach(p => drawPlate(p.x, PY, PR, { kind: p.kind }));
    for (const c of SUS) if (c.cap >= 0 && c.cap < 5) { const q = susPos(c, T); c.rd.draw(ctx, q.x, q.y, gt, { b: 1, s: 1.1 }); }
    typeLegend(960, 975, 1);
    ctx.restore();
  }
  const g = ease(seg(t, .5, 2.0));      // plate → culture dish
  const dishes = [
    { key: 'M', from: [360, 520, 70], lab: 'anti-CD45', src: 'cortex', name: 'Microglia', cells: MIC, rt: 'micro', pur: '' },
    { key: 'A', from: [PLATES[5].x, PY, PR], lab: 'anti-ITGB5', src: 'cortex', name: 'Astrocytes', cells: AST, rt: 'astro', pur: ' · >99%' },
    { key: 'N', from: [1560, 520, 70], lab: 'RGC panning', sub: 'P5 rat retina · sequential panning', src: 'P5 rat retina', name: 'Retinal ganglion cells', cells: RGC, rt: 'neuron', pur: ' · >99%' },
  ];
  const spr = ease(seg(t, 2.0, 5.5));
  dishes.forEach((d, i) => {
    const appear = i === 1 ? 1 : seg(t, .4, 1.1);
    const x = lerp(d.from[0], DX[d.key], g), y = lerp(d.from[1], DY, g), r = lerp(d.from[2], DR, g);
    drawDish(x, y, r, { a: appear });
    ctx.save(); ctx.globalAlpha *= appear; clipCircle(x, y, r - 4);
    // captured round cells → spreading cultured cells
    const ra = 1 - seg(t, 1.6, 2.6);
    if (ra > 0) {
      if (i === 1) { for (const c of SUS) if (c.cap === 5) { const q = susPos(c, T); c.rd.draw(ctx, x + (q.x - d.from[0]) * r / d.from[2], y + (q.y - d.from[1]) * r / d.from[2], gt, { b: 1, a: ra, s: lerp(1.1, 1.5, g) }); } }
      else { const R = rng(i * 77); for (let j = 0; j < 12; j++) { const a2 = R() * TAU, rr2 = Math.sqrt(R()) * .78; LEG_RD[d.rt].draw(ctx, x + Math.cos(a2) * rr2 * r, y + Math.sin(a2) * rr2 * r, gt, { b: 1, a: ra, s: lerp(1, 1.5, g) }); } }
    }
    const ca = seg(t, 1.5, 2.4);
    if (ca > 0) { ctx.translate(x, y); ctx.scale(r / DR, r / DR); d.cells.forEach(c => c.draw(ctx, { t: gt, sprout: spr, a: ca })); }
    ctx.restore();
    drawDishRim(x, y, r, { a: appear });
    txt(d.lab, x, y - r - 22, { a: appear * (1 - seg(t, 1.8, 2.4)), size: 18, w: 600, align: 'center', col: i === 1 ? COL.teal : COL.text });
    txt(d.name, DX[d.key], DY + DR + 42, { a: seg(t, 2.2, 3), size: 24, w: 600, align: 'center' });
    txt((d.sub || `${d.src} · ${d.lab} panning`) + d.pur, DX[d.key], DY + DR + 70, { a: seg(t, 2.6, 3.4), size: 17, align: 'center', col: COL.dim });
  });
  vignette();
  caption(S.cap, seg(t, 2.4, 3.2)); subcap(S.sub, seg(t, 2.8, 3.6));
}
function bracket(x0, x1, y, label, a, col) {
  if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = rgb(col, .55); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(x0, y + 10); ctx.lineTo(x0, y); ctx.lineTo(x1, y); ctx.lineTo(x1, y + 10); ctx.stroke(); ctx.restore();
  txt(label, (x0 + x1) / 2, y - 12, { a, size: 14, w: 600, ls: 2.5, align: 'center', col });
}
function chevron(x, y, a) { if (a <= .004) return; ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = fg(.9); ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - 5, y - 9); ctx.lineTo(x + 5, y); ctx.lineTo(x - 5, y + 9); ctx.stroke(); ctx.restore(); }
function compBar(x, y, w, h, ws, tot, label, a, final) {
  if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a;
  rr(x, y, w, h, h / 2); ctx.fillStyle = fg(.06); ctx.fill();
  ctx.save(); rr(x, y, w, h, h / 2); ctx.clip();
  let cx = x;
  for (const ty of TYPES) { const ww = tot > 0 ? w * ws[ty] / tot : 0; if (ww <= 0) continue; ctx.fillStyle = rgb(ty === 'astro' ? TP.astro.rim : mix(TP[ty].rim, [0, 0, 0], .15)); ctx.fillRect(cx, y, ww, h); cx += ww; }
  ctx.restore(); ctx.restore();
  txt(label, x, y - 12, { a, size: 15, ls: 1, col: COL.dim });
}
