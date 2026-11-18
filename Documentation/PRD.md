# PRD — Website Portofolio Muhammad Mirza

Status: **v1 live di mmirza.site, diselaraskan dengan kode 2026-11-18** · Sumber: `Documentation/00-discovery.md` (jawaban Fase 0–8)
Tanda **[ASUMSI]** = keputusan sementara yang saya ambil karena jawaban belum ada. Semuanya terkumpul di bagian 11 dan bisa diubah.

## 1. Ringkasan Produk

Website portofolio pribadi multi-halaman dengan panel Super Admin. Pemilik memperbarui konten (project, pengalaman, skill, CV, teks) lewat admin tanpa mengubah kode. Pengunjung publik tidak perlu akun.

## 2. Problem Statement

Muhammad Mirza saat ini hanya punya CV PDF. Belum ada tempat tunggal yang memperlihatkan karya, pengalaman, dan kemampuan teknis dengan cara yang menarik, mudah diperbarui, dan mudah dibuka dari HP.

## 3. Goals dan Non-goals

### Goals
1. **Meyakinkan dalam 30 detik.** Recruiter dan klien langsung menemukan project dan pengalaman, lalu bisa mengunduh CV atau membuka GitHub.
2. **Mudah diperbarui.** Super Admin bisa mengelola semua konten sendiri, harian bila perlu.
3. **Desain bagus dan bukan generik.** Terbaca jelas di HP, tablet, dan desktop, dengan identitas visual sendiri.

### Non-goals (di luar v1) **[ASUMSI]**
Blog, sertifikat, testimoni, login/komentar untuk pengunjung, multi-admin, e-commerce, forum.
Alasannya: tidak dipilih di jawaban 6.4 dan 6.2. Model data dibuat agar mudah ditambah di v2.

## 3a. Latar Pemilik (dari CV)

Mahasiswa BINUS (Computer Science, Artificial Intelligence, semester 5), sedang magang sebagai Fullstack Developer di PT PGAS Solution, sekaligus pembangun komunitas (Ace Padel Club, Horizon Organizer, Warnet Mobile). Portofolio harus menampilkan **kedua sisi**: software dan kepemimpinan komunitas. Detail dan pertanyaan konten: `Documentation/CONTENT.md`. Konsep visual: `Documentation/DESIGN.md` bagian 1.

## 4. Persona

| Persona | Kebutuhan dalam 30 detik | Aksi yang diharapkan |
|---|---|---|
| **Recruiter/HRD** (utama) | Project, pengalaman kerja, pendidikan, tech stack | Unduh CV, hubungi |
| **Calon klien** | Contoh project, kemampuan, cara menghubungi | Kirim pesan, WhatsApp |
| **Sesama developer** | Kode dan kualitas teknis | Buka GitHub, lihat detail project |
| **Pengunjung umum** | Siapa Mirza dan apa yang ia kerjakan | Jelajah, bagikan link |
| **Super Admin** (Mirza) | Mengubah konten cepat dan aman | CRUD, baca pesan, upload CV |

## 5. Fitur

Semua fitur wajib di v1 (jawaban 7.1: "semua", tidak ada yang ditunda). Prioritas P0 = harus ada untuk rilis.

### 5.1 Publik

| ID | Fitur | Prioritas |
|---|---|---|
| F1 | **Home**: hero satu layar (nama besar di belakang potret, peran di bawah foto, lapisan zirah terbuka di bawah kursor dengan masker cairan, intip "visor mata" berkala, latar neural vortex), lalu Pengalaman (akordeon), Project (pita sampul berjalan), Keahlian Teknis (globe skill, `#skills`), dan GitHub (kalender kontribusi). Semua bagian tanpa nomor dengan judul di tengah | P0 |
| F2 | **About**: kartu foto, nama dan peran, bio, kartu pendidikan (SMA dan kuliah). Tanpa tombol CV dan kontak (keduanya di footer) | P0 |
| F3 | **Experience**: timeline pengalaman kerja dan organisasi di `/experience` dengan logo instansi dan foto kegiatan, tanpa filter. Pendidikan tampil di About | P0 |
| F4 | **Skills**: dikelompokkan per kategori dari admin, tanpa persen. Tidak punya halaman sendiri (`/skills` dialihkan ke `/#skills`); tampil di beranda sebagai globe logo yang bisa diputar dan difilter per kategori | P0 |
| F5 | **Projects**: daftar + halaman detail (galeri, tech stack, tahun, studi kasus) + tautan demo dan repo | P0 |
| F6 | **Kontak**: form, notifikasi email ke pemilik, tautan sosial (LinkedIn, GitHub, Email, WhatsApp, Instagram) | P0 |
| F7 | **Resume CV**: satu klik di kartu pembuka dan footer, file terbaru dari admin, dihitung jumlah unduhannya | P0 |
| F8 | **Dua bahasa** ID/EN dengan toggle, URL `/id` dan `/en` | P0 |
| F9 | **Tema terang/gelap**: selalu mulai gelap, bisa diganti manual dan tersimpan | P0 |
| F10 | **Animasi**: hero, transisi halaman, reveal saat scroll. Menghormati `prefers-reduced-motion` | P0 |
| F11 | **Statistik pengunjung**: pencatatan tanpa cookie, ditampilkan di dashboard admin | P0 |
| F12 | **Kontak cepat**: WhatsApp lewat kartu di footer dan halaman kontak | P0 |
| F14 | **SEO & berbagi**: metadata per halaman, Open Graph, sitemap, robots.txt, data terstruktur `Person` | P0 |
| F15 | **Kebijakan Privasi**, halaman **404** dan **error** | P0 |
| F19 | **Pemberitahuan pembuka**: kartu "Informasi Penting" sekali per sesi browser, teks dua bahasa dari admin, tombol Resume CV (tab baru, kartu tetap terbuka) dan Beranda. ID/EN mengganti bahasa kartu di tempat; latar neural vortex selalu gelap | P0 |
| F18 | **Kategori project**: Software dan Komunitas & Bisnis **[USULAN, dari CV]** | P0 |

### 5.2 Super Admin (satu akun, email + password)

| ID | Fitur | Prioritas |
|---|---|---|
| A1 | Login/logout, sesi aman, ganti password | P0 |
| A2 | Dashboard: pengunjung, tayangan halaman, unduhan CV, pesan masuk, grafik kunjungan harian, pesan terbaru, dan rincian per hari | P0 |
| A3 | CRUD Project (dua bahasa, galeri, urutan), diubah langsung di pratinjau | P0 |
| A4 | CRUD Skill dan kategori | P0 |
| A5 | CRUD Pengalaman dan Pendidikan | P0 |
| A6 | Profil, teks halaman, link sosial, foto, dan CV, semuanya diubah langsung di pratinjau situs | P0 |
| A7 | Kotak masuk pesan (baru/dibaca/arsip) | P0 |
| A9 | Log audit: setiap tulis/ubah/hapus tercatat di tabel `AuditLog` (tanpa halaman panel sejak 2026-11-11) | P0 |

## 6. User Stories dan Kriteria Penerimaan

| # | Cerita | Kriteria penerimaan |
|---|---|---|
| U1 | Sebagai **recruiter**, saya ingin mengunduh CV dari halaman utama, agar bisa menilai kandidat dengan cepat. | Tombol "Resume CV" terlihat tanpa scroll di HP 360 px. File PDF terbuka/terunduh dalam ≤ 2 detik. |
| U2 | Sebagai **recruiter**, saya ingin melihat pengalaman dan pendidikan berurutan waktu, agar tahu latar belakangnya. | Timeline terurut dari terbaru. Tiap entri memuat instansi, peran, periode, uraian. |
| U3 | Sebagai **klien**, saya ingin melihat project beserta hasilnya, agar yakin pada kemampuannya. | Halaman detail memuat deskripsi, tech stack, galeri, dan tautan demo/repo bila ada. |
| U4 | Sebagai **developer**, saya ingin membuka repo project, agar bisa menilai kode. | Halaman detail memuat tautan repo bila ada. |
| U5 | Sebagai **pengunjung**, saya ingin mengganti bahasa dan tema, agar nyaman membaca. | Pilihan tersimpan. Semua teks (UI dan konten) berganti tanpa kehilangan halaman. |
| U6 | Sebagai **pengunjung**, saya ingin mengirim pesan, agar bisa menghubungi Mirza. | Form memvalidasi input, menampilkan status berhasil/gagal yang jelas, dan pesan masuk di admin. |
| U8 | Sebagai **Super Admin**, saya ingin menambah project baru dalam dua bahasa, agar konten cepat diperbarui. | Project baru tampil di situs dalam ≤ 1 menit setelah disimpan (revalidate). |
| U9 | Sebagai **Super Admin**, saya ingin mengganti file CV, agar semua orang mendapat versi terbaru. | Tautan unduh selalu mengarah ke CV terbaru. |
| U10 | Sebagai **Super Admin**, saya ingin setiap perubahan tercatat, agar ada riwayat konten dan akses tak wajar bisa dilacak. | Setiap tulis/ubah/hapus tercatat di `AuditLog` dengan waktu dan aktor. |

## 7. Metrik Keberhasilan

| Jenis | Metrik | Target |
|---|---|---|
| **Hasil utama** | Mendapat pekerjaan | Tujuan akhir (jawaban 6.7) |
| Indikator awal | Unduhan CV per bulan | Ditetapkan setelah baseline 2 minggu |
| Indikator awal | Pesan kontak per bulan | Ditetapkan setelah baseline 2 minggu |
| Kualitas | Lighthouse (mobile) | ≥ 90 di Performance, Accessibility, Best Practices, SEO |
| Kualitas | Core Web Vitals | LCP ≤ 2,5 s, CLS ≤ 0,1, INP ≤ 200 ms |
| Kualitas | Aksesibilitas | WCAG 2.2 AA, 0 pelanggaran kritis pada axe |
| Keandalan | Uptime | ≥ 99,5% |

## 8. Persyaratan Non-Fungsional

- **Responsif:** mobile-first. Titik uji 360, 390, 768, 1024, 1440 px. Mayoritas pengunjung dari HP.
- **Performa:** animasi hero ringan (canvas/CSS), di-lazy-load, dimatikan pada `prefers-reduced-motion`. Gambar lewat `next/image` dan Cloudinary.
- **Aksesibilitas:** WCAG AA, navigasi keyboard penuh, fokus terlihat, alt text dua bahasa, tautan lompat ke konten.
- **Keamanan:** lihat `ARCHITECTURE.md` bagian 8.
- **Privasi:** tanpa cookie pelacak. Alamat IP tidak disimpan mentah. Kebijakan privasi memuat data yang dikumpulkan.
- **Bahasa:** semua konten yang tampil ke publik tersedia dalam ID dan EN. Nada personal, jelas, tanpa klise.
- **Browser:** dua versi terbaru Chrome, Safari (termasuk iOS), Firefox, Edge.

## 9. Lingkup dan Milestone

v1 dikerjakan dalam lima milestone (Setup, Auth + Admin, Halaman publik, Polish, Deploy) dan live sejak 2026-10-01. Pekerjaan sekarang berupa revisi pemilik; sisa tugas dan backlog ada di `Documentation/TODO.md`.

## 10. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Animasi layar penuh menurunkan skor di HP | Lighthouse < 90 | Anggaran performa, kepadatan partikel turun di HP, lazy init |
| Form kontak tanpa proteksi | Spam, kuota email habis | Honeypot + rate limit 5 pesan per jam per IP (IP di-hash) |
| Data gratis (Neon, Vercel Hobby) berbatas | Pembatasan atau kehilangan data | Backup terjadwal terenkripsi, rollback Vercel |

## 11. Keputusan Sementara **[ASUMSI]** yang Menunggu Konfirmasi

Nomor merujuk ke `Documentation/00-discovery.md` bagian 6. Keputusan yang sudah dikonfirmasi atau selesai dihapus dari tabel; hasilnya tertuang di bagian 5 dan di `ARCHITECTURE.md`.

| # | Keputusan sementara | Alternatif |
|---|---|---|
| 2 | Blog dan sertifikat ditunda ke v2 | Masukkan ke v1 |
| 6 | Secret tidak pernah di-commit, hanya `Frontend/.env.example` | — |
| 8 | Resend untuk email, Cloudinary untuk gambar dan CV | Cloudflare R2 |
| 11 | Skill dikelompokkan tanpa level angka | Tampilkan level |
| 12 | Tampilkan kota dan tombol WhatsApp. Alamat lengkap tidak ditampilkan | Tampilkan alamat penuh |
| 13 | Semua konten diisi manual dalam dua bahasa | Terjemahan otomatis |
