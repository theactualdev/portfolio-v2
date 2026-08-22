/** Fullscreen quad: positions are already in NDC, so skip the camera matrices. */
export const surfaceVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

/**
 * Liquid dark surface.
 * Knobs: uAmp (scroll-driven turbulence), uPointer/uVel (cursor),
 * uHue (0 = neutral ground, 1 = amber finale), uStillTime (>=0 freezes the
 * clock AT that time — the designed still frame; -1.0 means "run live").
 */
export const surfaceFrag = /* glsl */ `
uniform float uTime; uniform float uAmp; uniform float uHue; uniform float uStillTime;
uniform vec2 uPointer; uniform float uVel; uniform vec2 uRes;
varying vec2 vUv;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),
             mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x), f.y); }

void main(){
  vec2 uv = vUv;
  // uStillTime >= 0 pins the clock to a chosen frame; -1 runs live.
  float t = uStillTime >= 0.0 ? uStillTime : uTime;
  vec2 asp = vec2(uRes.x/uRes.y, 1.0);
  float d = distance(uv*asp, uPointer*asp);
  float bump = exp(-d*9.0) * (0.35 + uVel*0.65);
  vec2 warp = vec2(noise(uv*3.0 + t*0.05), noise(uv*3.0 - t*0.04));
  float field = noise(uv*2.2 + warp*(0.6 + uAmp*0.8) + bump*0.35);
  vec3 ground = vec3(0.039,0.039,0.043);
  vec3 elevated = vec3(0.075,0.075,0.082);
  vec3 amber = vec3(0.851,0.643,0.255);
  vec3 col = mix(ground, elevated, smoothstep(0.35,0.75,field));
  col += amber * bump * (0.10 + 0.25*uHue);
  col = mix(col, mix(ground, amber, 0.16), uHue*smoothstep(0.6,1.0,uv.y));
  // edge0 < edge1 always: reversed-edge smoothstep is undefined in GLSL ES.
  float vig = 1.0 - smoothstep(0.45, 1.25, length((uv-0.5)*asp*1.6));
  gl_FragColor = vec4(col*vig, 1.0);
}`;
