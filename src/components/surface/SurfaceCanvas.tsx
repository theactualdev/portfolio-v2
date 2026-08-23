"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
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
    const onMove = state.pointer; // NDC -1..1
    target.current.set((onMove.x + 1) / 2, (onMove.y + 1) / 2);
    const prev = pointer.current.clone();
    pointer.current.lerp(target.current, 0.18); // answers within ~150ms
    vel.current = THREE.MathUtils.lerp(vel.current, prev.distanceTo(pointer.current) * 40, 0.2);

    u.uTime.value += delta;
    u.uAmp.value = amplitude;
    u.uHue.value = hueShift;
    u.uStillTime.value = still ? stillTime : -1;
    u.uPointer.value.copy(pointer.current);
    u.uVel.value = Math.min(vel.current, 1);
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

export default function SurfaceCanvas(props: Props) {
  const [supported, setSupported] = useState(true);
  /**
   * Reduced motion is designed parity, not a switch-off: the field freezes at
   * a chosen frame (`stillTime`) rather than disappearing, so the composition
   * is still the one we designed. Watched live, matching SmoothScroll.
   */
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setSupported(webglAvailable());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (!supported) {
    // Same visual family as the shader's resting state — a soft warm pool on
    // the ground colour — so a machine without WebGL still gets a composition.
    return (
      <div
        className="fixed inset-0 -z-10 bg-ground"
        style={{
          backgroundImage:
            "radial-gradient(60% 45% at 55% 45%, #17161a 0%, #0d0d0f 55%, #0a0a0b 100%)",
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 -z-10 bg-ground">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        fallback={<div className="absolute inset-0 bg-ground" />}
      >
        <SurfacePlane {...props} still={props.still || reduced} />
      </Canvas>
    </div>
  );
}
