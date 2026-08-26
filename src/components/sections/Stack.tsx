"use client";

import { useRef } from "react";
import { useSectionReveal } from "@/lib/motion/useSectionReveal";

const BODY = "var(--font-body), system-ui, sans-serif";
const DISPLAY = "var(--font-display), system-ui, sans-serif";

/**
 * The stack, as a continuous drift.
 *
 * A marquee is a trope, and the direction skill says so. It ships here because
 * the owner asked for one directly, having been told that. So the job is to
 * build the version that does not read as a template:
 *
 *   - Type only. No logo grid, no badges, no coloured chips — logos would put a
 *     dozen foreign brand colours on a page with exactly one accent.
 *   - Slow enough to actually read. The usual failure is a strip moving fast
 *     enough to signal "motion" and too fast to be information.
 *   - Two rows travelling in opposite directions at different speeds, so it
 *     reads as drift rather than as a conveyor belt.
 *   - It stops when you point at it. A marquee you cannot read is decoration.
 *   - Masked at both edges, so names fade out rather than being guillotined by
 *     a hard boundary the page has nowhere else.
 *   - Under prefers-reduced-motion it does not move at all: the animation is
 *     switched off and the strip becomes a static, wrapped, fully readable list.
 *     Nothing is ever hidden behind motion that never happens.
 *
 * Order is not alphabetical and not random — it runs roughly in the order he
 * reaches for things, so a reader who looks twice gets an opinion rather than
 * an inventory.
 */
/**
 * EVIDENCE RULE: nothing appears here that is not either on his resume or
 * demonstrably used in something he shipped. An unbacked name is the same
 * defect as the "four years" claim this site already had to remove — and it is
 * the one a peer is most likely to ask about in an interview.
 *
 * Resume: TypeScript, JavaScript, React, Next.js, Tailwind CSS, Firebase,
 * MongoDB, Git, Vite, Turbopack, Postman, Figma.
 * Evidenced by the products: Paystack and Prisma (MSE LUX), NestJS (Bleachers),
 * OpenCV.js (FaceBlur).
 * Evidenced by this site: GSAP, WebGL, Three.js.
 */
const ROW_A = [
  "TypeScript",
  "React",
  "Next.js",
  "Tailwind CSS",
  "GSAP",
  "WebGL",
  "Three.js",
];

const ROW_B = [
  "NestJS",
  "Prisma",
  "MongoDB",
  "Firebase",
  "Paystack",
  "OpenCV.js",
  "Vite",
  "Turbopack",
  "Git",
  "Figma",
  "Postman",
];

function Strip({
  items,
  seconds,
  reverse = false,
}: {
  items: string[];
  seconds: number;
  reverse?: boolean;
}) {
  return (
    <div className="group relative overflow-hidden py-3" data-marquee>
      {/* The animation itself lives in CSS, not here. An inline `animation`
          shorthand also sets animation-play-state:running, and inline styles
          outrank the stylesheet — so the hover-to-pause rule could never win.
          Only the duration is passed in. */}
      <div
        data-dir={reverse ? "rtl" : "ltr"}
        className="flex w-max gap-10 will-change-transform motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:gap-x-8 motion-reduce:gap-y-3"
        style={{ "--marquee-duration": `${seconds}s` } as React.CSSProperties}
      >
        {/* Duplicated once so the loop is seamless. The copy is aria-hidden;
            a screen reader should hear this list once, not twice. */}
        {[0, 1].map((copy) => (
          <div
            key={copy}
            className="flex shrink-0 gap-10 motion-reduce:flex-wrap motion-reduce:gap-x-8 motion-reduce:gap-y-3"
            aria-hidden={copy === 1 || undefined}
          >
            {items.map((name) => (
              <span
                key={name}
                className="whitespace-nowrap text-ink-muted"
                style={{ fontFamily: DISPLAY, fontWeight: 500, fontStretch: "105%", fontSize: "1.15rem" }}
              >
                {name}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Stack() {
  const root = useRef<HTMLDivElement>(null);

  useSectionReveal(root);

  return (
    <div ref={root}>
      <h2 className="sr-only">Stack</h2>
      <p
        data-reveal
        className="text-[0.68rem] uppercase tracking-[0.35em] text-ink-muted"
        style={{ fontFamily: BODY }}
      >
        Stack
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
        In the order I reach for them.
      </p>

      {/* Bleeds RIGHT only. Bleeding left as well ran the names into the
          spine's reserved lane and the hairline drew straight through them —
          measured 1-2 crossings at almost every width, which is the same defect
          the section gutters exist to prevent. Starting at the text column
          keeps the lane clear; the mask still gives both ends a soft edge, so
          it reads as drift rather than as a boxed widget. */}
      <div
        data-reveal
        className="mt-10 -mr-[7vw]"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
        }}
      >
        <Strip items={ROW_A} seconds={64} />
        <Strip items={ROW_B} seconds={88} reverse />
      </div>
    </div>
  );
}
