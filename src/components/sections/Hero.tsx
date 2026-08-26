"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { qaRegister } from "@/components/dev/QaHooks";
import { EASE, DUR, STAGGER } from "@/lib/motion/tokens";
import { surfaceDriver, REST_AMP } from "@/components/surface/surfaceDriver";

/**
 * The entry ceremony. THE SURFACE IS THE HERO.
 *
 * The ceremony is the field waking — the veil lifts while turbulence breathes
 * in from zero — and the name arrives small over material that is already
 * alive. The two-second stopper is the surface noticing your cursor, not a
 * name set at 12vw. (The type-monument idea was killed at direction lock; do
 * not revive it.)
 *
 * Contract: total < 3s, skippable by scroll/click/key, and reduced motion gets
 * the composed final state with no timeline at all.
 */

const BODY = "var(--font-body), system-ui, sans-serif";
const DISPLAY = "var(--font-display), system-ui, sans-serif";

export default function Hero() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let ctx: gsap.Context | undefined;
    let cancelWait: (() => void) | undefined;

    // The composed end state, written INLINE. The gating CSS only hands this
    // out through a media query, so a visitor who turns reduced motion off
    // mid-session had `.js [data-line] { opacity: 0 }` reassert with no
    // timeline left to undo it — a permanently blank hero behind an opaque
    // veil, recoverable only by reloading.
    const compose = () => {
      gsap.set("[data-line]", { opacity: 1, y: 0 });
      gsap.set("[data-veil]", { opacity: 0 });
      surfaceDriver.amp = REST_AMP;
    };

    const ceremony = () => {
      ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: EASE.enter } });

        // The field wakes: veil lifts and turbulence breathes in, together.
        tl.to("[data-veil]", { opacity: 0, duration: DUR.l, ease: EASE.move }, 0);
        // Written straight onto the driver object, which the R3F frame loop
        // reads. The prototype pushed this through setState — a React render
        // per frame, 60 times a second. This costs zero renders.
        tl.to(surfaceDriver, { amp: REST_AMP, duration: DUR.l, ease: EASE.move }, 0);

        // The name arrives small while the material is already alive.
        tl.to("[data-line]", { opacity: 1, y: 0, duration: DUR.m, stagger: STAGGER * 2 }, 0.35);

        const unregister = qaRegister(tl);

        // Any sign of intent jumps straight to the composed end state.
        const skip = () => tl.progress(1);
        window.addEventListener("wheel", skip, { once: true, passive: true });
        window.addEventListener("pointerdown", skip, { once: true });
        window.addEventListener("keydown", skip, { once: true });

        return () => {
          unregister();
          window.removeEventListener("wheel", skip);
          window.removeEventListener("pointerdown", skip);
          window.removeEventListener("keydown", skip);
        };
      });
    };

    /**
     * Wait for the surface before waking it.
     *
     * The ceremony IS the field waking, but the surface ships in a lazy chunk
     * that only starts fetching after hydration. Off localhost the amplitude
     * ramp was most of the way through before a canvas existed, so the one
     * gesture the whole site is judged on played against a static gradient.
     * Cap the wait — a slow chunk must never hold the page hostage.
     */
    const whenSurfaceReady = (go: () => void) => {
      if (document.querySelector("canvas")) return go();
      let timer = 0;
      const done = () => {
        obs.disconnect();
        window.clearTimeout(timer);
        cancelWait = undefined;
      };
      const obs = new MutationObserver(() => {
        if (document.querySelector("canvas")) { done(); go(); }
      });
      obs.observe(document.body, { childList: true, subtree: true });
      timer = window.setTimeout(() => { done(); go(); }, 1500);
      cancelWait = done;
    };

    const build = () => {
      cancelWait?.();
      ctx?.revert();
      ctx = undefined;
      if (mq.matches) compose();
      else whenSurfaceReady(ceremony);
    };

    build();
    mq.addEventListener("change", build);

    return () => {
      mq.removeEventListener("change", build);
      cancelWait?.();
      // revert() rolls the surfaceDriver tween back to its start, so amp
      // returns to 0 on unmount. Correct under React's development
      // double-effect, and moot in production — this is a single page and the
      // hero never unmounts.
      ctx?.revert();
    };
  }, []);

  return (
    <div>
      <p
        data-line
        className="text-[0.72rem] uppercase tracking-[0.2em] text-ink-muted sm:tracking-[0.35em]"
        style={{ fontFamily: BODY }}
      >
        Ayodele Olayinka&ensp;·&ensp;Frontend Engineer
      </p>

      <h1
        data-line
        className="mt-5 max-w-[24ch] leading-[1.06]"
        style={{
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontStretch: "115%",
          letterSpacing: "-0.015em",
          fontSize: "clamp(1.9rem, 3.2vw, 2.9rem)",
        }}
      >
        I build interfaces that pay attention.
      </h1>

      <p
        data-line
        className="mt-6 max-w-[44ch] text-[1.02rem] leading-relaxed text-ink-muted"
        style={{ fontFamily: BODY }}
      >
        React, Next.js, TypeScript. Founding frontend engineer at Nevo.
        Lagos&thinsp;→&thinsp;anywhere.
      </p>

      {/* Split by pointer type: telling a touch visitor to move a cursor they
          do not have reads as a site built for somebody else. */}
      <p data-line className="mt-10 text-[0.8rem] text-ink-muted" style={{ fontFamily: BODY }}>
        <span className="hidden sm:inline">Go on — move your cursor.</span>
        <span className="sm:hidden">Scroll.</span>
      </p>
    </div>
  );
}
