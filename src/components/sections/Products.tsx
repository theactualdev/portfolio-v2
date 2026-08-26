"use client";

import { useEffect, useRef, useState } from "react";
import { STAGGER } from "@/lib/motion/tokens";
import { useSectionReveal } from "@/lib/motion/useSectionReveal";
import ProductPreview from "./ProductPreview";

const BODY = "var(--font-body), system-ui, sans-serif";
const DISPLAY = "var(--font-display), system-ui, sans-serif";

/** `code` is optional: not every product has a repo that is ours to point at. */
type Product = { n: string; slug: string; name: string; note: string; live: string; code?: string };

/**
 * Things built, each row a link out. The locked answer to "what happens when
 * someone clicks a project" is: they go to the live thing or to the code —
 * there are no invented case-study routes behind these.
 *
 * Separate from Roles, which lists employment. Nevo appears in both, honestly:
 * it is the job AND the strongest thing shipped. MSE LUX says "for a client"
 * because it was, and that is a credential rather than a caveat.
 */
const PRODUCTS: Product[] = [
  { n: "01", slug: "nevo", name: "Nevo", note: "Adaptive learning platform — mobile-first, code-split, in school pilots", live: "https://nevolearning.com" },
  { n: "02", slug: "mse-lux", name: "MSE LUX", note: "Client e-commerce — Paystack checkout, Prisma, Next.js", live: "https://mse-lux-seven.vercel.app", code: "https://github.com/theactualdev/MSE-LUX" },
  { n: "03", slug: "bleachers", name: "Bleachers", note: "Sports PWA — event-sourced NestJS, offline-first", live: "https://bleachers-lovat.vercel.app", code: "https://github.com/theactualdev/bleachers" },
  { n: "04", slug: "gpa", name: "GPA Calculator", note: "Instant GPA computation, entirely client-side", live: "https://theactual-gpa.vercel.app", code: "https://github.com/theactualdev/theactualGPA" },
  { n: "05", slug: "faceblur", name: "FaceBlur", note: "OpenCV.js face detection — images never leave the device", live: "https://faceblur-v3.vercel.app", code: "https://github.com/theactualdev/faceblur" },
];

export default function Products() {
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState<string | null>("nevo");

  useSectionReveal(root, STAGGER);

  /**
   * Touch has no hover, and the owner's primary device is an iPhone — without
   * this the whole feature would be invisible on the device he demos from.
   * So below lg the panel follows whichever row is crossing the middle of the
   * screen. The rootMargin leaves only a thin band in the centre live, so
   * exactly one row is ever active.
   */
  useEffect(() => {
    const el = list.current;
    if (!el || !window.matchMedia("(max-width: 1023px)").matches) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.getAttribute("data-slug"));
        }
      },
      { rootMargin: "-48% 0px -48% 0px", threshold: 0 }
    );
    el.querySelectorAll("li[data-slug]").forEach((li) => io.observe(li));
    return () => io.disconnect();
  }, []);

  return (
    <div ref={root} className="relative">
      <h2 className="sr-only">Products</h2>
      <p
        data-reveal
        className="text-[0.68rem] uppercase tracking-[0.35em] text-ink-muted"
        style={{ fontFamily: BODY }}
      >
        Products
      </p>
      {/* Below lg the panel sits above the list in a slot reserved once, so
          it can change without ever shifting the rows under a reading thumb. */}
      <ProductPreview slug={active} className="mt-8 w-full max-w-[22rem] lg:hidden" />

      {/* lg+ only: below that width the "empty right side" this fills does not
          exist, and a panel would be competing for the reader's column. */}
      <ProductPreview
        slug={active}
        className="pointer-events-none absolute top-1/2 right-0 hidden w-[min(34vw,32rem)] -translate-y-1/2 lg:block"
      />

      <ul ref={list} className="mt-8 max-w-[56ch]">
        {PRODUCTS.map((w) => (
          <li
            key={w.n}
            data-slug={w.slug}
            data-reveal
            className="border-t border-ink/10 last:border-b"
            onMouseEnter={() => setActive(w.slug)}
            onFocus={() => setActive(w.slug)}
          >
            <div className="flex items-baseline gap-4 py-5 sm:gap-6" style={{ fontFamily: BODY }}>
              <span className="text-[0.7rem] tracking-[0.25em] text-ink-muted">{w.n}</span>
              <a
                href={w.live}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-1 flex-col sm:flex-row sm:items-baseline sm:gap-4 no-underline"
              >
                {/* Fixed width from sm up so the notes form a column. They
                    followed the name inline, which put their left edges at
                    five different x positions — a 100px spread, the only
                    ragged column on the page. */}
                <span
                  className="inline-block motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:translate-x-2 sm:w-44 sm:shrink-0"
                  style={{ fontFamily: DISPLAY, fontWeight: 600, fontStretch: "110%", fontSize: "1.2rem" }}
                >
                  {w.name}
                </span>
                {/* Was `hidden sm:inline`, which removed it from the a11y
                    tree too — a phone visitor got five bare names. */}
                <span className="mt-1 block text-[0.75rem] leading-snug text-ink-muted sm:mt-0 sm:flex-1">
                  {w.note}
                </span>
              </a>
              {w.code && (
                <a
                  href={w.code}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.72rem] uppercase tracking-[0.2em] text-ink-muted underline-offset-4 hover:text-accent hover:underline"
                >
                  Code
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
