// Daftar teks situs yang boleh diubah admin. Kuncinya "Namespace.nama" persis seperti di
// messages/*.json. Hanya kunci di sini yang diterima; selain itu ditolak di server.
// Teks UI lain (tombol, galat formulir, label aksesibilitas) sengaja tidak ada: itu bagian kode.

export type TextGroup = 'home' | 'pages' | 'contact' | 'footer' | 'notFound' | 'seo' | 'privacy'

export type TextEntry = {
  key: string
  group: TextGroup
  label: string
  // true: isian beberapa baris
  multiline?: boolean
  max: number
  // placeholder ICU yang boleh dipakai di teks ini, mis. ['year', 'name']
  placeholders?: readonly string[]
}

export const TEXT_GROUPS: { id: TextGroup; title: string; description: string }[] = [
  {
    id: 'home',
    title: 'Judul bagian beranda',
    description: 'Judul bagian di halaman beranda: keahlian, GitHub, project, pengalaman.',
  },
  {
    id: 'pages',
    title: 'Judul halaman',
    description: 'Judul utama halaman Tentang, Pengalaman, dan Project.',
  },
  {
    id: 'contact',
    title: 'Halaman Kontak',
    description: 'Judul dan kalimat pembuka di atas formulir kontak.',
  },
  {
    id: 'footer',
    title: 'Footer',
    description: 'Teks di bagian bawah setiap halaman.',
  },
  {
    id: 'notFound',
    title: 'Halaman 404',
    description: 'Teks saat halaman yang dibuka pengunjung tidak ada.',
  },
  {
    id: 'seo',
    title: 'SEO (judul dan deskripsi di mesin pencari)',
    description:
      'Judul tab browser dan deskripsi yang tampil di hasil Google dan pratinjau tautan. Judul sebaiknya di bawah 60 karakter, deskripsi di bawah 160.',
  },
  {
    id: 'privacy',
    title: 'Kebijakan Privasi',
    description:
      'Isi halaman Kebijakan Privasi. Tulis apa adanya, jangan menjanjikan hal yang tidak dilakukan situs.',
  },
]

const title = { max: 80 } as const
const metaTitle = { max: 70 } as const
const metaDescription = { max: 200, multiline: true } as const
const privacyBody = { max: 800, multiline: true } as const

export const TEXT_CATALOG: readonly TextEntry[] = [
  // beranda
  { key: 'Home.stackHeading', group: 'home', label: 'Bagian keahlian', ...title },
  { key: 'Home.githubHeading', group: 'home', label: 'Bagian GitHub', ...title },
  { key: 'Home.projectsHeading', group: 'home', label: 'Bagian project', ...title },
  { key: 'Home.experienceHeading', group: 'home', label: 'Bagian pengalaman', ...title },
  // judul halaman
  { key: 'About.title', group: 'pages', label: 'Halaman Tentang', ...title },
  { key: 'Experience.title', group: 'pages', label: 'Halaman Pengalaman', ...title },
  { key: 'Projects.title', group: 'pages', label: 'Halaman Project', ...title },
  // kontak
  { key: 'Contact.title', group: 'contact', label: 'Judul', ...title },
  { key: 'Contact.intro', group: 'contact', label: 'Kalimat pembuka', max: 300, multiline: true },
  { key: 'Contact.cardRole', group: 'contact', label: 'Jabatan di kartu pesan terkirim', max: 60 },
  // footer
  { key: 'Footer.contactHeading', group: 'footer', label: 'Judul kontak', ...title },
  {
    key: 'Footer.copyright',
    group: 'footer',
    label: 'Hak cipta',
    max: 120,
    placeholders: ['year', 'name'],
  },
  // 404
  { key: 'NotFound.title', group: 'notFound', label: 'Judul', ...title },
  { key: 'NotFound.body', group: 'notFound', label: 'Kalimat', max: 200, multiline: true },
  { key: 'NotFound.home', group: 'notFound', label: 'Tombol ke beranda', max: 30 },
  // SEO
  { key: 'Metadata.title', group: 'seo', label: 'Judul situs (bawaan)', ...metaTitle },
  {
    key: 'Metadata.description',
    group: 'seo',
    label: 'Deskripsi situs (bawaan)',
    ...metaDescription,
  },
  { key: 'Home.metaTitle', group: 'seo', label: 'Judul beranda', ...metaTitle },
  { key: 'About.metaTitle', group: 'seo', label: 'Judul halaman Tentang', ...metaTitle },
  {
    key: 'About.metaDescription',
    group: 'seo',
    label: 'Deskripsi halaman Tentang',
    ...metaDescription,
  },
  { key: 'Experience.metaTitle', group: 'seo', label: 'Judul halaman Pengalaman', ...metaTitle },
  {
    key: 'Experience.metaDescription',
    group: 'seo',
    label: 'Deskripsi halaman Pengalaman',
    ...metaDescription,
  },
  { key: 'Projects.metaTitle', group: 'seo', label: 'Judul halaman Project', ...metaTitle },
  {
    key: 'Projects.metaDescription',
    group: 'seo',
    label: 'Deskripsi halaman Project',
    ...metaDescription,
  },
  { key: 'Contact.metaTitle', group: 'seo', label: 'Judul halaman Kontak', ...metaTitle },
  {
    key: 'Contact.metaDescription',
    group: 'seo',
    label: 'Deskripsi halaman Kontak',
    ...metaDescription,
  },
  { key: 'Privacy.metaTitle', group: 'seo', label: 'Judul Kebijakan Privasi', ...metaTitle },
  {
    key: 'Privacy.metaDescription',
    group: 'seo',
    label: 'Deskripsi Kebijakan Privasi',
    ...metaDescription,
  },
  // privasi
  { key: 'Privacy.title', group: 'privacy', label: 'Judul halaman', ...title },
  { key: 'Privacy.intro', group: 'privacy', label: 'Pembuka', max: 500, multiline: true },
  { key: 'Privacy.visitsHeading', group: 'privacy', label: 'Statistik kunjungan: judul', ...title },
  {
    key: 'Privacy.visitsBody',
    group: 'privacy',
    label: 'Statistik kunjungan: isi',
    ...privacyBody,
  },
  { key: 'Privacy.contactHeading', group: 'privacy', label: 'Formulir kontak: judul', ...title },
  { key: 'Privacy.contactBody', group: 'privacy', label: 'Formulir kontak: isi', ...privacyBody },
  { key: 'Privacy.newsletterHeading', group: 'privacy', label: 'Newsletter: judul', ...title },
  { key: 'Privacy.newsletterBody', group: 'privacy', label: 'Newsletter: isi', ...privacyBody },
  { key: 'Privacy.cvHeading', group: 'privacy', label: 'Unduhan CV: judul', ...title },
  { key: 'Privacy.cvBody', group: 'privacy', label: 'Unduhan CV: isi', ...privacyBody },
  {
    key: 'Privacy.servicesHeading',
    group: 'privacy',
    label: 'Layanan pihak ketiga: judul',
    ...title,
  },
  {
    key: 'Privacy.servicesBody',
    group: 'privacy',
    label: 'Layanan pihak ketiga: isi',
    ...privacyBody,
  },
  { key: 'Privacy.rightsHeading', group: 'privacy', label: 'Hak pengunjung: judul', ...title },
  { key: 'Privacy.rightsBody', group: 'privacy', label: 'Hak pengunjung: isi', ...privacyBody },
  { key: 'Privacy.creditsHeading', group: 'privacy', label: 'Kredit: judul', ...title },
  { key: 'Privacy.creditsBody', group: 'privacy', label: 'Kredit: isi', ...privacyBody },
]

const BY_KEY = new Map(TEXT_CATALOG.map((entry) => [entry.key, entry]))

export function findTextEntry(key: string): TextEntry | undefined {
  return BY_KEY.get(key)
}

// Aturan isi satu teks. Mengembalikan pesan galat, atau null bila boleh.
// Kurung kurawal hanya boleh untuk placeholder yang diizinkan, karena sisanya dibaca
// sebagai sintaks ICU oleh next-intl dan bisa membuat halaman publik error.
export function checkTextValue(entry: TextEntry, value: string): string | null {
  if (value.length > entry.max) return `Paling panjang ${entry.max} karakter`
  if (!entry.multiline && /[\r\n]/.test(value)) return 'Tulis dalam satu baris'
  const allowed = new Set(entry.placeholders ?? [])
  const stripped = value.replace(/\{(\w+)\}/g, (whole, name: string) =>
    allowed.has(name) ? '' : whole,
  )
  if (/[{}]/.test(stripped)) {
    return allowed.size
      ? `Kurung kurawal hanya untuk ${[...allowed].map((p) => `{${p}}`).join(' dan ')}`
      : 'Tidak boleh memakai tanda kurung kurawal { }'
  }
  if (/'\{/.test(value)) return "Tanda ' tidak boleh persis sebelum {"
  return null
}
