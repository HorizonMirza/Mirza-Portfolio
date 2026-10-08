-- Permintaan pemilik 2026-10-08: "nyalakan tombol GitHub untuk GAAS". Hanya menyalakan tombol; URL
-- repo sudah diisi oleh migrasi 20261008180000_publish_gaas. Setelah ini pemilik bisa mematikannya
-- lagi lewat Admin → Project.
UPDATE "Project" SET "showRepo" = true, "updatedAt" = now()
WHERE "slug" = 'gaas' AND "repoUrl" IS NOT NULL;
