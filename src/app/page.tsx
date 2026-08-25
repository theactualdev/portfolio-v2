"use client";

import SurfaceLazy from "@/components/surface/SurfaceLazy";
import GreekCursor from "@/components/cursor/GreekCursor";
import Hero from "@/components/sections/Hero";
import MeanderLine from "@/components/meander/MeanderLine";
import { surfaceDriver } from "@/components/surface/surfaceDriver";

export default function Home() {
  return (
    <div className="relative text-ink">
      <a href="#main" className="skip-link" style={{ fontFamily: "var(--font-body)" }}>
        Skip to content
      </a>

      <SurfaceLazy driver={surfaceDriver} />
      <GreekCursor variant="meander" />
      <MeanderLine />

      {/* z-[6]: above every decorative layer (canvas -10, meander 5) but BELOW
          main (10) and header (20) — matching the approved prototype, where the
          lines animate in FRONT of the veil rather than filtered through it. */}
      <div data-veil className="fixed inset-0 z-[6] bg-ground pointer-events-none" />

      {/* Tracking and size step down below sm: at 0.35em the two marks
          collided at 360px (7px apart, reading as one run-on string) and
          wrapped at 320px, the WCAG reflow width. */}
      <header className="fixed inset-x-0 top-0 z-20 flex items-baseline justify-between gap-3 px-[6vw] py-6 text-[0.6rem] uppercase tracking-[0.18em] text-ink-muted sm:text-[0.68rem] sm:tracking-[0.35em]" style={{ fontFamily: "var(--font-body)" }}>
        <span data-line>theactualdev</span>
        <span data-line>Available for work</span>
      </header>

      {/* tabIndex=-1 so activating the skip link MOVES FOCUS, not just
          scroll. Inert today (main is empty and unnamed), but Tasks 5-7 put
          ~15 focusables behind this link and the fix is free now. */}
      <main id="main" tabIndex={-1} className="relative z-10">
        <section id="hero" data-meander-section className="flex min-h-screen flex-col justify-center px-[7vw] md:pl-[calc(6vw+96px)]">
          <Hero />
        </section>
        <section id="about" data-meander-section className="flex min-h-screen flex-col justify-center px-[7vw] md:pl-[calc(6vw+96px)]" />
        <section id="work" data-meander-section className="flex min-h-screen flex-col justify-center px-[7vw] md:pl-[calc(6vw+96px)]" />
        <section id="contact" data-meander-section className="flex min-h-screen flex-col justify-center px-[7vw] md:pl-[calc(6vw+96px)]" />
      </main>
    </div>
  );
}
