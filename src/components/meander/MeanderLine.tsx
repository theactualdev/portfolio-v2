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

      // Where the line ENDS. The terminus is meant to arrive beside the
      // contact block, so an element can claim it with [data-meander-end];
      // the line stops at that element's vertical centre. Without the marker
      // the line runs to the end of content, which parks the amber head on the
      // page's last pixel row where it is half-clipped by the viewport edge —
      // an arrival that reads as falling off the bottom.
      const endMark = document.querySelector<HTMLElement>("[data-meander-end]");

      // Measure CONTENT, never document.documentElement.scrollHeight.
      // This svg is absolutely positioned inside the page wrapper and its own
      // height attribute (set below) counts toward the document's scroll
      // extent — so reading scrollHeight here reads back last build's output.
      // The page could then grow but never shrink: one phone rotation, window
      // drag or devtools open left a permanent dead scroll tail (measured:
      // 1816px past the end of content on a 390x844 -> 844x390 rotation, and
      // it ratcheted further on every subsequent shrink). Content height is
      // the quantity we actually want and the svg cannot contribute to it.
      const last = nodes[nodes.length - 1];
      const docH = Math.round(last.getBoundingClientRect().bottom + window.scrollY);
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
      const endY = endMark
        ? Math.round(
            endMark.getBoundingClientRect().top +
              window.scrollY +
              endMark.getBoundingClientRect().height / 2
          )
        : docH;
      d += ` L ${x} ${endY}`;           // run to the terminus

      root.setAttribute("viewBox", `0 0 ${window.innerWidth} ${docH}`);
      root.setAttribute("height", String(docH));
      el.setAttribute("d", d);

      const len = el.getTotalLength();
      el.style.strokeDasharray = `${len}`;

      if (reduce.matches) {
        // Composed still version: already drawn, no scrub, terminus parked.
        // Kill any trigger from a previous non-reduced build. build() re-runs
        // on a motion-preference change, and this path never used to kill it —
        // an orphaned trigger keeps scrubbing the "already drawn" line and
        // drags the head back off the terminus we just parked it at.
        trigger?.kill();
        trigger = undefined;
        el.style.strokeDashoffset = "0";
        if (head.current) {
          const end = el.getPointAtLength(len);
          head.current.setAttribute("cx", String(end.x));
          head.current.setAttribute("cy", String(end.y));
          head.current.style.opacity = "1";
        }
        return;
      }

      el.style.strokeDashoffset = `${len}`;
      trigger?.kill();

      /**
       * The tip LEADS the reader; it does not trail above them.
       *
       * Mapping the dash offset to raw scroll progress made the spine a
       * top-anchored stub: at scrollY 0 nothing was drawn at all, so on the one
       * screen the site is judged on the motif did not exist and the gutter the
       * sections reserve for it read as an unexplained indent. The tip also
       * advanced faster than the content it was meant to spine, reaching only
       * half the viewport height at the very last pixel of the page.
       *
       * So the drawn length is derived from a document position a little below
       * the fold instead. Section one is already spined when the veil lifts,
       * and the amber tip stays ahead of the copy being read. The path is
       * vertical runs plus fixed jogs, so length up to a document y is just
       * y plus one jog for every boundary already passed — no path sampling.
       */
      const jogPx = laneB - laneA;
      const LEAD = 0.82; // keeps the tip inside the viewport, not on its edge
      const drawnAt = (docY: number) => {
        let passed = 0;
        for (const t of turns) if (t <= docY) passed++;
        return Math.min(len, Math.max(0, docY + jogPx * passed));
      };

      const paint = () => {
        const drawn = drawnAt(window.scrollY + window.innerHeight * LEAD);
        el.style.strokeDashoffset = `${len - drawn}`;
        // the single amber note rides the drawing head
        if (head.current) {
          const pt = el.getPointAtLength(drawn);
          head.current.setAttribute("cx", String(pt.x));
          head.current.setAttribute("cy", String(pt.y));
          // Rides to the path's end — which is the contact block — and stays
          // there. The single amber note arrives rather than vanishing.
          head.current.style.opacity = drawn > 2 ? "1" : "0";
        }
      };

      paint(); // draw the arrival screen before any scrolling happens
      trigger = ScrollTrigger.create({
        start: 0,
        end: () => document.documentElement.scrollHeight - window.innerHeight,
        scrub: true,
        onUpdate: paint,
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
