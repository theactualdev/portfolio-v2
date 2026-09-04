"use client";

import SurfaceCanvas from "@/components/surface/SurfaceCanvas";
import GreekCursor from "@/components/cursor/GreekCursor";
import Header from "@/components/chrome/Header";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Roles from "@/components/sections/Roles";
import Products from "@/components/sections/Products";
import Stack from "@/components/sections/Stack";
import Contact from "@/components/sections/Contact";
import ScrollTurbulence from "@/components/surface/ScrollTurbulence";
import MeanderLine from "@/components/meander/MeanderLine";
import { surfaceDriver } from "@/components/surface/surfaceDriver";

export default function Home() {
  return (
    <div className="relative text-ink">
      <a href="#main" className="skip-link" style={{ fontFamily: "var(--font-body)" }}>
        Skip to content
      </a>

      <SurfaceCanvas driver={surfaceDriver} />
      <ScrollTurbulence />
      <GreekCursor variant="meander" />
      <MeanderLine />

      {/* z-[6]: above every decorative layer (canvas -10, meander 5) but BELOW
          main (10) and header (20) — matching the approved prototype, where the
          lines animate in FRONT of the veil rather than filtered through it. */}
      <div data-veil className="fixed inset-0 z-[6] bg-ground pointer-events-none" />

      <Header />

      {/* tabIndex=-1 so activating the skip link MOVES FOCUS rather than only
          scrolling — there are 15 focusables behind it.

          Sections reserve the spine's lane at EVERY width. The reserving
          padding used to be md:-only while MeanderLine derives both lanes from
          vw unconditionally, so below 768px the hairline drew straight through
          the About and Contact copy and the amber terminus parked on the email
          link's underline. Both now come from the same expression. */}
      <main id="main" tabIndex={-1} className="relative z-10">
        <section id="hero" data-meander-section className="flex min-h-screen flex-col justify-center pr-[7vw] pl-[calc(6vw+min(56px,9vw)+18px)]">
          <Hero />
        </section>
        <section id="about" data-meander-section className="flex min-h-screen flex-col justify-center pr-[7vw] pl-[calc(6vw+min(56px,9vw)+18px)]">
          <About />
        </section>
        <section id="work" data-meander-section className="flex min-h-screen flex-col justify-center pr-[7vw] pl-[calc(6vw+min(56px,9vw)+18px)]">
          <Roles />
        </section>
        <section id="products" data-meander-section className="flex min-h-screen flex-col justify-center pr-[7vw] pl-[calc(6vw+min(56px,9vw)+18px)]">
          <Products />
        </section>
        <section id="stack" data-meander-section className="flex min-h-screen flex-col justify-center pr-[7vw] pl-[calc(6vw+min(56px,9vw)+18px)]">
          <Stack />
        </section>
        <section id="contact" data-meander-section className="flex min-h-screen flex-col justify-center pr-[7vw] pl-[calc(6vw+min(56px,9vw)+18px)]">
          <Contact />
        </section>
      </main>
    </div>
  );
}
