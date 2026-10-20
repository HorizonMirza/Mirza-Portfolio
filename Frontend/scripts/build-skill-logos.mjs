// Membuat public/skills/<slug>.webp dari sumber SVG di scripts/skill-logos/ (jalankan: pnpm logos:build).
// Globe skill memakai bitmap, bukan SVG: logo SVG harus digambar dari vektor saat pertama kali tampil
// dan 31 logo sekaligus membuat beranda tersendat ketika bagian Keahlian masuk layar (diukur
// 2026-10-20 di HP, CPU 4x lebih lambat: 70 ms -> 19 ms per bingkai dengan WebP). 144 px cukup tajam
// untuk lingkaran logo terbesar (±44 px) di layar 3x. Memakai Chromium dari Playwright (sudah
// devDependency), jadi tidak perlu pustaka gambar tambahan.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from '@playwright/test'

const SIZE = 144
const root = path.dirname(fileURLToPath(import.meta.url))
const source = path.join(root, 'skill-logos')
const target = path.join(root, '..', 'public', 'skills')

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
})
const page = await browser.newPage()
await mkdir(target, { recursive: true })
for (const file of (await readdir(source)).filter((f) => f.endsWith('.svg')).sort()) {
  const svg = await readFile(path.join(source, file), 'utf8')
  const dataUrl = await page.evaluate(
    async ({ svg, size }) => {
      const img = new Image()
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
      await img.decode()
      // rasio asli dipertahankan, di tengah kotak persegi transparan (seperti object-fit: contain)
      const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1
      const w = ratio >= 1 ? size : size * ratio
      const h = ratio >= 1 ? size / ratio : size
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      canvas.getContext('2d').drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
      return canvas.toDataURL('image/webp', 0.9)
    },
    { svg, size: SIZE },
  )
  const out = path.join(target, file.replace(/\.svg$/, '.webp'))
  await writeFile(out, Buffer.from(dataUrl.split(',')[1], 'base64'))
  console.log(path.relative(process.cwd(), out))
}
await browser.close()
