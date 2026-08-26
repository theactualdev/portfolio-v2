"use client";

import { useEffect, useRef } from "react";

const BODY = "var(--font-body), system-ui, sans-serif";

/**
 * The masthead, which recedes while you read.
 *
 * There is no scrim here on purpose — a filled bar would occlude the field the
 * whole site is built on. But a fixed header over full-bleed scrolling copy
 * collides with it: measured, three text runs printed straight through the
 * wordmark at mid-page on a phone, none of them legible.
 *
 * So the marks behave instead. They are orientation — who this is, and that he
 * is available — which matters on arrival and again at the contact block, not
 * while someone is reading the middle of the page. They fade out once the
 * visitor leaves the first screen and return for the last one.
 *
 * Driven by scrollY alone: no layout reads in the scroll path, and the write is
 * rAF-throttled and skipped when the value has not changed.
 */
export default function Header() {
  const el = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = el.current;
    if (!node) return;

    let frame = 0;
    let last = -1;

    const apply = () => {
      frame = 0;
      const vh = window.innerHeight;
      const max = document.documentElement.scrollHeight - vh;
      const y = window.scrollY;
      // Ramps are deliberately tight. Gentler ones left the marks at 0.75
      // opacity exactly where copy reaches the header band — measured, 2-4
      // legible collisions per viewport. The marks are gone before any content
      // arrives, and do not come back until the contact block owns the screen.
      const leaving = Math.min(1, Math.max(0, (y - vh * 0.08) / (vh * 0.18)));
      const returning = Math.min(1, Math.max(0, (y - (max - vh * 0.3)) / (vh * 0.2)));
      const next = Math.round((1 - leaving + returning) * 100) / 100;
      const clamped = Math.min(1, Math.max(0, next));
      if (clamped === last) return;
      last = clamped;
      node.style.opacity = String(clamped);
      // Never let faded marks intercept a click meant for the page beneath.
      node.style.pointerEvents = clamped < 0.05 ? "none" : "";
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    /* Tracking and size step down below sm: at 0.35em the two marks collided
       at 360px (7px apart, reading as one run-on string) and wrapped at 320px,
       the WCAG reflow width. */
    <header
      ref={el}
      className="fixed inset-x-0 top-0 z-20 flex items-baseline justify-between gap-3 px-[6vw] py-6 text-[0.6rem] uppercase tracking-[0.18em] text-ink-muted transition-opacity duration-300 motion-reduce:transition-none sm:text-[0.68rem] sm:tracking-[0.35em]"
      style={{ fontFamily: BODY }}
    >
      <span data-line>theactualdev</span>
      <span data-line>Available for work</span>
    </header>
  );
}
