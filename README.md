# astrocyte_anim

Canvas animation walking through the methods of Liddelow et al., 2017 (Nature 541:481) —
tissue → immunopanning → serum-free culture → the microglia/astrocyte/RGC relay → readout.

No build step. `index.html` loads the modules below as plain `<script>` tags, in order,
sharing one global scope (no bundler needed — works straight from `file://` or GitHub Pages).

## Structure

```
index.html            viewer shell + control bar markup
css/viewer.css         control bar / layout styling
js/
  core/                shared engine, no scene-specific logic
    math.js            rng, lerp/ease/seg helpers, colour mixing
    theme.js            palette, light/dark THEME toggle, text helpers
    arbor.js            procedural branch/process geometry (Br class, evalBr, addStrand)
    builders.js         per-cell-type process layouts (buildAstro/Micro/Neuron)
    cell.js             Cell class — draws one animated cell
    round.js             Round class — dissociated (pre-culture) cells
    glyphs.js            molecule glyphs (IL-1α, TNF, C1q, LPS, antibody, …)
    fields.js            drifting particle fields of glyphs
    hardware.js          dishes, pipettes, tubes, clocks, hop arcs
  scenes/
    actors.js            cell instances shared by scenes 2 & 4
    scene1.js            tissue + the Scene1→2 tissue hand-off
    scene2.js             immunopanning
    scene3.js             serum-free culture
    scene4.js             the microglia/astrocyte/RGC relay
    scene5.js             heatmap readout
  app.js                 canvas setup, STEPS list, render loop, playback/scrub state
  controls.js            wires the on-screen control bar to app.js
tools/                 offline renderers (Playwright + ffmpeg); the viewer itself needs none of this
  contact.mjs          contact sheet: busiest beat + final frame per step → out/contact/
  render.mjs           one H.264 clip per step + held last frame → out/video/
```

## Editing

Each scene file only touches its own step range in `STEPS` (see `js/app.js`). To change
what a step looks like or how long a beat takes, edit the `seg(t, a, b)` / `bump(...)`
calls inside that scene's function — `t` is seconds since the step started.

On-screen copy (caption, optional sub-caption, end caption) lives on each `STEPS` entry in
`js/app.js` and mirrors `SCRIPT.md`. Keep on-screen text free of em dashes and double hyphens.

Each `STEPS` entry also has `dur` (seconds until the step has settled, + 0.5 s; one video clip)
and `busy` (a crowded moment, used by the contact sheet). If you retime a step, update `dur`.

## Rendering clips for slides

```
cd tools && npm install && npx playwright install chromium   # once
node render.mjs                        # every step with a clip, light theme, 30 fps
node render.mjs --steps 3,7-9 --theme dark --fps 60 --jobs 3 --out out/clips
node contact.mjs                       # out/contact/sheet.png for layout review
```

Clips are a horizontal band of the 1920×1080 stage (`CROP` in `js/app.js`: 1920×768, trimmed
top and bottom). Titles, sub-captions and the footer citation are hidden (`?render=1`), since
they are set on the slide. Step 1 is a still (`video: false`); step 2's clip opens already
blurred (`t0`).

Frames are rendered deterministically through `window.__seek(k, t, gt, prevStep, prevT)` with
`gt = gtBase(k) + t`. Every clip opens on the previous clip's last frame (`render()` dissolves
from it; `joins` / `morph` steps carry it in their own code), so clips butt together without a
jump. Requires `ffmpeg` on PATH.

## Controls

Keyboard: `→`/space/PgDn next, `←`/PgUp back, `P` play/pause, `R` replay step,
`L` light/dark (light is the default), `F` fullscreen. The on-screen bar exposes the same
via mouse/touch, plus a scrub bar for stepping through a single beat frame-by-frame.

## Viewing

Open `index.html` directly, or serve the folder (e.g. `python3 -m http.server`) and visit
it in a browser. Same for GitHub Pages — no build step required.
