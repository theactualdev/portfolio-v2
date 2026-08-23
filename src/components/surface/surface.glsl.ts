/**
 * Fullscreen quad: positions are already in NDC, so skip the camera matrices.
 * A 2x2 planeGeometry spans exactly clip space, which is why this works.
 */
export const surfaceVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

/**
 * "A dark, expensive surface that notices you."
 *
 * A slow, domain-warped fbm field reading as viscous dark liquid, with a
 * refractive lens under the pointer and a warm specular glint trailing it.
 *
 * Knobs (all driven from SurfaceCanvas):
 *   uAmp       0..1  turbulence — scroll-driven. 0 = nearly still, 1 = churning.
 *   uHue       0..1  warmth — 0 the resting ground, 1 the amber footer finale.
 *                    (The ground is very slightly cool by design; "neutral" here
 *                    means "no amber applied", not "R==G==B".)
 *   uPointer   uv    pointer position, already smoothed toward the real cursor.
 *   uVel       0..1  pointer speed — drives how hard the lens bites.
 *   uStillTime  -1   run live;  >= 0  freeze the clock AT that time (the
 *                    designed reduced-motion frame, chosen not accidental).
 *   uRes       px    drawing-buffer size, for aspect correction and dither.
 *   uQuality   0|1   1 = two-level warp (pointer devices), 0 = one level.
 *                    Set from pointer capability, not from screen size alone.
 *
 * Why the pieces are here:
 *   - Domain warp (two levels) is what makes it read as liquid rather than a
 *     gradient with noise on top. One level looks like fog; three costs more
 *     than the frame budget allows.
 *   - The dither at the end is not decoration. Near-black gradients quantise
 *     into visible concentric bands in 8-bit; sub-LSB noise breaks them up.
 *     Remove it and the rings come straight back.
 */
export const surfaceFrag = /* glsl */ `
uniform float uTime; uniform float uAmp; uniform float uHue; uniform float uStillTime;
uniform vec2 uPointer; uniform float uVel; uniform vec2 uRes; uniform float uQuality;
varying vec2 vUv;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }

float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1.0,0.0)), f.x),
             mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), f.x), f.y);
}

// 3 octaves is the most we can afford at 2x DPR and still hold the frame budget.
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { v += a*noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

void main(){
  vec2 asp = vec2(uRes.x/uRes.y, 1.0);
  float t = uStillTime >= 0.0 ? uStillTime : uTime;

  vec2 uv = vUv;

  // --- pointer lens: bend the field toward the cursor, harder when moving ---
  vec2 toP = (uv - uPointer) * asp;
  float d  = length(toP);
  float lens = exp(-d*d*14.0);
  vec2 dir = d > 0.0001 ? toP/d : vec2(0.0);
  uv -= dir * lens * (0.020 + uVel*0.030) / asp;

  // --- domain-warped fbm: two levels, which is what reads as liquid ---
  vec2 p = uv * vec2(2.6, 2.0);
  float drift = t * 0.045;
  vec2 q = vec2(fbm(p + vec2(0.0, drift)),
                fbm(p + vec2(5.2, 1.3) - drift));
  float warp = 1.10 + uAmp * 1.30;
  // Second warp level is what sells "liquid", but it costs 2 more fbm calls.
  // Touch devices have no pointer, so the signature interaction is absent
  // there anyway — one level is the honest tier, not a degraded one.
  vec2 s2 = q;
  if (uQuality > 0.5) {
    s2 = vec2(fbm(p + warp*q + vec2(1.7, 9.2) + drift*0.7),
              fbm(p + warp*q + vec2(8.3, 2.8) - drift*0.5));
  }
  float f = fbm(p + warp*s2);

  // push contrast so the structure is legible at these luminances
  f = smoothstep(0.24, 0.78, f);

  // --- palette: stays near-black, but with real highlights to catch light ---
  vec3 deep  = vec3(0.038, 0.038, 0.044);
  vec3 mid   = vec3(0.105, 0.105, 0.120);
  vec3 high  = vec3(0.235, 0.228, 0.218);
  vec3 amber = vec3(0.851, 0.643, 0.255);

  vec3 col = mix(deep, mid, smoothstep(0.05, 0.55, f));
  col = mix(col, high, smoothstep(0.52, 0.92, f));

  // warmth rises with uHue — the accent's payoff at the footer
  col = mix(col, mix(col, amber, 0.20), uHue);

  // --- specular glint: the "it noticed you" moment ---
  float spec = pow(lens, 1.6) * (0.10 + uVel*0.55);
  col += amber * spec * (0.55 + 0.45*uHue);
  // faint cool rim just outside the lens, so the bite has an edge
  col += vec3(0.10, 0.11, 0.13) * pow(max(lens - 0.25, 0.0), 2.0) * 0.5;

  // --- vignette, generous so it never reads as a ring ---
  float vig = 1.0 - smoothstep(0.55, 1.60, length((uv-0.5)*asp*1.7));
  col *= mix(0.84, 1.0, vig);

  // --- dither: breaks 8-bit banding in the near-black ramp (see header) ---
  float dth = (hash(gl_FragCoord.xy + fract(t)) - 0.5) / 255.0;
  col += dth;

  gl_FragColor = vec4(col, 1.0);
}`;
