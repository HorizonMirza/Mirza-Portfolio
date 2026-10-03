# PRD — Website Portofolio Muhammad Mirza

Status: **draf v1** · Sumber: `Documentation/00-discovery.md` (jawaban Fase 0–8)
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
| F1 | **Home**: hero layar penuh dengan animasi, nama, posisi yang dicari, CTA Unduh CV + GitHub, ringkasan project unggulan | P0 |
| F2 | **About**: bio personal, foto, data kontak yang boleh ditampilkan | P0 |
| F3 | **Experience**: timeline pengalaman kerja dan organisasi di `/experience` dengan filter, logo instansi, dan foto kegiatan. Pendidikan tidak ditampilkan di sini sejak 2026-10-03 (keputusan pemilik); data pendidikan tetap dipakai halaman About | P0 |
| F4 | **Skills**: dikelompokkan (Frontend, Backend, Database, Tools/DevOps), tanpa progress bar persen **[ASUMSI]** | P0 |
| F5 | **Projects**: daftar + halaman detail (galeri, tech stack, demo, repo, tahun, studi kasus) + metadata GitHub otomatis | P0 |
| F6 | **Kontak**: form, notifikasi email ke pemilik, tautan sosial (LinkedIn, GitHub, Email, WhatsApp, Instagram) | P0 |
| F7 | **Unduh CV**: satu klik, file terbaru dari admin, dihitung jumlah unduhannya | P0 |
| F8 | **Dua bahasa** ID/EN dengan toggle, URL `/id` dan `/en` | P0 |
| F9 | **Tema terang/gelap** (ikut sistem, bisa diganti manual) | P0 |
| F10 | **Animasi**: hero, transisi halaman, reveal saat scroll. Menghormati `prefers-reduced-motion` | P0 |
| F11 | **Statistik pengunjung**: pencatatan tanpa cookie, ditampilkan di dashboard admin | P0 |
| F12 | **Kontak cepat**: ~~tombol WhatsApp melayang~~ dihapus pemilik 2026-10-03; WhatsApp lewat kartu di footer dan halaman kontak | P0 |
| F13 | **Newsletter**: form berlangganan dengan konfirmasi email (double opt-in) dan tautan berhenti | P0 |
| F14 | **SEO & berbagi**: metadata per halaman, Open Graph, sitemap, robots.txt, data terstruktur `Person` | P0 |
| F15 | **Kebijakan Privasi**, halaman **404** dan **error** | P0 |
| F16 | **API publik** read-only (project, skill, profil) | P1 |
| F17 | **Pelat status di hero** yang dapat diubah admin (status ketersediaan, lokasi, posisi sekarang) **[USULAN, dari referensi utama]** | P0 |
| F18 | **Kategori project**: Software dan Komunitas & Bisnis **[USULAN, dari CV]** | P0 |

### 5.2 Super Admin (satu akun, email + password)

| ID | Fitur | Prioritas |
|---|---|---|
| A1 | Login/logout, sesi aman, ganti password | P0 |
| A2 | Dashboard: pesan baru, statistik pengunjung, unduhan CV, pelanggan newsletter | P0 |
| A3 | CRUD Project (dua bahasa, galeri, urutan, terbitkan/draf, impor dari GitHub) | P0 |
| A4 | CRUD Skill dan kategori | P0 |
| A5 | CRUD Pengalaman dan Pendidikan | P0 |
| A6 | Edit Profil dan teks hero, link sosial, upload foto dan CV | P0 |
| A7 | Kotak masuk pesan (baru/dibaca/arsip) | P0 |
| A8 | Newsletter: daftar pelanggan dan kirim broadcast | P0 |
| A9 | Log audit (siapa mengubah apa, kapan) | P0 |
| A10 | Pratinjau perubahan sebelum diterbitkan (draf) | P1 |

## 6. User Stories dan Kriteria Penerimaan

| # | Cerita | Kriteria penerimaan |
|---|---|---|
| U1 | Sebagai **recruiter**, saya ingin mengunduh CV dari halaman utama, agar bisa menilai kandidat dengan cepat. | Tombol "Unduh CV" terlihat tanpa scroll di HP 360 px. File PDF terbuka/terunduh dalam ≤ 2 detik. |
| U2 | Sebagai **recruiter**, saya ingin melihat pengalaman dan pendidikan berurutan waktu, agar tahu latar belakangnya. | Timeline terurut dari terbaru. Tiap entri memuat instansi, peran, periode, uraian. |
| U3 | Sebagai **klien**, saya ingin melihat project beserta hasilnya, agar yakin pada kemampuannya. | Halaman detail memuat deskripsi, tech stack, galeri, dan tautan demo/repo bila ada. |
| U4 | Sebagai **developer**, saya ingin membuka repo project, agar bisa menilai kode. | Kartu project menampilkan bahasa, bintang, dan waktu update terakhir dari GitHub. |
| U5 | Sebagai **pengunjung**, saya ingin mengganti bahasa dan tema, agar nyaman membaca. | Pilihan tersimpan. Semua teks (UI dan konten) berganti tanpa kehilangan halaman. |
| U6 | Sebagai **pengunjung**, saya ingin mengirim pesan, agar bisa menghubungi Mirza. | Form memvalidasi input, menampilkan status berhasil/gagal yang jelas, dan pesan masuk di admin. |
| U7 | Sebagai **pengunjung**, saya ingin berlangganan newsletter dan berhenti kapan saja. | Email konfirmasi terkirim. Tautan berhenti berfungsi tanpa login. |
| U8 | Sebagai **Super Admin**, saya ingin menambah project baru dalam dua bahasa, agar konten cepat diperbarui. | Project baru tampil di situs dalam ≤ 1 menit setelah disimpan (revalidate). |
| U9 | Sebagai **Super Admin**, saya ingin mengganti file CV, agar semua orang mendapat versi terbaru. | Tautan unduh selalu mengarah ke CV terbaru. |
| U10 | Sebagai **Super Admin**, saya ingin melihat log perubahan, agar tahu riwayat konten dan mendeteksi akses tak wajar. | Setiap tulis/ubah/hapus tercatat dengan waktu dan aktor. |

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

Lihat `Documentation/TODO.md`. Ringkas: M1 Setup → M2 Auth + Admin → M3 Halaman publik → M4 Polish → M5 Deploy. Estimasi 1 hari per milestone, total target 1 bulan dengan waktu review.

## 10. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Semua fitur masuk v1 dalam 5 milestone | Jadwal molor | Tiap milestone punya batas jelas. Fitur P1 boleh mundur tanpa menunda rilis |
| Animasi layar penuh menurunkan skor di HP | Lighthouse < 90 | Anggaran performa, kepadatan partikel turun di HP, lazy init |
| Form kontak tanpa proteksi | Spam, kuota email habis | Honeypot + rate limit (lihat 11) |
| Data gratis (Neon, Vercel Hobby) berbatas | Pembatasan atau kehilangan data | Backup terjadwal terenkripsi, rollback Vercel |
| Konten belum siap (CV, foto, project) | Halaman kosong | Gunakan data seed sementara, ganti saat aset tiba |
| Widget live chat pihak ketiga | Performa dan privasi | Dimuat hanya saat tombol chat diklik |

## 11. Keputusan Sementara **[ASUMSI]** yang Menunggu Konfirmasi

Nomor merujuk ke `Documentation/00-discovery.md` bagian 6.

| # | Keputusan sementara | Alternatif |
|---|---|---|
| 1 | ~~Halaman `/experience` berisi timeline kerja dan pendidikan~~ **Dikonfirmasi 2026-09-30:** satu halaman dengan filter Semua/Kerja/Organisasi/Pendidikan | Pisahkan menjadi dua halaman |
| 2 | Blog dan sertifikat ditunda ke v2 | Masukkan ke v1 |
| 3 | ~~Live chat: widget gratis~~ **Dikonfirmasi 2026-09-30:** tombol WhatsApp melayang, tanpa widget pihak ketiga. **Revisi 2026-10-03:** tombol melayang dihapus, WhatsApp cukup di footer dan halaman kontak | Hanya tombol WhatsApp |
| 4 | Newsletter: double opt-in, kirim broadcast dari admin lewat Resend. **Double opt-in dikonfirmasi 2026-09-30** (dikerjakan M3); broadcast masih menunggu | Kirim manual di luar sistem |
| 5 | ~~Form kontak: honeypot + rate limit~~ **Dikonfirmasi 2026-09-30:** honeypot + rate limit 5 pesan per jam per IP (IP di-hash) | Tanpa proteksi, sesuai jawaban awal |
| 6 | Secret tidak pernah di-commit, hanya `Frontend/.env.example` | — |
| 7 | Alur PR ke `main` (Vercel preview otomatis) | Push langsung ke `main` |
| 8 | Resend untuk email, Cloudinary untuk gambar dan CV | Cloudflare R2 |
| 9 | GitHub API untuk metadata kartu project dan tombol "Impor dari GitHub" di admin | Daftar repo otomatis penuh |
| 10 | ~~API publik read-only~~ **Dikonfirmasi 2026-09-30:** `/api/v1/projects`, `/api/v1/skills`, `/api/v1/profile` dibuat di M3 (tanpa email/WhatsApp) | Tanpa API publik |
| 11 | Skill dikelompokkan tanpa level angka | Tampilkan level |
| 12 | Tampilkan kota dan tombol WhatsApp. Alamat lengkap tidak ditampilkan | Tampilkan alamat penuh |
| 13 | Semua konten diisi manual dalam dua bahasa | Terjemahan otomatis |
| 14 | ~~Animasi hero: canvas ringan~~ **Dikonfirmasi 2026-09-30:** canvas 2D ringan "Horizon" | WebGL |
| 15 | Domain `.site` (dibimbing saat deploy) | Domain lain |
