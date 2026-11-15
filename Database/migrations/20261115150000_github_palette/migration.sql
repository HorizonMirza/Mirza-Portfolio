-- Warna grafik kontribusi GitHub di beranda bisa diubah admin (2026-11-15, DESIGN.md bagian 149).
-- Hanya menambah kolom opsional; kosong = warna biru bawaan.
-- AlterTable
ALTER TABLE "SiteSetting" ADD COLUMN     "githubPalette" JSONB;
