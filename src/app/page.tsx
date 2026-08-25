"use client";

import SurfaceLazy from "@/components/surface/SurfaceLazy";
import GreekCursor from "@/components/cursor/GreekCursor";
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

      <header className="fixed inset-x-0 top-0 z-20 flex items-baseline justify-between px-[6vw] py-6 text-[0.68rem] uppercase tracking-[0.35em] text-ink-muted" style={{ fontFamily: "var(--font-body)" }}>
        <span data-line>theactualdev</span>
        <span data-line>Available for work</span>
      </header>

      <main id="main" className="relative z-10">
        <section id="hero" data-meander-section className="flex min-h-screen flex-col justify-center px-[7vw] md:pl-[calc(6vw+96px)]" />
        <section id="about" data-meander-section className="flex min-h-screen flex-col justify-center px-[7vw] md:pl-[calc(6vw+96px)]" />
        <section id="work" data-meander-section className="flex min-h-screen flex-col justify-center px-[7vw] md:pl-[calc(6vw+96px)]" />
        <section id="contact" data-meander-section className="flex min-h-screen flex-col justify-center px-[7vw] md:pl-[calc(6vw+96px)]" />
      </main>
    </div>
  );
}
