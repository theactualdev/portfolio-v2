"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { surfaceDriver, REST_AMP, onAmpRelease } from "@/components/surface/surfaceDriver";

/**
 * Maps scroll velocity to surface turbulence: the sea churns while you travel
 * and settles when you rest.
 *
 * Reads Lenis's velocity when smooth scroll is active, and falls back to a
 * decaying scroll-delta estimate when it is not (touch, or reduced motion —
 * where the surface pins amplitude anyway, making this a no-op).
 *
 * Does not touch amplitude until the ceremony hands it over (see
 * surfaceDriver's releaseAmp). Running from hydration meant this lerp raced the
 * lazy WebGL chunk and won — the field was already at rest before there was a
 * canvas to watch it wake on.
 */
export default function ScrollTurbulence() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let running = false;
    let released = false;

    let lastY = window.scrollY;
    let fallbackVel = 0;
    const onScroll = () => {
      fallbackVel = window.scrollY - lastY;
      lastY = window.scrollY;
    };
    const tick = () => {
      const v = window.__lenis
        ? (window.__lenis as unknown as { velocity: number }).velocity
        : fallbackVel;
      fallbackVel *= 0.8; // decay the estimate between scroll events
      const target = Math.min(1, REST_AMP + Math.abs(v) * 0.012);
      // Ease toward the target so churn builds and settles rather than snapping.
      surfaceDriver.amp += (target - surfaceDriver.amp) * 0.08;
    };
    const start = () => {
      if (running) return;
      running = true;
      lastY = window.scrollY;
      fallbackVel = 0;
      window.addEventListener("scroll", onScroll, { passive: true });
      gsap.ticker.add(tick);
    };

    const stop = () => {
      if (!running) return;
      running = false;
      gsap.ticker.remove(tick);
      window.removeEventListener("scroll", onScroll);
    };

    // Only act once the ceremony has released amplitude; a preference change
    // before that just updates intent, it does not start the ticker early.
    const sync = () => {
      if (!released) return;
      if (mq.matches) stop();
      else start();
    };

    const cancel = onAmpRelease(() => {
      released = true;
      sync();
    });
    mq.addEventListener("change", sync);

    return () => {
      cancel();
      mq.removeEventListener("change", sync);
      stop();
    };
  }, []);

  return null;
}
