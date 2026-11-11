// Bahasa tampilan panel admin (permintaan pemilik 2026-11-11, DESIGN.md bagian 113): tombol ID/EN di
// top bar mengganti bahasa tampilan admin sekaligus bahasa isian form dua bahasa. Pilihan disimpan di
// cookie agar halaman server langsung dirender dalam bahasa itu. Kunci kamus adalah teks Indonesia;
// teks yang belum diterjemahkan tetap tampil dalam bahasa Indonesia (diterjemahkan bertahap).

export type AdminLang = 'id' | 'en'

export const ADMIN_LANG_COOKIE = 'mmirza-admin-lang'

export function parseAdminLang(value: string | null | undefined): AdminLang {
  return value === 'en' ? 'en' : 'id'
}

const EN: Record<string, string> = {
  // menu
  Utama: 'Main',
  'Halaman situs': 'Site pages',
  'Kotak masuk': 'Inbox',
  Sistem: 'System',
  'Bagian Awal': 'Intro',
  Privasi: 'Privacy',
  'Halaman lain': 'Other pages',
  Pesan: 'Messages',
  'Log audit': 'Audit log',
  Pengaturan: 'Settings',
  Akun: 'Account',
  'Menu admin': 'Admin menu',
  'Menu cepat': 'Quick menu',
  'Buka menu admin': 'Open admin menu',
  'Tutup menu': 'Close menu',
  'Halaman situs dan menu lain': 'Site pages and more',
  // top bar dan menu profil
  'Menu profil': 'Profile menu',
  'Lihat situs': 'View site',
  Keluar: 'Log out',
  'Keluar…': 'Logging out…',
  '(membuka tab baru)': '(opens in a new tab)',
  'Mode gelap': 'Dark mode',
  // Atur kaca
  'Atur kaca': 'Glass',
  'Tampilan kaca': 'Glass appearance',
  'Preset kaca': 'Glass presets',
  Bening: 'Clear',
  Buram: 'Frosted',
  Padat: 'Solid',
  Kepekatan: 'Opacity',
  'Cahaya tepi': 'Edge light',
  Latar: 'Background',
  'Latar panel admin': 'Admin background',
  Gradasi: 'Gradient',
  Titik: 'Dots',
  Polos: 'Plain',
  'Atur ulang tampilan': 'Reset appearance',
  // dashboard
  'Pesan baru': 'New messages',
  'Kunjungan 7 hari': 'Visits, 7 days',
  'Unduhan CV 30 hari': 'CV downloads, 30 days',
  'Project terbit': 'Published projects',
  Pengalaman: 'Experience',
  Skill: 'Skills',
  Ringkasan: 'Summary',
  'Kunjungan per hari, 30 hari terakhir': 'Daily visits, last 30 days',
  'Belum ada kunjungan tercatat dalam 30 hari terakhir.': 'No visits recorded in the last 30 days.',
  'Lihat sebagai tabel': 'Show as table',
  Tanggal: 'Date',
  Kunjungan: 'Visits',
  'Pesan terbaru': 'Latest messages',
  'Semua pesan': 'All messages',
  'Belum ada pesan. Pesan dari form di halaman Kontak akan tampil di sini.':
    'No messages yet. Messages from the Contact form will appear here.',
  '(tanpa subjek)': '(no subject)',
  Baru: 'New',
  // tab modul
  'Bagian halaman': 'Page sections',
  'Teks halaman': 'Page text',
  Profil: 'Profile',
  Pendidikan: 'Education',
  'Foto dan peran': 'Photos and roles',
  Project: 'Projects',
  // footer form
  Simpan: 'Save',
  Batal: 'Cancel',
  'Menyimpan…': 'Saving…',
  'Buat project': 'Create project',
  'Tambah pengalaman': 'Add experience',
  'Tambah pendidikan': 'Add education',
  // judul dan deskripsi halaman
  'Project baru': 'New project',
  'Kebijakan Privasi': 'Privacy Policy',
  Sampul: 'Cover',
  'Kartu pemberitahuan yang muncul sekali saat situs dibuka. Hanya isinya yang bisa diubah; judul, label, dan tombol kartu tetap.':
    'Notice card shown once when the site opens. Only its body can be changed; the title, labels, and buttons stay fixed.',
  'Beranda: foto profil di kiri atas, foto utama, dan peran di bawah foto. Daftar skill di tab Skill; pengalaman dan project mengikuti modul Experience dan Projects.':
    'Home page: profile photo at the top left, main photo, and roles under the photo. Skills are in the Skills tab; experience and projects follow the Experience and Projects modules.',
  'Halaman Tentang. Bio, foto, nama, dan peran ada di tab Profil.':
    'About page. Bio, photo, name, and roles are in the Profile tab.',
  'Halaman Pengalaman. Isi riwayatnya ada di tab Pengalaman.':
    'Experience page. The history itself is in the Experience tab.',
  'Halaman daftar dan detail Project. Isi project ada di tab Project.':
    'Project list and detail pages. Project content is in the Projects tab.',
  'Halaman Kontak: judul, label formulir, pesan galat, dan kartu pesan terkirim.':
    'Contact page: title, form labels, error messages, and the sent-message card.',
  'Tulisan di menu navigasi atas dan bawah situs.':
    'Labels in the top and bottom navigation menus.',
  'Teks di bagian bawah setiap halaman.': 'Text at the bottom of every page.',
  'Isi halaman Kebijakan Privasi. Tulis apa adanya, jangan menjanjikan hal yang tidak dilakukan situs.':
    'Privacy Policy content. Write it as it is; do not promise anything the site does not do.',
  'Halaman 404 dan halaman galat.': '404 and error pages.',
  'Daftar skill per kategori untuk globe Keahlian Teknis. Urutan di sini dipakai di situs publik. Kategori hanya bisa dihapus bila sudah kosong.':
    'Skills per category for the Technical Skills globe. The order here is used on the public site. A category can only be deleted when it is empty.',
  'Kartu dan teks halaman Tentang: foto kartu, nama, peran, bio, chip kampus dan bendera, dan headline untuk gambar pratinjau tautan. Kontak dan Resume CV diatur di Footer; foto profil, foto utama, dan peran beranda di Home.':
    'About page card and text: card photo, name, roles, bio, campus and flag chips, and the headline for link previews. Contacts and the CV are in Footer; the profile photo, main photo, and home roles are in Home.',
  'Kerja dan organisasi (pendidikan ada di About → Pendidikan). Timeline publik diurutkan otomatis: yang masih berjalan di atas, lalu dari tanggal selesai terbaru.':
    'Work and organizations (education is in About → Education). The public timeline is sorted automatically: ongoing items first, then by the latest end date.',
  'Pendidikan di halaman Tentang, diurutkan dari yang paling lama. Hanya yang berstatus Terbit yang tampil.':
    'Education on the About page, sorted from the oldest. Only published entries are shown.',
  'Pengaturan teknis yang berlaku untuk seluruh situs publik. Teks, foto, dan kartu pembuka ada di menu Halaman situs.':
    'Technical settings for the whole public site. Text, photos, and the intro card are in the Site pages menu.',
  'Pesan dari formulir kontak. Waktu dalam WIB.': 'Messages from the contact form. Times in WIB.',
  'Setiap perubahan dari panel admin tercatat di sini. Data pribadi pengunjung tidak ikut dicatat.':
    "Every change made in the admin panel is recorded here. Visitors' personal data is not recorded.",
  'Urutan di sini sama dengan urutan di situs publik. Hanya project berstatus terbit yang tampil.':
    'The order here matches the public site. Only published projects are shown.',
}

export function adminT(lang: AdminLang, text: string): string {
  return lang === 'en' ? (EN[text] ?? text) : text
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
