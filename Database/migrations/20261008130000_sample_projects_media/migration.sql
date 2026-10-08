-- Data: melengkapi 6 project contoh (permintaan pemilik 2026-10-08, "buat lengkap demonya"):
-- gambar sampul + 2 gambar galeri (mockup bertanda CONTOH di Frontend/public/demo/projects, bukan
-- Cloudinary; publicId berawalan local-demo/ sehingga tidak pernah dikirim ke Cloudinary saat
-- diganti/dihapus), studi kasus, tautan demo dan GitHub. Kolom yang sudah diisi pemilik tidak
-- ditimpa.

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/project-1-cover', '/demo/projects/project-1-cover.jpg', 'IMAGE', 'jpg', 59633, 1600, 900, 'Gambar contoh sampul untuk aplikasi web', 'Sample cover image for web app'
WHERE EXISTS (SELECT 1 FROM "Project" WHERE "slug" = 'contoh-project-1-aplikasi-web')
  AND NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/project-1-cover');

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/project-1-gallery-1', '/demo/projects/project-1-gallery-1.jpg', 'IMAGE', 'jpg', 50848, 1600, 900, 'Gambar contoh galeri 1 untuk aplikasi web', 'Sample gallery 1 image for web app'
WHERE EXISTS (SELECT 1 FROM "Project" WHERE "slug" = 'contoh-project-1-aplikasi-web')
  AND NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/project-1-gallery-1');

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/project-1-gallery-2', '/demo/projects/project-1-gallery-2.jpg', 'IMAGE', 'jpg', 44322, 1600, 900, 'Gambar contoh galeri 2 untuk aplikasi web', 'Sample gallery 2 image for web app'
WHERE EXISTS (SELECT 1 FROM "Project" WHERE "slug" = 'contoh-project-1-aplikasi-web')
  AND NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/project-1-gallery-2');

UPDATE "Project" p SET "coverId" = a."id"
FROM "Asset" a
WHERE p."slug" = 'contoh-project-1-aplikasi-web' AND p."coverId" IS NULL AND a."publicId" = 'local-demo/projects/project-1-cover';

INSERT INTO "ProjectImage" ("id", "projectId", "assetId", "order")
SELECT gen_random_uuid(), p."id", a."id", CASE WHEN a."publicId" LIKE '%gallery-1' THEN 0 ELSE 1 END
FROM "Project" p, "Asset" a
WHERE p."slug" = 'contoh-project-1-aplikasi-web'
  AND a."publicId" IN ('local-demo/projects/project-1-gallery-1', 'local-demo/projects/project-1-gallery-2')
  AND NOT EXISTS (SELECT 1 FROM "ProjectImage" pi WHERE pi."projectId" = p."id")
ON CONFLICT DO NOTHING;

UPDATE "Project" SET
  "caseStudy_id" = COALESCE("caseStudy_id", E'## Masalah\n\nTulis kondisi sebelum project ini ada: siapa yang kesulitan dan seberapa sering.\n\n## Pendekatan\n\n- Tulis keputusan utama dan alasannya.\n- Tulis bagian tersulit dan cara menyelesaikannya.\n\n## Hasil\n\n- Tulis angka atau perubahan yang bisa dibuktikan.\n\n## Pelajaran\n\nTulis hal yang akan Anda lakukan berbeda bila mengulang project ini.'),
  "caseStudy_en" = COALESCE("caseStudy_en", E'## Problem\n\nDescribe the situation before this project: who struggled and how often.\n\n## Approach\n\n- Describe the key decisions and why.\n- Describe the hardest part and how you solved it.\n\n## Results\n\n- Describe numbers or changes you can back up.\n\n## Lessons\n\nDescribe what you would do differently next time.'),
  "demoUrl" = COALESCE("demoUrl", 'https://mmirza.site'),
  "repoUrl" = COALESCE("repoUrl", 'https://github.com/HorizonMirza')
WHERE "slug" = 'contoh-project-1-aplikasi-web';

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/project-2-cover', '/demo/projects/project-2-cover.jpg', 'IMAGE', 'jpg', 50858, 1600, 900, 'Gambar contoh sampul untuk dashboard data', 'Sample cover image for data dashboard'
WHERE EXISTS (SELECT 1 FROM "Project" WHERE "slug" = 'contoh-project-2-dashboard-data')
  AND NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/project-2-cover');

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/project-2-gallery-1', '/demo/projects/project-2-gallery-1.jpg', 'IMAGE', 'jpg', 65475, 1600, 900, 'Gambar contoh galeri 1 untuk dashboard data', 'Sample gallery 1 image for data dashboard'
WHERE EXISTS (SELECT 1 FROM "Project" WHERE "slug" = 'contoh-project-2-dashboard-data')
  AND NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/project-2-gallery-1');

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/project-2-gallery-2', '/demo/projects/project-2-gallery-2.jpg', 'IMAGE', 'jpg', 37343, 1600, 900, 'Gambar contoh galeri 2 untuk dashboard data', 'Sample gallery 2 image for data dashboard'
WHERE EXISTS (SELECT 1 FROM "Project" WHERE "slug" = 'contoh-project-2-dashboard-data')
  AND NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/project-2-gallery-2');

UPDATE "Project" p SET "coverId" = a."id"
FROM "Asset" a
WHERE p."slug" = 'contoh-project-2-dashboard-data' AND p."coverId" IS NULL AND a."publicId" = 'local-demo/projects/project-2-cover';

INSERT INTO "ProjectImage" ("id", "projectId", "assetId", "order")
SELECT gen_random_uuid(), p."id", a."id", CASE WHEN a."publicId" LIKE '%gallery-1' THEN 0 ELSE 1 END
FROM "Project" p, "Asset" a
WHERE p."slug" = 'contoh-project-2-dashboard-data'
  AND a."publicId" IN ('local-demo/projects/project-2-gallery-1', 'local-demo/projects/project-2-gallery-2')
  AND NOT EXISTS (SELECT 1 FROM "ProjectImage" pi WHERE pi."projectId" = p."id")
ON CONFLICT DO NOTHING;

UPDATE "Project" SET
  "caseStudy_id" = COALESCE("caseStudy_id", E'## Masalah\n\nTulis kondisi sebelum project ini ada: siapa yang kesulitan dan seberapa sering.\n\n## Pendekatan\n\n- Tulis keputusan utama dan alasannya.\n- Tulis bagian tersulit dan cara menyelesaikannya.\n\n## Hasil\n\n- Tulis angka atau perubahan yang bisa dibuktikan.\n\n## Pelajaran\n\nTulis hal yang akan Anda lakukan berbeda bila mengulang project ini.'),
  "caseStudy_en" = COALESCE("caseStudy_en", E'## Problem\n\nDescribe the situation before this project: who struggled and how often.\n\n## Approach\n\n- Describe the key decisions and why.\n- Describe the hardest part and how you solved it.\n\n## Results\n\n- Describe numbers or changes you can back up.\n\n## Lessons\n\nDescribe what you would do differently next time.'),
  "demoUrl" = COALESCE("demoUrl", 'https://mmirza.site'),
  "repoUrl" = COALESCE("repoUrl", 'https://github.com/HorizonMirza')
WHERE "slug" = 'contoh-project-2-dashboard-data';

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/project-3-cover', '/demo/projects/project-3-cover.jpg', 'IMAGE', 'jpg', 59980, 1600, 900, 'Gambar contoh sampul untuk komunitas', 'Sample cover image for community'
WHERE EXISTS (SELECT 1 FROM "Project" WHERE "slug" = 'contoh-project-3-komunitas')
  AND NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/project-3-cover');

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/project-3-gallery-1', '/demo/projects/project-3-gallery-1.jpg', 'IMAGE', 'jpg', 59800, 1600, 900, 'Gambar contoh galeri 1 untuk komunitas', 'Sample gallery 1 image for community'
WHERE EXISTS (SELECT 1 FROM "Project" WHERE "slug" = 'contoh-project-3-komunitas')
  AND NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/project-3-gallery-1');

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/project-3-gallery-2', '/demo/projects/project-3-gallery-2.jpg', 'IMAGE', 'jpg', 45418, 1600, 900, 'Gambar contoh galeri 2 untuk komunitas', 'Sample gallery 2 image for community'
WHERE EXISTS (SELECT 1 FROM "Project" WHERE "slug" = 'contoh-project-3-komunitas')
  AND NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/project-3-gallery-2');

UPDATE "Project" p SET "coverId" = a."id"
FROM "Asset" a
WHERE p."slug" = 'contoh-project-3-komunitas' AND p."coverId" IS NULL AND a."publicId" = 'local-demo/projects/project-3-cover';

INSERT INTO "ProjectImage" ("id", "projectId", "assetId", "order")
SELECT gen_random_uuid(), p."id", a."id", CASE WHEN a."publicId" LIKE '%gallery-1' THEN 0 ELSE 1 END
FROM "Project" p, "Asset" a
WHERE p."slug" = 'contoh-project-3-komunitas'
  AND a."publicId" IN ('local-demo/projects/project-3-gallery-1', 'local-demo/projects/project-3-gallery-2')
  AND NOT EXISTS (SELECT 1 FROM "ProjectImage" pi WHERE pi."projectId" = p."id")
ON CONFLICT DO NOTHING;

UPDATE "Project" SET
  "caseStudy_id" = COALESCE("caseStudy_id", E'## Masalah\n\nTulis kondisi sebelum project ini ada: siapa yang kesulitan dan seberapa sering.\n\n## Pendekatan\n\n- Tulis keputusan utama dan alasannya.\n- Tulis bagian tersulit dan cara menyelesaikannya.\n\n## Hasil\n\n- Tulis angka atau perubahan yang bisa dibuktikan.\n\n## Pelajaran\n\nTulis hal yang akan Anda lakukan berbeda bila mengulang project ini.'),
  "caseStudy_en" = COALESCE("caseStudy_en", E'## Problem\n\nDescribe the situation before this project: who struggled and how often.\n\n## Approach\n\n- Describe the key decisions and why.\n- Describe the hardest part and how you solved it.\n\n## Results\n\n- Describe numbers or changes you can back up.\n\n## Lessons\n\nDescribe what you would do differently next time.'),
  "demoUrl" = COALESCE("demoUrl", 'https://mmirza.site'),
  "repoUrl" = COALESCE("repoUrl", 'https://github.com/HorizonMirza')
WHERE "slug" = 'contoh-project-3-komunitas';

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/project-4-cover', '/demo/projects/project-4-cover.jpg', 'IMAGE', 'jpg', 52414, 1600, 900, 'Gambar contoh sampul untuk aplikasi AI', 'Sample cover image for AI app'
WHERE EXISTS (SELECT 1 FROM "Project" WHERE "slug" = 'contoh-project-4-aplikasi-ai')
  AND NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/project-4-cover');

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/project-4-gallery-1', '/demo/projects/project-4-gallery-1.jpg', 'IMAGE', 'jpg', 50039, 1600, 900, 'Gambar contoh galeri 1 untuk aplikasi AI', 'Sample gallery 1 image for AI app'
WHERE EXISTS (SELECT 1 FROM "Project" WHERE "slug" = 'contoh-project-4-aplikasi-ai')
  AND NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/project-4-gallery-1');

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/project-4-gallery-2', '/demo/projects/project-4-gallery-2.jpg', 'IMAGE', 'jpg', 48617, 1600, 900, 'Gambar contoh galeri 2 untuk aplikasi AI', 'Sample gallery 2 image for AI app'
WHERE EXISTS (SELECT 1 FROM "Project" WHERE "slug" = 'contoh-project-4-aplikasi-ai')
  AND NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/project-4-gallery-2');

UPDATE "Project" p SET "coverId" = a."id"
FROM "Asset" a
WHERE p."slug" = 'contoh-project-4-aplikasi-ai' AND p."coverId" IS NULL AND a."publicId" = 'local-demo/projects/project-4-cover';

INSERT INTO "ProjectImage" ("id", "projectId", "assetId", "order")
SELECT gen_random_uuid(), p."id", a."id", CASE WHEN a."publicId" LIKE '%gallery-1' THEN 0 ELSE 1 END
FROM "Project" p, "Asset" a
WHERE p."slug" = 'contoh-project-4-aplikasi-ai'
  AND a."publicId" IN ('local-demo/projects/project-4-gallery-1', 'local-demo/projects/project-4-gallery-2')
  AND NOT EXISTS (SELECT 1 FROM "ProjectImage" pi WHERE pi."projectId" = p."id")
ON CONFLICT DO NOTHING;

UPDATE "Project" SET
  "caseStudy_id" = COALESCE("caseStudy_id", E'## Masalah\n\nTulis kondisi sebelum project ini ada: siapa yang kesulitan dan seberapa sering.\n\n## Pendekatan\n\n- Tulis keputusan utama dan alasannya.\n- Tulis bagian tersulit dan cara menyelesaikannya.\n\n## Hasil\n\n- Tulis angka atau perubahan yang bisa dibuktikan.\n\n## Pelajaran\n\nTulis hal yang akan Anda lakukan berbeda bila mengulang project ini.'),
  "caseStudy_en" = COALESCE("caseStudy_en", E'## Problem\n\nDescribe the situation before this project: who struggled and how often.\n\n## Approach\n\n- Describe the key decisions and why.\n- Describe the hardest part and how you solved it.\n\n## Results\n\n- Describe numbers or changes you can back up.\n\n## Lessons\n\nDescribe what you would do differently next time.'),
  "demoUrl" = COALESCE("demoUrl", 'https://mmirza.site'),
  "repoUrl" = COALESCE("repoUrl", 'https://github.com/HorizonMirza')
WHERE "slug" = 'contoh-project-4-aplikasi-ai';

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/project-5-cover', '/demo/projects/project-5-cover.jpg', 'IMAGE', 'jpg', 43100, 1600, 900, 'Gambar contoh sampul untuk acara dan turnamen', 'Sample cover image for events and tournaments'
WHERE EXISTS (SELECT 1 FROM "Project" WHERE "slug" = 'contoh-project-5-acara-turnamen')
  AND NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/project-5-cover');

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/project-5-gallery-1', '/demo/projects/project-5-gallery-1.jpg', 'IMAGE', 'jpg', 49336, 1600, 900, 'Gambar contoh galeri 1 untuk acara dan turnamen', 'Sample gallery 1 image for events and tournaments'
WHERE EXISTS (SELECT 1 FROM "Project" WHERE "slug" = 'contoh-project-5-acara-turnamen')
  AND NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/project-5-gallery-1');

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/project-5-gallery-2', '/demo/projects/project-5-gallery-2.jpg', 'IMAGE', 'jpg', 48116, 1600, 900, 'Gambar contoh galeri 2 untuk acara dan turnamen', 'Sample gallery 2 image for events and tournaments'
WHERE EXISTS (SELECT 1 FROM "Project" WHERE "slug" = 'contoh-project-5-acara-turnamen')
  AND NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/project-5-gallery-2');

UPDATE "Project" p SET "coverId" = a."id"
FROM "Asset" a
WHERE p."slug" = 'contoh-project-5-acara-turnamen' AND p."coverId" IS NULL AND a."publicId" = 'local-demo/projects/project-5-cover';

INSERT INTO "ProjectImage" ("id", "projectId", "assetId", "order")
SELECT gen_random_uuid(), p."id", a."id", CASE WHEN a."publicId" LIKE '%gallery-1' THEN 0 ELSE 1 END
FROM "Project" p, "Asset" a
WHERE p."slug" = 'contoh-project-5-acara-turnamen'
  AND a."publicId" IN ('local-demo/projects/project-5-gallery-1', 'local-demo/projects/project-5-gallery-2')
  AND NOT EXISTS (SELECT 1 FROM "ProjectImage" pi WHERE pi."projectId" = p."id")
ON CONFLICT DO NOTHING;

UPDATE "Project" SET
  "caseStudy_id" = COALESCE("caseStudy_id", E'## Masalah\n\nTulis kondisi sebelum project ini ada: siapa yang kesulitan dan seberapa sering.\n\n## Pendekatan\n\n- Tulis keputusan utama dan alasannya.\n- Tulis bagian tersulit dan cara menyelesaikannya.\n\n## Hasil\n\n- Tulis angka atau perubahan yang bisa dibuktikan.\n\n## Pelajaran\n\nTulis hal yang akan Anda lakukan berbeda bila mengulang project ini.'),
  "caseStudy_en" = COALESCE("caseStudy_en", E'## Problem\n\nDescribe the situation before this project: who struggled and how often.\n\n## Approach\n\n- Describe the key decisions and why.\n- Describe the hardest part and how you solved it.\n\n## Results\n\n- Describe numbers or changes you can back up.\n\n## Lessons\n\nDescribe what you would do differently next time.'),
  "demoUrl" = COALESCE("demoUrl", 'https://mmirza.site'),
  "repoUrl" = COALESCE("repoUrl", 'https://github.com/HorizonMirza')
WHERE "slug" = 'contoh-project-5-acara-turnamen';

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/project-6-cover', '/demo/projects/project-6-cover.jpg', 'IMAGE', 'jpg', 48274, 1600, 900, 'Gambar contoh sampul untuk tool internal', 'Sample cover image for internal tool'
WHERE EXISTS (SELECT 1 FROM "Project" WHERE "slug" = 'contoh-project-6-tool-internal')
  AND NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/project-6-cover');

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/project-6-gallery-1', '/demo/projects/project-6-gallery-1.jpg', 'IMAGE', 'jpg', 51219, 1600, 900, 'Gambar contoh galeri 1 untuk tool internal', 'Sample gallery 1 image for internal tool'
WHERE EXISTS (SELECT 1 FROM "Project" WHERE "slug" = 'contoh-project-6-tool-internal')
  AND NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/project-6-gallery-1');

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/project-6-gallery-2', '/demo/projects/project-6-gallery-2.jpg', 'IMAGE', 'jpg', 41549, 1600, 900, 'Gambar contoh galeri 2 untuk tool internal', 'Sample gallery 2 image for internal tool'
WHERE EXISTS (SELECT 1 FROM "Project" WHERE "slug" = 'contoh-project-6-tool-internal')
  AND NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/project-6-gallery-2');

UPDATE "Project" p SET "coverId" = a."id"
FROM "Asset" a
WHERE p."slug" = 'contoh-project-6-tool-internal' AND p."coverId" IS NULL AND a."publicId" = 'local-demo/projects/project-6-cover';

INSERT INTO "ProjectImage" ("id", "projectId", "assetId", "order")
SELECT gen_random_uuid(), p."id", a."id", CASE WHEN a."publicId" LIKE '%gallery-1' THEN 0 ELSE 1 END
FROM "Project" p, "Asset" a
WHERE p."slug" = 'contoh-project-6-tool-internal'
  AND a."publicId" IN ('local-demo/projects/project-6-gallery-1', 'local-demo/projects/project-6-gallery-2')
  AND NOT EXISTS (SELECT 1 FROM "ProjectImage" pi WHERE pi."projectId" = p."id")
ON CONFLICT DO NOTHING;

UPDATE "Project" SET
  "caseStudy_id" = COALESCE("caseStudy_id", E'## Masalah\n\nTulis kondisi sebelum project ini ada: siapa yang kesulitan dan seberapa sering.\n\n## Pendekatan\n\n- Tulis keputusan utama dan alasannya.\n- Tulis bagian tersulit dan cara menyelesaikannya.\n\n## Hasil\n\n- Tulis angka atau perubahan yang bisa dibuktikan.\n\n## Pelajaran\n\nTulis hal yang akan Anda lakukan berbeda bila mengulang project ini.'),
  "caseStudy_en" = COALESCE("caseStudy_en", E'## Problem\n\nDescribe the situation before this project: who struggled and how often.\n\n## Approach\n\n- Describe the key decisions and why.\n- Describe the hardest part and how you solved it.\n\n## Results\n\n- Describe numbers or changes you can back up.\n\n## Lessons\n\nDescribe what you would do differently next time.'),
  "demoUrl" = COALESCE("demoUrl", 'https://mmirza.site'),
  "repoUrl" = COALESCE("repoUrl", 'https://github.com/HorizonMirza')
WHERE "slug" = 'contoh-project-6-tool-internal';

-- metadata GitHub otomatis (bintang, bahasa, pembaruan terakhir) dicontohkan di project pertama
UPDATE "Project" SET "githubRepo" = 'HorizonMirza/Mirza-Portfolio'
WHERE "slug" = 'contoh-project-1-aplikasi-web' AND "githubRepo" IS NULL;
