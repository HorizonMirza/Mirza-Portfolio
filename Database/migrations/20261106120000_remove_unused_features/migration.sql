-- Fitur yang tidak dipakai dihapus (keputusan pemilik 2026-11-06, DESIGN.md bagian 107): newsletter,
-- status ketersediaan profil, dan API publik. Kodenya sudah dihapus di deploy sebelumnya, jadi tidak ada
-- yang membaca tabel dan kolom ini lagi. Resend tidak pernah aktif, jadi Subscriber tidak pernah berisi
-- email pelanggan; Broadcast tidak pernah dipakai.
DROP TABLE "Subscriber";
DROP TABLE "Broadcast";
DROP TYPE "SubscriberStatus";

ALTER TABLE "Profile" DROP COLUMN "availability",
DROP COLUMN "availabilityNote_id",
DROP COLUMN "availabilityNote_en";
DROP TYPE "Availability";

-- teks situs dari admin untuk isian yang sudah tidak ada (halaman newsletter, bagian newsletter di
-- Privasi, dan "Sekarang" di About yang digabung ke Experience)
DELETE FROM "SiteText"
WHERE "key" LIKE 'Newsletter.%'
   OR "key" IN ('Privacy.newsletterHeading', 'Privacy.newsletterBody', 'About.present');
