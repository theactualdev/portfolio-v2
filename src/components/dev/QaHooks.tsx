"use client";

import { useEffect } from "react";
import gsap from "gsap";

type Seekable = gsap.core.Timeline | gsap.core.Tween;

/**
 * Written as a folded conditional rather than a plain `new Set()` so the
 * bundler's NODE_ENV substitution collapses it to `null` in production
 * builds — the Set constructor never reaches the client bundle, so the
 * registry cannot retain timelines there.
 */
const registry: Set<Seekable> | null =
  process.env.NODE_ENV === "production" ? null : new Set<Seekable>();

const noop = () => {};

/**
 * Animated components register their timelines so capture.js can seek them.
 * Returns a void disposer, so it can be returned directly from useEffect.
 * In production the guard below is statically true, so the whole body is
 * dead code and this compiles down to a no-op returning a no-op.
 */
export function qaRegister(tl: Seekable): () => void {
  if (process.env.NODE_ENV === "production") return noop;
  registry?.add(tl);
  return () => {
    registry?.delete(tl);
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
        // NaN/Infinity survive the min/max clamp and corrupt a timeline's
        // time, so reject anything non-finite outright.
        if (!Number.isFinite(t)) return;
        const p = Math.min(Math.max(t, 0), 1);
        registry?.forEach((tl) => tl.pause().progress(p));
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
