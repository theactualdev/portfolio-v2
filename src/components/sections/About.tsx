"use client";

import { useRef } from "react";
import { useSectionReveal } from "@/lib/motion/useSectionReveal";

const BODY = "var(--font-body), system-ui, sans-serif";
const DISPLAY = "var(--font-display), system-ui, sans-serif";

/**
 * `data-reveal` is the section-reveal convention: scroll-triggered, scoped per
 * section by gsap.context's second argument. Deliberately NOT `data-line`,
 * which the hero ceremony selects document-wide — sharing one attribute would
 * let the ceremony grab content four screens below the fold.
 */
export default function About() {
  const root = useRef<HTMLDivElement>(null);

  useSectionReveal(root);

  return (
    <div ref={root}>
      <p
        data-reveal
        className="text-[0.68rem] uppercase tracking-[0.35em] text-ink-muted"
        style={{ fontFamily: BODY }}
      >
        About
      </p>
      <p
        data-reveal
        className="mt-6 max-w-[34ch] leading-[1.25]"
        style={{
          fontFamily: DISPLAY,
          fontWeight: 600,
          fontStretch: "110%",
          fontSize: "clamp(1.4rem, 2.4vw, 2.1rem)",
        }}
      >
        Four years turning specifications into interfaces people actually finish using.
      </p>
      <p
        data-reveal
        className="mt-6 max-w-[46ch] text-[1rem] leading-relaxed text-ink-muted"
        style={{ fontFamily: BODY }}
      >
        Most recently at Nevo, building an adaptive learning platform from the
        first commit. Before that, e-commerce and event-sourced systems.
      </p>
    </div>
  );
}
