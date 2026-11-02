# astrocyte_anim

Animated walkthrough of the methods in Liddelow et al., 2017 (Nature 541:481): tissue, immunopanning, serum-free culture, the microglia to astrocyte to RGC relay, and the Fig. 1a readout.

## Controls

Arrow keys or space to step through, `P` to pause, `R` to replay a step, `L` for light/dark, `F` for fullscreen. Toolbar at the bottom does the same.

## Structure

- `js/core/` is where the cells, molecules and lab equipment are built
- `js/scenes/` is the animation itself, one file per stage of the methods
- `js/app.js` lists the 15 steps with their captions and citations
- `tools/` renders the animation frame by frame and stitches the frames into the video clips used in the slides

## Animation

Nothing is keyframed. Every frame is drawn from scratch based on how many seconds into the step you are, so pausing or scrubbing just redraws at a different time. Most of the timing comes from `seg(t, a, b)`, which turns a time window into a 0 to 1 value that then drives movement, fading or how reactive a cell is.

## Making the video clips

You need Node and ffmpeg for this part

```
cd tools
npm install
npx playwright install chromium
node render.mjs
```

Clips end up in `out/video/`. Each one starts on the last frame of the one before it, so they play back to back in the slides w/o a jump
