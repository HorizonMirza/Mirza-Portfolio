-- Permintaan pemilik 2026-10-08: "untuk semua project di hapus dulu" (dikonfirmasi: hapus semua
-- data project). Semua project, termasuk draf, dihapus; gambar galeri dan kaitan skill ikut terhapus
-- lewat ON DELETE CASCADE. Project baru ditambahkan lagi lewat Admin → Project.
-- Migrasi ini tidak menulis AuditLog karena tidak ada aktor admin; alasannya tercatat di sini dan di
-- Documentation/CONTENT.md.
DELETE FROM "Project";

-- Gambar bawaan repo (publicId `local-demo/projects/...`) yang tidak dipakai lagi. Aset Cloudinary
-- unggahan admin dibiarkan, sama seperti saat project dihapus dari admin.
DELETE FROM "Asset" a
WHERE a."publicId" LIKE 'local-demo/projects/%'
  AND NOT EXISTS (SELECT 1 FROM "Project" p WHERE p."coverId" = a."id")
  AND NOT EXISTS (SELECT 1 FROM "ProjectImage" i WHERE i."assetId" = a."id")
  AND NOT EXISTS (SELECT 1 FROM "Profile" pr WHERE pr."photoId" = a."id" OR pr."cvId" = a."id")
  AND NOT EXISTS (SELECT 1 FROM "Experience" e WHERE e."logoId" = a."id" OR e."photoId" = a."id");
