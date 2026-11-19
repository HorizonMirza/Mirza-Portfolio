// Shader GLSL ES 3.0 untuk simulasi cairan hero (hero-fluid.ts): percikan, adveksi, curl,
// vortisitas, divergensi, tekanan, gradien, pudar, dan tampilan akhir sebagai masker gambar kedua.

export const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const head = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 outColor;
uniform vec2 uTexel;
`

export const SPLAT = `${head}
uniform sampler2D uTarget;
uniform float uAspect;
uniform vec2 uPoint;
uniform vec2 uPoint2;
uniform float uRadius;
uniform vec3 uValue;
uniform float uCap;
void main() {
  // percikan berbentuk kapsul dari uPoint ke uPoint2 (titik bila keduanya sama): jarak ke ruas garis,
  // sehingga satu gerakan kursor cukup satu lintasan, bukan belasan percikan bulat
  vec2 a = uPoint;
  vec2 b = uPoint2;
  vec2 pa = vUv - a;
  vec2 ba = b - a;
  pa.x *= uAspect;
  ba.x *= uAspect;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0);
  vec2 p = pa - ba * h;
  vec3 add = exp(-dot(p, p) / uRadius) * uValue;
  vec3 base = texture(uTarget, vUv).xyz;
  // zat warna dibatasi uCap agar percikan yang bertumpuk tidak membesar; kecepatan tidak dibatasi
  outColor = vec4(min(base + add, vec3(uCap)), 1.0);
}`

export const ADVECT = `${head}
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uSimTexel;
uniform float uDt;
uniform float uDissipation;
void main() {
  vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uSimTexel;
  outColor = texture(uSource, coord) / (1.0 + uDissipation * uDt);
}`

export const CURL = `${head}
uniform sampler2D uVelocity;
void main() {
  float l = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).y;
  float r = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).y;
  float b = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).x;
  outColor = vec4(0.5 * (r - l - t + b), 0.0, 0.0, 1.0);
}`

export const VORTICITY = `${head}
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float uCurlStrength;
uniform float uDt;
void main() {
  float l = texture(uCurl, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uCurl, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uCurl, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uCurl, vUv + vec2(0.0, uTexel.y)).x;
  float c = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(t) - abs(b), abs(r) - abs(l));
  force /= length(force) + 0.0001;
  force *= uCurlStrength * c;
  force.y *= -1.0;
  vec2 v = texture(uVelocity, vUv).xy + force * uDt;
  outColor = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0);
}`

export const DIVERGENCE = `${head}
uniform sampler2D uVelocity;
void main() {
  float l = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
  float t = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
  outColor = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0);
}`

export const PRESSURE = `${head}
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main() {
  float l = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float d = texture(uDivergence, vUv).x;
  outColor = vec4((l + r + b + t - d) * 0.25, 0.0, 0.0, 1.0);
}`

export const GRADIENT = `${head}
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main() {
  float l = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  vec2 v = texture(uVelocity, vUv).xy - 0.5 * vec2(r - l, t - b);
  outColor = vec4(v, 0.0, 1.0);
}`

export const FADE = `${head}
uniform sampler2D uSource;
uniform float uFactor;
void main() {
  outColor = texture(uSource, vUv) * uFactor;
}`

// Tampilan: lapisan armor (premultiplied) dikali masker dari zat warna. Butiran memakai derau nilai
// yang diam (tidak berkedip) sekitar 3 px, sehingga tepi terlihat bertekstur seperti referensi.
export const DISPLAY = `${head}
uniform sampler2D uDye;
uniform sampler2D uLayer;
uniform float uEdge;
uniform float uSoft;
uniform float uGrain;
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main() {
  float d = texture(uDye, vUv).x;
  float n = noise(gl_FragCoord.xy / 3.0) - 0.5;
  float e = uEdge + n * uGrain;
  float a = smoothstep(e - uSoft, e + uSoft, d);
  outColor = texture(uLayer, vUv) * a;
}`
