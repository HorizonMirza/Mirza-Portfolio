# WORKFLOW — Cara Kerja Proyek

Status: **draf v1**. Berlaku untuk pengembangan bersama antara Muhammad Mirza (pemilik, reviewer) dan Claude (penulis kode).

## 1. Peran

| Peran | Tanggung jawab |
|---|---|
| **Mirza (pemilik/reviewer)** | Menyediakan konten dan aset, memutuskan hal yang terbuka, mereview dan menyetujui setiap perubahan, memegang semua akun dan secret |
| **Claude (penulis kode)** | Menulis kode, tes, dan dokumentasi sesuai dokumen di `documentation/`, menjalankan pemeriksaan sebelum menyerahkan, menandai asumsi dan risiko secara jujur |

Claude tidak mengambil keputusan yang tercatat sebagai "terbuka" tanpa konfirmasi, tidak menambah layanan atau dependency besar tanpa persetujuan, dan tidak menyimpan secret di repo.

## 2. Urutan Kerja per Milestone

```
Rencana (TODO.md) → Kerjakan di branch → Cek lokal → PR → CI + Preview → Review Mirza → Merge → Deploy → Catat
```

1. **Rencana:** ambil tugas dari `documentation/TODO.md` berurutan. Satu PR = satu tujuan yang jelas.
2. **Kerjakan:** buat branch dari `main`, kerja kecil dan sering commit.
3. **Cek lokal:** jalankan `pnpm lint`, `pnpm typecheck`, `pnpm test`, dan `pnpm build` sebelum push.
4. **PR:** isi templat PR (apa, kenapa, cara uji, tangkapan layar mobile dan desktop).
5. **CI dan preview:** semua pemeriksaan hijau, Vercel membuat URL preview.
6. **Review:** Mirza membuka preview di HP dan laptop, membaca diff, memberi komentar. Claude menindaklanjuti.
7. **Merge:** squash merge ke `main` setelah disetujui. Vercel deploy production otomatis.
8. **Catat:** centang tugas di `TODO.md`, perbarui dokumen bila keputusan berubah.

> Catatan: jawaban 22.1 menyebut "di main". Alur di atas memakai PR ke `main` supaya setiap perubahan punya preview dan bisa direview sebelum tayang. Jika Anda tetap ingin push langsung ke `main`, ubah bagian ini dan bagian 3. Untuk dokumen saja, push langsung dapat diterima.

## 3. Branch dan Commit

- `main` selalu dapat dideploy. Tidak ada `dev` terpisah (proyek kecil, satu pemilik).
- Nama branch: `feat/<topik>`, `fix/<topik>`, `documentation/<topik>`, `chore/<topik>`, contoh `feat/admin-crud-project`.
- Branch berumur pendek (idealnya ≤ 1–2 hari).
- **Commit:** awalan `[CLAUDIA]` untuk commit dari Claude (pola repo GAAS), lalu format Conventional Commits dengan tipe bahasa Inggris dan deskripsi bahasa Indonesia. Tanpa baris atribusi AI (`Co-Authored-By`, `Claude-Session`), sesuai permintaan pemilik. Commit manual pemilik tanpa awalan.

  ```
  [CLAUDIA] feat(projects): tambah halaman detail project
  [CLAUDIA] fix(contact): perbaiki validasi email kosong
  [CLAUDIA] docs: perbarui rencana milestone 2
  ```

  Tipe: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`.
- Komentar kode dan pesan commit **bahasa Indonesia**. Nama variabel, fungsi, dan berkas **bahasa Inggris**.
- Jangan pernah commit: `.env*` (kecuali `frontend/.env.example`), kunci API, dump database, kredensial admin.

## 4. Definition of Done

Sebuah fitur dianggap selesai bila **semua** poin terpenuhi:

- [ ] Sesuai kriteria penerimaan di `PRD.md`
- [ ] Berfungsi di mobile (360 px), tablet, dan desktop
- [ ] Konten publik ada dalam **ID dan EN**
- [ ] Mode terang dan gelap tampil benar
- [ ] `lint` dan `typecheck` lulus, tanpa peringatan baru
- [ ] Ada tes yang relevan (unit dan/atau E2E) dan semuanya lulus
- [ ] Tanpa error atau peringatan di console browser
- [ ] Aksesibilitas: keyboard, fokus, alt text, axe tanpa pelanggaran kritis
- [ ] Input divalidasi di server, hak akses diperiksa (untuk fitur admin, tercatat di log audit)
- [ ] Performa tidak menurunkan Lighthouse di bawah 90
- [ ] Dokumen terkait diperbarui (PRD/ARCHITECTURE/TODO, panduan admin bila perlu)
- [ ] Direview dan disetujui Mirza

## 5. Pengujian

| Jenis | Alat | Cakupan |
|---|---|---|
| Unit | Vitest | Skema Zod, fungsi util, query, logika hash/rate limit |
| Komponen | Testing Library | Form, toggle, komponen dengan logika |
| E2E | Playwright | Alur utama: unduh CV, ganti bahasa/tema, kirim kontak, login admin, CRUD project |
| Aksesibilitas | axe (di Playwright) | Semua halaman publik dan admin utama |
| Performa | Lighthouse CI | Home, Projects, detail Project (mobile) |
| Manual | Anda | Perangkat nyata: Android, iPhone (Safari), laptop. Lihat daftar periksa rilis |

Bug yang ditemukan: tulis tes yang gagal dulu, perbaiki, pastikan tes lulus.

## 6. Review Kode

Claude memeriksa diff sendiri sebelum meminta review, lalu menjalankan review kode dan review keamanan (jawaban 27.1). Fokus review:
1. Kebenaran dan kasus tepi
2. Keamanan (validasi, otorisasi, secret, XSS)
3. Aksesibilitas dan responsif
4. Kesederhanaan (tidak ada abstraksi atau dependency berlebihan)
5. Tes dan dokumentasi

## 7. Rilis, Deployment, dan Rollback

- **Deploy:** otomatis dari `main` ke Vercel (production). Tidak ada staging terpisah. Preview PR berfungsi sebagai staging (jawaban 30.1).
- **Migrasi database:** kompatibel ke belakang. Tambahkan kolom/tabel dulu, hapus di rilis berikutnya. Jalankan di preview sebelum production.
- **Daftar periksa rilis:**
  - [ ] CI hijau, preview sudah dicek di HP nyata
  - [ ] Lighthouse mobile ≥ 90
  - [ ] Variabel lingkungan production lengkap
  - [ ] Backup terbaru ada dan pernah diuji pulih
  - [ ] Sitemap, robots, Open Graph diperiksa
  - [ ] Uptime monitor dan Sentry aktif
- **Rollback:** Vercel Instant Rollback ke deployment sebelumnya. Jika ada migrasi berbahaya, pulihkan dari backup. Catat insiden di `documentation/`.

## 8. Alur Pembaruan Konten (harian)

Konten diubah lewat `/admin`, bukan lewat kode:
1. Login, ubah konten (isi ID dan EN), simpan.
2. Halaman terkait diperbarui otomatis (revalidate) dalam ≤ 1 menit.
3. Perubahan tercatat di log audit.

Perubahan desain, fitur, atau struktur data tetap lewat PR.

## 9. Manajemen Secret

- Semua secret ada di Vercel Environment Variables dan GitHub Actions Secrets.
- Lokal memakai `.env.local` (tidak di-commit). Repo hanya berisi `frontend/.env.example` tanpa nilai asli.
- Bila secret terlanjur ter-commit: anggap bocor, **cabut dan buat ulang secretnya**, baru bersihkan repo.
- `gitleaks` berjalan di pre-commit dan CI.

## 10. Pemeliharaan

| Frekuensi | Kegiatan |
|---|---|
| Harian | Update konten lewat admin, baca pesan masuk |
| Mingguan | Tinjau PR Dependabot, cek Sentry dan uptime |
| Bulanan | Cek skor Lighthouse dan Web Vitals, tinjau statistik unduhan CV dan pesan, bersihkan pesan lama |
| Triwulan | Uji pemulihan backup, audit dependency (`pnpm audit`), tinjau akses akun dan token |

## 11. Umpan Balik

Masukan masuk lewat form kontak dan tautan yang tercantum (jawaban 34.1). Catat masukan yang dapat ditindaklanjuti di `TODO.md` bagian Backlog.

## 12. Komunikasi dengan Claude

- Tulis tujuan dan batasan singkat, sebut bagian dokumen yang relevan.
- Claude menyebut asumsi yang ia ambil, hasil pengujian yang sebenarnya (termasuk yang gagal), dan hal yang belum bisa diverifikasi.
- Perubahan yang berdampak besar (arsitektur, data, biaya, keamanan) selalu ditanyakan dulu.

## 13. Perbandingan dengan Alur Repo GAAS

Repo GAAS (`HorizonMirza/gaas-generalaffairapplicationsupport`) sudah punya alur kerja sendiri. Ringkasnya dan bedanya dengan rencana di atas:

| Hal | GAAS | Rencana portofolio (di atas) |
|---|---|---|
| Kontributor | Pemilik + 3 asisten AI (Claude Code, Antigravity, Codex) dalam sandbox terpisah | Pemilik + Claude |
| Awalan commit | `[CLAUDIA]`, `[AGY]`, `[NOVA]` per asisten | Sama: `[CLAUDIA]` + Conventional Commits (`[CLAUDIA] feat(...)`) |
| Branch | Push langsung ke `main` setelah verifikasi | Branch pendek + PR + preview Vercel |
| Verifikasi | `dotnet build`, `tsc --noEmit`, Playwright untuk UI, `resetdb` bila skema berubah | `lint`, `typecheck`, `test`, `build`, Playwright + axe, Lighthouse CI |
| Bahasa | UI Indonesia, dokumen Indonesia | Konten ID/EN, komentar dan commit Indonesia |
| Dokumen | `CLAUDE.md`, `AGENTS.md`, `documentation/Prd.md`, `skill.md`, `workflow.md`, `TODO.md` | `CLAUDE.md`, `documentation/PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `WORKFLOW.md`, `TODO.md`, `SKILL.md` |
| Klarifikasi | Bertanya dulu bila permintaan ambigu, konfirmasi sebelum aksi sulit dibalik | Sama (lihat bagian 12) |

**Keputusan yang perlu Anda ambil:** ikut pola GAAS (push langsung ke `main`, awalan `[CLAUDIA]`) atau pola PR di atas? Perbedaan pentingnya: di portofolio setiap push ke `main` langsung menjadi versi live di Vercel, sedangkan GAAS berjalan lokal. Karena itu rencana ini memakai PR + preview. Jika Anda tetap ingin push langsung, bagian 2 dan 3 akan saya ubah, dan CI wajib hijau sebelum push.
