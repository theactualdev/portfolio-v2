"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { EASE, DUR } from "@/lib/motion/tokens";
import { surfaceDriver, REST_AMP, releaseAmp, onSurfaceLive } from "@/components/surface/surfaceDriver";

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
      // Under reduced motion the CSS already composes both. Finishing the
      // animations here covers a mid-session flip INTO reduced motion, where
      // they may be part-way through.
      document.documentElement.classList.add("ceremony-skip");
      surfaceDriver.amp = REST_AMP;
      releaseAmp();
    };

    const ceremony = () => {
      ctx = gsap.context(() => {
        // The veil and the lines are CSS animations now — they start at
        // parse time and do not wait for this code. See globals.css. All that
        // is left here is the field's breath, which genuinely needs the canvas.
        /**
         * The field's breath is a SEPARATE tween, started when the surface
         * arrives — never blocking the type on it.
         *
         * Gating the whole ceremony on the lazy WebGL chunk made the hero h1
         * the LCP element at 2828ms under 4x CPU throttle, against a 2.5s
         * budget: the canvas only appeared at 2102ms and the lines waited
         * behind it. Text now paints on schedule (FCP 396ms) and the material
         * still breathes in from zero whenever it lands.
         *
         * Written straight onto the driver object, which the R3F frame loop
         * reads. The prototype pushed this through setState — a React render
         * per frame, 60 times a second. This costs zero renders.
         */
        const breathe = () =>
          gsap.to(surfaceDriver, {
            amp: REST_AMP,
            duration: DUR.l,
            ease: EASE.move,
            onComplete: releaseAmp,
          });
        whenSurfaceReady(breathe);

        // Any sign of intent jumps straight to the composed end state. The CSS
        // animations are finished rather than cancelled, so nothing snaps back.
        const skip = () => {
          document.documentElement.classList.add("ceremony-skip");
          cancelWait?.();
          gsap.to(surfaceDriver, {
            amp: REST_AMP,
            duration: DUR.s,
            ease: EASE.move,
            onComplete: releaseAmp,
          });
        };
        window.addEventListener("wheel", skip, { once: true, passive: true });
        window.addEventListener("pointerdown", skip, { once: true });
        window.addEventListener("keydown", skip, { once: true });

        return () => {
          window.removeEventListener("wheel", skip);
          window.removeEventListener("pointerdown", skip);
          window.removeEventListener("keydown", skip);
        };
      });
    };

    /**
     * Wait for the surface before waking it.
     *
     * The ceremony IS the field waking, so the breath must start when the
     * field first PAINTS — not when React inserts a <canvas>, which R3F does
     * at its default 300x150 roughly two seconds before it draws anything.
     * Waiting on the element ran the entire breath against a blank frame.
     */
    const whenSurfaceReady = (go: () => void) => {
      let timer = 0;
      let fired = false;
      const done = () => {
        window.clearTimeout(timer);
        off();
        cancelWait = undefined;
      };
      const run = () => {
        if (fired) return;
        fired = true;
        done();
        go();
      };
      const off = onSurfaceLive(run);
      // Cap: a machine with no WebGL at all must not leave amplitude pinned at
      // zero forever. Nothing VISIBLE waits on this — the veil and the lines
      // are CSS and have already run — so a generous cap costs nothing and
      // buys the wake on slow connections. At 1.5s the deployed site missed it
      // every time, because the surface chunk did not arrive until 8-17s.
      timer = window.setTimeout(run, 12_000);
      cancelWait = done;
    };

    const build = () => {
      cancelWait?.();
      ctx?.revert();
      ctx = undefined;
      if (mq.matches) compose();
      else ceremony();
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
        style={{ fontFamily: BODY, "--line-i": 2 } as React.CSSProperties}
      >
        {/* Below sm this stacks without the separator rather than wrapping
            mid-phrase — at 390px it orphaned "ENGINEER", at 320px it left the
            middot dangling at the end of a line. */}
        <span className="block whitespace-nowrap sm:inline">Ayodele Olayinka</span>
        <span className="hidden sm:inline">&ensp;·&ensp;</span>
        <span className="block whitespace-nowrap sm:inline">Frontend Engineer</span>
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
          "--line-i": 3,
        } as React.CSSProperties}
      >
        I build interfaces that pay attention.
      </h1>

      <p
        data-line
        className="mt-6 max-w-[44ch] text-[1.02rem] leading-relaxed text-ink-muted"
        style={{ fontFamily: BODY, "--line-i": 4 } as React.CSSProperties}
      >
        React, Next.js, TypeScript. Founding frontend engineer at Nevo.
        Lagos&thinsp;→&thinsp;anywhere.
      </p>

    </div>
  );
}
