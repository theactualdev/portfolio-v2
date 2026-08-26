"use client";

import { notFound } from "next/navigation";

import { useState } from "react";
import SurfaceCanvas from "@/components/surface/SurfaceCanvas";

export default function SpikeSurface() {
  const [amp, setAmp] = useState(0.3);
  const [hue, setHue] = useState(0);
  const [still, setStill] = useState(false);
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="min-h-screen">
      <SurfaceCanvas amplitude={amp} hueShift={hue} still={still} />
      <div className="fixed bottom-6 left-6 flex flex-col gap-2 text-xs text-ink-muted">
        <label>amp {amp.toFixed(2)}<input type="range" min={0} max={1} step={0.01} value={amp} onChange={(e) => setAmp(+e.target.value)} /></label>
        <label>hue {hue.toFixed(2)}<input type="range" min={0} max={1} step={0.01} value={hue} onChange={(e) => setHue(+e.target.value)} /></label>
        <label><input type="checkbox" checked={still} onChange={(e) => setStill(e.target.checked)} /> still frame</label>
      </div>
    </main>
  );
}
