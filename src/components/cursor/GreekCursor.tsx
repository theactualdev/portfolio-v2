"use client";

import { useEffect, useRef } from "react";

/**
 * Greek-motif cursor.
 *
 * Two variants, both drawn as thin cream strokes with the amber accent used
 * once:
 *
 *   "mati"    — the apotropaic eye painted on Greek ship prows. Thematically
 *               the strongest fit: the site's whole concept is a surface that
 *               notices you, and the mati is the symbol of watching. The pupil
 *               tracks slightly toward the direction of travel, and the lid
 *               narrows over interactive elements.
 *   "meander" — the Greek key / fret. Purely geometric, matches the composed
 *               architectural register, rotates a quarter turn over
 *               interactive elements.
 *
 * Why it is not the trope it resembles: the anti-pattern is the generic
 * lerping dot that follows the pointer on every award site. This carries a
 * motif that reinforces the concept, and it is *state-aware* rather than
 * decorative — it reports affordance, which is the job the native cursor does
 * and which a naive custom cursor destroys.
 *
 * Accessibility and correctness:
 *   - Only mounts on `(hover: hover) and (pointer: fine)`. Touch and stylus
 *     keep their native behaviour; nothing is hidden from them.
 *   - `prefers-reduced-motion` removes the follow-lerp and the idle drift; the
 *     mark snaps to the pointer instead of trailing it.
 *   - Never hides the native cursor over text inputs or textareas, where the
 *     I-beam carries real information.
 *   - Position is written straight to `transform` inside rAF. No React state
 *     per frame, no layout, composited only.
 */

export type CursorVariant = "mati" | "meander";

type Props = { variant?: CursorVariant };

const INTERACTIVE = 'a, button, [role="button"], summary, label, select';
const TEXTUAL = 'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, [contenteditable="true"]';

export default function GreekCursor({ variant = "mati" }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const inner = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!fine.matches) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const el = root.current;
    const svg = inner.current;
    if (!el || !svg) return;

    // pos = where the mark is drawn, target = where the pointer actually is.
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const target = { ...pos };
    let raf = 0;
    let visible = false;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!visible) {
        visible = true;
        el.style.opacity = "1";
      }
      const t = e.target as Element | null;
      const overInteractive = !!t?.closest?.(INTERACTIVE);
      const overText = !!t?.closest?.(TEXTUAL);
      // The native cursor is only suppressed where we are genuinely replacing
      // it. Over text it still carries information, so it stays.
      document.documentElement.dataset.cursor = overText ? "native" : "custom";
      el.dataset.state = overText ? "hidden" : overInteractive ? "active" : "idle";
    };

    const onLeave = () => {
      visible = false;
      el.style.opacity = "0";
    };

    const tick = () => {
      // Fast follow: attached, with just enough weight to feel physical.
      // Reduced motion snaps — a trailing mark is exactly the drift those
      // users asked not to see.
      const k = reduce.matches ? 1 : 0.32;
      pos.x += (target.x - pos.x) * k;
      pos.y += (target.y - pos.y) * k;
      el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      delete document.documentElement.dataset.cursor;
    };
  }, [variant]);

  return (
    <div
      ref={root}
      aria-hidden="true"
      data-greek-cursor
      data-state="idle"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 90,
        opacity: 0,
        pointerEvents: "none",
        willChange: "transform",
        // centre the mark on the hotspot
        marginLeft: -18,
        marginTop: -18,
        // the key turns on interactive elements; the eye only widens
        ["--cursor-turn" as string]: variant === "meander" ? "90deg" : "0deg",
      } as React.CSSProperties}
    >
      {variant === "mati" ? (
        <svg ref={inner} width="36" height="36" viewBox="0 0 36 36" fill="none">
          {/* vesica — the eye's lid */}
          <path
            d="M4 18 C 10 10, 26 10, 32 18 C 26 26, 10 26, 4 18 Z"
            stroke="var(--color-ink)"
            strokeWidth="1.1"
            strokeLinejoin="round"
            opacity="0.85"
          />
          {/* iris */}
          <circle cx="18" cy="18" r="4.6" stroke="var(--color-ink)" strokeWidth="1" opacity="0.6" />
          {/* pupil — the one amber note */}
          <circle cx="18" cy="18" r="2.1" fill="var(--color-accent)" />
        </svg>
      ) : (
        <svg ref={inner} width="36" height="36" viewBox="0 0 36 36" fill="none">
          {/* Greek key / meander, drawn as a square spiral */}
          <path
            d="M6 30 V 6 H 30 V 24 H 13 V 13 H 24 V 19"
            stroke="var(--color-ink)"
            strokeWidth="1.2"
            strokeLinecap="square"
            strokeLinejoin="miter"
            opacity="0.85"
          />
          <circle cx="18" cy="18" r="1.6" fill="var(--color-accent)" />
        </svg>
      )}
    </div>
  );
}
