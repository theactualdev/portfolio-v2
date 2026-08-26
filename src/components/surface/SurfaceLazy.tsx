"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const SurfaceCanvas = dynamic(() => import("./SurfaceCanvas"), {
  ssr: false,
  // Same visual family as the surface's resting state, so the swap is a
  // cross-fade in feel rather than a pop. Fixed background => zero CLS.
  loading: () => (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 bg-ground"
      style={{
        backgroundImage:
          // Same warmed values as SurfaceCanvas's no-WebGL fallback — the cool
          // #17161a original was corrected in Phase 1; do not reintroduce it.
          "radial-gradient(60% 45% at 55% 45%, #1b1613 0%, #0f0d0b 55%, #0a0a0b 100%)",
      }}
    />
  ),
});

export default function SurfaceLazy(props: ComponentProps<typeof SurfaceCanvas>) {
  return <SurfaceCanvas {...props} />;
}
