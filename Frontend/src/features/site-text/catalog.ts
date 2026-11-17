// Daftar teks situs yang boleh diubah admin, dikelompokkan per modul (satu halaman admin per modul:
// Admin → Halaman situs). Kuncinya "Namespace.nama" persis seperti di messages/*.json. Hanya kunci di
// sini yang diterima; selain itu ditolak di server. Teks yang memuat data dinamis atau aturan jamak
// (mis. "{count} kontribusi") dan label aksesibilitas teknis sengaja tidak ada: itu bagian kode.

export type ModuleId =
  'intro' | 'home' | 'about' | 'experience' | 'projects' | 'contact' | 'navbar' | 'footer'

export type TextEntry = {
  key: string
  module: ModuleId
  // judul kartu di halaman modul
  section: string
  label: string
  // true: isian beberapa baris
  multiline?: boolean
  max: number
  // placeholder ICU yang boleh dipakai di teks ini, mis. ['year', 'name']
  placeholders?: readonly string[]
}

export type SiteModule = { id: ModuleId; label: string; title: string; description: string }

export const SITE_MODULES: readonly SiteModule[] = [
  {
    id: 'intro',
    label: 'Bagian Awal',
    title: 'Bagian Awal',
    description:
      // sejak 2026-11-11 tab "Kartu Pembuka" di Home, bukan menu sendiri
      'Kartu pemberitahuan yang muncul sekali saat situs dibuka. Hanya isinya yang bisa diubah; judul, label, dan tombol kartu tetap.',
  },
  {
    id: 'home',
    label: 'Home',
    title: 'Home',
    description:
      'Beranda: foto profil di kiri atas, foto utama, dan peran di bawah foto. Kartu yang muncul saat situs dibuka di tab Kartu pembuka, daftar skill di tab Skill; pengalaman dan project mengikuti modul Experience dan Projects.',
  },
  {
    id: 'about',
    label: 'About',
    title: 'About',
    description: 'Halaman Tentang. Bio, foto, nama, dan peran ada di tab Profil.',
  },
  {
    id: 'experience',
    label: 'Experience',
    title: 'Experience',
    description: 'Halaman Pengalaman. Isi riwayatnya ada di tab Pengalaman.',
  },
  {
    id: 'projects',
    label: 'Projects',
    title: 'Projects',
    description: 'Halaman daftar dan detail Project. Isi project ada di tab Project.',
  },
  {
    id: 'contact',
    label: 'Contact',
    title: 'Contact',
    description: 'Halaman Kontak: judul, label formulir, pesan galat, dan kartu pesan terkirim.',
  },
  {
    id: 'navbar',
    label: 'Navbar',
    title: 'Navbar',
    description: 'Tulisan di menu navigasi atas dan bawah situs.',
  },
  {
    id: 'footer',
    label: 'Footer',
    title: 'Footer',
    description: 'Teks di bagian bawah setiap halaman.',
  },
]

const SIZE = {
  label: { max: 40 },
  title: { max: 80 },
  short: { max: 200, multiline: true },
  text: { max: 300, multiline: true },
  metaTitle: { max: 70 },
  metaDesc: { max: 200, multiline: true },
  body: { max: 800, multiline: true },
  copy: { max: 120 },
} as const

export const TEXT_CATALOG: readonly TextEntry[] = [
  { key: 'About.title', module: 'about', section: 'Teks Halaman', label: 'Judul', ...SIZE.title },
  {
    key: 'About.educationHeading',
    module: 'about',
    section: 'Teks Halaman',
    label: 'Judul Bagian Pendidikan',
    ...SIZE.title,
  },
  {
    key: 'About.noEducation',
    module: 'about',
    section: 'Teks Halaman',
    label: 'Teks bila belum ada pendidikan',
    ...SIZE.short,
  },
  {
    key: 'About.metaTitle',
    module: 'about',
    section: 'SEO',
    label: 'Judul Halaman',
    ...SIZE.metaTitle,
  },
  {
    key: 'About.metaDescription',
    module: 'about',
    section: 'SEO',
    label: 'Deskripsi Halaman',
    ...SIZE.metaDesc,
  },
  {
    key: 'Experience.title',
    module: 'experience',
    section: 'Teks Halaman',
    label: 'Judul',
    ...SIZE.title,
  },
  {
    key: 'Experience.none',
    module: 'experience',
    section: 'Teks Halaman',
    label: 'Teks bila belum ada pengalaman',
    ...SIZE.short,
  },
  {
    key: 'Experience.present',
    module: 'experience',
    section: 'Teks Halaman',
    label: 'Kata untuk "sampai sekarang" (juga di About dan beranda)',
    ...SIZE.label,
  },
  {
    key: 'Experience.metaTitle',
    module: 'experience',
    section: 'SEO',
    label: 'Judul Halaman',
    ...SIZE.metaTitle,
  },
  {
    key: 'Experience.metaDescription',
    module: 'experience',
    section: 'SEO',
    label: 'Deskripsi Halaman',
    ...SIZE.metaDesc,
  },
  {
    key: 'Projects.title',
    module: 'projects',
    section: 'Teks Halaman',
    label: 'Judul',
    ...SIZE.title,
  },
  {
    key: 'Projects.empty',
    module: 'projects',
    section: 'Teks Halaman',
    label: 'Teks bila belum ada project',
    ...SIZE.short,
  },
  {
    key: 'Projects.back',
    module: 'projects',
    section: 'Teks Halaman',
    label: 'Tautan Kembali ke Daftar',
    ...SIZE.label,
  },
  {
    key: 'Projects.demo',
    module: 'projects',
    section: 'Teks Halaman',
    label: 'Tombol Lihat Aplikasi',
    ...SIZE.label,
  },
  {
    key: 'Projects.repo',
    module: 'projects',
    section: 'Teks Halaman',
    label: 'Tombol Kode Sumber',
    ...SIZE.label,
  },
  {
    key: 'Projects.stack',
    module: 'projects',
    section: 'Teks Halaman',
    label: 'Judul Daftar Teknologi',
    ...SIZE.label,
  },
  {
    key: 'Projects.metaTitle',
    module: 'projects',
    section: 'SEO',
    label: 'Judul Halaman',
    ...SIZE.metaTitle,
  },
  {
    key: 'Projects.metaDescription',
    module: 'projects',
    section: 'SEO',
    label: 'Deskripsi Halaman',
    ...SIZE.metaDesc,
  },
  {
    key: 'Contact.title',
    module: 'contact',
    section: 'Judul dan Pembuka',
    label: 'Judul',
    ...SIZE.title,
  },
  {
    key: 'Contact.intro',
    module: 'contact',
    section: 'Judul dan Pembuka',
    label: 'Kalimat Pembuka',
    ...SIZE.text,
  },
  {
    key: 'Contact.cardRole',
    module: 'contact',
    section: 'Kartu ID',
    label: 'Jabatan di kartu ID (juga di kartu pesan terkirim)',
    ...SIZE.label,
  },
  {
    key: 'Contact.cardSite',
    module: 'contact',
    section: 'Kartu ID',
    label: 'Alamat situs di tali dan barcode kartu ID',
    ...SIZE.label,
  },
  {
    key: 'Contact.name',
    module: 'contact',
    section: 'Formulir',
    label: 'Label Nama',
    ...SIZE.label,
  },
  {
    key: 'Contact.email',
    module: 'contact',
    section: 'Formulir',
    label: 'Label Email',
    ...SIZE.label,
  },
  {
    key: 'Contact.subject',
    module: 'contact',
    section: 'Formulir',
    label: 'Label Subjek',
    ...SIZE.label,
  },
  {
    key: 'Contact.message',
    module: 'contact',
    section: 'Formulir',
    label: 'Label Pesan',
    ...SIZE.label,
  },
  {
    key: 'Contact.send',
    module: 'contact',
    section: 'Formulir',
    label: 'Tombol Kirim',
    ...SIZE.label,
  },
  {
    key: 'Contact.sending',
    module: 'contact',
    section: 'Formulir',
    label: 'Tombol Saat Mengirim',
    ...SIZE.label,
  },
  {
    key: 'Contact.error',
    module: 'contact',
    section: 'Pesan Galat',
    label: 'Gagal terkirim',
    ...SIZE.short,
  },
  {
    key: 'Contact.rateLimited',
    module: 'contact',
    section: 'Pesan Galat',
    label: 'Terlalu banyak percobaan',
    ...SIZE.short,
  },
  {
    key: 'Contact.invalid',
    module: 'contact',
    section: 'Pesan Galat',
    label: 'Isian belum benar',
    ...SIZE.short,
  },
  {
    key: 'Contact.nameRequired',
    module: 'contact',
    section: 'Pesan Galat',
    label: 'Nama Kosong',
    ...SIZE.short,
  },
  {
    key: 'Contact.nameTooLong',
    module: 'contact',
    section: 'Pesan Galat',
    label: 'Nama terlalu panjang',
    ...SIZE.short,
  },
  {
    key: 'Contact.emailInvalid',
    module: 'contact',
    section: 'Pesan Galat',
    label: 'Email tidak valid',
    ...SIZE.short,
  },
  {
    key: 'Contact.subjectTooLong',
    module: 'contact',
    section: 'Pesan Galat',
    label: 'Subjek terlalu panjang',
    ...SIZE.short,
  },
  {
    key: 'Contact.messageShort',
    module: 'contact',
    section: 'Pesan Galat',
    label: 'Pesan terlalu pendek',
    ...SIZE.short,
  },
  {
    key: 'Contact.messageLong',
    module: 'contact',
    section: 'Pesan Galat',
    label: 'Pesan terlalu panjang',
    ...SIZE.short,
  },
  {
    key: 'Contact.sentTitle',
    module: 'contact',
    section: 'Kartu Pesan Terkirim',
    label: 'Judul Kartu',
    ...SIZE.label,
  },
  {
    key: 'Contact.sentBadge',
    module: 'contact',
    section: 'Kartu Pesan Terkirim',
    label: 'Lencana Status',
    ...SIZE.label,
  },
  {
    key: 'Contact.ticketFrom',
    module: 'contact',
    section: 'Kartu Pesan Terkirim',
    label: 'Label "Dari"',
    ...SIZE.label,
  },
  {
    key: 'Contact.ticketReplyTo',
    module: 'contact',
    section: 'Kartu Pesan Terkirim',
    label: 'Label "Balasan ke"',
    ...SIZE.label,
  },
  {
    key: 'Contact.ticketSubject',
    module: 'contact',
    section: 'Kartu Pesan Terkirim',
    label: 'Label Subjek',
    ...SIZE.label,
  },
  {
    key: 'Contact.ticketMessage',
    module: 'contact',
    section: 'Kartu Pesan Terkirim',
    label: 'Label Pesan',
    ...SIZE.label,
  },
  {
    key: 'Contact.ticketTime',
    module: 'contact',
    section: 'Kartu Pesan Terkirim',
    label: 'Label Waktu',
    ...SIZE.label,
  },
  {
    key: 'Contact.another',
    module: 'contact',
    section: 'Kartu Pesan Terkirim',
    label: 'Tombol Tulis Pesan Lain',
    ...SIZE.label,
  },
  {
    key: 'Contact.metaTitle',
    module: 'contact',
    section: 'SEO',
    label: 'Judul Halaman',
    ...SIZE.metaTitle,
  },
  {
    key: 'Contact.metaDescription',
    module: 'contact',
    section: 'SEO',
    label: 'Deskripsi Halaman',
    ...SIZE.metaDesc,
  },
  { key: 'Nav.home', module: 'navbar', section: 'Menu', label: 'Beranda', ...SIZE.label },
  { key: 'Nav.about', module: 'navbar', section: 'Menu', label: 'Tentang', ...SIZE.label },
  { key: 'Nav.experience', module: 'navbar', section: 'Menu', label: 'Pengalaman', ...SIZE.label },
  { key: 'Nav.projects', module: 'navbar', section: 'Menu', label: 'Project', ...SIZE.label },
  { key: 'Nav.contact', module: 'navbar', section: 'Menu', label: 'Kontak', ...SIZE.label },
  {
    key: 'Nav.label',
    module: 'navbar',
    section: 'Menu',
    label: 'Nama Menu untuk Pembaca Layar',
    ...SIZE.label,
  },
  {
    key: 'Footer.contactHeading',
    module: 'footer',
    section: 'Teks Footer',
    label: 'Judul Kontak',
    ...SIZE.title,
  },
  {
    key: 'Footer.copyright',
    module: 'footer',
    section: 'Teks Footer',
    label: 'Hak Cipta',
    ...SIZE.copy,
    placeholders: ['year', 'name'],
  },
  { key: 'Footer.cv', module: 'footer', section: 'Teks Footer', label: 'Tombol CV', ...SIZE.label },
  {
    key: 'Footer.cvFile',
    module: 'footer',
    section: 'Teks Footer',
    label: 'Keterangan Jenis Berkas CV',
    ...SIZE.label,
  },
  {
    key: 'Footer.whatsappHint',
    module: 'footer',
    section: 'Petunjuk Saat Disorot',
    label: 'WhatsApp',
    ...SIZE.label,
  },
  {
    key: 'Footer.emailHint',
    module: 'footer',
    section: 'Petunjuk Saat Disorot',
    label: 'Email',
    ...SIZE.label,
  },
  {
    key: 'Footer.cvHint',
    module: 'footer',
    section: 'Petunjuk Saat Disorot',
    label: 'CV',
    ...SIZE.label,
  },
  {
    key: 'Footer.githubHint',
    module: 'footer',
    section: 'Petunjuk Saat Disorot',
    label: 'GitHub',
    ...SIZE.label,
  },
]

const BY_KEY = new Map(TEXT_CATALOG.map((entry) => [entry.key, entry]))

export function findTextEntry(key: string): TextEntry | undefined {
  return BY_KEY.get(key)
}

export function findModule(id: string): SiteModule | undefined {
  return SITE_MODULES.find((m) => m.id === id)
}

export function entriesOf(moduleId: ModuleId): TextEntry[] {
  return TEXT_CATALOG.filter((entry) => entry.module === moduleId)
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
