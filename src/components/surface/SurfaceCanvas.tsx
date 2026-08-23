"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import * as THREE from "three";
import { surfaceVert, surfaceFrag } from "./surface.glsl";

type Props = { amplitude?: number; hueShift?: number; still?: boolean; stillTime?: number };

/**
 * The uniform map, named so the per-frame writer can re-type the material's
 * loosely typed `uniforms` record without touching the memoized object by
 * name (see the note on the useFrame body below).
 */
type SurfaceUniforms = {
  uTime: { value: number };
  uAmp: { value: number };
  uHue: { value: number };
  uStillTime: { value: number };
  uPointer: { value: THREE.Vector2 };
  uVel: { value: number };
  uRes: { value: THREE.Vector2 };
  uQuality: { value: number };
};

function SurfacePlane({ amplitude = 0, hueShift = 0, still = false, stillTime = 2.4 }: Props) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { size, viewport } = useThree();
  const pointer = useRef(new THREE.Vector2(0.5, 0.5));
  const target = useRef(new THREE.Vector2(0.5, 0.5));
  const vel = useRef(0);

  const uniforms = useMemo<SurfaceUniforms>(
    () => ({
      uTime: { value: 0 }, uAmp: { value: 0 }, uHue: { value: 0 },
      uStillTime: { value: -1 }, uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uVel: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) },
      uQuality: { value: 1 },
    }),
    []
  );

  /**
   * Full quality means the two-level domain warp. It is gated on a real
   * pointer rather than on screen width: the surface's whole signature is
   * reacting to a cursor, and a device without one is not being given a
   * degraded experience by drawing a simpler field. Measured: the second
   * warp level cost mobile 58 -> 35 fps under 4x CPU throttle.
   */
  const fullQuality = useMemo(
    () =>
      typeof window === "undefined" ||
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    []
  );

  /**
   * Pointer is tracked on `window`, NOT via R3F's `state.pointer`.
   *
   * R3F only updates `state.pointer` from events landing on its own canvas.
   * This canvas is a fixed, -z-10 page background, so `<main>` sits on top of
   * it and swallows every pointer event — `state.pointer` never moved, and the
   * surface never reacted. (Verified by freezing the clock and hashing frames
   * with the pointer at opposite corners: byte-identical.)
   *
   * Window-level tracking is also the behaviour the design actually wants: the
   * surface should notice you while you are over text and links, not only over
   * bare canvas.
   */
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      target.current.set(
        e.clientX / window.innerWidth,
        1 - e.clientY / window.innerHeight // UV origin is bottom-left
      );
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  /**
   * Uniforms are written through the material ref, not through the memoized
   * `uniforms` local. It is the same object either way — three keeps the map
   * we handed it — but `react-hooks/immutability` (on by default in
   * eslint-config-next 16) rejects mutating a useMemo result inside a
   * callback, and per-frame uniform mutation is exactly how R3F is meant to
   * be driven. Reading it off the ref keeps the canonical pattern and the
   * lint gate.
   */
  useFrame((state, delta) => {
    const u = mat.current?.uniforms as SurfaceUniforms | undefined;
    if (!u) return;
    const prev = pointer.current.clone();
    pointer.current.lerp(target.current, 0.18); // answers within ~150ms
    vel.current = THREE.MathUtils.lerp(vel.current, prev.distanceTo(pointer.current) * 40, 0.2);

    u.uTime.value += delta;
    u.uHue.value = hueShift; // colour, not motion — the accent payoff still lands
    u.uStillTime.value = still ? stillTime : -1;

    if (still) {
      /**
       * Freezing the clock alone is NOT parity. `t` is one of five inputs to
       * the composition: `uAmp` (scroll-driven) re-warps the whole field, and
       * the pointer lens displaces uv *before* the fbm is sampled. A frozen
       * field being dragged by a live lens looks worse than a live one — the
       * live field absorbs the distortion into its own flow, the frozen one
       * just smears. Measured before this guard: pointer movement under
       * reduce-motion produced a mean delta of 2.284, the same magnitude as
       * the normal pointer response.
       *
       * So the still frame pins every motion input and holds the designed
       * composition. Hue is deliberately left live — it is colour, not motion.
       */
      u.uAmp.value = 0;
      u.uPointer.value.set(0.5, 0.5);
      u.uVel.value = 0;
    } else {
      u.uAmp.value = amplitude;
      u.uPointer.value.copy(pointer.current);
      u.uVel.value = Math.min(vel.current, 1);
    }
    u.uRes.value.set(size.width, size.height);
    u.uQuality.value = fullQuality ? 1 : 0;
    void viewport;
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        vertexShader={surfaceVert}
        fragmentShader={surfaceFrag}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

/** One-off probe. R3F's `fallback` renders a replacement but three still
 *  throws "Error creating WebGL context" first, so decide before mounting. */
function webglAvailable() {
  if (typeof document === "undefined") return true; // assume yes during SSR
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** matchMedia as an external store, so no setState happens inside an effect. */
function subscribeMedia(query: string) {
  return (onChange: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  };
}

const subscribeReducedMotion = subscribeMedia("(prefers-reduced-motion: reduce)");
const noopSubscribe = () => () => {};

export default function SurfaceCanvas(props: Props) {
  /**
   * WebGL support and reduced-motion are both external state, read through
   * useSyncExternalStore rather than an effect + setState. The server
   * snapshots keep hydration stable: assume WebGL is present and motion is
   * allowed, then correct on the client if either is false.
   */
  const supported = useSyncExternalStore(noopSubscribe, webglAvailable, () => true);

  /**
   * Reduced motion is designed parity, not a switch-off: the field freezes at
   * a chosen frame (`stillTime`) rather than disappearing, so the composition
   * is still the one we designed. Watched live, matching SmoothScroll.
   */
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );

  if (!supported) {
    // Same visual family as the shader's resting state — a soft warm pool on
    // the ground colour — so a machine without WebGL still gets a composition.
    return (
      <div
        className="fixed inset-0 -z-10 bg-ground"
        style={{
          backgroundImage:
            "radial-gradient(60% 45% at 55% 45%, #1b1613 0%, #0f0d0b 55%, #0a0a0b 100%)",
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 -z-10 bg-ground">
      <Canvas
        // Field is entirely low-frequency (fbm, gaussian lens, vignette), so a
        // 1.5 cap supersamples detail that does not exist while costing 2.25x
        // the fragments on a phone. Capped at 1 until a measured reason exists.
        dpr={[1, 1]}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        fallback={<div className="absolute inset-0 bg-ground" />}
      >
        <SurfacePlane {...props} still={props.still || reduced} />
      </Canvas>
    </div>
  );
}
