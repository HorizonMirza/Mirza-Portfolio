-- Kolom yang tidak dipakai lagi sejak revisi admin 2026-11-10, dihapus atas persetujuan pemilik
-- ("hapus kolom lama"):
-- - SiteSetting.introEnabled, introTitle_id/en: kartu pembuka selalu tampil selama isinya lengkap,
--   judulnya teks tetap Intro.title (DESIGN.md bagian 109).
-- - SiteSetting.heroArmorId: armor hero selalu gambar bawaan repo. Aset yang dulu diunggah sebagai
--   armor (bila ada) tetap ada di tabel Asset dan Cloudinary, hanya tidak terhubung lagi.
-- - Profile.cardRole_id/en: jabatan kartu ID kini teks situs Contact.cardRole; nilainya sudah
--   disalin oleh migrasi 20261110120000_card_role_to_site_text.
-- DropForeignKey
ALTER TABLE "SiteSetting" DROP CONSTRAINT "SiteSetting_heroArmorId_fkey";

-- DropIndex
DROP INDEX "SiteSetting_heroArmorId_key";

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "cardRole_en",
DROP COLUMN "cardRole_id";

-- AlterTable
ALTER TABLE "SiteSetting" DROP COLUMN "heroArmorId",
DROP COLUMN "introEnabled",
DROP COLUMN "introTitle_en",
DROP COLUMN "introTitle_id";

