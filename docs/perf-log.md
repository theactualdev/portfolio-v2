# Performance log

Every number here was measured, not estimated. Re-measure rather than trusting
a row that has gone stale — the harness notes at the bottom exist because
several of these numbers were wrong the first time.

## 2026-08-26 — Phase 2, Task 10

Measured against `next start` on :3011 (production build) for weight and LCP,
and the dev server on :3010 for the frame probes. Real GPU, Chrome via
`puppeteer-core`, plain `--no-sandbox`.

### First-load weight for `/`

Turbopack no longer prints "First Load JS", so this is derived from the
scripts the served HTML actually references, gzipped from `.next/static`.

| | gz | gate |
|---|---|---|
| JS (9 chunks) | **224.1 KB** | ≤ 300 KB ✅ |
| CSS | 4.8 KB | — |
| Fonts preloaded | 44.9 KB | — |
| **Total first load** | **273.8 KB** | — |

`three` is **absent** from every first-load chunk (grepped for
`THREE.WebGLRenderer` / `three.module`). It ships in a **230.6 KB gz** async
chunk fetched only when `SurfaceLazy` mounts.

Largest first-load chunks: 69.9 KB, 43.1 KB, 43.0 KB, 38.7 KB.

### Fonts

- Both General Sans faces served from `/_next/static/media/*.woff2`.
- `font-display: swap` on every self-hosted face.
- **Zero** requests to fontshare / googleapis / gstatic — verified by
  intercepting every request on a production page load.
- Archivo is `preload: false`: it is fetched when the display face is first
  used, not on the critical path. It was preloading 90 KB for a face nothing
  rendered, measured at 2.5 s on the wire under Fast 3G.

### Frame budget

`node scripts/qa/perf-probe.js`

| run | fps | median gap | p95 gap | max gap |
|---|---|---|---|---|
| desktop, 1× CPU, 1600×1000 | **60.1** | 16.7 ms | **16.8 ms** | 17.0 ms |
| mobile, 4× CPU, 390×844, touch | **60.1** | 16.7 ms | **16.8 ms** | 17.1 ms |

Phase 1 recorded desktop 60.1 fps / p95 16.9 ms and mobile 59.4 fps / p95
16.8 ms, against a blank-page baseline of p95 16.80 ms. The gate was ±2 ms
p95; both runs land within 0.1 ms of Phase 1 **with the full page, four
ScrollTriggers and the meander on top of the surface**.

### Mobile re-measurement, 2026-08-26 late — NOT TRUSTWORTHY, re-do it

After the final-review fixes the mobile probe was re-run and gave **36.7,
47.4 and 56.3 fps** across three runs, with p95 swinging 50.1 → 49.9 →
17.1 ms. Do not read that as a regression, and do not read the good run as a
pass. The machine had **1.0–1.3 GB of 7.8 GB free** with 15 of the owner's
Chrome processes open, and the numbers track that, not the code:

- The **median gap stayed 16.7 ms in every single run**. A genuine per-frame
  regression raises the median. What moved was p95 and max — sporadic long
  frames, which is the signature of CPU/memory contention.
- Neither change in that batch can cost frames in this probe anyway: the probe
  sweeps the **pointer**, never scrolls, so `MeanderLine.paint()` (scroll-only)
  effectively does not run, and the amplitude handover only changes *when*
  ScrollTurbulence's ticker starts, not its per-frame work.
- The dev server also became unusable for throttled runs after a `next build`
  invalidated its cache: under 4× CPU the first compile exceeds the probe's
  30 s navigation timeout. Measure against `next start`, and warm it first.

**Outstanding: mobile frame budget is unverified since the final-review fixes.**
Re-run on an unloaded machine, and treat the Task 11 iPhone pass as the real
verdict — it is ship-blocking for exactly this reason.

An earlier mobile run also showed 57.1 fps with a single 83.3 ms hitch. If a
raised *median* ever appears, profile before shipping — the usual suspect is a
layout read in a scroll handler.

### LCP

4× CPU throttle, production build, 1440×900. Gate: **< 2.5 s**.

| run | FCP | canvas mounts | LCP (hero `h1`) |
|---|---|---|---|
| 1 | 600 ms | 2044 ms | **2064 ms** ✅ |
| 2 | 628 ms | 2174 ms | **2108 ms** ✅ |

This failed at first, at **2828 ms**. The ceremony had been gated on the WebGL
surface being ready — correct for the field's breath, wrong for the type,
because the lazy chunk does not land until ~2.1 s under throttle and the lines
were queued behind it. The ceremony is now two pieces: the veil and the lines
start immediately, and the amplitude ramp starts when the canvas arrives. The
material still breathes in from zero; the text no longer waits for it.

### Entry ceremony duration

Asserted by construction — `window.__qa` exposes no timeline registry read, so
there is nothing to measure at runtime:

```
max(DUR.l, 0.35 + (n-1)*(STAGGER*2) + DUR.m)   n = 5 document-wide [data-line]
max(1.1, 0.35 + 4*0.12 + 0.7) = max(1.1, 1.53) = 1.53 s     gate: ≤ 3 s ✅
```

`n = 5` is 2 header marks + 3 hero lines. It was 6 until the hero's "move your
cursor" nudge was cut, which took 0.12 s off the tail.

The entrance is CSS keyframes starting at parse time, not a GSAP timeline, so
these values live in globals.css and mirror the motion tokens — change them
together. Skip verified on wheel, keydown, pointerdown and a real touch tap.

### Contrast

Measured **against the live field**, not against the flat ground — the text
sits on a moving, warming surface, and checking tokens against `#0a0a0b` is
what let two AA failures through. Worst case per element anywhere on the page
is **4.64:1**; the accent email link is 4.78:1. See the Task 9 commit.

## Harness notes — read before adding a row

- **Never force swiftshader.** `--use-angle=swiftshader` drops this machine to
  **8 rAF/sec** (real GPU: 61). Count rAF for one second before trusting any
  timing number; under ~50/sec, fix the harness first.
- `page.screenshot()` can return a **stale WebGL frame**, `gl.readPixels`
  returns zeros without `preserveDrawingBuffer`, and byte-diffing two
  screenshot PNGs is meaningless — a same-instant control reads ~99%
  "different". Read the surface's state through `window.__qa.driver()`.
- `page.screenshot()` **deadlocks under CPU throttling**; use a CDP screencast.
- Kill a previous `next start` **by port** before re-measuring. A stale server
  against a fresh `.next` serves mismatched chunk hashes and 500s, which looks
  exactly like a broken page.
- `/dev/*` routes `notFound()` in production, so production-build measurements
  taken against them measure nothing.

## 2026-09-04 — the surface leaves three.js

Measured on Playwright WebKit against `next start` on :3021 (production build)
for the rewrite, and against the deployed three/R3F build on
`https://www.olayinka.tech/` for the before column. Pixels decoded with
`sharp`; see the harness note on why PNG bytes are not comparable.

### Why

The surface draws one fullscreen quad with one fragment shader. Its vertex
shader writes clip space directly and never touches a matrix, so three's scene
graph, camera, materials, loaders and math library were all unused. The
complete list of what the component imported was `Canvas`/`useFrame`/
`useThree`, `Vector2`, `MathUtils.lerp`, `ShaderMaterial` (as a type), and
`mesh`/`planeGeometry`/`shaderMaterial`.

That cost a **237 KB gz** chunk which, because it was code-split to keep it off
the critical path, appeared **nowhere in the served HTML** — no `<script>`, no
preload, no `modulepreload`. The browser could not discover it until the main
bundle had downloaded, parsed and executed, so on a cold iPhone load it was
requested at **2333 ms** and the canvas did not exist until **3650 ms**. The
owner measured **3 s** to first field on a real iPhone in a private tab; warm,
the same device was 1 s.

Preloading it was considered first and rejected: Turbopack's manifests do not
name the chunk (it is referenced by none of them, and five separate chunks
contain the shader because each `/dev/*` route bundles its own copy), so a
preload would have meant a post-build script identifying the chunk by grepping
its contents.

### Weight

Whole-page JS, `transferSize` summed on an iPhone 13 profile:

| | JS downloaded |
|---|---|
| deployed, three/R3F | **433 KB** |
| local, raw WebGL | **191 KB** |

`three`, `@react-three/fiber` and `@types/three` are removed from
`package.json`. No dynamic import remains: `SurfaceLazy.tsx` is deleted and
`page.tsx` imports `SurfaceCanvas` statically, so there is no async chunk and
nothing left to preload. `surface.glsl.ts` is **unchanged** — the declarations
three used to inject (`position`, `uv`, precision) are supplied as a prelude at
compile time instead.

### Parity against the three implementation

| check | result |
|---|---|
| field renders with structure | stddev **8.26** (flat fill ≈ 0) |
| DPR capped at 1 | buffer 1200×800 === CSS 1200×800 |
| console errors | none |
| pointer lens responds | opposite corners, MAD **6.14**/255 |
| reduced motion: pointer pinned | MAD **exactly 0** |
| reduced motion: clock frozen | 1.5 s apart, MAD **exactly 0** |
| no-WebGL fallback | gradient shown, canvas absent |
| quality tier, desktop | fine pointer true |
| quality tier, iPhone | fine pointer false |

Side by side, isolated to the canvas:

| build | reduced-motion | mean | stddev | range |
|---|---|---|---|---|
| raw WebGL | no-preference | 13.08 | 8.011 | 8–55 |
| three | no-preference | 13.14 | 8.030 | 8–55 |
| raw WebGL | reduce | 9.12 | **0.626** | 8–10 |
| three | reduce | 9.12 | **0.626** | 8–10 |

Identical to three decimal places under reduced motion, and within
screenshot-timing noise on the live field.

### Found while verifying: the reduced-motion still frame is blank

Both builds render reduced motion as a near-flat fill — stddev **0.626**, all
channels within **8–10 of 255**. Not a regression from the rewrite; it
reproduces exactly on the deployed three build.

The cause is that `uAmp` acquired a second job. The still-frame branch pins
`uAmp = 0` because amplitude used to feed only the domain warp. The presence
ramp (`presence = smoothstep(0.0, REST_AMP, uAmp)`, added so the entry ceremony
wakes the field rather than morphing an already-visible one) made `uAmp = 0`
mean *absent*, and the still branch was never updated. So the "designed still
frame" the comments promise is a blank rectangle for every reduced-motion
visitor.

Fixed in the frozen branch: `uAmp = REST_AMP` rather than 0, so presence
saturates and the resting warp is the approved composition, while every motion
input stays pinned. Measured after:

| build | reduced-motion | mean | stddev | range |
|---|---|---|---|---|
| raw WebGL, fixed | reduce | 13.14 | **8.171** | 8-55 |
| raw WebGL, fixed | no-preference | 13.26 | 8.115 | 8-55 |
| three, deployed | reduce | 9.12 | 0.626 | 8-10 |

The still frame now carries the same structure as the live field, and is still
frozen: pointer moved across the viewport and 1.5 s of clock both give a mean
absolute difference of **exactly 0**.

### Harness note

`page.screenshot()` returning a stale WebGL frame would make a frozen-field
check pass for the wrong reason. The positive control is in the same suite and
the same method: the live pointer-lens check moved **6.14**/255 across the same
two screenshots. A method that captures that is not returning stale frames when
it reports 0.
