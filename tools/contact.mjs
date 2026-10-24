// Contact sheet for declutter review.
//   node contact.mjs [--theme light|dark] [--steps 3,7-9]
// For every step renders the midpoint of its busiest beat (STEPS[k].busy) and its final frame
// (STEPS[k].dur) through window.__seek, then writes
//   out/contact/step-XX.png   busy | final, side by side
//   out/contact/sheet.png     all steps in one grid
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'out', 'contact');
const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : def; };
const parseSteps = (spec, n) => {
  if (!spec) return [...Array(n).keys()];
  const ks = [];
  for (const part of spec.split(',')) { const [a, b] = part.split('-').map(Number); for (let k = a; k <= (b ?? a); k++) ks.push(k - 1); }
  return ks.filter(k => k >= 0 && k < n);
};

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', e => console.error('page error:', e.message));
await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href + '?render=1');
await page.waitForFunction(() => window.__anim);
await page.evaluate(m => window.__anim.setTheme(m), arg('theme', 'light'));
const steps = await page.evaluate(() => window.__anim.steps());
const ks = parseSteps(arg('steps'), steps.length);

// renders step k at time t the way it plays after step k-1 has run its full dur
const grab = (k, t) => page.evaluate(([k, t]) => {
  const S = window.__anim.steps(), prev = k - 1;
  window.__seek(k, t, window.__anim.gtBase(k) + t, prev, prev >= 0 ? S[prev].dur : 0);
  const c = document.createElement('canvas'); c.width = 1920; c.height = 1080;
  c.getContext('2d').drawImage(document.getElementById('c'), 0, 0, 1920, 1080);
  return c.toDataURL('image/png');
}, [k, t]);

const tiles = [];
for (const k of ks) {
  const s = steps[k];
  const busy = await grab(k, s.busy), fin = await grab(k, s.dur);
  tiles.push({ k, slug: s.slug, busyT: s.busy, dur: s.dur, busy, fin });
  const png = await page.evaluate(async ([busy, fin, label]) => {
    const load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
    const [a, b] = await Promise.all([load(busy), load(fin)]);
    const c = document.createElement('canvas'); c.width = 1920; c.height = 600; const x = c.getContext('2d');
    x.fillStyle = '#888'; x.fillRect(0, 0, 1920, 600);
    x.drawImage(a, 0, 50, 956, 538); x.drawImage(b, 964, 50, 956, 538);
    x.fillStyle = '#fff'; x.font = '600 26px Helvetica, Arial'; x.fillText(label[0], 12, 34); x.fillText(label[1], 976, 34);
    return c.toDataURL('image/png');
  }, [busy, fin, [`${String(k + 1).padStart(2, '0')} ${s.slug} · busy t=${s.busy}s`, `final t=${s.dur}s`]]);
  fs.writeFileSync(path.join(OUT, `step-${String(k + 1).padStart(2, '0')}.png`), Buffer.from(png.split(',')[1], 'base64'));
  console.log(`step ${k + 1} ${s.slug}`);
}

// grid: 3 steps per row, each step = busy + final thumbnails
const sheet = await page.evaluate(async tiles => {
  const load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const TW = 480, TH = 270, G = 8, LH = 30, cols = 3, rows = Math.ceil(tiles.length / cols);
  const c = document.createElement('canvas'); c.width = cols * (2 * TW + 3 * G); c.height = rows * (TH + LH + G) + G;
  const x = c.getContext('2d'); x.fillStyle = '#777'; x.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < tiles.length; i++) {
    const T = tiles[i], cx = (i % cols) * (2 * TW + 3 * G) + G, cy = Math.floor(i / cols) * (TH + LH + G) + G;
    const [a, b] = await Promise.all([load(T.busy), load(T.fin)]);
    x.drawImage(a, cx, cy + LH, TW, TH); x.drawImage(b, cx + TW + G, cy + LH, TW, TH);
    x.fillStyle = '#fff'; x.font = '600 18px Helvetica, Arial';
    x.fillText(`${String(T.k + 1).padStart(2, '0')} ${T.slug}   busy ${T.busyT}s | final ${T.dur}s`, cx, cy + 21);
  }
  return c.toDataURL('image/png');
}, tiles);
fs.writeFileSync(path.join(OUT, 'sheet.png'), Buffer.from(sheet.split(',')[1], 'base64'));
console.log('wrote', path.relative(ROOT, OUT));
await browser.close();
