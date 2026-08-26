/**
 * Mutable per-frame channel between page choreography and the WebGL surface.
 * GSAP writes it inside onUpdate callbacks; SurfacePlane reads it in useFrame.
 * Deliberately NOT React state: 60 writes/second must not mean 60 renders.
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
