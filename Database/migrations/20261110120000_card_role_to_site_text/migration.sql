-- Jabatan di kartu ID halaman Kontak kini satu isian teks situs Contact.cardRole (Admin → Contact,
-- bagian Kartu ID, 2026-11-10); dulu juga ada di Profile.cardRole_id/en yang menimpanya. Nilai dari
-- profil dipindah ke teks situs agar kartu tetap menampilkan jabatan yang sama. Kolom profil tidak
-- dipakai lagi (dihapus nanti bila pemilik setuju).
INSERT INTO "SiteText" ("key", "value_id", "value_en", "updatedAt")
SELECT 'Contact.cardRole', "cardRole_id", "cardRole_en", CURRENT_TIMESTAMP
FROM "Profile"
WHERE "id" = 1 AND ("cardRole_id" IS NOT NULL OR "cardRole_en" IS NOT NULL)
ON CONFLICT ("key") DO UPDATE SET
  "value_id" = COALESCE(EXCLUDED."value_id", "SiteText"."value_id"),
  "value_en" = COALESCE(EXCLUDED."value_en", "SiteText"."value_en"),
  "updatedAt" = CURRENT_TIMESTAMP;
