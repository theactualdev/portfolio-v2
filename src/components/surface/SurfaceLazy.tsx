"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const SurfaceCanvas = dynamic(() => import("./SurfaceCanvas"), {
  ssr: false,
  /**
   * Flat ground, deliberately — it matches the surface's own amp-0 frame
   * exactly, so there is nothing to see across the swap.
   *
   * This used to carry the no-WebGL fallback's radial gradient, on the theory
   * that matching the surface's RESTING state made the swap a cross-fade. It
   * did the opposite. The placeholder leaves the DOM on the same tick the
   * canvas is inserted, before R3F has sized or drawn it, so the measured
   * sequence was gradient -> flat ground for 200-450ms -> field, mid-ceremony;
   * and the gradient's own contrast was about a seventh of the shader's, so
   * even with no gap it was a ~7x jump. The field now materialises out of
   * exactly this colour instead (see the presence ramp in surface.glsl.ts).
   *
   * Fixed background => zero CLS.
   */
  loading: () => <div aria-hidden="true" className="fixed inset-0 -z-10 bg-ground" />,
});

export default function SurfaceLazy(props: ComponentProps<typeof SurfaceCanvas>) {
  return <SurfaceCanvas {...props} />;
}
