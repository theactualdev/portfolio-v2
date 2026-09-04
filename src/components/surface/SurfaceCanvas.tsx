"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { surfaceVert, surfaceFrag } from "./surface.glsl";
import { markSurfaceLive, REST_AMP } from "./surfaceDriver";

type Props = {
  amplitude?: number;
  hueShift?: number;
  still?: boolean;
  stillTime?: number;
  /**
   * Mutable per-frame channel (see `surfaceDriver.ts`). When supplied it takes
   * precedence over the `amplitude`/`hueShift` props: page choreography writes
   * it inside GSAP onUpdate callbacks and the render loop reads it, so driving
   * the surface costs zero React renders.
   */
  driver?: { amp: number; hue: number };
};

/**
 * This was three.js + react-three-fiber until the load cost stopped being
 * defensible.
 *
 * The surface draws ONE fullscreen quad with ONE fragment shader. Everything
 * three provided for that — a scene graph, a camera, materials, loaders, its
 * whole math library — went unused: the vertex shader writes clip space
 * directly and never touches a matrix. Measured on the deployed site, that
 * cost a 237KB gzipped chunk which, because it had to be code-split to keep it
 * off the critical path, was not referenced in the HTML at all. The browser
 * could not discover it until the main bundle had downloaded, parsed and run,
 * so it was requested at ~2333ms and the field did not exist until ~3650ms —
 * on a page whose entire brief is being stopped within two seconds.
 *
 * Against the raw WebGL API the same output has no dependency at all, which
 * means it ships in the main bundle: no lazy chunk, no waterfall, nothing to
 * preload.
 *
 * `surface.glsl.ts` is deliberately untouched by this change — it is the
 * signature, and the whole point is that it was never the expensive part.
 */

/**
 * Declarations three used to prepend to every ShaderMaterial.
 *
 * The shader source is GLSL ES 1.00 (`varying`, `gl_FragColor`) and reads the
 * `position` and `uv` attributes by three's names, so supplying them here
 * keeps that file byte-identical. `position` is declared vec2 rather than
 * three's vec3 because the shader only ever reads `.xy`, and a quad drawn in
 * clip space has no depth to carry.
 */
const VERT_PRELUDE = `precision highp float;
attribute vec2 position;
attribute vec2 uv;
`;

/**
 * Mirrors three's precision handling: highp wherever it exists — the fbm
 * accumulates enough that mediump adds banding on top of what the shader's
 * dither is already fighting — with a mediump fallback for hardware that lacks
 * it, rather than a shader that fails to compile.
 */
const FRAG_PRELUDE = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`;

/**
 * alpha:true so the canvas is transparent until the first frame lands and the
 * container's ground colour shows through. An opaque drawing buffer clears to
 * black before the first draw, which is a different colour from the ground and
 * would flash exactly where the old placeholder swap was tuned not to.
 *
 * No depth or stencil buffer: one quad, nothing to sort.
 */
const GL_ATTRS: WebGLContextAttributes = {
  alpha: true,
  antialias: false,
  depth: false,
  stencil: false,
  powerPreference: "high-performance",
};

/** A fullscreen quad in clip space, carrying the uv orientation three's
 *  planeGeometry produced: v increases upward, origin bottom-left. */
const QUAD_POS = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
const QUAD_UV = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);

const UNIFORM_NAMES = [
  "uTime", "uAmp", "uHue", "uStillTime",
  "uPointer", "uVel", "uRes", "uQuality",
] as const;

type UniformName = (typeof UNIFORM_NAMES)[number];
type Locations = Record<UniformName, WebGLUniformLocation | null>;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // A shader that will not compile means no field at all, so say why rather
    // than leaving a silently blank background.
    console.error("[surface] shader failed to compile:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function buildProgram(gl: WebGLRenderingContext) {
  const vs = compile(gl, gl.VERTEX_SHADER, VERT_PRELUDE + surfaceVert);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_PRELUDE + surfaceFrag);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  // Attached to the program now, and not needed on their own any more.
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("[surface] program failed to link:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

/** One-off probe, kept from the three implementation: decide before mounting
 *  rather than letting context creation throw. */
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

export default function SurfaceCanvas({
  amplitude = 0,
  hueShift = 0,
  still = false,
  stillTime = 2.4,
  driver,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const frozen = still || reduced;

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
   * The render loop must see current props without the GL context being torn
   * down and rebuilt whenever one changes — that would restart the clock and
   * drop the field mid-ceremony. It reads this ref instead, which is the same
   * arrangement `driver` already uses for the same reason.
   */
  const live = useRef({ amplitude, hueShift, frozen, stillTime, driver, fullQuality });

  /**
   * Synced in an effect rather than during render — `react-hooks/refs` rejects
   * writing a ref while rendering, and there is nothing to gain from it here:
   * useRef's initial value already covers the first frame, and every later
   * change is picked up by the next animation frame either way. Declared above
   * the GL effect so it runs first on mount.
   */
  useEffect(() => {
    live.current = { amplitude, hueShift, frozen, stillTime, driver, fullQuality };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !supported) return;

    // webgl2 preferred, webgl accepted. The shader is GLSL ES 1.00, which both
    // compile, so there is nothing to branch on beyond getting a context.
    const gl = (canvas.getContext("webgl2", GL_ATTRS) ??
      canvas.getContext("webgl", GL_ATTRS)) as WebGLRenderingContext | null;
    if (!gl) return;

    const program = buildProgram(gl);
    if (!program) return;

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD_POS, gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD_UV, gl.STATIC_DRAW);
    const uvLoc = gl.getAttribLocation(program, "uv");
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

    const loc = Object.fromEntries(
      UNIFORM_NAMES.map((n) => [n, gl.getUniformLocation(program, n)])
    ) as Locations;

    gl.useProgram(program);

    /**
     * Pointer is tracked on `window`, not on the canvas.
     *
     * This canvas is a fixed, -z-10 page background, so `<main>` sits on top of
     * it and swallows every pointer event that lands on the page. Listening on
     * the canvas would mean the surface never reacted at all. (Under three this
     * was verified by freezing the clock and hashing frames with the pointer at
     * opposite corners: byte-identical.)
     *
     * Window-level tracking is also the behaviour the design actually wants:
     * the surface should notice you while you are over text and links, not only
     * over bare canvas.
     */
    let targetX = 0.5;
    let targetY = 0.5;
    let pointerX = 0.5;
    let pointerY = 0.5;
    let vel = 0;

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX / window.innerWidth;
      targetY = 1 - e.clientY / window.innerHeight; // UV origin is bottom-left
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    /**
     * DPR is pinned to 1. The field is entirely low-frequency (fbm, gaussian
     * lens, vignette), so supersampling detail that does not exist would cost
     * 2.25x the fragments on a phone for nothing visible.
     */
    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth));
      const h = Math.max(1, Math.round(canvas.clientHeight));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    let last = performance.now();
    let time = 0;
    let painted = false;
    let lost = false;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const delta = (now - last) / 1000;
      last = now;

      const s = live.current;
      // Read the mutable channel fresh every frame — that is the whole point of
      // it. Props remain the fallback for the dev routes and for any consumer
      // that has nothing to choreograph.
      const amp = s.driver ? s.driver.amp : s.amplitude;
      const hue = s.driver ? s.driver.hue : s.hueShift;

      const prevX = pointerX;
      const prevY = pointerY;
      pointerX += (targetX - pointerX) * 0.18; // answers within ~150ms
      pointerY += (targetY - pointerY) * 0.18;
      const moved = Math.hypot(pointerX - prevX, pointerY - prevY) * 40;
      vel += (moved - vel) * 0.2;

      time += delta;
      gl.uniform1f(loc.uTime, time);
      gl.uniform1f(loc.uHue, hue); // colour, not motion — the accent still lands
      gl.uniform1f(loc.uStillTime, s.frozen ? s.stillTime : -1);

      if (s.frozen) {
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
         *
         * Amplitude rests at REST_AMP rather than 0, which is a fix, not a
         * transcription of what three did. `uAmp` used to drive the domain warp
         * alone, so pinning it to 0 meant "unwarped" and the still frame was
         * the designed composition. The presence ramp then gave amplitude a
         * second job — `presence = smoothstep(0.0, REST_AMP, uAmp)` — and 0
         * started meaning ABSENT. This branch was never updated, so every
         * reduced-motion visitor got a flat fill: measured on the deployed
         * build at stddev 0.626 with all channels inside 8-10 of 255, against
         * 8.03 for the live field. Resting at REST_AMP saturates presence and
         * holds the resting warp, so the frame is the approved composition
         * while every motion input stays pinned.
         */
        gl.uniform1f(loc.uAmp, REST_AMP);
        gl.uniform2f(loc.uPointer, 0.5, 0.5);
        gl.uniform1f(loc.uVel, 0);
      } else {
        gl.uniform1f(loc.uAmp, amp);
        gl.uniform2f(loc.uPointer, pointerX, pointerY);
        gl.uniform1f(loc.uVel, Math.min(vel, 1));
      }

      gl.uniform2f(loc.uRes, canvas.width, canvas.height);
      gl.uniform1f(loc.uQuality, s.fullQuality ? 1 : 0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (!painted) {
        painted = true;
        // Announced after the first draw rather than before it: the signal's
        // whole purpose is that the field is actually on screen, and the
        // ceremony's breath is timed against it.
        markSurfaceLive();
      }
    };
    raf = requestAnimationFrame(frame);

    /**
     * A lost context is not rare on mobile — backgrounding the tab under memory
     * pressure is enough. Without these the background would stay permanently
     * blank after one, which would be a worse regression than any load time
     * this rewrite buys back.
     */
    const onLost = (e: Event) => {
      e.preventDefault(); // required, or the context is never restorable
      lost = true;
      cancelAnimationFrame(raf);
    };
    const onRestored = () => {
      if (!lost) return;
      lost = false;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      gl.deleteBuffer(posBuf);
      gl.deleteBuffer(uvBuf);
      gl.deleteProgram(program);
      // Free the GPU allocation immediately rather than waiting for GC.
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [supported]);

  if (!supported) {
    // Same visual family as the shader's resting state — a soft warm pool on
    // the ground colour — so a machine without WebGL still gets a composition.
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-ground"
        style={{
          backgroundImage:
            "radial-gradient(60% 45% at 55% 45%, #1b1613 0%, #0f0d0b 55%, #0a0a0b 100%)",
        }}
      />
    );
  }

  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 bg-ground">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
