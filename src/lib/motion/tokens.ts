/** motion-language v0 vocabulary. Change ONLY together with the skill file. */
export const EASE = { enter: "expo.out", move: "power2.inOut", exit: "power2.in" } as const;
export const DUR = { xs: 0.2, s: 0.4, m: 0.7, l: 1.1 } as const;
export const STAGGER = 0.06;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
