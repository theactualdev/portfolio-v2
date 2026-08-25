"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EASE, DUR, STAGGER, prefersReducedMotion } from "@/lib/motion/tokens";
import { surfaceDriver } from "@/components/surface/surfaceDriver";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const BODY = "var(--font-body), system-ui, sans-serif";
const DISPLAY = "var(--font-display), system-ui, sans-serif";

const SOCIALS = [
  { label: "GitHub", href: "https://github.com/theactualdev" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/theactualdev" },
  { label: "X", href: "https://x.com/theactualdev" },
];

/**
 * The finale. This is where the amber pays off: the surface warms as you
 * arrive, and the meander's single amber terminus parks beside the contact
 * block rather than vanishing. Hospitality expressed as behaviour — the theme
 * is never named in copy.
 */
export default function Contact() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // The warmth ramp runs in BOTH motion modes. Hue is colour, not motion:
      // SurfaceCanvas deliberately keeps hue live while it pins amplitude, so
      // a reduced-motion visitor still gets the arrival, just without churn.
      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          surfaceDriver.hue = self.progress * 0.85;
        },
      });

      if (!prefersReducedMotion()) {
        gsap.set("[data-reveal]", { opacity: 0, y: 14 });
        gsap.to("[data-reveal]", {
          opacity: 1,
          y: 0,
          duration: DUR.m,
          ease: EASE.enter,
          stagger: STAGGER * 2,
          scrollTrigger: { trigger: root.current, start: "top 70%" },
        });
      }
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} data-meander-end>
      <p
        data-reveal
        className="text-[0.68rem] uppercase tracking-[0.35em] text-ink-muted"
        style={{ fontFamily: BODY }}
      >
        Contact
      </p>
      <h2
        data-reveal
        className="mt-6 max-w-[20ch] leading-[1.05]"
        style={{
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontStretch: "115%",
          fontSize: "clamp(2rem, 4vw, 3.4rem)",
        }}
      >
        The door is open.
      </h2>
      {/* block: without it the top margin has no effect on an inline anchor. */}
      <a
        data-reveal
        href="mailto:olayinkacodes@gmail.com"
        className="mt-8 block w-fit text-accent underline underline-offset-8"
        style={{ fontFamily: BODY, fontSize: "1.05rem" }}
      >
        olayinkacodes@gmail.com
      </a>
      <div
        data-reveal
        className="mt-10 flex gap-8 text-[0.72rem] uppercase tracking-[0.25em] text-ink-muted"
        style={{ fontFamily: BODY }}
      >
        {SOCIALS.map((s) => (
          <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
            {s.label}
          </a>
        ))}
      </div>
      <p
        data-reveal
        className="mt-16 text-[0.62rem] uppercase tracking-[0.3em] text-ink/60"
        style={{ fontFamily: BODY }}
      >
        © 2026 theactualdev
      </p>
    </div>
  );
}
