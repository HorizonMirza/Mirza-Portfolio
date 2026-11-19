// Logo asli berwarna penuh untuk globe skill. Berkas di Frontend/public/skills/<slug>.webp (144 px),
// dibuat dari sumber SVG di Frontend/scripts/skill-logos/<slug>.svg lewat `pnpm logos:build`; slug sama
// dengan BRAND_ICONS (brand-icons.ts). Sumber dan lisensi: Frontend/scripts/skill-logos/SOURCES.md.
// Bitmap, bukan SVG, agar 31 logo tidak digambar dari vektor saat bagian Keahlian masuk layar
// (beranda tersendat di HP).
// invertDark: logo hitam yang dibalik warnanya di tema gelap (sama dengan versi gelap resminya).

export const SKILL_LOGOS: Record<string, { invertDark?: boolean }> = {
  typescript: {},
  javascript: {},
  python: {},
  cplusplus: {},
  c: {},
  java: {},
  html5: {},
  css: {},
  react: {},
  nextdotjs: { invertDark: true },
  tailwindcss: {},
  bootstrap: {},
  nodedotjs: {},
  laravel: {},
  fastapi: {},
  postgresql: {},
  mysql: {},
  supabase: {},
  git: {},
  github: { invertDark: true },
  vercel: { invertDark: true },
  visualstudiocode: {},
  figma: {},
  canva: {},
  microsoftword: {},
  microsoftexcel: {},
  microsoftpowerpoint: {},
  claude: {},
  openai: { invertDark: true },
  kiro: {},
  antigravity: {},
}
