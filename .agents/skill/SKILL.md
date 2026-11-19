---
name: mirza-portfolio
description: Resep pengerjaan untuk repo portofolio Muhammad Mirza. Gunakan saat menambah entitas konten baru (model data + CRUD admin + tampilan publik), menambah halaman publik, menulis konten dua bahasa, menambah endpoint API, menghapus fitur atau kode tak terpakai, atau memeriksa sebuah fitur sebelum dianggap selesai. Berisi langkah berurutan, aturan keamanan, aksesibilitas, dan pedoman tulisan proyek ini.
---

# Skill: Pengerjaan Portofolio Mirza

Baca `CLAUDE.md` dan dokumen di `Documentation/` yang relevan sebelum memakai resep ini. Resep di sini adalah **pola berulang**. Jika bertentangan dengan `Documentation/PRD.md`, ikuti PRD dan laporkan pertentangannya. Aturan umum (secret, dependency, migrasi, commit dan push, Definition of Done) ada di `CLAUDE.md` dan `Documentation/WORKFLOW.md`, tidak diulang di sini.

## Resep A — Menambah entitas konten baru

Contoh: `Certificate`, `Testimonial`. Kerjakan berurutan, langsung di `main`.

1. **Model data** di `Database/schema.prisma`. Teks publik memakai pasangan `*_id` dan `*_en`. Tambahkan `createdAt`, `updatedAt`, dan `order` bila urutannya diatur admin (tidak ada status draf: admin mengubah langsung di pratinjau). Buat migrasi **kompatibel ke belakang**.
2. **Skema Zod** di `Backend/features/<domain>/schema.ts`. Wajibkan kedua bahasa, batasi panjang, validasi URL dan slug.
3. **Query** di `Backend/features/<domain>/queries.ts`. Baca hanya kolom yang dibutuhkan. Beri cache tag `<domain>` sesuai pola yang sudah ada. Next 16: baca `node_modules/next/dist/docs/` dulu, API cache berubah dari versi lama.
4. **Actions** di `Backend/features/<domain>/actions.ts` (`'use server'`, hanya ekspor fungsi async). Contoh lengkap: `Backend/features/projects/actions.ts`. Kode Backend mengimpor sesamanya lewat `@backend/...` dan tidak boleh mengimpor `Frontend/`. Pola wajib:
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
5. **UI admin** di `Frontend/src/app/admin/(panel)/<domain>/` (panggil `requireSuperAdminPage()`), komponen di `Frontend/src/features/<domain>/components/` (mengimpor schema dan action dari `@backend/features/<domain>/...`). Admin memakai pola "ubah langsung di pratinjau" (revisi 2026-11-12): halaman tampil seperti di situs dan diketik di tempat. Pakai komponen bersama di `components/admin/`: `live-edit.tsx` (`LiveStage`, `InlineInput`, `InlineArea`, `LangRow` + `useEditLang`, `LiveErrors`, `SaveBar`), `ConfirmDelete`, `ReorderButtons` (urutan naik/turun, bukan seret), `applyResult` (toast + galat server ke field), dan `useAssetPicker` (pilih berkas lalu potong lewat `ImageCropDialog`) untuk berkas yang ditekan di pratinjau. `Field` hanya untuk form biasa (akun, dialog). Form: React Hook Form + `zodResolver` dengan skema yang sama dengan server. Teks admin ditulis bahasa Indonesia lewat `useAdminT()` (klien) atau `adminT()` (server), lalu terjemahan Inggrisnya ditambahkan ke `Backend/lib/admin-i18n-en.ts`; `tests/unit/admin-i18n.test.ts` menolak teks tanpa terjemahan.
6. **Tampilan publik** di `Frontend/src/app/[locale]/...` memakai Server Components. Panggil `setRequestLocale(locale)` di layout/page agar tetap statis. Tambahkan ke sitemap bila punya halaman sendiri.
7. **Teks UI** ditambahkan ke `Frontend/messages/id.json` **dan** `Frontend/messages/en.json`. Bila admin boleh mengubahnya, daftarkan kuncinya di `Backend/features/site-text/catalog.ts` pada modul yang sesuai.
8. **Tes:** unit untuk skema dan otorisasi, E2E untuk alur tambah → tampil di publik.
9. **Dokumen:** perbarui `ARCHITECTURE.md` (model data, action), tambah bagian baru di akhir `DESIGN.md`, dan satu baris di log `TODO.md`.

## Resep B — Menambah halaman publik

1. Buat `Frontend/src/app/[locale]/<halaman>/page.tsx` sebagai Server Component.
2. Ekspor `generateMetadata` (judul, deskripsi, Open Graph, `alternates.languages` untuk `hreflang`).
3. Struktur semantik: satu `h1`, `main`, heading berurutan.
4. Ambil data lewat query di `Backend/features/<domain>/`, bukan langsung di halaman.
5. Tambahkan ke navigasi (`components/site/nav-items.ts`, label `Nav.*` di `messages` dan di modul Navbar `Backend/features/site-text/catalog.ts`) dan ke sitemap.
6. Cek: 360 px, 768 px, desktop, terang/gelap, ID/EN, navigasi keyboard.
7. Tambah E2E (halaman terbuka, tautan penting bekerja) dan jalankan axe.

## Resep C — Menambah route handler

1. Tulis logikanya di `Backend/api/<nama>.ts` (ekspor `GET`/`POST`). Berkas rute Next `Frontend/src/app/api/<nama>/route.ts` hanya me-re-export (`export { GET } from '@backend/api/<nama>'`) dan menulis konfigurasi segmen seperti `export const dynamic = 'force-dynamic'` langsung di berkas rute.
2. Tentukan akses: publik, publik + rate limit, atau admin.
3. Validasi input dengan Zod. Untuk metode mutasi periksa `Origin`.
4. Respons mengikuti kontrak di `ARCHITECTURE.md` bagian 6.4 (`{ data }` / `{ error: { code, message, fields } }`).
5. Endpoint publik mutasi wajib rate limit dan tidak membocorkan detail internal pada galat.
6. Jangan mencatat data pribadi di log.
7. Tambahkan tes dan perbarui tabel endpoint di `ARCHITECTURE.md`.

## Resep D — Menulis konten dua bahasa

- Sumber isi awal adalah CV pemilik. Jangan mengarang pengalaman, angka, atau nama perusahaan. Jika data tidak ada, tandai `TODO(konten)` dan tanyakan.
- **ID** ditulis natural, orang pertama ("saya"), kalimat pendek. **EN** ditulis wajar oleh penutur, bukan terjemahan kata per kata.
- Utamakan hasil yang dapat dibuktikan ("Membangun X yang melayani Y") dibanding sifat ("passionate", "gigih").
- Setiap project: **masalah → peran saya → teknologi → hasil**.
- Hindari: "crafting digital experiences", "passionate developer", "cutting-edge", "seamless", "leverage", emoji dekoratif, tiga poin fitur yang seragam.
- Nama teknologi ditulis dengan kapitalisasi resminya (Next.js, PostgreSQL, TypeScript).

## Resep E — Memeriksa sebuah fitur sebelum "selesai"

Jalankan `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e`, lalu cocokkan dengan Definition of Done di `Documentation/WORKFLOW.md` bagian 4. Yang sering terlewat:

- Halaman publik ikut diperbarui setelah admin menyimpan (`revalidateContent`), di `/id` dan `/en`.
- Tidak ada teks yang tertanam di komponen: teks situs di `messages/*.json`, teks admin lewat `useAdminT()`/`adminT()`.
- Markdown dari admin disanitasi, gambar lewat `next/image`, tidak ada data pribadi mentah di log.
- Gerak menghormati `prefers-reduced-motion`, animasi berat berhenti saat di luar layar.

## Resep F — Menghapus fitur atau kode tak terpakai

1. **Pastikan benar-benar mati.** Cari ke seluruh repo, termasuk impor dinamis, string path, `messages/*.json`, `Backend/features/site-text/catalog.ts`, `Backend/lib/admin-i18n-en.ts`, CSS (`src/styles/`, token `@theme` di `tokens.css`), konfigurasi, workflow CI, dan dokumen. `pnpm exec tsc --noEmit --noUnusedLocals --noUnusedParameters` menemukan variabel lokal mati.
2. **Jangan hapus** berkas konvensi Next (`page`, `layout`, `route`, `error`, `not-found`, `forbidden`, `unauthorized`, `global-not-found`, `opengraph-image`, `proxy.ts`), migrasi lama, lisensi font, dan script yang dipanggil `package.json`, CI, atau Vercel.
3. **Hapus semuanya sekaligus:** kode, tes, kunci terjemahan (ID, EN, kamus admin), token CSS, aset, variabel environment di `.env.example`, dan baris di dokumen keadaan sekarang (`PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`). Log di `TODO.md` tidak dihapus, hanya ditambah catatan baru.
4. **Kolom atau tabel database** dihapus lewat migrasi baru (`DROP COLUMN`/`DROP TABLE`) hanya dengan persetujuan pemilik, karena push ke `main` menjalankannya di production dan tidak bisa dibatalkan. Pastikan `prisma migrate diff --from-config-datasource --to-schema ../Database/schema.prisma --exit-code` bersih.
5. **Dependency** tidak dihapus langsung: daftarkan dulu dan minta persetujuan. Periksa juga pemakaian tidak langsung (peer dependency, kode hasil generate, hook Git, `overrides`).
6. Jalankan Resep E, lalu commit per tujuan.
