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
