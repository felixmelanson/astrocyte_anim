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
```

## Editing

Each scene file only touches its own step range in `STEPS` (see `js/app.js`). To change
what a step looks like or how long a beat takes, edit the `seg(t, a, b)` / `bump(...)`
calls inside that scene's function — `t` is seconds since the step started.

`TITLE(n)` placeholders mark on-screen text that still needs real copy; the original
wording is kept in a `// was:` comment next to each call site.

## Controls

Keyboard: `→`/space/PgDn next, `←`/PgUp back, `P` play/pause, `R` replay step,
`L` light/dark, `H` hide step dots, `F` fullscreen. The on-screen bar exposes the same
via mouse/touch, plus a scrub bar for stepping through a single beat frame-by-frame.

## Viewing

Open `index.html` directly, or serve the folder (e.g. `python3 -m http.server`) and visit
it in a browser. Same for GitHub Pages — no build step required.
