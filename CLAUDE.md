# CLAUDE.md

@Frontend/AGENTS.md

Panduan untuk Claude Code di repo ini. Baca ini dulu, lalu dokumen di `Documentation/` sesuai kebutuhan tugas.

## Proyek

Website portofolio pribadi **Muhammad Mirza**: situs publik dua bahasa (ID/EN) + panel Super Admin untuk mengelola konten. Satu pemilik, dikerjakan bersama: **Claude menulis kode, Mirza mereview**.

**Status:** Milestone 1 (setup) selesai. Kerjakan milestone berikutnya hanya bila diminta Mirza (`Documentation/TODO.md`).

**Next.js 16:** API berbeda dari versi lama. Baca `Frontend/AGENTS.md` dan panduan di `Frontend/node_modules/next/dist/docs/` sebelum menulis kode Next.

## Dokumen Acuan

| Berkas | Isi | Kapan dibaca |
|---|---|---|
| `Documentation/PRD.md` | Tujuan, fitur, user story, kriteria penerimaan, keputusan sementara | Sebelum mengerjakan fitur apa pun |
| `Documentation/DESIGN.md` | Token, tipografi, komponen, wireframe, aksesibilitas, pedoman tulisan | Sebelum mengerjakan UI |
| `Documentation/ARCHITECTURE.md` | Tech stack, model data, API, keamanan, deployment | Sebelum mengubah struktur, data, atau API |
| `Documentation/WORKFLOW.md` | Branch, commit, Definition of Done, rilis | Sebelum commit atau PR |
| `Documentation/TODO.md` | Milestone dan tugas | Untuk menentukan pekerjaan berikutnya |
| `Documentation/00-discovery.md` | Jawaban asli pemilik dan keputusan terbuka | Bila ada keraguan tentang maksud pemilik |
| `Documentation/CONTENT.md` | Konten dari CV (pengalaman, pendidikan, skill, angka yang boleh dipakai) dan yang masih ditanyakan | Sebelum menulis atau mengisi teks/seed apa pun |
| `Documentation/REFERENCES.md` | Analisis referensi desain, prinsip yang diambil dan yang dilarang | Sebelum keputusan desain atau animasi |
| `.agents/skill/SKILL.md` | Resep untuk tugas berulang (entitas baru, halaman baru). Tidak dimuat otomatis oleh Claude Code (bukan di `.claude/skills/`), jadi **baca manual** | Saat menambah entitas atau halaman |

Bila dokumen bertentangan, urutan kebenaran: jawaban pemilik di `00-discovery.md` > `PRD.md` > dokumen lain. Jika Anda mengubah keputusan, perbarui dokumen terkait di PR yang sama.

## Stack Singkat

Node.js 24 · Next.js 16 (App Router) + TypeScript 6 strict · Tailwind 4 + shadcn/ui · animasi CSS bawaan + canvas (Motion seperlunya) · next-intl · PostgreSQL (Neon) + Prisma · Better Auth (email + password, satu admin) · Zod · Cloudinary · Resend + React Email · Vercel Cron · Vitest + Playwright + axe · pnpm · Vercel + GitHub Actions. Detail dan alasan: `Documentation/ARCHITECTURE.md`.

## Perintah

```bash
cd Frontend
pnpm install
pnpm dev            # server pengembangan
pnpm lint           # ESLint
pnpm typecheck      # tsc --noEmit
pnpm test           # Vitest
pnpm test:e2e       # Playwright (+ axe)
pnpm build          # build production
pnpm format:check   # Prettier
pnpm db:migrate     # prisma migrate dev
pnpm db:seed        # data awal dari CV (idempoten)
```

Sebelum menyerahkan pekerjaan jalankan: `lint`, `typecheck`, `test`, `build`.

## Aturan Wajib

**Keamanan dan secret**
- Jangan pernah commit `.env*` (kecuali `Frontend/.env.example` tanpa nilai), kunci API, dump database, atau kredensial.
- Semua input dari luar divalidasi Zod di **server**. Setiap Server Action/route handler admin memeriksa sesi dan role `SUPER_ADMIN`, lalu menulis `AuditLog`.
- Markdown dari admin selalu disanitasi. Tidak ada `dangerouslySetInnerHTML` tanpa sanitasi. Tidak ada raw SQL tak berparameter.
- Jangan mencatat isi pesan, email, atau IP mentah di log.

**Konten dan bahasa**
- Semua teks publik ada dalam **ID dan EN**: teks UI di `Frontend/messages/*.json`, konten dinamis lewat kolom `*_id` dan `*_en`.
- Komentar kode dan pesan commit **bahasa Indonesia**. Nama variabel, fungsi, dan berkas **bahasa Inggris**.
- Commit dari Claude diawali `[CLAUDIA]` lalu Conventional Commits: `[CLAUDIA] feat(projects): tambah halaman detail` (pola repo GAAS). Permintaan pemilik: **jangan** menambah baris `Co-Authored-By`/`Claude-Session` di pesan commit.
- Ikuti `DESIGN.md` bagian 1 dan 9: tanpa klise dan "AI slop", salinan spesifik dan personal.
- **Jangan mengarang fakta.** Semua pengalaman, angka, dan klaim berasal dari CV atau dikonfirmasi pemilik (`Documentation/CONTENT.md`). Nomor telepon dan email pribadi tidak ditulis di repo, hanya lewat admin/seed/environment.
- Referensi desain hanya untuk prinsip. Jangan menyalin tema, tata letak, atau teks dari situs orang lain.

**Kualitas**
- Mobile-first. Uji 360 px, 768 px, dan desktop. Mode terang dan gelap.
- WCAG 2.2 AA: semantik HTML, keyboard, fokus terlihat, alt text dua bahasa, `prefers-reduced-motion`.
- Target Lighthouse mobile ≥ 90. Jangan menambah JavaScript klien tanpa alasan. Utamakan Server Components.
- Gunakan token desain (CSS variables), bukan warna atau ukuran acak.
- Waktu disimpan UTC (`timestamptz`) dan **selalu ditampilkan dalam zona `Asia/Jakarta`** lewat `Intl.DateTimeFormat` (termasuk email, PDF, export). Primary key UUID v7. Seed memakai `seedId()` agar idempoten.
- Animasi: CSS dulu (scroll-driven, View Transitions, `@starting-style`). Motion hanya untuk gerak yang bergantung state React. Form publik memakai Server Action + `useActionState`, tanpa library form (`Documentation/DESIGN.md` bagian 2.4 dan 3).

**Proses**
- Jangan menambah dependency, layanan, atau biaya tanpa persetujuan. Tuliskan alasannya.
- Tidak ada Dependabot update otomatis. Update dependency dikerjakan manual sebulan sekali atau saat ada alert keamanan (`Documentation/WORKFLOW.md` bagian 10a).
- Jangan mengambil keputusan yang tercantum "terbuka" di `PRD.md` bagian 11 tanpa konfirmasi. Beri tanda asumsi bila terpaksa memakai default.
- Kerjakan di branch, satu tujuan per PR. Kriteria selesai: `Documentation/WORKFLOW.md` bagian 4.
- Laporkan hasil dengan jujur: tes yang gagal, langkah yang dilewati, dan hal yang belum bisa diverifikasi.
- Jangan membuat PR kecuali diminta.

## Struktur

Akar repo hanya berisi berkas `.md`, ditambah `.github/` (wajib di akar) dan `.agents/skill/` (skill proyek).

```
Frontend/        aplikasi Next.js. SEMUA perintah pnpm dijalankan dari sini (cd Frontend)
  src/app/[locale]/  halaman publik     src/app/admin/  panel admin (M2)
  src/app/api/       route handlers     src/features/   per domain (schema, queries, actions, components)
  src/components/    ui/, shared/       src/lib/        db, auth, env, ...
  messages/          id.json, en.json   scripts/seed.ts, tests/unit/, e2e/
Backend/         README peta kode server. Backend ada di dalam Next.js (Opsi A, final)
Database/        schema.prisma, migrations/, seed/seed-data.ts
Documentation/   dokumen perencanaan
```

`lib/` tidak boleh mengimpor dari `features/`. Satu domain, satu folder di `features/`. Detail: `Documentation/ARCHITECTURE.md` bagian 4.

## Menjalankan di Sesi Cloud

- Sandbox bawaan memakai Node 22, sedangkan proyek butuh Node 24 (`Frontend/.nvmrc`). Unduh Node 24 dari nodejs.org (cek SHASUMS256) ke scratchpad lalu taruh di awal `PATH`.
- Proyek memakai PostgreSQL 17 (CI dan production). Sandbox hanya punya Postgres 16 di `/usr/lib/postgresql/16/bin` (jalankan sebagai user non-root, data di luar repo), cukup untuk uji lokal, tetapi hasil akhir dipastikan oleh CI.
- E2E: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome pnpm test:e2e` (jalankan `pnpm build` dulu).
- Jangan `pkill -f` dengan pola yang juga muncul di perintah shell itu sendiri.

## Batasan Lingkungan Sesi Cloud

Domain di luar daftar yang diizinkan diblokir (contoh: `mnizwa.com`). Bila butuh akses, sampaikan nama domainnya ke pemilik agar mengubah Network access environment. Jangan menebak isi situs yang tidak bisa dibuka.
