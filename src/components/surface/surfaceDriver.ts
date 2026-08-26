/**
 * Mutable per-frame channel between page choreography and the WebGL surface.
 * GSAP writes it inside onUpdate callbacks; SurfacePlane reads it in useFrame.
 * Deliberately NOT React state: 60 writes/second must not mean 60 renders.
 */
/**
 * Resting turbulence. Also the point at which the surface's PRESENCE ramp
 * saturates — below this, amplitude fades the field in out of the ground;
 * above it, amplitude only churns. Mirrored as a `const float REST_AMP` in
 * surface.glsl.ts; change both together.
 */
export const REST_AMP = 0.28;

export const surfaceDriver = {
  amp: 0, // turbulence 0..1 — ceremony ramps it to REST_AMP, scroll adds on top
  hue: 0, // warmth 0..1 — the footer finale ramps this
};

/**
 * Who owns `amp` during entry.
 *
 * The ceremony IS the field waking, so nothing else may touch amplitude until
 * it has finished waking it. Without this handover ScrollTurbulence began
 * lerping toward REST_AMP at hydration and won the race against the lazy WebGL
 * chunk: measured, amp reached 0.227 of 0.28 — 81% of the ramp — *before the
 * canvas existed*, so the surface faded in already at rest and the signature
 * gesture never happened anywhere but a fast local desktop.
 *
 * Hero releases when its breath completes, when the visitor skips, or
 * immediately under reduced motion (where there is no breath to protect).
 */
let released = false;
const waiting: Array<() => void> = [];

export const releaseAmp = () => {
  if (released) return;
  released = true;
  while (waiting.length) waiting.shift()!();
};

/**
 * The surface has painted its FIRST frame.
 *
 * Distinct from the canvas element existing. R3F inserts <canvas> at its
 * default 300x150 long before it is sized or drawn — measured, the element
 * appeared at 833ms while the field did not paint until ~2929ms. Waiting on
 * the element meant the ceremony's whole 1.1s breath ran and finished before
 * there was anything on screen to watch it, which is the defect this signal
 * exists to prevent. SurfacePlane calls markSurfaceLive on its first frame.
 */
let surfaceLive = false;
const surfaceWaiting: Array<() => void> = [];

export const markSurfaceLive = () => {
  if (surfaceLive) return;
  surfaceLive = true;
  while (surfaceWaiting.length) surfaceWaiting.shift()!();
};

/** Runs `fn` once the surface has actually painted. Returns a canceller. */
export const onSurfaceLive = (fn: () => void) => {
  if (surfaceLive) {
    fn();
    return () => {};
  }
  surfaceWaiting.push(fn);
  return () => {
    const i = surfaceWaiting.indexOf(fn);
    if (i >= 0) surfaceWaiting.splice(i, 1);
  };
};

/** Runs `fn` once the ceremony has handed amplitude over. Returns a canceller. */
export const onAmpRelease = (fn: () => void) => {
  if (released) {
    fn();
    return () => {};
  }
  waiting.push(fn);
  return () => {
    const i = waiting.indexOf(fn);
    if (i >= 0) waiting.splice(i, 1);
  };
};
