"use client";

/**
 * Hero concept prototype (dev only): THE SURFACE IS THE HERO.
 *
 * The ceremony is the field waking — veil lifts, turbulence ramps from zero —
 * while the name arrives small and precise. No type monument: the two-second
 * stopper is the material noticing your cursor, not reading a name at 12vw.
 *
 * Everything here uses the real building blocks (SurfaceCanvas, motion
 * tokens, qaRegister) so what you see is what Plan 2 would formalise, not a
 * mockup. Copy is placeholder-with-intent: swagger in the details, composed
 * presentation.
 *
 * Ceremony contract (from the direction locks): total < 3s, skippable by
 * scroll/click/key, reduced-motion gets the composed final state instantly.
 */

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import SurfaceCanvas from "@/components/surface/SurfaceCanvas";
import GreekCursor, { type CursorVariant } from "@/components/cursor/GreekCursor";
import { qaRegister } from "@/components/dev/QaHooks";
import { EASE, DUR, STAGGER, prefersReducedMotion } from "@/lib/motion/tokens";
import "../specimens/fonts.css"; // General Sans (local, deterministic)

const ARCHIVO =
  "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap";

const REST_AMP = 0.28;

export default function HeroPrototype() {
  const root = useRef<HTMLDivElement>(null);
  const ampProxy = useRef({ v: 0 });
  // Lazy init: under reduced motion amp starts (and stays) at rest — no
  // setState inside the effect body, which React 19's lint rightly rejects.
  const [amp, setAmp] = useState(() => (prefersReducedMotion() ? REST_AMP : 0));
  const [cursor, setCursor] = useState<CursorVariant>("mati");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "1") setCursor("mati");
      if (e.key === "2") setCursor("meander");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    if (prefersReducedMotion()) {
      // Parity: the composed end state, immediately. amp already initialised
      // at rest; the surface freezes at its designed still frame internally.
      gsap.set("[data-line]", { opacity: 1, y: 0 });
      gsap.set("[data-veil]", { opacity: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set("[data-line]", { opacity: 0, y: 14 });

      const tl = gsap.timeline({ defaults: { ease: EASE.enter } });

      // The field wakes: veil lifts and turbulence breathes in, together.
      tl.to("[data-veil]", { opacity: 0, duration: DUR.l, ease: EASE.move }, 0);
      tl.to(
        ampProxy.current,
        {
          v: REST_AMP,
          duration: DUR.l,
          ease: EASE.move,
          onUpdate: () => setAmp(ampProxy.current.v),
        },
        0
      );

      // The name arrives small while the material is already alive.
      tl.to("[data-line]", { opacity: 1, y: 0, duration: DUR.m, stagger: STAGGER * 2 }, 0.35);

      const unregister = qaRegister(tl);

      // Skippable: any intent jumps straight to the composed end state.
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
    }, root);

    return () => ctx.revert();
  }, []);

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div ref={root} className="relative min-h-screen overflow-hidden text-ink">
      <link rel="stylesheet" href={ARCHIVO} />

      <SurfaceCanvas amplitude={amp} />
      <GreekCursor variant={cursor} />

      {/* Ceremony veil: the ground colour, lifting as the field wakes. */}
      <div data-veil className="fixed inset-0 z-10 bg-ground pointer-events-none" />

      <header className="fixed inset-x-0 top-0 z-20 flex items-baseline justify-between px-[6vw] py-6 text-[0.68rem] uppercase tracking-[0.35em] text-ink-muted">
        <span data-line style={{ fontFamily: '"General Sans", system-ui, sans-serif' }}>
          theactualdev
        </span>
        <span data-line style={{ fontFamily: '"General Sans", system-ui, sans-serif' }}>
          Available for work
        </span>
      </header>

      <main className="relative z-20 flex min-h-screen flex-col justify-center px-[7vw]">
        <p
          data-line
          className="text-[0.72rem] uppercase tracking-[0.35em] text-ink-muted"
          style={{ fontFamily: '"General Sans", system-ui, sans-serif' }}
        >
          Ayodele Olayinka&ensp;·&ensp;Frontend Engineer
        </p>

        <h1
          data-line
          className="mt-5 max-w-[24ch] leading-[1.06]"
          style={{
            fontFamily: '"Archivo", system-ui, sans-serif',
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
          style={{ fontFamily: '"General Sans", system-ui, sans-serif' }}
        >
          React, Next.js, TypeScript. Founding frontend engineer at Nevo.
          Lagos&thinsp;→&thinsp;anywhere.
        </p>

        <p
          data-line
          className="mt-10 text-[0.8rem] text-ink-muted/80"
          style={{ fontFamily: '"General Sans", system-ui, sans-serif' }}
        >
          Go on — move your cursor. Hover{" "}
          <a
            href="https://github.com/theactualdev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline underline-offset-4"
          >
            this link
          </a>{" "}
          to see it react.
        </p>

        <p
          data-line
          className="mt-3 text-[0.7rem] uppercase tracking-[0.28em] text-ink-muted/60"
          style={{ fontFamily: '"General Sans", system-ui, sans-serif' }}
        >
          Press 1 — mati (the eye) &ensp;·&ensp; 2 — meander (the key)
          &ensp;·&ensp; showing: {cursor}
        </p>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-20 flex items-baseline justify-between px-[6vw] py-6 text-[0.68rem] uppercase tracking-[0.35em] text-ink-muted">
        <span data-line style={{ fontFamily: '"General Sans", system-ui, sans-serif' }}>
          Selected work · 01–05
        </span>
        <span data-line style={{ fontFamily: '"General Sans", system-ui, sans-serif' }}>
          Below this fold, in the real build
        </span>
      </footer>
    </div>
  );
}
