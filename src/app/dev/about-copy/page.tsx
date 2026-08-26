"use client";

import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import SurfaceLazy from "@/components/surface/SurfaceLazy";
import ScrollTurbulence from "@/components/surface/ScrollTurbulence";
import GreekCursor from "@/components/cursor/GreekCursor";
import MeanderLine from "@/components/meander/MeanderLine";
import Header from "@/components/chrome/Header";
import { surfaceDriver, REST_AMP } from "@/components/surface/surfaceDriver";

/**
 * Dev bench: the two About framings, in the real composition.
 *
 * Judged live and in place rather than as text in a chat, because that is the
 * only elicitation that has worked on this project — and because copy over a
 * moving field at real type sizes reads nothing like copy in a list.
 *
 * Press A / B, or click anywhere, to swap. Everything else — position, field,
 * spine, type — is held constant so the words are the only variable.
 */

const BODY = "var(--font-body), system-ui, sans-serif";
const DISPLAY = "var(--font-display), system-ui, sans-serif";

const VARIANTS = {
  A: {
    lead: "Shipping production frontend since 2023.",
    body: (
      <>
        Founding frontend engineer at Nevo, building an adaptive learning
        platform from the first commit — while finishing a Computer Science
        degree at the University of Lagos. Before that,{" "}
        <span className="whitespace-nowrap">e-commerce</span> and event-sourced
        systems.
      </>
    ),
  },
  B: {
    lead: "At Nevo since the first commit.",
    body: (
      <>
        Founding frontend engineer on an adaptive learning platform students use
        in school pilots — on mid-range Android phones and unreliable
        connections, which is where interface decisions actually get tested.
        Computer Science at the University of Lagos in the meantime. Before
        Nevo, <span className="whitespace-nowrap">e-commerce</span> and
        event-sourced systems.
      </>
    ),
  },
} as const;

type Key = keyof typeof VARIANTS;

export default function AboutCopyBench() {
  const [key, setKey] = useState<Key>("B");

  useEffect(() => {
    // The ceremony lives in Hero, which is not mounted here — wake the field
    // directly so the copy is judged over the surface at its real rest state.
    surfaceDriver.amp = REST_AMP;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "a" || e.key === "A") setKey("A");
      if (e.key === "b" || e.key === "B") setKey("B");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (process.env.NODE_ENV === "production") notFound();

  const v = VARIANTS[key];

  return (
    <div
      className="relative text-ink"
      onClick={() => setKey((k) => (k === "A" ? "B" : "A"))}
    >
      <SurfaceLazy driver={surfaceDriver} />
      <ScrollTurbulence />
      <GreekCursor variant="meander" />
      <MeanderLine />
      <Header />

      <main className="relative z-10">
        {/* Same classes as the real page's sections — the composition has to
            be identical or the comparison is worthless. */}
        <section
          data-meander-section
          className="flex min-h-screen flex-col justify-center pr-[7vw] pl-[calc(6vw+min(56px,9vw)+18px)]"
        >
          <p
            className="text-[0.68rem] uppercase tracking-[0.35em] text-ink-muted"
            style={{ fontFamily: BODY }}
          >
            About
          </p>
          <p
            className="mt-6 max-w-[34ch] leading-[1.25]"
            style={{
              fontFamily: DISPLAY,
              fontWeight: 600,
              fontStretch: "110%",
              fontSize: "clamp(1.4rem, 2.4vw, 2.1rem)",
            }}
          >
            {v.lead}
          </p>
          <p
            className="mt-6 max-w-[46ch] text-[1rem] leading-relaxed text-ink-muted"
            style={{ fontFamily: BODY }}
          >
            {v.body}
          </p>
        </section>

        {/* A second screen so the meander has a boundary to turn at, exactly
            as it does on the real page. */}
        <section data-meander-section className="min-h-screen" />
      </main>

      {/* Dev affordance only — never ships. */}
      <p
        className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 text-[0.62rem] uppercase tracking-[0.3em] text-ink-muted"
        style={{ fontFamily: BODY }}
      >
        Showing {key} — press A / B, or click, to swap
      </p>
    </div>
  );
}
