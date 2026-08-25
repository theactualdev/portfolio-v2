"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion/tokens";
import { surfaceDriver, REST_AMP } from "@/components/surface/surfaceDriver";

/**
 * Maps scroll velocity to surface turbulence: the sea churns while you travel
 * and settles when you rest.
 *
 * Reads Lenis's velocity when smooth scroll is active, and falls back to a
 * decaying scroll-delta estimate when it is not (touch, or reduced motion —
 * where the surface pins amplitude anyway, making this a no-op).
 *
 * Coexists with the hero ceremony, which also writes surfaceDriver.amp for its
 * first ~1.1s: the lerp below eases toward its target from whatever value the
 * ceremony left, so the two never fight. Scrolling also skips the ceremony,
 * which resolves the overlap by design.
 */
export default function ScrollTurbulence() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    let lastY = window.scrollY;
    let fallbackVel = 0;
    const onScroll = () => {
      fallbackVel = window.scrollY - lastY;
      lastY = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const tick = () => {
      const v = window.__lenis
        ? (window.__lenis as unknown as { velocity: number }).velocity
        : fallbackVel;
      fallbackVel *= 0.8; // decay the estimate between scroll events
      const target = Math.min(1, REST_AMP + Math.abs(v) * 0.012);
      // Ease toward the target so churn builds and settles rather than snapping.
      surfaceDriver.amp += (target - surfaceDriver.amp) * 0.08;
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
