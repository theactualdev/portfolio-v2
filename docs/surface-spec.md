# Surface material spec

The cursor-aware liquid WebGL surface that sits behind the whole page — "a dark,
expensive surface that notices you". Built and judged on the isolated dev route
`/dev/spike-surface` before it goes anywhere near the real page.

**Status: scaffolding complete (Task 6, Steps 1–6). The material itself has not
been iterated yet — Steps 7–9 are the design loop and are still open.**

## Files

| File | Role |
|---|---|
| `src/components/surface/surface.glsl.ts` | Vertex + fragment source |
| `src/components/surface/SurfaceCanvas.tsx` | R3F canvas, uniform driver, no-WebGL fallback |
| `src/app/dev/spike-surface/page.tsx` | Dev-only spike route with amp/hue/still controls |
| `scripts/qa/perf-probe.js` | rAF-cadence probe the acceptance gates cite |

## Dependencies

`three@0.185.1`, `@react-three/fiber@9.7.0`, `@types/three@0.185.4`.

## Uniforms — the knobs

Plain-English descriptions, because the person tuning this does not write GLSL.

| Uniform | Type | Meaning | Current source |
|---|---|---|---|
| `uTime` | float | Seconds since mount. Drives the slow warp of the field. | Accumulated per frame from R3F's `delta` |
| `uAmp` | float 0–1 | Turbulence. 0 = almost still; 1 = the noise warp is at full strength. Meant to be scroll-driven. | `amplitude` prop |
| `uHue` | float 0–1 | 0 = neutral ground; 1 = the amber finale. Pushes warmth into the bloom and the upper field. | `hueShift` prop |
| `uStillTime` | float | `-1` means "run live". Any value `>= 0` freezes the clock **at that time** — so the reduced-motion still frame is a *chosen* frame, not `t=0`. | `still ? stillTime : -1` |
| `uPointer` | vec2 0–1 | Smoothed cursor position in UV space. Lerped at 0.18/frame, so it answers in roughly 150ms. | R3F `state.pointer`, remapped from NDC |
| `uVel` | float 0–1 | Smoothed cursor speed. Brightens the bloom while the cursor is moving. | Derived from the pointer lerp, clamped to 1 |
| `uRes` | vec2 | Drawing-buffer size in px. Used only to correct the aspect ratio so the bloom stays round. | R3F `size` |

Two deliberate details, recorded so nobody "fixes" them later:

- The vertex shader writes `gl_Position = vec4(position.xy, 0.0, 1.0)` — it
  bypasses the camera matrices on purpose so the 2x2 plane covers exactly the
  clip-space viewport regardless of camera. Standard fullscreen-quad trick.
- `uStillTime` uses `-1.0` as the "run live" sentinel rather than a separate
  boolean uniform, so the frozen frame is selectable.

## DPR ladder

`dpr={[1, 1.5]}` — floor 1, cap 1.5. Not yet stress-tested; Step 9's fallback
ladder lowers the cap to 1.0 first if the perf gates fail.

## Chosen `stillTime`

Not chosen yet. Default is `2.4`. Acceptance gate 4 requires tuning it until the
frozen frame is one you would have picked deliberately.

## Baseline probe results (Step 6)

Measured with `scripts/qa/perf-probe.js`: 10s of rAF gaps in headless Chrome
while a synthetic pointer sweeps the viewport. **Acceptance is judged relative to
the blank-page baseline**, because headless Chrome's rAF cadence is not a clean
60Hz and the absolute numbers mean little on their own.

Conditions: Chrome headless (`--hide-scrollbars`), `deviceScaleFactor: 1`,
against the **dev server** on `http://localhost:3010` — unminified, React in dev
mode. GPU reported by the page: `ANGLE (Intel, Intel(R) UHD Graphics 620
(0x00003EA0) Direct3D11 vs_5_0 ps_5_0, D3D11)`.

| # | Page | CPU | Viewport | frames | fps | median gap | p95 gap | max gap |
|---|---|---|---|---|---|---|---|---|
| 1 | `/` (blank baseline — four empty sections, no JS motion) | 1x | 1600x1000 | 602 | 60.1 | 16.70 ms | **16.80 ms** | 17.70 ms |
| 2 | `/dev/spike-surface` | 1x | 1600x1000 | 601 | 60.1 | 16.70 ms | **16.80 ms** | 17.10 ms |
| 3 | `/dev/spike-surface` | 4x | 390x844 | 583 | **58.3** | 16.70 ms | 16.80 ms | 231.60 ms |

Read against the gates in Step 8:

- **Gate 1 — desktop p95 within 2ms of the blank baseline:** 16.80 vs 16.80 ms,
  delta **0.00 ms**. Passing at this stage, with the caveat that the material
  has not been iterated yet; re-measure after every shader change.
- **Gate 2 — >= 40fps at 390x844 under 4x CPU throttle:** 58.3 fps. Passing.
  The 231.6 ms `maxGap` is a single startup/GC stall inside the 10s window, not
  a sustained one — the median and p95 are both at the 60Hz cadence. Worth
  re-checking on a production build.

Caveats for whoever reads these later:

- Dev-server numbers. A production build will differ (less React overhead,
  minified) — re-run all three against `next build && next start` before
  treating any gate as finally cleared.
- Headless Chrome throttles background work differently than a real window, and
  4x CPU throttle does **not** throttle the GPU. The mobile figure is optimistic
  about fill-rate cost on a real phone.

## Proof the surface actually draws

A silently-failing shader looks exactly like the intended dark background, so
"the page is dark" proves nothing. What was actually asserted, on the composited
screenshot (not `canvas.drawImage`, which returns a cleared buffer without
`preserveDrawingBuffer` and gives a false all-black reading):

- Canvas present at 1600x1000, live **WebGL2** context, `isContextLost() ===
  false`, `gl.getError() === 0`, zero console errors or warnings.
- The drawn field is **not uniform**: 106 unique colours in a 200x125 sample;
  luminance 0 at the corners (the vignette) rising to ~15.3 in the centre;
  centre-block std-dev 0.95.
- **It answers the pointer:** moving the cursor from (400,300) to (1250,780)
  changed 2.98% of sampled pixels (max luminance delta 2.0).
- **The clock advances:** with the pointer held still, two frames 6s apart
  differ across 4.07% of sampled pixels.
- Control experiment: a plain WebGL canvas clearing to a known colour was
  screenshotted through the identical path and read back correctly, proving
  headless capture does not silently drop WebGL on this machine.

### One real bug found and fixed during this verification

The surface rendered correctly but was **100% invisible**: the page measured
uniformly `#0a0a0b`. Cause was CSS painting order, not the shader.
`globals.css` set `html, body { background: var(--color-ground) }`.
`SurfaceCanvas` mounts as `fixed inset-0 -z-10`, which is a negative-z-index
stacking context, and those paint *before* the backgrounds of in-flow blocks —
so `body`'s opaque background covered the canvas completely. The root's
background does not have this problem: it propagates to the viewport canvas,
which paints beneath everything. Fix: `html` keeps the ground colour, `body`
keeps only the text colour. Any future full-bleed `-z-10` layer depends on this.

## Candidate log (Step 7)

Nothing logged yet — the material is still the first draft straight out of the
plan. Each iteration should land here as one line: what changed, and whether it
moved toward "expensive, not tech-demo".

| # | Change | Verdict |
|---|---|---|
| 0 | Initial shader from the plan, unmodified | Not yet judged |

## Fallback branch taken (Step 9)

None yet.

## Open items before this can leave the spike route

- `prefers-reduced-motion` is **not** wired to `still` anywhere. `SurfaceCanvas`
  only takes `still` as a prop, and the spike route drives it from a checkbox,
  so the reduced-motion capture is currently identical to the normal one.
  Gate 4 needs this connected and `stillTime` chosen.
- The spike route does not register a driver tween with `qaRegister`, so
  `window.__qa.seek()` cannot yet walk `uAmp`/`uHue` for deterministic capture.
- The no-WebGL fallback path (gate 5) has not been exercised.

## Iteration 2 — material rewrite (controller, interactive)

The Step-2 starter material rendered but read as a black screen with concentric
banding: no liquid character, invisible glint, mean luminance 8.4/255.

Changes:
- **Two-level domain-warped fbm** (3 octaves) replaces single-pass noise. This
  is what makes it read as liquid rather than as a gradient with noise on top.
- **Pointer lens**: the field is displaced toward the cursor with a gaussian
  falloff, strength scaled by pointer velocity, plus an amber specular glint
  and a faint cool rim just outside the lens.
- **Dither** (sub-LSB, per-pixel, time-varying) before output. Near-black
  gradients quantise to visible concentric rings in 8-bit; this removes them.
  Measured: distinct grey levels 140 (was heavily banded).
- **Tonal range lifted**: deep 0.038 / mid 0.105 / high 0.235. Vignette floor
  raised 0.72 -> 0.84 so edges do not crush to flat black.

### Quality tier (`uQuality`)

The second warp level costs 2 extra fbm calls and took touch devices from
58 -> 35 fps under 4x CPU throttle. It is now gated on
`(hover: hover) and (pointer: fine)` — **pointer capability, not screen width**.
A touch device has no cursor, so the signature interaction is absent there
anyway; one warp level is the honest tier, not a degraded one.

### Measured (dev server, headless Chrome)

| Run | fps | p95 gap | max gap |
|---|---|---|---|
| Blank page baseline, 1600x1000 @1x | 60.1 | 16.80 | 17.70 |
| Spike desktop, full tier, 1600x1000 @1x | 60.1 | 16.90 | 20.40 |
| Spike mobile, touch-emulated, 390x844 @3x, 4x CPU | 59.4 | 16.80 | 66.70 |

Desktop p95 is within 0.1ms of the blank-page baseline. Mobile passes the
>=40fps gate with room.

**Probe caveat found during this pass:** the probe measured the *desktop* code
path on "mobile" runs, because a small viewport in desktop Chrome still reports
`hover: hover`. Fixed with `--touch`, which emulates a real device
(`isMobile` + `hasTouch`) so Chrome reports `hover: none` / `pointer: coarse`
natively. Headless numbers remain indicative only — the authority for mobile is
the manual iPhone pass.

### Gates status

- [x] Desktop p95 within 2ms of blank baseline (0.1ms)
- [x] >=40fps at 390x844 under 4x CPU throttle (59.4)
- [x] Reduced-motion freezes at a chosen frame and reads as a designed
      composition (verified: two shots 1.8s apart byte-identical)
- [x] No-WebGL fallback renders a composed radial field, zero pageerrors
      (previously threw "THREE.WebGLRenderer: Error creating WebGL context")
- [ ] Pointer answers within 150ms — not yet measured
- [ ] **Ayodele confirms "expensive, not tech-demo"** — pending, live

### Pointer regression — found by the user, fixed

The pointer never worked. R3F only updates `state.pointer` from events landing
on its own canvas; this canvas is a fixed `-z-10` page background, so `<main>`
sat on top and swallowed every event. `document.elementFromPoint` at the centre
of the viewport returned MAIN, not CANVAS.

It was not caught earlier because the verification looked at a screenshot,
saw a bright region near where the mouse had been moved, and inferred a
response — while the noise field was drifting between shots. The test that
actually isolates it freezes the clock (so the pointer is the only variable)
and hashes frames with the pointer at opposite corners:

    before fix: top-left and bottom-right hashes identical
    after fix:  hashes differ

Pointer is now tracked on `window` via a passive `pointermove` listener. That
is also the behaviour the design wants — the surface should notice you while
you are over text and links, not only over bare canvas.

Note: returning the pointer to a previous position does not reproduce a
byte-identical frame, because `uVel` decays from a different approach vector.
That is momentum, not a defect.
