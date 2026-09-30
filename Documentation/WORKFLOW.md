# WORKFLOW — Cara Kerja Proyek

Status: **draf v1**. Berlaku untuk pengembangan bersama antara Muhammad Mirza (pemilik, reviewer) dan Claude (penulis kode).

## 1. Peran

| Peran | Tanggung jawab |
|---|---|
| **Mirza (pemilik/reviewer)** | Menyediakan konten dan aset, memutuskan hal yang terbuka, mereview dan menyetujui setiap perubahan, memegang semua akun dan secret |
| **Claude (penulis kode)** | Menulis kode, tes, dan dokumentasi sesuai dokumen di `Documentation/`, menjalankan pemeriksaan sebelum menyerahkan, menandai asumsi dan risiko secara jujur |

Claude tidak mengambil keputusan yang tercatat sebagai "terbuka" tanpa konfirmasi, tidak menambah layanan atau dependency besar tanpa persetujuan, dan tidak menyimpan secret di repo.

## 2. Urutan Kerja per Milestone

```
Rencana (TODO.md) → Kerjakan di main → Cek lokal lengkap → Push ke main → CI → Deploy otomatis → Review Mirza → Catat
```

1. **Rencana:** ambil tugas dari `Documentation/TODO.md` berurutan. Satu commit = satu tujuan yang jelas.
2. **Kerjakan:** langsung di `main`, kerja kecil dan sering commit.
3. **Cek lokal lengkap sebelum push:** `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`, `pnpm build`, dan `pnpm test:e2e`. Karena push ke `main` langsung menjadi versi live di Vercel, semua harus hijau dulu.
4. **Push ke `main`:** CI berjalan di setiap push. Bila CI merah, perbaikan langsung jadi prioritas pertama (atau kembalikan dengan Vercel Instant Rollback).
5. **Review:** Mirza membuka situs di HP dan laptop, membaca riwayat commit, memberi komentar. Claude menindaklanjuti dengan commit baru.
6. **Catat:** centang tugas di `TODO.md`, perbarui dokumen bila keputusan berubah.

> **Keputusan (2026-09-30, diperbarui):** **semua pekerjaan langsung di `main`, tidak ada branch lain** (permintaan pemilik, sama seperti pola GAAS). Tidak ada PR. Branch lama sudah disatukan ke `main` dengan fast-forward, sehingga semua commit tetap atas nama pemilik.

## 3. Branch dan Commit

- Hanya ada branch `main`, dan `main` selalu dapat dideploy. Tidak ada `dev`, branch fitur, atau PR.
- Tidak ada force push dan tidak ada penulisan ulang riwayat di `main`.
- **Commit:** awalan `[CLAUDIA]` untuk commit dari Claude (pola repo GAAS), lalu format Conventional Commits dengan tipe bahasa Inggris dan deskripsi bahasa Indonesia. Tanpa baris atribusi AI (`Co-Authored-By`, `Claude-Session`), sesuai permintaan pemilik. Commit manual pemilik tanpa awalan.

  ```
  [CLAUDIA] feat(projects): tambah halaman detail project
  [CLAUDIA] fix(contact): perbaiki validasi email kosong
  [CLAUDIA] docs: perbarui rencana milestone 2
  ```

  Tipe: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`.
- Komentar kode dan pesan commit **bahasa Indonesia**. Nama variabel, fungsi, dan berkas **bahasa Inggris**.
- Jangan pernah commit: `.env*` (kecuali `Frontend/.env.example`), kunci API, dump database, kredensial admin.

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

- **Deploy:** otomatis dari `main` ke Vercel (production). Tidak ada staging terpisah dan tidak ada preview PR, jadi pemeriksaan lokal lengkap (bagian 2 langkah 3) menggantikan staging.
- **Migrasi database:** kompatibel ke belakang. Tambahkan kolom/tabel dulu, hapus di rilis berikutnya. Uji dulu di database lokal/CI (CI menjalankan migrasi + seed dua kali) sebelum push.
- **Daftar periksa rilis:**
  - [ ] CI hijau, situs sudah dicek di HP nyata
  - [ ] Lighthouse mobile ≥ 90
  - [ ] Variabel lingkungan production lengkap
  - [ ] Backup terbaru ada dan pernah diuji pulih
  - [ ] Sitemap, robots, Open Graph diperiksa
  - [ ] Uptime monitor dan Sentry aktif
- **Rollback:** Vercel Instant Rollback ke deployment sebelumnya. Jika ada migrasi berbahaya, pulihkan dari backup. Catat insiden di `Documentation/`.

## 8. Alur Pembaruan Konten (harian)

Konten diubah lewat `/admin`, bukan lewat kode:
1. Login, ubah konten (isi ID dan EN), simpan.
2. Halaman terkait diperbarui otomatis (revalidate) dalam ≤ 1 menit.
3. Perubahan tercatat di log audit.

Perubahan desain, fitur, atau struktur data dikerjakan Claude di kode lalu di-push ke `main`.

## 9. Manajemen Secret

- Semua secret ada di Vercel Environment Variables dan GitHub Actions Secrets.
- Lokal memakai `.env.local` (tidak di-commit). Repo hanya berisi `Frontend/.env.example` tanpa nilai asli.
- Bila secret terlanjur ter-commit: anggap bocor, **cabut dan buat ulang secretnya**, baru bersihkan repo.
- `gitleaks` berjalan di pre-commit dan CI.

## 10. Pemeliharaan

| Frekuensi | Kegiatan |
|---|---|
| Harian | Update konten lewat admin, baca pesan masuk |
| Mingguan | Cek Sentry, uptime, dan **Dependabot alerts** (Security → Dependabot) |
| Bulanan | **Update dependency** (lihat bagian 10a), cek skor Lighthouse dan Web Vitals, tinjau statistik unduhan CV dan pesan, bersihkan pesan lama |
| Triwulan | Uji pemulihan backup, tinjau akses akun dan token |

### 10a. Update dependency (tanpa bot)

Dependabot **update otomatis dimatikan** (tidak ada `.github/dependabot.yml`), agar tidak ada PR atau commit dari bot dan Contributors tetap hanya pemilik. **Dependabot alerts** tetap aktif sebagai notifikasi. **Dependabot security updates** (PR otomatis) juga dimatikan.

Update dikerjakan Claude **sebulan sekali**, atau **segera** bila ada peringatan keamanan high/critical:

1. `cd Frontend && pnpm outdated` dan `pnpm audit`.
2. Naikkan patch/minor sekaligus. Major satu per satu, baca catatan rilisnya (untuk Next.js: panduan di `node_modules/next/dist/docs/`).
3. Periksa juga versi GitHub Actions di `.github/workflows/ci.yml`.
4. Celah di dependency tidak langsung yang belum diperbaiki induknya: pakai `overrides` di `Frontend/pnpm-workspace.yaml`, lengkap dengan alasan dan kapan dihapus.
5. Jalankan pemeriksaan lengkap (lint, typecheck, test, build, E2E), lalu commit `[CLAUDIA] chore(deps): ...` atas nama Horizon Mirza.

CI menjalankan `pnpm audit --audit-level=high` di setiap push dan PR, sehingga celah baru yang tinggi langsung membuat CI merah.

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
| Branch | Push langsung ke `main` setelah verifikasi | Sama: langsung ke `main` setelah pemeriksaan lokal lengkap (keputusan pemilik 2026-09-30) |
| Verifikasi | `dotnet build`, `tsc --noEmit`, Playwright untuk UI, `resetdb` bila skema berubah | `lint`, `typecheck`, `test`, `build`, Playwright + axe, Lighthouse CI |
| Bahasa | UI Indonesia, dokumen Indonesia | Konten ID/EN, komentar dan commit Indonesia |
| Dokumen | `CLAUDE.md`, `AGENTS.md`, `Documentation/Prd.md`, `skill.md`, `workflow.md`, `TODO.md` | `CLAUDE.md`, `Documentation/PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `WORKFLOW.md`, `TODO.md`, `SKILL.md` |
| Klarifikasi | Bertanya dulu bila permintaan ambigu, konfirmasi sebelum aksi sulit dibalik | Sama (lihat bagian 12) |

**Diputuskan (2026-09-30):** ikut pola GAAS, push langsung ke `main` dengan awalan `[CLAUDIA]`. Karena setiap push ke `main` langsung live di Vercel, pemeriksaan lokal lengkap (termasuk E2E) wajib sebelum push.
