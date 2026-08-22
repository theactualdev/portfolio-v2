"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Registered at module scope, not inside the effect below.
 *
 * React flushes CHILD effects before ancestor ones, and this provider wraps
 * `{children}` — so registering inside its effect would land *after* a child
 * had already tried to build a ScrollTrigger, and gsap would warn
 * "Please gsap.registerPlugin(ScrollTrigger)" and skip it. ScrollTrigger's own
 * self-registration cannot cover for us either: it keys off `window.gsap`,
 * which gsap's ESM build never assigns under a bundler.
 *
 * The `window` guard is what the original in-effect placement bought us: this
 * is a "use client" module, and client components are still rendered on the
 * server, so bare module scope would execute during SSR. The guard keeps
 * registration browser-only while still running before any child effect.
 */
if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;
    let raf: ((time: number) => void) | null = null;

    const start = () => {
      if (lenis || mq.matches) return; // parity: native scroll when reduced
      lenis = new Lenis({ lerp: 0.1 });
      window.__lenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      raf = (time: number) => lenis?.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
    };
    const stop = () => {
      if (raf) gsap.ticker.remove(raf);
      if (lenis) {
        lenis.destroy();
        // Only clear the global if it is still ours: with reduced motion
        // active at mount this instance never published one, and an
        // unconditional delete would drop a sibling provider's instance.
        if (window.__lenis === lenis) delete window.__lenis;
        // start() turns lag smoothing off for Lenis's benefit; it is a global
        // gsap setting, so put it back to the documented default rather than
        // leave it disabled with no Lenis left to justify it.
        gsap.ticker.lagSmoothing(500, 33);
      }
      lenis = null;
      raf = null;
    };
    const onChange = () => (mq.matches ? stop() : start());

    start();
    mq.addEventListener("change", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
      stop();
    };
  }, []);

  return <>{children}</>;
}
