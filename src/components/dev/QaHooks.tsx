"use client";

import { useEffect } from "react";
import gsap from "gsap";

type Seekable = gsap.core.Timeline | gsap.core.Tween;
const registry = new Set<Seekable>();

/**
 * Animated components register their timelines so capture.js can seek them.
 * Returns a void disposer, so it can be returned directly from useEffect.
 */
export function qaRegister(tl: Seekable): () => void {
  registry.add(tl);
  return () => {
    registry.delete(tl);
  };
}

declare global {
  interface Window {
    __qa?: {
      scrollTo: (y: number) => void;
      seek: (t: number) => void;
      freeze: () => void;
      register: typeof qaRegister;
    };
    __lenis?: {
      scrollTo: (y: number, o?: Record<string, unknown>) => void;
      stop: () => void;
      start: () => void;
    };
  }
}

export default function QaHooks() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    window.__qa = {
      scrollTo(y) {
        // force:true — Lenis ignores programmatic scroll while stopped, and
        // freeze() stops it. Without this, freeze-then-scroll silently no-ops.
        if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true });
        else {
          document.documentElement.style.scrollBehavior = "auto";
          window.scrollTo(0, y);
        }
      },
      seek(t) {
        const p = Math.min(Math.max(t, 0), 1);
        registry.forEach((tl) => tl.pause().progress(p));
      },
      freeze() {
        gsap.globalTimeline.pause();
        window.__lenis?.stop();
      },
      register: qaRegister,
    };
    return () => {
      delete window.__qa;
    };
  }, []);
  return null;
}
