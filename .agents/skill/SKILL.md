---
name: mirza-portfolio
description: Resep pengerjaan untuk repo portofolio Muhammad Mirza. Gunakan saat menambah entitas konten baru (model data + CRUD admin + tampilan publik), menambah halaman publik, menulis konten dua bahasa, menambah endpoint API, menghapus fitur atau kode tak terpakai, atau memeriksa sebuah fitur sebelum dianggap selesai. Berisi langkah berurutan, aturan keamanan, aksesibilitas, dan pedoman tulisan proyek ini.
---

# Skill: Pengerjaan Portofolio Mirza

Baca `CLAUDE.md` dan dokumen di `Documentation/` yang relevan sebelum memakai resep ini. Resep di sini adalah **pola berulang**. Jika bertentangan dengan `Documentation/PRD.md`, ikuti PRD dan laporkan pertentangannya.

## Resep A — Menambah entitas konten baru

Contoh: `Certificate`, `Testimonial`. Kerjakan berurutan, langsung di `main`.

1. **Model data** di `Database/schema.prisma`. Teks publik memakai pasangan `*_id` dan `*_en`. Tambahkan `createdAt`, `updatedAt`, dan `order` bila urutannya diatur admin (tidak ada status draf: admin mengubah langsung di pratinjau). Buat migrasi **kompatibel ke belakang**.
2. **Skema Zod** di `Frontend/src/features/<domain>/schema.ts`. Wajibkan kedua bahasa, batasi panjang, validasi URL dan slug.
3. **Query** di `Frontend/src/features/<domain>/queries.ts`. Baca hanya kolom yang dibutuhkan. Beri cache tag `<domain>` sesuai pola yang sudah ada. Next 16: baca `node_modules/next/dist/docs/` dulu, API cache berubah dari versi lama.
4. **Actions** di `Frontend/src/features/<domain>/actions.ts` (`'use server'`, hanya ekspor fungsi async). Contoh lengkap: `features/projects/actions.ts`. Pola wajib:
   ```ts
   export async function saveX(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
     try {
       const admin = await requireSuperAdmin()            // 1) pastikan admin (lempar UnauthorizedError)
       const parsed = xSchema.safeParse(input)            // 2) validasi ulang di server
       if (!parsed.success) return fail('Periksa kembali isian.', zodFieldErrors(parsed.error.issues))
       const saved = await getDb().$transaction(async (tx) => {  // 3) tulis + AuditLog dalam satu transaksi
         const after = await tx.x.create({ data: parsed.data })
         await writeAudit(tx, { actorId: admin.userId, action: 'create', entity: 'X', entityId: after.id, after })
         return after
       })
       revalidateContent('<domain>')                      // 4) updateTag + path literal /id dan /en
       return ok('X dibuat.', { id: saved.id })
     } catch (error) {
       return toActionError(error, { slug: 'Slug' })      // galat unik → fieldErrors, tanpa detail internal
     }
   }
   ```
   Jangan memanggil `revalidatePath('/[locale]', 'layout')` (beranda jadi 404). Jangan mencatat isi pesan/email pengunjung di audit. Tambahkan action baru ke daftar di `tests/unit/authz.test.ts`.
5. **UI admin** di `Frontend/src/app/admin/(panel)/<domain>/` (panggil `requireSuperAdminPage()`), komponen di `features/<domain>/components/`. Admin memakai pola "ubah langsung di pratinjau" (`Documentation/DESIGN.md` bagian 133–139): halaman tampil seperti di situs dan diketik di tempat. Pakai komponen bersama di `components/admin/`: `live-edit.tsx` (`LiveStage`, `InlineInput`, `InlineArea`, `LangRow` + `useEditLang`, `LiveErrors`, `SaveBar`), `ConfirmDelete`, `ReorderButtons` (urutan naik/turun, bukan seret), `applyResult` (toast + galat server ke field), dan `useAssetPicker` (pilih berkas lalu potong lewat `ImageCropDialog`) untuk berkas yang ditekan di pratinjau. `Field` hanya untuk form biasa (akun, dialog). Form: React Hook Form + `zodResolver` dengan skema yang sama dengan server. Teks admin ditulis bahasa Indonesia lewat `useAdminT()` (klien) atau `adminT()` (server), lalu terjemahan Inggrisnya ditambahkan ke `src/lib/admin-i18n-en.ts`; `tests/unit/admin-i18n.test.ts` menolak teks tanpa terjemahan.
6. **Tampilan publik** di `Frontend/src/app/[locale]/...` memakai Server Components. Panggil `setRequestLocale(locale)` di layout/page agar tetap statis. Tambahkan ke sitemap bila punya halaman sendiri.
7. **Teks UI** ditambahkan ke `Frontend/messages/id.json` **dan** `Frontend/messages/en.json`. Bila admin boleh mengubahnya, daftarkan kuncinya di `features/site-text/catalog.ts` pada modul yang sesuai.
8. **Tes:** unit untuk skema dan otorisasi, E2E untuk alur tambah → tampil di publik.
9. **Dokumen:** perbarui `ARCHITECTURE.md` (model data, action), tambah bagian baru di akhir `DESIGN.md`, dan satu baris di log `TODO.md`.

## Resep B — Menambah halaman publik

1. Buat `Frontend/src/app/[locale]/<halaman>/page.tsx` sebagai Server Component.
2. Ekspor `generateMetadata` (judul, deskripsi, Open Graph, `alternates.languages` untuk `hreflang`).
3. Struktur semantik: satu `h1`, `main`, heading berurutan.
4. Ambil data lewat query di `features/`, bukan langsung di halaman.
5. Tambahkan ke navigasi (`components/site/nav-items.ts`, label `Nav.*` di `messages` dan di modul Navbar `features/site-text/catalog.ts`) dan ke sitemap.
6. Cek: 360 px, 768 px, desktop, terang/gelap, ID/EN, navigasi keyboard.
7. Tambah E2E (halaman terbuka, tautan penting bekerja) dan jalankan axe.

## Resep C — Menambah route handler

1. Tentukan akses: publik, publik + rate limit, atau admin.
2. Validasi input dengan Zod. Untuk metode mutasi periksa `Origin`.
3. Respons mengikuti kontrak di `ARCHITECTURE.md` bagian 6.4 (`{ data }` / `{ error: { code, message, fields } }`).
4. Endpoint publik mutasi wajib rate limit dan tidak membocorkan detail internal pada galat.
5. Jangan mencatat data pribadi di log.
6. Tambahkan tes dan perbarui tabel endpoint di `ARCHITECTURE.md`.

## Resep D — Menulis konten dua bahasa

- Sumber isi awal adalah CV pemilik. Jangan mengarang pengalaman, angka, atau nama perusahaan. Jika data tidak ada, tandai `TODO(konten)` dan tanyakan.
- **ID** ditulis natural, orang pertama ("saya"), kalimat pendek. **EN** ditulis wajar oleh penutur, bukan terjemahan kata per kata.
- Utamakan hasil yang dapat dibuktikan ("Membangun X yang melayani Y") dibanding sifat ("passionate", "gigih").
- Setiap project: **masalah → peran saya → teknologi → hasil**.
- Hindari: "crafting digital experiences", "passionate developer", "cutting-edge", "seamless", "leverage", emoji dekoratif, tiga poin fitur yang seragam.
- Nama teknologi ditulis dengan kapitalisasi resminya (Next.js, PostgreSQL, TypeScript).

## Resep E — Memeriksa sebuah fitur sebelum "selesai"

Jalankan `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e`, lalu telusuri daftar ini:

**Fungsi dan data**
- [ ] Sesuai kriteria penerimaan di `PRD.md`
- [ ] Validasi di server, bukan hanya di form
- [ ] Mutasi admin memeriksa `SUPER_ADMIN` dan menulis `AuditLog`
- [ ] Halaman publik ikut diperbarui setelah admin menyimpan (revalidate)

**Bahasa dan tampilan**
- [ ] ID dan EN lengkap, tidak ada teks yang tertanam di komponen
- [ ] Terang dan gelap benar, memakai token desain
- [ ] 360 px, 768 px, desktop tanpa scroll horizontal

**Aksesibilitas**
- [ ] Bisa dipakai penuh dengan keyboard, fokus terlihat
- [ ] Label form, alt text dua bahasa, urutan heading
- [ ] Gerak menghormati `prefers-reduced-motion`
- [ ] axe tanpa pelanggaran kritis

**Keamanan dan privasi**
- [ ] Tidak ada secret di kode atau log
- [ ] Markdown/HTML dari pengguna disanitasi
- [ ] Tidak ada data pribadi mentah di log atau analitik

**Performa**
- [ ] Tidak menambah JS klien tanpa alasan, gambar lewat `next/image`
- [ ] Lighthouse mobile ≥ 90 pada halaman yang terdampak

## Resep F — Menghapus fitur atau kode tak terpakai

1. **Pastikan benar-benar mati.** Cari ke seluruh repo, termasuk impor dinamis, string path, `messages/*.json`, `features/site-text/catalog.ts`, `src/lib/admin-i18n-en.ts`, CSS (`globals.css`, token `@theme`), konfigurasi, workflow CI, dan dokumen. `pnpm exec tsc --noEmit --noUnusedLocals --noUnusedParameters` menemukan variabel lokal mati.
2. **Jangan hapus** berkas konvensi Next (`page`, `layout`, `route`, `error`, `not-found`, `forbidden`, `unauthorized`, `global-not-found`, `opengraph-image`, `proxy.ts`), migrasi lama, lisensi font, dan script yang dipanggil `package.json`, CI, atau Vercel.
3. **Hapus semuanya sekaligus:** kode, tes, kunci terjemahan (ID, EN, kamus admin), token CSS, aset, variabel environment di `.env.example`, dan baris di dokumen keadaan sekarang (`PRD.md`, `ARCHITECTURE.md`). Log di `DESIGN.md` dan `TODO.md` tidak dihapus, hanya ditambah catatan baru.
4. **Kolom atau tabel database** dihapus lewat migrasi baru (`DROP COLUMN`/`DROP TABLE`) hanya dengan persetujuan pemilik, karena push ke `main` menjalankannya di production dan tidak bisa dibatalkan. Pastikan `prisma migrate diff --from-config-datasource --to-schema ../Database/schema.prisma --exit-code` bersih.
5. **Dependency** tidak dihapus langsung: daftarkan dulu dan minta persetujuan. Periksa juga pemakaian tidak langsung (peer dependency, kode hasil generate, hook Git, `overrides`).
6. Jalankan Resep E, lalu commit per tujuan.

## Resep G — Commit dan push

- Commit: `[CLAUDIA] tipe(lingkup): deskripsi bahasa Indonesia`, contoh `[CLAUDIA] feat(admin): tambah CRUD skill`. Tanpa baris `Co-Authored-By` atau `Claude-Session` (WORKFLOW.md bagian 3). Zona waktu `TZ=Asia/Jakarta`.
- Satu commit = satu tujuan. Semua di `main`, tanpa branch dan tanpa PR. Jalankan pemeriksaan lengkap (termasuk `test:e2e`) sebelum push, karena push langsung live.

## Hal yang Tidak Boleh Dilakukan

- Menyimpan secret di repo, atau melonggarkan CSP/CORS/rate limit untuk "memudahkan".
- Menambah dependency berat (animasi 3D, grafik, UI kit lain) tanpa persetujuan.
- Membuat migrasi yang menghapus tabel, kolom, atau data tanpa persetujuan pemilik.
- Menyalin desain atau teks dari situs orang lain. Referensi hanya untuk prinsip.
- Menandai fitur selesai tanpa tes dan pemeriksaan di HP.
