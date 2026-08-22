"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;
    let raf: ((time: number) => void) | null = null;

    const start = () => {
      if (lenis || mq.matches) return; // parity: native scroll when reduced
      lenis = new Lenis({ lerp: 0.1 });
      window.__lenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      raf = (time: number) => lenis?.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
    };
    const stop = () => {
      if (raf) gsap.ticker.remove(raf);
      lenis?.destroy();
      lenis = null;
      raf = null;
      delete window.__lenis;
    };
    const onChange = () => (mq.matches ? stop() : start());

    start();
    mq.addEventListener("change", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
      stop();
    };
  }, []);

  return <>{children}</>;
}
