"use client";

import { useRef } from "react";
import { STAGGER } from "@/lib/motion/tokens";
import { useSectionReveal } from "@/lib/motion/useSectionReveal";

const BODY = "var(--font-body), system-ui, sans-serif";
const DISPLAY = "var(--font-display), system-ui, sans-serif";

/**
 * Things built, each row a link out. The locked answer to "what happens when
 * someone clicks a project" is: they go to the live thing or to the code —
 * there are no invented case-study routes behind these.
 *
 * Separate from Roles, which lists employment. Nevo appears in both, honestly:
 * it is the job AND the strongest thing shipped. MSE LUX says "for a client"
 * because it was, and that is a credential rather than a caveat.
 */
const PRODUCTS = [
  { n: "01", name: "Nevo", note: "Adaptive learning platform — founding engineer", live: "https://nevolearning.com", code: "https://github.com/teslimsadiqnevo/nevo-frontend-2.0" },
  { n: "02", name: "MSE LUX", note: "E-commerce for a client — Paystack, Prisma, Next.js", live: "https://mse-lux-seven.vercel.app", code: "https://github.com/theactualdev/MSE-LUX" },
  { n: "03", name: "Bleachers", note: "Event-sourced sports PWA — NestJS, offline-first", live: "https://bleachers-lovat.vercel.app", code: "https://github.com/theactualdev/bleachers" },
  { n: "04", name: "GPA Calculator", note: "Vite, React, TypeScript", live: "https://theactual-gpa.vercel.app", code: "https://github.com/theactualdev/theactualGPA" },
  { n: "05", name: "FaceBlur", note: "In-browser AI face blurring", live: "https://faceblur-v3.vercel.app", code: "https://github.com/theactualdev/faceblur" },
];

export default function Products() {
  const root = useRef<HTMLDivElement>(null);

  useSectionReveal(root, STAGGER);

  return (
    <div ref={root}>
      <h2 className="sr-only">Products</h2>
      <p
        data-reveal
        className="text-[0.68rem] uppercase tracking-[0.35em] text-ink-muted"
        style={{ fontFamily: BODY }}
      >
        Products
      </p>
      <ul className="mt-8 max-w-[56ch]">
        {PRODUCTS.map((w) => (
          <li key={w.n} data-reveal className="border-t border-ink/10 last:border-b">
            <div className="flex items-baseline gap-4 py-5 sm:gap-6" style={{ fontFamily: BODY }}>
              <span className="text-[0.7rem] tracking-[0.25em] text-ink-muted">{w.n}</span>
              <a
                href={w.live}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex-1 no-underline"
              >
                {/* Fixed width from sm up so the notes form a column. They
                    followed the name inline, which put their left edges at
                    five different x positions — a 100px spread, the only
                    ragged column on the page. */}
                <span
                  className="inline-block motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:translate-x-2 sm:w-44"
                  style={{ fontFamily: DISPLAY, fontWeight: 600, fontStretch: "110%", fontSize: "1.2rem" }}
                >
                  {w.name}
                </span>
                {/* Was `hidden sm:inline`, which removed it from the a11y
                    tree too — a phone visitor got five bare names. */}
                <span className="mt-1 block text-[0.75rem] leading-snug text-ink-muted sm:mt-0 sm:inline">
                  {w.note}
                </span>
              </a>
              <a
                href={w.code}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[0.72rem] uppercase tracking-[0.2em] text-ink-muted underline-offset-4 hover:text-accent hover:underline"
              >
                Code
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
