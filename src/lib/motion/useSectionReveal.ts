"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EASE, DUR, STAGGER } from "@/lib/motion/tokens";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * The section-reveal grammar, in one place.
 *
 * `[data-reveal]` elements start hidden via the `.js [data-reveal]` gating in
 * globals.css — never via gsap.set, which would blank already-painted copy at
 * hydration — and rise into place when the section approaches.
 *
 * Two behaviours worth knowing about:
 *
 *   - The motion preference is watched LIVE. Reading it once at mount meant a
 *     visitor who turned reduced motion off mid-session kept the CSS end state
 *     asserting while no timeline ever ran again to undo it.
 *   - Focus completes the reveal immediately. An element sitting at opacity 0
 *     that can still take keyboard focus is the classic version of that bug:
 *     Tab jumps the page to something invisible for most of a second.
 */
export function useSectionReveal(
  root: RefObject<HTMLElement | null>,
  stagger: number = STAGGER * 2
) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let ctx: gsap.Context | undefined;

    // Belt and braces for the gating CSS: whatever happens to the timeline,
    // content must end up visible rather than stranded at opacity 0.
    const compose = () => gsap.set(el.querySelectorAll("[data-reveal]"), { opacity: 1, y: 0 });

    const build = () => {
      ctx?.revert();
      ctx = undefined;

      if (mq.matches) {
        compose();
        return;
      }

      ctx = gsap.context(() => {
        gsap.to("[data-reveal]", {
          opacity: 1,
          y: 0,
          duration: DUR.m,
          ease: EASE.enter,
          stagger,
          scrollTrigger: { trigger: el, start: "top 70%" },
        });
      }, el);
    };

    build();

    const onFocusIn = () => compose();
    el.addEventListener("focusin", onFocusIn);
    mq.addEventListener("change", build);

    return () => {
      el.removeEventListener("focusin", onFocusIn);
      mq.removeEventListener("change", build);
      ctx?.revert();
    };
  }, [root, stagger]);
}
