"use client";

/**
 * Meander-as-structure prototype (dev only).
 *
 * Demonstrates the whole Greek theme as one idea: a single unbroken cream
 * hairline running the page's full length, turning at each section boundary,
 * drawing itself as you scroll — rigid order over the liquid field.
 *
 * Section labels are plain English on purpose. The verification pass killed the
 * Greek section names (Ethos/Erga/Xenia): three registers of foreignness in one
 * nav reads as decoration, and untranslated words in navigation are a status
 * signal. The theme is never named.
 */

import { useState } from "react";
import SurfaceCanvas from "@/components/surface/SurfaceCanvas";
import GreekCursor from "@/components/cursor/GreekCursor";
import MeanderLine from "@/components/meander/MeanderLine";
import "../specimens/fonts.css";

const ARCHIVO =
  "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap";

const BODY = '"General Sans", system-ui, sans-serif';
const DISPLAY = '"Archivo", system-ui, sans-serif';

const WORK = [
  { n: "01", name: "MSE LUX", note: "E-commerce, Paystack, Prisma" },
  { n: "02", name: "Bleachers", note: "Event-sourced PWA, NestJS" },
  { n: "03", name: "Nevo", note: "Founding frontend engineer" },
  { n: "04", name: "GPA Calculator", note: "Vite, React" },
  { n: "05", name: "FaceBlur", note: "In-browser AI blurring" },
];

export default function MeanderPrototype() {
  const [amp] = useState(0.26);
  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="relative text-ink">
      <link rel="stylesheet" href={ARCHIVO} />
      <SurfaceCanvas amplitude={amp} />
      <GreekCursor variant="meander" />
      <MeanderLine />

      {/* --- hero --- */}
      <section
        data-meander-section
        className="relative z-20 flex min-h-screen flex-col justify-center"
        style={{ paddingLeft: "calc(6vw + 96px)", paddingRight: "7vw" }}
      >
        <p className="text-[0.72rem] uppercase tracking-[0.35em] text-ink-muted" style={{ fontFamily: BODY }}>
          Ayodele Olayinka&ensp;·&ensp;Frontend Engineer
        </p>
        <h1
          className="mt-5 max-w-[24ch] leading-[1.06]"
          style={{
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontStretch: "115%",
            letterSpacing: "-0.015em",
            fontSize: "clamp(1.9rem, 3.2vw, 2.9rem)",
          }}
        >
          I build interfaces that pay attention.
        </h1>
        <p className="mt-6 max-w-[44ch] text-[1.02rem] leading-relaxed text-ink-muted" style={{ fontFamily: BODY }}>
          React, Next.js, TypeScript. Founding frontend engineer at Nevo.
          Lagos&thinsp;→&thinsp;anywhere.
        </p>
        <p className="mt-10 text-[0.72rem] uppercase tracking-[0.3em] text-ink-muted/60" style={{ fontFamily: BODY }}>
          Scroll — the line draws itself
        </p>
      </section>

      {/* --- about --- */}
      <section
        data-meander-section
        className="relative z-20 flex min-h-screen flex-col justify-center"
        style={{ paddingLeft: "calc(6vw + 96px)", paddingRight: "7vw" }}
      >
        <p className="text-[0.68rem] uppercase tracking-[0.35em] text-ink-muted" style={{ fontFamily: BODY }}>
          About
        </p>
        <p
          className="mt-6 max-w-[34ch] leading-[1.25]"
          style={{ fontFamily: DISPLAY, fontWeight: 600, fontStretch: "110%", fontSize: "clamp(1.4rem, 2.4vw, 2.1rem)" }}
        >
          Four years turning specifications into interfaces people
          actually finish using.
        </p>
        <p className="mt-6 max-w-[46ch] text-[1rem] leading-relaxed text-ink-muted" style={{ fontFamily: BODY }}>
          Most recently at Nevo, building an adaptive learning platform from
          the first commit. Before that, e-commerce and event-sourced systems.
        </p>
      </section>

      {/* --- work --- */}
      <section
        data-meander-section
        className="relative z-20 flex min-h-screen flex-col justify-center"
        style={{ paddingLeft: "calc(6vw + 96px)", paddingRight: "7vw" }}
      >
        <p className="text-[0.68rem] uppercase tracking-[0.35em] text-ink-muted" style={{ fontFamily: BODY }}>
          Selected work
        </p>
        <ul className="mt-8 max-w-[52ch]">
          {WORK.map((w) => (
            <li key={w.n} className="border-t border-ink/10">
              <a
                href="#"
                className="group flex items-baseline gap-6 py-5 no-underline"
                style={{ fontFamily: BODY }}
              >
                <span className="text-[0.7rem] tracking-[0.25em] text-ink-muted">{w.n}</span>
                <span
                  className="flex-1 transition-transform duration-300 group-hover:translate-x-2"
                  style={{ fontFamily: DISPLAY, fontWeight: 600, fontStretch: "110%", fontSize: "1.2rem" }}
                >
                  {w.name}
                </span>
                <span className="text-[0.8rem] text-ink-muted">{w.note}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* --- footer: the finale --- */}
      <section
        data-meander-section
        className="relative z-20 flex min-h-screen flex-col justify-center"
        style={{ paddingLeft: "calc(6vw + 96px)", paddingRight: "7vw" }}
      >
        <p className="text-[0.68rem] uppercase tracking-[0.35em] text-ink-muted" style={{ fontFamily: BODY }}>
          Contact
        </p>
        <h2
          className="mt-6 max-w-[20ch] leading-[1.05]"
          style={{ fontFamily: DISPLAY, fontWeight: 700, fontStretch: "115%", fontSize: "clamp(2rem, 4vw, 3.4rem)" }}
        >
          The door is open.
        </h2>
        <a
          href="mailto:olayinkacodes@gmail.com"
          className="mt-8 w-fit text-accent underline underline-offset-8"
          style={{ fontFamily: BODY, fontSize: "1.05rem" }}
        >
          olayinkacodes@gmail.com
        </a>
      </section>
    </div>
  );
}
