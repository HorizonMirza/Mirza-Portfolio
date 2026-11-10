// Placeholder berkilau untuk next/image (placeholder={SHIMMER_PLACEHOLDER}, DESIGN.md bagian 111):
// tampil sebagai latar <img> sampai gambarnya termuat, lalu dilepas next/image sendiri, jadi tanpa
// JavaScript tambahan dan kilau berhenti setelah gambar tampil. SVG tanpa viewBox dan tanpa ukuran
// tetap agar mengisi seluruh bidang gambar (background-size cover/contain). Abu-abu transparan cocok
// untuk tema terang dan gelap; dengan prefers-reduced-motion kilau tidak bergerak.
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><style>.s{transform-box:fill-box;animation:m 1.6s ease-in-out infinite}@keyframes m{from{transform:translateX(-100%)}to{transform:translateX(100%)}}@media (prefers-reduced-motion:reduce){.s{animation:none;opacity:0}}</style><defs><linearGradient id="g"><stop offset="0" stop-color="#808080" stop-opacity="0"/><stop offset=".5" stop-color="#808080" stop-opacity=".22"/><stop offset="1" stop-color="#808080" stop-opacity="0"/></linearGradient></defs><rect width="100%" height="100%" fill="#808080" fill-opacity=".14"/><rect class="s" width="100%" height="100%" fill="url(#g)"/></svg>`

export const SHIMMER_PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent(SVG)}` as const
