-- Kolom SiteSetting yang tidak dibaca kode lagi sejak revisi 2026-11-16, dihapus atas persetujuan
-- pemilik (2026-11-18, audit DB-05/06/07 dan pembersihan kode tak terpakai):
-- - soundVolume: volume utama "Semua suara" dihapus, tiap suara punya geseran sendiri (soundMix).
-- - emailOnMessage: email pesan baru selalu dikirim bila Resend diatur.
-- - loginNotify: email login baru selalu dikirim ke email akun bila Resend diatur.
-- - allowIndexing: situs selalu boleh diindeks, hanya mode perawatan yang menutupnya.
-- Nilai terakhir keempat kolom tidak dipakai di mana pun, jadi tidak ada data bermakna yang hilang.
-- AlterTable
ALTER TABLE "SiteSetting" DROP COLUMN "allowIndexing",
DROP COLUMN "emailOnMessage",
DROP COLUMN "loginNotify",
DROP COLUMN "soundVolume";
