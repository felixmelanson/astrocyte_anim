'use strict';
/* ---------------- Culture cells (shared by Scenes 2 & 4) ---------------- */
const DR = 200, DY = 440, DX = { M: 360, A: 960, N: 1560 };
const MIC = [[-95, -70], [30, -118], [118, -40], [-18, 10], [-120, 60], [70, 95], [-25, 130]].map((p, i) => new Cell('micro', p[0], p[1], 300 + i * 11, 1.05, { len: 17, drift: 6 }));
const AST = [[-78, -66], [84, -74], [-72, 84], [92, 78]].map((p, i) => new Cell('astro', p[0], p[1], 410 + i * 23, .98, { drift: 9 }));
const RGC = [[-92, -86, .9], [88, -104, 2.2], [-98, 76, -.7], [96, 64, 3.6], [0, -8, 1.4]].map((p, i) => new Cell('neuron', p[0], p[1], 520 + i * 7, .9, { axAng: p[2], axLen: 175, drift: 2 }));
