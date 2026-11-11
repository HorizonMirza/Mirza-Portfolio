// Nama yang dikenal untuk isi log audit (DESIGN.md bagian 121). Teks Indonesia; terjemahan Inggrisnya
// di lib/admin-i18n-en.ts. Kolom yang tidak ada di sini tampil dengan nama aslinya.

// kata kerja kalimat umpan: "Mirza mengubah project RIPE.AI"
export const ACTION_VERB: Record<string, string> = {
  create: 'membuat',
  update: 'mengubah',
  delete: 'menghapus',
  reorder: 'mengurutkan',
  import: 'mengimpor',
  password: 'mengganti password akun',
  signout: 'mengeluarkan',
}

// chip saring aksi
export const ACTION_FILTERS = [
  'create',
  'update',
  'delete',
  'reorder',
  'password',
  'signout',
] as const
export const ACTION_LABEL: Record<string, string> = {
  create: 'buat',
  update: 'ubah',
  delete: 'hapus',
  reorder: 'urutkan',
  import: 'impor',
  password: 'password',
  signout: 'keluarkan perangkat',
}

// nama entitas di saringan (huruf besar di awal) dan di dalam kalimat (huruf kecil)
export const ENTITY_LABEL: Record<string, string> = {
  Asset: 'Berkas',
  Experience: 'Pengalaman',
  Message: 'Pesan',
  Profile: 'Profil',
  Project: 'Project',
  Session: 'Perangkat',
  SiteSetting: 'Pengaturan',
  SiteText: 'Teks situs',
  Skill: 'Skill',
  SkillCategory: 'Kategori skill',
  User: 'Akun',
}

export const ENTITY_NOUN: Record<string, string> = {
  Asset: 'berkas',
  Experience: 'pengalaman',
  Message: 'pesan',
  Profile: 'profil',
  Project: 'project',
  Session: 'perangkat',
  SiteSetting: 'pengaturan situs',
  SiteText: 'teks halaman',
  Skill: 'skill',
  SkillCategory: 'kategori skill',
  User: 'akun',
}

// Kolom → nama. Akhiran _id / _en ditambahkan sebagai (ID) / (EN) oleh fieldLabel.
const FIELD: Record<string, string> = {
  title: 'Judul',
  summary: 'Ringkasan',
  role: 'Peran',
  description: 'Deskripsi',
  caseStudy: 'Studi kasus',
  year: 'Tahun',
  category: 'Kategori',
  categoryId: 'Kategori',
  demoUrl: 'Link demo',
  repoUrl: 'Link repo',
  showDemo: 'Tampilkan demo',
  showRepo: 'Tampilkan repo',
  githubRepo: 'Repo GitHub',
  featured: 'Unggulan',
  order: 'Urutan',
  status: 'Status',
  publishedAt: 'Terbit',
  slug: 'Slug',
  coverId: 'Sampul',
  type: 'Jenis',
  organization: 'Instansi',
  organization_en: 'Instansi (EN)',
  startDate: 'Mulai',
  endDate: 'Selesai',
  location: 'Lokasi',
  employmentType: 'Jenis pekerjaan',
  logoId: 'Logo',
  photoId: 'Foto',
  inStory: 'Di cerita',
  name: 'Nama',
  icon: 'Ikon',
  headline: 'Judul profil',
  bio: 'Bio',
  city: 'Kota',
  email: 'Email',
  whatsapp: 'WhatsApp',
  socials: 'Media sosial',
  currentRole: 'Peran sekarang',
  aboutRoles: 'Peran beranda',
  aboutPhotoId: 'Foto kartu About',
  aboutBandRoles: 'Peran halaman Tentang',
  showCampusChip: 'Chip kampus',
  showFlag: 'Chip bendera',
  cvId: 'Berkas CV',
  cvUrl: 'Link CV',
  readAt: 'Dibaca',
  alt: 'Teks alternatif',
  publicId: 'Berkas',
  kind: 'Jenis berkas',
  bytes: 'Ukuran',
  target: 'Tempat',
  targetId: 'Milik',
  replaced: 'Menggantikan',
  soundVolume: 'Suara tombol',
  introBody: 'Isi kartu pembuka',
  heroPortraitId: 'Foto utama beranda',
  defaultTheme: 'Tema awal pengunjung',
  heroAnimation: 'Animasi hero',
  defaultLocale: 'Bahasa saat pertama dibuka',
  introEnabled: 'Kartu pembuka',
  introFrequency: 'Kartu pembuka muncul',
  whatsappButton: 'Tombol WhatsApp melayang',
  contactOpen: 'Terima pesan dari form kontak',
  contactPerHour: 'Batas pesan per jam',
  emailOnMessage: 'Email saat ada pesan baru',
  loginNotify: 'Email saat ada login baru',
  trackVisits: 'Hitung kunjungan',
  visitRetentionDays: 'Simpan data kunjungan',
  allowIndexing: 'Izinkan mesin pencari',
  maintenanceMode: 'Mode perawatan',
  device: 'Perangkat',
  sessions: 'Sesi aktif',
  removedAssets: 'Berkas ikut dihapus',
  skillIds: 'Skill',
}

// Nama kolom yang dikenal; null = tidak dikenal (tampil apa adanya, huruf mono).
export function fieldLabel(key: string): { base: string; lang: 'ID' | 'EN' | null } | null {
  if (key in FIELD) return { base: FIELD[key]!, lang: null }
  const m = /^(.+)_(id|en)$/.exec(key)
  if (m && m[1]! in FIELD) return { base: FIELD[m[1]!]!, lang: m[2] === 'id' ? 'ID' : 'EN' }
  return null
}

// Nilai pilihan pengaturan → kata yang dikenal
export const VALUE_LABEL: Record<string, string> = {
  dark: 'Gelap',
  light: 'Terang',
  system: 'Ikuti perangkat',
  browser: 'Ikuti browser',
  once: 'Sekali saja',
  visit: 'Setiap kunjungan baru',
  weekly: 'Seminggu sekali',
  PUBLISHED: 'Terbit',
  DRAFT: 'Draf',
  NEW: 'Baru',
  READ: 'Dibaca',
  ARCHIVED: 'Diarsipkan',
  WORK: 'Kerja',
  EDUCATION: 'Pendidikan',
  ORGANIZATION: 'Organisasi',
  SOFTWARE: 'Software',
  COMMUNITY_BUSINESS: 'Komunitas & Bisnis',
}
