import { EN } from '@/lib/admin-i18n-en'

// Bahasa tampilan panel admin (permintaan pemilik 2026-11-11, DESIGN.md bagian 113 dan 115): tombol
// ID/EN di top bar mengganti seluruh tampilan admin sekaligus bahasa isian form dua bahasa. Pilihan
// disimpan di cookie agar halaman server langsung dirender dalam bahasa itu. Kunci kamus adalah teks
// Indonesia persis seperti di kode; teks isian dari database (mis. nama project) tidak diterjemahkan.

export type AdminLang = 'id' | 'en'

export const ADMIN_LANG_COOKIE = 'mmirza-admin-lang'

export function parseAdminLang(value: string | null | undefined): AdminLang {
  return value === 'en' ? 'en' : 'id'
}

export type AdminVars = Record<string, string | number>

// Kalimat yang memuat nama isian atau angka (pesan validasi dan hasil aksi dari server). Bagian
// yang berubah diterjemahkan lagi lewat kamus bila ada (mis. nama isian).
const PATTERNS: [RegExp, (m: RegExpExecArray, tr: (text: string) => string) => string][] = [
  [/^(.+) wajib diisi$/, (m, tr) => `${tr(m[1]!)} is required`],
  [/^(.+) maksimal (\d+) karakter$/, (m, tr) => `${tr(m[1]!)} must be at most ${m[2]} characters`],
  [/^(.+) minimal (\d+) karakter$/, (m, tr) => `${tr(m[1]!)} must be at least ${m[2]} characters`],
  [/^(.+) terlalu panjang$/, (m, tr) => `${tr(m[1]!)} is too long`],
  [
    /^(.+) harus diawali http:\/\/ atau https:\/\/$/,
    (m, tr) => `${tr(m[1]!)} must start with http:// or https://`,
  ],
  [/^(.+) sudah dipakai$/, (m, tr) => `${tr(m[1]!)} is already in use`],
  [/^Tahun maksimal (\d+)$/, (m) => `Year must be at most ${m[1]}`],
  [
    /^Kategori masih berisi (\d+) skill\. Pindahkan atau hapus skill-nya dulu\.$/,
    (m) =>
      `This category still has ${m[1]} skill${m[1] === '1' ? '' : 's'}. Move or delete them first.`,
  ],
  [/^Teks (.+) disimpan\.$/, (m, tr) => `${tr(m[1]!)} text saved.`],
  [/^Tipe tidak didukung\. Gunakan (.+)\.$/, (m) => `Unsupported type. Use ${m[1]}.`],
  [/^Ukuran maksimal (.+)\.$/, (m) => `Maximum size ${m[1]}.`],
  [/^(.+) tersimpan\.$/, (m, tr) => `${tr(m[1]!)} saved.`],
  [/^Paling panjang (\d+) karakter$/, (m) => `At most ${m[1]} characters`],
  [
    /^Perbandingan gambar harus (\d+):(\d+) \(sekitar ([\d.]+)\), gambar ini (\d+)×(\d+)\.$/,
    (m) =>
      `The image ratio must be ${m[1]}:${m[2]} (about ${m[3]}); this image is ${m[4]}×${m[5]}.`,
  ],
  [
    /^Lebar gambar minimal (\d+) px, gambar ini (\d+) px\.$/,
    (m) => `The image must be at least ${m[1]} px wide; this image is ${m[2]} px.`,
  ],
]

// true bila teks punya terjemahan Inggris (kamus atau pola); dipakai tes kelengkapan kamus
export function hasAdminTranslation(text: string): boolean {
  return text in EN || PATTERNS.some(([pattern]) => pattern.test(text))
}

function translate(text: string): string {
  const hit = EN[text]
  if (hit !== undefined) return hit
  for (const [pattern, render] of PATTERNS) {
    const match = pattern.exec(text)
    if (match) return render(match, translate)
  }
  return text
}

function fill(text: string, vars?: AdminVars) {
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (all, name: string) =>
    name in vars ? String(vars[name]) : all,
  )
}

// Terjemahkan teks admin. Teks yang tidak ada di kamus tampil apa adanya (mis. nama project).
export function adminT(lang: AdminLang, text: string, vars?: AdminVars): string {
  return fill(lang === 'en' ? translate(text) : text, vars)
}

// Teks bertemplat (angka di dalam kalimat)
export function adminDrafts(lang: AdminLang, count: number) {
  return lang === 'en' ? `${count} draft${count === 1 ? '' : 's'}` : `${count} draf`
}

export function adminVisitsTotal(lang: AdminLang, total: number) {
  return lang === 'en'
    ? `Total ${total.toLocaleString('en-US')} visits. Days in WIB.`
    : `Total ${total.toLocaleString('id-ID')} kunjungan. Hari menurut WIB.`
}
