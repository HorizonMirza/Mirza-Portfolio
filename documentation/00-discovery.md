# Discovery & Keputusan Awal — Portofolio Muhammad Mirza

Dokumen ini merangkum jawaban Fase 0–8 dan menjadi acuan untuk PRD, desain, dan implementasi.
Status: **draf v1**. Bagian "Perlu Diputuskan" di bawah harus dijawab sebelum Fase 2 dimulai.

## 1. Ringkasan

| Aspek | Keputusan |
|---|---|
| Pemilik | Muhammad Mirza (dikerjakan sendiri, kode ditulis Claude, direview pemilik) |
| Tujuan | Personal branding, mencari pekerjaan, mencari klien, menyimpan portofolio |
| Audiens | HRD/recruiter, klien, sesama developer, dan pengunjung umum |
| Yang dicari pengunjung dalam 30 detik | Project dan pengalaman kerja |
| Aksi utama pengunjung | Unduh CV dan buka GitHub |
| Ukuran sukses | Mendapat pekerjaan |
| Perangkat | Mobile, tablet, desktop. Pengunjung terbanyak dari HP |
| Deadline | Tidak ada tenggat keras, target versi final 1 bulan |
| Budget | Hanya domain `.site`. Semua layanan lain memakai tier gratis |
| Bahasa UI | ID dan EN (bisa diganti pengunjung) |
| Tema | Biru, mode terang dan gelap |
| Gaya | Personal, sederhana, mudah dibaca. Tidak generik ("AI slop") |

## 2. Lingkup

### Halaman publik (multi-page, navigasi di atas)
Home (hero layar penuh dengan animasi), About, Education, Skills, Projects (+ halaman detail), Kontak (form), Unduh CV, halaman Kebijakan Privasi, halaman 404/error.

### Fitur lintas halaman
Dark/light mode, ID/EN, animasi, statistik pengunjung, live chat, newsletter, preview link (Open Graph), sitemap, robots.txt.

### Super Admin (satu akun, email + password)
CRUD project, skill, pendidikan/pengalaman, baca pesan masuk, upload CV, edit teks hero, log audit.

### Non-goals
Tidak ada. Pengunjung publik tidak perlu login atau registrasi.

### Rencana MVP
Semua fitur masuk MVP. Tidak ada yang ditunda. Target selesai 1 bulan, 5 milestone dengan estimasi 1 hari per milestone.

## 3. Keputusan Teknis

| Lapisan | Pilihan |
|---|---|
| Frontend | Next.js (App Router) + TypeScript |
| Styling/UI | Tailwind CSS + shadcn/ui + Framer Motion |
| Backend | Next.js Route Handlers / Server Actions (Opsi A, tanpa server terpisah) |
| Database | PostgreSQL (Neon atau Supabase) |
| ORM | Prisma |
| Auth | Auth.js, role `USER` / `SUPER_ADMIN` (hanya admin yang bisa login) |
| Upload file | Cloudinary atau Cloudflare R2 |
| Validasi | Zod + React Hook Form |
| Email | Resend |
| Integrasi | GitHub API untuk data repo otomatis |
| Deployment | Vercel, langsung production, auto-deploy dari `main` |
| CI/CD | GitHub Actions (lint, typecheck, test, build) |
| Monitoring | Sentry, uptime monitor, Vercel Analytics. Notifikasi via email dan Telegram |
| Testing | Vitest (unit) + Playwright (E2E) |
| Dependency | Dependabot |

## 4. Kualitas dan Proses

- Standar aksesibilitas WCAG AA (kontras, navigasi keyboard, alt text).
- Target Lighthouse ≥ 90 di semua kategori. Semua gambar dioptimasi.
- Definition of Done: fitur berjalan, responsif, lulus lint dan typecheck, ada test dasar, tanpa error console.
- Code review dan security review sebelum merge.
- Komentar kode dan pesan commit dalam bahasa Indonesia. Nama variabel/fungsi tetap bahasa Inggris.
- Backup database otomatis terjadwal dan rollback lewat Vercel/Git.
- Dokumentasi: README, panduan setup, panduan admin, catatan arsitektur.
- Konten diperbarui harian lewat admin.

## 5. Aset yang Ditunggu dari Pemilik

- [ ] CV (sumber bio, pengalaman, pendidikan, skill, kata kunci SEO)
- [ ] Foto profil
- [ ] Logo/inisial
- [ ] Screenshot dan detail 6 project awal
- [ ] Teks halaman error dan 404
- [ ] Tautan sosial: LinkedIn, GitHub, email, WhatsApp, Instagram
- [ ] Domain `.site` (dibimbing saat tahap deployment)

## 6. Perlu Diputuskan

1. **Experience/Pengalaman kerja.** Di 6.4 hanya Education yang dipilih, tetapi di 6.3 pengalaman disebut sebagai hal yang "dijual". Apakah halaman Experience ikut dibuat?
2. **Blog dan Sertifikat.** Tidak dipilih di 6.4, tetapi CRUD blog disebut di 6.5 dan "artikel" di 10.3. Apakah keduanya tidak dibuat di v1?
3. **Live chat.** Vercel tidak mendukung WebSocket permanen. Opsi: widget gratis (Tawk.to atau Crisp), atau tombol WhatsApp.
4. **Newsletter.** Siapa yang mengirim, seberapa sering, dan lewat apa (misalnya Resend Audiences atau Buttondown)? Perlu persetujuan pengunjung (opt-in) dan tercantum di kebijakan privasi.
5. **Form kontak tanpa proteksi spam** (20.1 dan 19.2). Form publik tanpa proteksi mudah diserbu bot dan bisa menghabiskan kuota email gratis. Rekomendasi: honeypot dan rate limit sederhana, tanpa CAPTCHA, tidak mengganggu pengunjung.
6. **Secret dan repo.** Jawaban 20.2 ("Commit dulu") dan 22.1 ("di main") perlu dipastikan. Secret (URL database, kunci Resend/Cloudinary, `AUTH_SECRET`) tidak boleh di-commit; hanya `frontend/.env.example` yang masuk repo. Selain itu, apakah repo publik atau privat?
7. **Bekerja langsung di `main`.** Karena setiap push ke `main` langsung deploy ke production, rekomendasi saya: kerja di branch, buka PR ke `main`, dan Vercel memberi preview gratis. Setuju?
8. **Layanan pihak ketiga.** Selain GitHub API: setuju memakai Resend (email) dan Cloudinary atau R2 (gambar dan CV)?
9. **GitHub API.** Apakah dipakai untuk mengisi metadata (bahasa, bintang, update terakhir) di kartu project, atau membuat daftar repo otomatis di halaman terpisah?
10. **API publik** (19.1). Endpoint apa yang dibuka? Usulan: read-only untuk project dan skill.
11. **Skill.** Dikelompokkan (Frontend/Backend/Tools) dengan level angka, atau hanya daftar? Usulan: tanpa progress bar persen.
12. **Data pribadi.** Alamat rumah lengkap di website publik rawan disalahgunakan. Usulan: cukup kota, dan telepon lewat tombol WhatsApp.
13. **Konten dua bahasa.** Setiap teks di admin harus diisi dalam ID dan EN. Bisa dibantu terjemahan otomatis atau diisi manual?
14. **Animasi hero** layar penuh harus ringan agar Lighthouse ≥ 90 di HP. Kami pakai canvas/CSS ringan, bukan WebGL berat, dan menghormati `prefers-reduced-motion`. Setuju?
15. **Domain `.site`.** Biasanya murah di tahun pertama, tetapi perpanjangan jauh lebih mahal. Apakah akan diperpanjang, atau pindah domain nanti?

## 7. Referensi Visual

Screenshot referensi (portofolio orang lain) hanya untuk inspirasi struktur dan nuansa: kartu ringkas dengan tombol CV, latar animasi halus, toggle ID/EN. Desain akhir dibuat orisinal dan tidak menyalin.

## 8. Milestone

| # | Milestone | Estimasi |
|---|---|---|
| 1 | Setup (repo, Next.js, CI, database, env) | 1 hari |
| 2 | Auth + Super Admin (CRUD, upload, audit log) | 1 hari |
| 3 | Halaman publik (semua halaman, ID/EN, tema) | 1 hari |
| 4 | Polish (animasi, SEO, aksesibilitas, performa, test) | 1 hari |
| 5 | Deploy (domain, Vercel, monitoring, backup, dokumentasi) | 1 hari |
