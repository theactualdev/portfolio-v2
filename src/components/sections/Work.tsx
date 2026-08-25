"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EASE, DUR, STAGGER, prefersReducedMotion } from "@/lib/motion/tokens";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const BODY = "var(--font-body), system-ui, sans-serif";
const DISPLAY = "var(--font-display), system-ui, sans-serif";

/**
 * Five rows, each a link out. The locked answer to "what happens when someone
 * clicks a project" is: they go to the live thing or to the code — there are
 * no invented case-study routes behind these.
 */
const WORK = [
  { n: "01", name: "MSE LUX", note: "E-commerce — Paystack, Prisma, Next.js", live: "https://mse-lux-seven.vercel.app", code: "https://github.com/theactualdev/MSE-LUX" },
  { n: "02", name: "Bleachers", note: "Event-sourced sports PWA — NestJS, offline-first", live: "https://bleachers-lovat.vercel.app", code: "https://github.com/theactualdev/bleachers" },
  { n: "03", name: "Nevo", note: "Adaptive learning platform — founding engineer", live: "https://nevolearning.com", code: "https://github.com/teslimsadiqnevo/nevo-frontend-2.0" },
  { n: "04", name: "GPA Calculator", note: "Vite, React, TypeScript", live: "https://theactual-gpa.vercel.app", code: "https://github.com/theactualdev/theactualGPA" },
  { n: "05", name: "FaceBlur", note: "In-browser AI face blurring", live: "https://faceblur-theactualdev.vercel.app", code: "https://github.com/theactualdev/faceblur" },
];

export default function Work() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.set("[data-reveal]", { opacity: 0, y: 14 });
      gsap.to("[data-reveal]", {
        opacity: 1,
        y: 0,
        duration: DUR.m,
        ease: EASE.enter,
        stagger: STAGGER,
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root}>
      <p
        data-reveal
        className="text-[0.68rem] uppercase tracking-[0.35em] text-ink-muted"
        style={{ fontFamily: BODY }}
      >
        Selected work
      </p>
      <ul className="mt-8 max-w-[56ch]">
        {WORK.map((w) => (
          <li key={w.n} data-reveal className="border-t border-ink/10 last:border-b">
            <div className="flex items-baseline gap-6 py-5" style={{ fontFamily: BODY }}>
              <span className="text-[0.7rem] tracking-[0.25em] text-ink-muted">{w.n}</span>
              <a
                href={w.live}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex-1 no-underline"
              >
                <span
                  className="inline-block transition-transform duration-300 group-hover:translate-x-2"
                  style={{ fontFamily: DISPLAY, fontWeight: 600, fontStretch: "110%", fontSize: "1.2rem" }}
                >
                  {w.name}
                </span>
                <span className="ml-4 hidden text-[0.8rem] text-ink-muted sm:inline">{w.note}</span>
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
