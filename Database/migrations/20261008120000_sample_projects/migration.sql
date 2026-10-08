-- Data: 6 project CONTOH atas permintaan pemilik (2026-10-08) untuk melihat tampilan halaman Project
-- dan bagian project di beranda. Judulnya diawali "Contoh Project" / "Sample Project" dan isinya
-- kerangka yang diganti pemilik lewat Admin -> Project (atau dihapus). Bukan fakta dari CV.
-- Status terbit agar terlihat di situs. Hanya ditambahkan bila slug-nya belum ada.

INSERT INTO "Project" ("id", "slug", "title_id", "title_en", "summary_id", "summary_en", "description_id", "description_en", "year", "category", "featured", "order", "status", "publishedAt", "updatedAt")
SELECT gen_random_uuid(), 'contoh-project-1-aplikasi-web', 'Contoh Project 1: Aplikasi Web', 'Sample Project 1: Web App', 'Project contoh untuk melihat tampilan. Ganti judul, ringkasan, foto, dan tautannya di Admin, atau hapus project ini.', 'A sample project to preview the layout. Replace the title, summary, images, and links in the admin, or delete it.', E'## Latar belakang\n\nTulis masalah yang ingin diselesaikan dan untuk siapa project ini dibuat.\n\n## Yang saya kerjakan\n\n- Tulis peran dan bagian yang Anda bangun.\n- Tulis teknologi atau cara yang dipakai.\n\n## Hasil\n\n- Tulis hasil yang bisa dibuktikan, mis. jumlah pengguna atau waktu yang dihemat.', E'## Background\n\nDescribe the problem this project solves and who it is for.\n\n## What I did\n\n- Describe your role and the parts you built.\n- Describe the tools or approach you used.\n\n## Results\n\n- Describe outcomes you can back up, e.g. number of users or time saved.', 2026, 'SOFTWARE', true, 101, 'PUBLISHED', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Project" WHERE "slug" = 'contoh-project-1-aplikasi-web');

INSERT INTO "_ProjectToSkill" ("A", "B")
SELECT p."id", sk."id" FROM "Project" p, "Skill" sk
WHERE p."slug" = 'contoh-project-1-aplikasi-web' AND sk."name" IN ('Next.js', 'TypeScript', 'PostgreSQL')
ON CONFLICT DO NOTHING;

INSERT INTO "Project" ("id", "slug", "title_id", "title_en", "summary_id", "summary_en", "description_id", "description_en", "year", "category", "featured", "order", "status", "publishedAt", "updatedAt")
SELECT gen_random_uuid(), 'contoh-project-2-dashboard-data', 'Contoh Project 2: Dashboard Data', 'Sample Project 2: Data Dashboard', 'Project contoh untuk melihat tampilan. Ganti judul, ringkasan, foto, dan tautannya di Admin, atau hapus project ini.', 'A sample project to preview the layout. Replace the title, summary, images, and links in the admin, or delete it.', E'## Latar belakang\n\nTulis masalah yang ingin diselesaikan dan untuk siapa project ini dibuat.\n\n## Yang saya kerjakan\n\n- Tulis peran dan bagian yang Anda bangun.\n- Tulis teknologi atau cara yang dipakai.\n\n## Hasil\n\n- Tulis hasil yang bisa dibuktikan, mis. jumlah pengguna atau waktu yang dihemat.', E'## Background\n\nDescribe the problem this project solves and who it is for.\n\n## What I did\n\n- Describe your role and the parts you built.\n- Describe the tools or approach you used.\n\n## Results\n\n- Describe outcomes you can back up, e.g. number of users or time saved.', 2026, 'SOFTWARE', true, 102, 'PUBLISHED', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Project" WHERE "slug" = 'contoh-project-2-dashboard-data');

INSERT INTO "_ProjectToSkill" ("A", "B")
SELECT p."id", sk."id" FROM "Project" p, "Skill" sk
WHERE p."slug" = 'contoh-project-2-dashboard-data' AND sk."name" IN ('React', 'TypeScript')
ON CONFLICT DO NOTHING;

INSERT INTO "Project" ("id", "slug", "title_id", "title_en", "summary_id", "summary_en", "description_id", "description_en", "year", "category", "featured", "order", "status", "publishedAt", "updatedAt")
SELECT gen_random_uuid(), 'contoh-project-3-komunitas', 'Contoh Project 3: Komunitas', 'Sample Project 3: Community', 'Project contoh untuk melihat tampilan. Ganti judul, ringkasan, foto, dan tautannya di Admin, atau hapus project ini.', 'A sample project to preview the layout. Replace the title, summary, images, and links in the admin, or delete it.', E'## Latar belakang\n\nTulis masalah yang ingin diselesaikan dan untuk siapa project ini dibuat.\n\n## Yang saya kerjakan\n\n- Tulis peran dan bagian yang Anda bangun.\n- Tulis teknologi atau cara yang dipakai.\n\n## Hasil\n\n- Tulis hasil yang bisa dibuktikan, mis. jumlah pengguna atau waktu yang dihemat.', E'## Background\n\nDescribe the problem this project solves and who it is for.\n\n## What I did\n\n- Describe your role and the parts you built.\n- Describe the tools or approach you used.\n\n## Results\n\n- Describe outcomes you can back up, e.g. number of users or time saved.', 2025, 'COMMUNITY_BUSINESS', true, 103, 'PUBLISHED', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Project" WHERE "slug" = 'contoh-project-3-komunitas');

INSERT INTO "Project" ("id", "slug", "title_id", "title_en", "summary_id", "summary_en", "description_id", "description_en", "year", "category", "featured", "order", "status", "publishedAt", "updatedAt")
SELECT gen_random_uuid(), 'contoh-project-4-aplikasi-ai', 'Contoh Project 4: Aplikasi AI', 'Sample Project 4: AI App', 'Project contoh untuk melihat tampilan. Ganti judul, ringkasan, foto, dan tautannya di Admin, atau hapus project ini.', 'A sample project to preview the layout. Replace the title, summary, images, and links in the admin, or delete it.', E'## Latar belakang\n\nTulis masalah yang ingin diselesaikan dan untuk siapa project ini dibuat.\n\n## Yang saya kerjakan\n\n- Tulis peran dan bagian yang Anda bangun.\n- Tulis teknologi atau cara yang dipakai.\n\n## Hasil\n\n- Tulis hasil yang bisa dibuktikan, mis. jumlah pengguna atau waktu yang dihemat.', E'## Background\n\nDescribe the problem this project solves and who it is for.\n\n## What I did\n\n- Describe your role and the parts you built.\n- Describe the tools or approach you used.\n\n## Results\n\n- Describe outcomes you can back up, e.g. number of users or time saved.', 2025, 'SOFTWARE', false, 104, 'PUBLISHED', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Project" WHERE "slug" = 'contoh-project-4-aplikasi-ai');

INSERT INTO "_ProjectToSkill" ("A", "B")
SELECT p."id", sk."id" FROM "Project" p, "Skill" sk
WHERE p."slug" = 'contoh-project-4-aplikasi-ai' AND sk."name" IN ('Python')
ON CONFLICT DO NOTHING;

INSERT INTO "Project" ("id", "slug", "title_id", "title_en", "summary_id", "summary_en", "description_id", "description_en", "year", "category", "featured", "order", "status", "publishedAt", "updatedAt")
SELECT gen_random_uuid(), 'contoh-project-5-acara-turnamen', 'Contoh Project 5: Acara & Turnamen', 'Sample Project 5: Events & Tournaments', 'Project contoh untuk melihat tampilan. Ganti judul, ringkasan, foto, dan tautannya di Admin, atau hapus project ini.', 'A sample project to preview the layout. Replace the title, summary, images, and links in the admin, or delete it.', E'## Latar belakang\n\nTulis masalah yang ingin diselesaikan dan untuk siapa project ini dibuat.\n\n## Yang saya kerjakan\n\n- Tulis peran dan bagian yang Anda bangun.\n- Tulis teknologi atau cara yang dipakai.\n\n## Hasil\n\n- Tulis hasil yang bisa dibuktikan, mis. jumlah pengguna atau waktu yang dihemat.', E'## Background\n\nDescribe the problem this project solves and who it is for.\n\n## What I did\n\n- Describe your role and the parts you built.\n- Describe the tools or approach you used.\n\n## Results\n\n- Describe outcomes you can back up, e.g. number of users or time saved.', 2024, 'COMMUNITY_BUSINESS', false, 105, 'PUBLISHED', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Project" WHERE "slug" = 'contoh-project-5-acara-turnamen');

INSERT INTO "Project" ("id", "slug", "title_id", "title_en", "summary_id", "summary_en", "description_id", "description_en", "year", "category", "featured", "order", "status", "publishedAt", "updatedAt")
SELECT gen_random_uuid(), 'contoh-project-6-tool-internal', 'Contoh Project 6: Tool Internal', 'Sample Project 6: Internal Tool', 'Project contoh untuk melihat tampilan. Ganti judul, ringkasan, foto, dan tautannya di Admin, atau hapus project ini.', 'A sample project to preview the layout. Replace the title, summary, images, and links in the admin, or delete it.', E'## Latar belakang\n\nTulis masalah yang ingin diselesaikan dan untuk siapa project ini dibuat.\n\n## Yang saya kerjakan\n\n- Tulis peran dan bagian yang Anda bangun.\n- Tulis teknologi atau cara yang dipakai.\n\n## Hasil\n\n- Tulis hasil yang bisa dibuktikan, mis. jumlah pengguna atau waktu yang dihemat.', E'## Background\n\nDescribe the problem this project solves and who it is for.\n\n## What I did\n\n- Describe your role and the parts you built.\n- Describe the tools or approach you used.\n\n## Results\n\n- Describe outcomes you can back up, e.g. number of users or time saved.', 2023, 'SOFTWARE', false, 106, 'PUBLISHED', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Project" WHERE "slug" = 'contoh-project-6-tool-internal');

INSERT INTO "_ProjectToSkill" ("A", "B")
SELECT p."id", sk."id" FROM "Project" p, "Skill" sk
WHERE p."slug" = 'contoh-project-6-tool-internal' AND sk."name" IN ('JavaScript', 'Git')
ON CONFLICT DO NOTHING;
