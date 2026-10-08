-- Peran pemilik per project dan pilihan tombol demo/GitHub di halaman detail (permintaan pemilik 2026-10-08)
ALTER TABLE "Project" ADD COLUMN "role_id" TEXT,
ADD COLUMN "role_en" TEXT,
ADD COLUMN "showDemo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "showRepo" BOOLEAN NOT NULL DEFAULT true;

-- Peran dari PDF "Portofolio - Muhammad Mirza Wirya"; hanya diisi bila belum diisi admin.
-- MR Coffee dan Swarna Creation tidak mencantumkan peran di PDF, jadi dibiarkan kosong.
UPDATE "Project" SET "role_id" = 'Front-End Developer', "role_en" = 'Front-End Developer'
WHERE "slug" IN ('catfin-r', 'ripe-ai') AND "role_id" IS NULL AND "role_en" IS NULL;
UPDATE "Project" SET "role_id" = 'Frontend Developer', "role_en" = 'Frontend Developer'
WHERE "slug" = 'crypto-pedia' AND "role_id" IS NULL AND "role_en" IS NULL;
