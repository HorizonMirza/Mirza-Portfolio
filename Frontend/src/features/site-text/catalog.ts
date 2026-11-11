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
      'Kartu pemberitahuan yang muncul sekali saat situs dibuka. Hanya isinya yang bisa diubah; judul, label, dan tombol kartu tetap.',
  },
  {
    id: 'home',
    label: 'Home',
    title: 'Home',
    description:
      'Beranda: foto profil di kiri atas, foto utama, dan peran di bawah foto. Daftar skill di tab Skill; pengalaman dan project mengikuti modul Experience dan Projects.',
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
  { key: 'About.title', module: 'about', section: 'Teks halaman', label: 'Judul', ...SIZE.title },
  {
    key: 'About.educationHeading',
    module: 'about',
    section: 'Teks halaman',
    label: 'Judul bagian pendidikan',
    ...SIZE.title,
  },
  {
    key: 'About.noEducation',
    module: 'about',
    section: 'Teks halaman',
    label: 'Teks bila belum ada pendidikan',
    ...SIZE.short,
  },
  {
    key: 'About.metaTitle',
    module: 'about',
    section: 'SEO',
    label: 'Judul halaman',
    ...SIZE.metaTitle,
  },
  {
    key: 'About.metaDescription',
    module: 'about',
    section: 'SEO',
    label: 'Deskripsi halaman',
    ...SIZE.metaDesc,
  },
  {
    key: 'Experience.title',
    module: 'experience',
    section: 'Teks halaman',
    label: 'Judul',
    ...SIZE.title,
  },
  {
    key: 'Experience.none',
    module: 'experience',
    section: 'Teks halaman',
    label: 'Teks bila belum ada pengalaman',
    ...SIZE.short,
  },
  {
    key: 'Experience.present',
    module: 'experience',
    section: 'Teks halaman',
    label: 'Kata untuk "sampai sekarang" (juga di About dan beranda)',
    ...SIZE.label,
  },
  {
    key: 'Experience.metaTitle',
    module: 'experience',
    section: 'SEO',
    label: 'Judul halaman',
    ...SIZE.metaTitle,
  },
  {
    key: 'Experience.metaDescription',
    module: 'experience',
    section: 'SEO',
    label: 'Deskripsi halaman',
    ...SIZE.metaDesc,
  },
  {
    key: 'Projects.title',
    module: 'projects',
    section: 'Teks halaman',
    label: 'Judul',
    ...SIZE.title,
  },
  {
    key: 'Projects.empty',
    module: 'projects',
    section: 'Teks halaman',
    label: 'Teks bila belum ada project',
    ...SIZE.short,
  },
  {
    key: 'Projects.back',
    module: 'projects',
    section: 'Teks halaman',
    label: 'Tautan kembali ke daftar',
    ...SIZE.label,
  },
  {
    key: 'Projects.demo',
    module: 'projects',
    section: 'Teks halaman',
    label: 'Tombol lihat aplikasi',
    ...SIZE.label,
  },
  {
    key: 'Projects.repo',
    module: 'projects',
    section: 'Teks halaman',
    label: 'Tombol kode sumber',
    ...SIZE.label,
  },
  {
    key: 'Projects.stack',
    module: 'projects',
    section: 'Teks halaman',
    label: 'Judul daftar teknologi',
    ...SIZE.label,
  },
  {
    key: 'Projects.metaTitle',
    module: 'projects',
    section: 'SEO',
    label: 'Judul halaman',
    ...SIZE.metaTitle,
  },
  {
    key: 'Projects.metaDescription',
    module: 'projects',
    section: 'SEO',
    label: 'Deskripsi halaman',
    ...SIZE.metaDesc,
  },
  {
    key: 'Contact.title',
    module: 'contact',
    section: 'Judul dan pembuka',
    label: 'Judul',
    ...SIZE.title,
  },
  {
    key: 'Contact.intro',
    module: 'contact',
    section: 'Judul dan pembuka',
    label: 'Kalimat pembuka',
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
    label: 'Label nama',
    ...SIZE.label,
  },
  {
    key: 'Contact.email',
    module: 'contact',
    section: 'Formulir',
    label: 'Label email',
    ...SIZE.label,
  },
  {
    key: 'Contact.subject',
    module: 'contact',
    section: 'Formulir',
    label: 'Label subjek',
    ...SIZE.label,
  },
  {
    key: 'Contact.message',
    module: 'contact',
    section: 'Formulir',
    label: 'Label pesan',
    ...SIZE.label,
  },
  {
    key: 'Contact.send',
    module: 'contact',
    section: 'Formulir',
    label: 'Tombol kirim',
    ...SIZE.label,
  },
  {
    key: 'Contact.sending',
    module: 'contact',
    section: 'Formulir',
    label: 'Tombol saat mengirim',
    ...SIZE.label,
  },
  {
    key: 'Contact.error',
    module: 'contact',
    section: 'Pesan galat',
    label: 'Gagal terkirim',
    ...SIZE.short,
  },
  {
    key: 'Contact.rateLimited',
    module: 'contact',
    section: 'Pesan galat',
    label: 'Terlalu banyak percobaan',
    ...SIZE.short,
  },
  {
    key: 'Contact.invalid',
    module: 'contact',
    section: 'Pesan galat',
    label: 'Isian belum benar',
    ...SIZE.short,
  },
  {
    key: 'Contact.nameRequired',
    module: 'contact',
    section: 'Pesan galat',
    label: 'Nama kosong',
    ...SIZE.short,
  },
  {
    key: 'Contact.nameTooLong',
    module: 'contact',
    section: 'Pesan galat',
    label: 'Nama terlalu panjang',
    ...SIZE.short,
  },
  {
    key: 'Contact.emailInvalid',
    module: 'contact',
    section: 'Pesan galat',
    label: 'Email tidak valid',
    ...SIZE.short,
  },
  {
    key: 'Contact.subjectTooLong',
    module: 'contact',
    section: 'Pesan galat',
    label: 'Subjek terlalu panjang',
    ...SIZE.short,
  },
  {
    key: 'Contact.messageShort',
    module: 'contact',
    section: 'Pesan galat',
    label: 'Pesan terlalu pendek',
    ...SIZE.short,
  },
  {
    key: 'Contact.messageLong',
    module: 'contact',
    section: 'Pesan galat',
    label: 'Pesan terlalu panjang',
    ...SIZE.short,
  },
  {
    key: 'Contact.sentTitle',
    module: 'contact',
    section: 'Kartu pesan terkirim',
    label: 'Judul kartu',
    ...SIZE.label,
  },
  {
    key: 'Contact.sentBadge',
    module: 'contact',
    section: 'Kartu pesan terkirim',
    label: 'Lencana status',
    ...SIZE.label,
  },
  {
    key: 'Contact.ticketFrom',
    module: 'contact',
    section: 'Kartu pesan terkirim',
    label: 'Label "Dari"',
    ...SIZE.label,
  },
  {
    key: 'Contact.ticketReplyTo',
    module: 'contact',
    section: 'Kartu pesan terkirim',
    label: 'Label "Balasan ke"',
    ...SIZE.label,
  },
  {
    key: 'Contact.ticketSubject',
    module: 'contact',
    section: 'Kartu pesan terkirim',
    label: 'Label subjek',
    ...SIZE.label,
  },
  {
    key: 'Contact.ticketMessage',
    module: 'contact',
    section: 'Kartu pesan terkirim',
    label: 'Label pesan',
    ...SIZE.label,
  },
  {
    key: 'Contact.ticketTime',
    module: 'contact',
    section: 'Kartu pesan terkirim',
    label: 'Label waktu',
    ...SIZE.label,
  },
  {
    key: 'Contact.another',
    module: 'contact',
    section: 'Kartu pesan terkirim',
    label: 'Tombol tulis pesan lain',
    ...SIZE.label,
  },
  {
    key: 'Contact.metaTitle',
    module: 'contact',
    section: 'SEO',
    label: 'Judul halaman',
    ...SIZE.metaTitle,
  },
  {
    key: 'Contact.metaDescription',
    module: 'contact',
    section: 'SEO',
    label: 'Deskripsi halaman',
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
    label: 'Nama menu untuk pembaca layar',
    ...SIZE.label,
  },
  {
    key: 'Footer.contactHeading',
    module: 'footer',
    section: 'Teks footer',
    label: 'Judul kontak',
    ...SIZE.title,
  },
  {
    key: 'Footer.copyright',
    module: 'footer',
    section: 'Teks footer',
    label: 'Hak cipta',
    ...SIZE.copy,
    placeholders: ['year', 'name'],
  },
  { key: 'Footer.cv', module: 'footer', section: 'Teks footer', label: 'Tombol CV', ...SIZE.label },
  {
    key: 'Footer.cvFile',
    module: 'footer',
    section: 'Teks footer',
    label: 'Keterangan jenis berkas CV',
    ...SIZE.label,
  },
  {
    key: 'Footer.whatsappHint',
    module: 'footer',
    section: 'Petunjuk saat disorot',
    label: 'WhatsApp',
    ...SIZE.label,
  },
  {
    key: 'Footer.emailHint',
    module: 'footer',
    section: 'Petunjuk saat disorot',
    label: 'Email',
    ...SIZE.label,
  },
  {
    key: 'Footer.cvHint',
    module: 'footer',
    section: 'Petunjuk saat disorot',
    label: 'CV',
    ...SIZE.label,
  },
  {
    key: 'Footer.githubHint',
    module: 'footer',
    section: 'Petunjuk saat disorot',
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
