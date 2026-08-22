"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
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
    }),
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

export default function SurfaceCanvas(props: Props) {
  return (
    <div className="fixed inset-0 -z-10 bg-ground">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        // Static fallback when WebGL is unavailable — same visual family.
        fallback={<div className="absolute inset-0 bg-ground" />}
      >
        <SurfacePlane {...props} />
      </Canvas>
    </div>
  );
}
