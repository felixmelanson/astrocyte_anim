// Deterministic per-step video export.
//   node render.mjs [--theme light|dark] [--steps 3,7-9] [--fps 30|60] [--jobs 3] [--out out/video]
// Each step k is rendered frame by frame through window.__seek(k, t, gt, prevStep, prevT) with
//   t  = frame / fps                      (0 … STEPS[k].dur)
//   gt = gtBase(k) + t                    (idle drift continues exactly from the previous clip's end)
//   prevStep = k - 1, prevT = STEPS[k-1].dur   (so the scene-1 → 2 hand-off and scene fades play as live)
// at 1920×1080 with HUD, controls, titles and footer hidden, cropped to the horizontal band CROP (app.js:
// 1920 wide, titles trimmed top and bottom), piped as PNG into ffmpeg (H.264, yuv420p, CRF 18).
// A clip runs from STEPS[k].t0 (default 0) to STEPS[k].dur; its first frame is the previous clip's last frame.
// Steps with video:false (step 1, a still) are skipped unless named in --steps.
// Writes <out>/step-XX-<slug>.mp4 and <out>/step-XX-<slug>-last.png (the held frame).
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : def; };
const OUT = path.resolve(ROOT, arg('out', path.join('out', 'video')));
const theme = arg('theme', 'light'), fps = Number(arg('fps', 30)), jobs = Math.max(1, Number(arg('jobs', 3)));
if (!['light', 'dark'].includes(theme)) throw new Error('--theme must be light or dark');
const parseSteps = (spec, n, all) => {
  if (!spec) return all;
  const ks = [];
  for (const part of spec.split(',')) { const [a, b] = part.split('-').map(Number); for (let k = a; k <= (b ?? a); k++) ks.push(k - 1); }
  return ks.filter(k => k >= 0 && k < n);
};

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const url = pathToFileURL(path.join(ROOT, 'index.html')).href + '?render=1';

async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.__anim);
await page.evaluate(() => window.__anim.ready);
  await page.evaluate(m => window.__anim.setTheme(m), theme);
  return page;
}

const probe = await openPage();
const steps = await probe.evaluate(() => window.__anim.steps());
await probe.close();
const queue = parseSteps(arg('steps'), steps.length, steps.filter(s => s.video).map(s => s.i));

async function renderStep(page, k) {
  const s = steps[k], name = `step-${String(k + 1).padStart(2, '0')}-${s.slug}`;
  const n = Math.round((s.dur - s.t0) * fps);              // frames 0 … n, last one at t = dur
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'veryfast', '-movflags', '+faststart', '-r', String(fps),
    path.join(OUT, name + '.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error(`ffmpeg exited ${c} on ${name}`))));
  const t0 = Date.now();
  let last = null;
  for (let i = 0; i <= n; i++) {
    const t = i === n ? s.dur : s.t0 + i / fps;
    const b64 = await page.evaluate(([k, t]) => {
      const S = window.__anim.steps(), prev = k - 1, { y, h } = window.__anim.crop;
      window.__seek(k, t, window.__anim.gtBase(k) + t, prev, prev >= 0 ? S[prev].dur : 0);
      const c = document.createElement('canvas'); c.width = 1920; c.height = h;
      c.getContext('2d').drawImage(document.getElementById('c'), 0, y, 1920, h, 0, 0, 1920, h);
      return c.toDataURL('image/png').slice(22);
    }, [k, t]);
    const buf = Buffer.from(b64, 'base64'); last = buf;
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await done;
  fs.writeFileSync(path.join(OUT, name + '-last.png'), last);
  console.log(`${name}.mp4  ${(s.dur - s.t0).toFixed(1)}s  ${n + 1} frames  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}

await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => {
  const page = await openPage();
  while (queue.length) await renderStep(page, queue.shift());
  await page.close();
}));
await browser.close();
console.log(`theme ${theme}, ${fps} fps → ${path.relative(ROOT, OUT)}`);
