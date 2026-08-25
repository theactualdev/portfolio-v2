"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * The meander as the site's continuous line.
 *
 * A meander is one unbroken line that turns at right angles and never breaks.
 * The site is one continuous page. So this is a single cream hairline running
 * the page's full length, jogging at each section boundary, drawing itself as
 * you scroll. The structure IS the motif and the motif IS the structure —
 * nothing decorative is added.
 *
 * Rigid orthogonal cream over the turbulent liquid field is the whole concept
 * in one image: order over chaos. It serves the locked signature rather than
 * competing with it.
 *
 * Rules it obeys (see the portfolio-direction skill):
 *   - Hairline, cream, never a filled band or closed border. Black + gold +
 *     Greek key is the Versace identity; this stays a rule, not a border.
 *   - Amber appears as exactly ONE point — the leading terminus, read as
 *     lamplight rather than gilding.
 *   - Nothing Greek is ever still: the line draws on scroll. Under reduced
 *     motion it is simply already drawn, which is the composed still version.
 *   - The theme is never named anywhere in copy.
 */

type Props = {
  /** Selector for the elements whose boundaries the line turns at. */
  sections?: string;
  /** Horizontal jog at each turn, in px. Also the module for the grid. */
  jog?: number;
};

export default function MeanderLine({ sections = "[data-meander-section]", jog = 56 }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const path = useRef<SVGPathElement>(null);
  const head = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const el = path.current;
    const root = svg.current;
    if (!el || !root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let trigger: ScrollTrigger | undefined;

    const build = () => {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>(sections));
      if (!nodes.length) return;

      const docH = document.documentElement.scrollHeight;
      const laneA = Math.round(window.innerWidth * 0.06);
      const laneB = laneA + Math.min(jog, Math.round(window.innerWidth * 0.09));

      // Boundaries are the bottom edge of every section but the last.
      const turns = nodes
        .slice(0, -1)
        .map((n) => Math.round(n.getBoundingClientRect().bottom + window.scrollY));

      let x = laneA;
      let d = `M ${x} 0`;
      for (const y of turns) {
        d += ` L ${x} ${y}`;            // run down to the boundary
        x = x === laneA ? laneB : laneA; // turn
        d += ` L ${x} ${y}`;            // step across
      }
      d += ` L ${x} ${docH}`;           // run to the end of the page

      root.setAttribute("viewBox", `0 0 ${window.innerWidth} ${docH}`);
      root.setAttribute("height", String(docH));
      el.setAttribute("d", d);

      const len = el.getTotalLength();
      el.style.strokeDasharray = `${len}`;

      if (reduce.matches) {
        // Composed still version: already drawn, no scrub, terminus parked.
        el.style.strokeDashoffset = "0";
        if (head.current) head.current.style.opacity = "0";
        return;
      }

      el.style.strokeDashoffset = `${len}`;
      trigger?.kill();
      const obj = { p: 0 };
      trigger = ScrollTrigger.create({
        start: 0,
        end: () => document.documentElement.scrollHeight - window.innerHeight,
        scrub: true,
        onUpdate: (self) => {
          obj.p = self.progress;
          el.style.strokeDashoffset = `${len * (1 - obj.p)}`;
          // the single amber note rides the drawing head
          if (head.current) {
            const pt = el.getPointAtLength(len * obj.p);
            head.current.setAttribute("cx", String(pt.x));
            head.current.setAttribute("cy", String(pt.y));
            head.current.style.opacity = obj.p > 0.002 && obj.p < 0.999 ? "1" : "0";
          }
        },
      });
    };

    build();
    const onResize = () => {
      ScrollTrigger.refresh();
      build();
    };
    window.addEventListener("resize", onResize);
    reduce.addEventListener("change", build);

    return () => {
      trigger?.kill();
      window.removeEventListener("resize", onResize);
      reduce.removeEventListener("change", build);
    };
  }, [sections, jog]);

  return (
    <svg
      ref={svg}
      aria-hidden="true"
      width="100%"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 5,
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      <path
        ref={path}
        data-meander-path
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth="1"
        strokeOpacity="0.30"
        vectorEffect="non-scaling-stroke"
      />
      <circle ref={head} data-meander-head r="2.5" fill="var(--color-accent)" style={{ opacity: 0 }} />
    </svg>
  );
}
