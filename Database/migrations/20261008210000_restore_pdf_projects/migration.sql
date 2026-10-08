-- Permintaan pemilik 2026-10-08: "tambahkan project dari pdf saya tadi nanti saya edit sendiri".
-- Isi sama dengan migrasi 20261008150000_projects_from_portfolio_pdf (teks PDF, tahun dari pemilik,
-- tangkapan layar dari PDF), ditambah peran dari PDF. GAAS tetap urutan pertama dan satu-satunya
-- unggulan. Tidak menimpa project dengan slug yang sama bila sudah dibuat ulang lewat admin.

INSERT INTO "Project" ("id", "slug", "title_id", "title_en", "summary_id", "summary_en", "description_id", "description_en", "year", "category", "demoUrl", "featured", "order", "status", "publishedAt", "updatedAt")
VALUES (gen_random_uuid(), 'catfin-r', 'CatFin-R: Catering Finance', 'CatFin-R: Catering Finance', 'Sistem berbasis web untuk pemilik usaha katering: stok, keuangan, dan laporan dalam satu platform.', 'A web-based finance system that helps catering owners manage stock, finances, and reports in one platform.', '## Tentang project

CatFin-R adalah sistem manajemen keuangan katering berbasis web yang membantu pemilik usaha katering mengelola stok, keuangan, dan laporan dalam satu platform. Project kelompok untuk mata kuliah Software Engineering.

## Peran saya

Front-End Developer. Saya membangun antarmuka dashboard:

- Ringkasan keuangan real-time
- Peringatan stok
- Grafik arus kas
- Invoice

## Teknologi

HTML, CSS, dan JavaScript.', '## About the project

CatFin-R is a web-based catering finance management system that helps catering owners manage stock, finances, and reports in one platform. It was a group project for a Software Engineering course.

## My role

Front-End Developer. I built the dashboard interface:

- Real-time financial summaries
- Stock alerts
- Cash flow charts
- Invoices

## Tech

HTML, CSS, and JavaScript.', 2026, 'SOFTWARE', 'https://catering-finance-report-se.vercel.app', false, 1, 'PUBLISHED', now(), now())
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/catfin-r', '/images/projects/catfin-r.jpg', 'IMAGE', 'jpg', 79935, 1383, 739, 'Dashboard CatFin-R: ringkasan pendapatan, grafik arus kas, dan peringatan stok', 'CatFin-R dashboard: revenue summary, cash flow chart, and stock alerts'
WHERE NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/catfin-r');

UPDATE "Project" p SET "coverId" = a."id"
FROM "Asset" a
WHERE p."slug" = 'catfin-r' AND p."coverId" IS NULL AND a."publicId" = 'local-demo/projects/catfin-r';

INSERT INTO "_ProjectToSkill" ("A", "B")
SELECT p."id", sk."id" FROM "Project" p, "Skill" sk
WHERE p."slug" = 'catfin-r' AND sk."name" IN ('HTML', 'CSS', 'JavaScript')
ON CONFLICT DO NOTHING;

INSERT INTO "Project" ("id", "slug", "title_id", "title_en", "summary_id", "summary_en", "description_id", "description_en", "year", "category", "demoUrl", "featured", "order", "status", "publishedAt", "updatedAt")
VALUES (gen_random_uuid(), 'ripe-ai', 'RIPE.AI', 'RIPE.AI', 'Aplikasi web yang mengklasifikasikan kematangan buah secara real-time dari warna dan tekstur, tanpa deep learning.', 'A web app that classifies fruit ripeness in real time from color and texture, with no deep learning required.', '## Tentang project

RIPE.AI mengklasifikasikan kematangan buah secara real-time memakai analisis warna HSV/LAB, fitur tekstur GLCM/LBP, dan SVM, tanpa deep learning. Project kelompok untuk mata kuliah Computer Vision.

## Peran saya

Front-End Developer. Saya membangun:

- Pemindai foto
- Fitur kamera real-time
- Tampilan hasil prediksi

## Yang saya pelajari

Menghubungkan frontend dengan API machine learning berbasis Flask, dan merancang UI yang menyajikan data prediksi dengan jelas.

## Teknologi

HTML, CSS, dan JavaScript.', '## About the project

RIPE.AI classifies fruit ripeness in real time using HSV/LAB color analysis, GLCM/LBP texture features, and SVM, with no deep learning required. It was a group project for a Computer Vision course.

## My role

Front-End Developer. I built:

- The photo scanner
- The real-time camera feature
- The prediction results display

## What I learned

How to connect a frontend to a Flask machine learning API, and how to design a UI that presents prediction data clearly.

## Tech

HTML, CSS, and JavaScript.', 2026, 'SOFTWARE', 'https://fruit-classifier-mu.vercel.app/', false, 2, 'PUBLISHED', now(), now())
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/ripe-ai', '/images/projects/ripe-ai.jpg', 'IMAGE', 'jpg', 47265, 1365, 709, 'Halaman utama RIPE.AI untuk deteksi kematangan buah', 'RIPE.AI home page for fruit ripeness detection'
WHERE NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/ripe-ai');

UPDATE "Project" p SET "coverId" = a."id"
FROM "Asset" a
WHERE p."slug" = 'ripe-ai' AND p."coverId" IS NULL AND a."publicId" = 'local-demo/projects/ripe-ai';

INSERT INTO "_ProjectToSkill" ("A", "B")
SELECT p."id", sk."id" FROM "Project" p, "Skill" sk
WHERE p."slug" = 'ripe-ai' AND sk."name" IN ('HTML', 'CSS', 'JavaScript')
ON CONFLICT DO NOTHING;

INSERT INTO "Project" ("id", "slug", "title_id", "title_en", "summary_id", "summary_en", "description_id", "description_en", "year", "category", "demoUrl", "featured", "order", "status", "publishedAt", "updatedAt")
VALUES (gen_random_uuid(), 'crypto-pedia', 'Crypto Pedia', 'Crypto Pedia', 'Platform prediksi harga Bitcoin berbasis AI dengan dashboard real-time dan grafik harga aktual vs prediksi.', 'An AI-powered Bitcoin price prediction platform with a real-time dashboard and an actual vs. predicted price chart.', '## Tentang project

Crypto Pedia adalah platform prediksi harga Bitcoin berbasis AI.

## Peran saya

Frontend Developer. Saya membangun seluruh website dari nol:

- Dashboard Bitcoin real-time
- Visualisasi interaktif dengan Chart.js yang membandingkan harga aktual dan harga prediksi
- Prediction Generator dengan sinyal trading dari AI

Website ini berjalan sebagai situs statis tanpa backend.

## Teknologi

HTML, CSS, JavaScript (vanilla), dan Chart.js.', '## About the project

Crypto Pedia is an AI-powered Bitcoin price prediction platform.

## My role

Frontend Developer. I built the entire website from scratch:

- A real-time Bitcoin dashboard
- An interactive Chart.js visualization comparing actual and predicted prices
- A Prediction Generator with AI-generated trading signals

The site is deployed as a fully static site with no backend.

## Tech

HTML, CSS, vanilla JavaScript, and Chart.js.', 2026, 'SOFTWARE', 'https://huggingface.co/spaces/donut12345/ML_LSTM_BTC', false, 3, 'PUBLISHED', now(), now())
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/crypto-pedia', '/images/projects/crypto-pedia.jpg', 'IMAGE', 'jpg', 50867, 1375, 709, 'Halaman utama Crypto Pedia untuk melacak dan memprediksi harga Bitcoin', 'Crypto Pedia home page for tracking and predicting the Bitcoin price'
WHERE NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/crypto-pedia');

UPDATE "Project" p SET "coverId" = a."id"
FROM "Asset" a
WHERE p."slug" = 'crypto-pedia' AND p."coverId" IS NULL AND a."publicId" = 'local-demo/projects/crypto-pedia';

INSERT INTO "_ProjectToSkill" ("A", "B")
SELECT p."id", sk."id" FROM "Project" p, "Skill" sk
WHERE p."slug" = 'crypto-pedia' AND sk."name" IN ('HTML', 'CSS', 'JavaScript')
ON CONFLICT DO NOTHING;

INSERT INTO "Project" ("id", "slug", "title_id", "title_en", "summary_id", "summary_en", "description_id", "description_en", "year", "category", "demoUrl", "featured", "order", "status", "publishedAt", "updatedAt")
VALUES (gen_random_uuid(), 'mr-coffee', 'MR Coffee', 'MR Coffee', 'Website kedai kopi dengan pemesanan makanan dan minuman, halaman menu, serta halaman Tentang Kami dan Kontak.', 'A coffee shop website with food and beverage ordering, a menu page, and About Us and Contact pages.', '## Tentang project

MR Coffee adalah project pribadi: website kedai kopi yang saya bangun dari nol, dengan:

- Sistem pemesanan makanan dan minuman
- Halaman menu
- Halaman Tentang Kami dan Kontak

## Tujuan

Project ini saya buat sendiri untuk mengasah kemampuan frontend, dengan fokus pada UI yang bersih dan menarik yang menghadirkan suasana hangat sebuah kedai kopi.

## Teknologi

HTML, CSS, dan JavaScript.', '## About the project

MR Coffee is a personal project: a coffee shop website I built entirely from scratch, featuring:

- A food and beverage ordering system
- A menu page
- About Us and Contact pages

## Why I built it

It was self-initiated to sharpen my frontend skills, with a focus on a clean, visually appealing UI that reflects the warm atmosphere of a real coffee shop.

## Tech

HTML, CSS, and JavaScript.', 2025, 'SOFTWARE', NULL, false, 4, 'PUBLISHED', now(), now())
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/mr-coffee', '/images/projects/mr-coffee.jpg', 'IMAGE', 'jpg', 97514, 1367, 736, 'Halaman utama website MR Coffee', 'MR Coffee website home page'
WHERE NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/mr-coffee');

UPDATE "Project" p SET "coverId" = a."id"
FROM "Asset" a
WHERE p."slug" = 'mr-coffee' AND p."coverId" IS NULL AND a."publicId" = 'local-demo/projects/mr-coffee';

INSERT INTO "_ProjectToSkill" ("A", "B")
SELECT p."id", sk."id" FROM "Project" p, "Skill" sk
WHERE p."slug" = 'mr-coffee' AND sk."name" IN ('HTML', 'CSS', 'JavaScript')
ON CONFLICT DO NOTHING;

INSERT INTO "Project" ("id", "slug", "title_id", "title_en", "summary_id", "summary_en", "description_id", "description_en", "year", "category", "demoUrl", "featured", "order", "status", "publishedAt", "updatedAt")
VALUES (gen_random_uuid(), 'swarna-creation', 'Swarna Creation', 'Swarna Creation', 'Website resmi untuk usaha event organizer milik teman, dengan animasi halus dan UI interaktif.', 'The official website for a friend''s event organizer business, with smooth animations and an interactive UI.', '## Tentang project

Swarna Creation adalah project pribadi untuk klien nyata: website resmi yang saya bangun untuk usaha event organizer milik teman. Website ini menjadi kehadiran digital utama perusahaan, mencakup semua halaman penting dengan animasi halus dan UI interaktif.

## Yang saya dapat

Pengalaman langsung membangun website profesional untuk klien, dengan konten dan pengguna nyata.

## Teknologi

HTML, CSS, dan JavaScript.', '## About the project

Swarna Creation is a real-world personal project: the official website I built for a friend''s event organizer business. It serves as the company''s main digital presence, covering all essential pages with smooth animations and an interactive UI.

## What I gained

Hands-on experience building a professional, client-facing website with real content and real users in mind.

## Tech

HTML, CSS, and JavaScript.', 2026, 'SOFTWARE', NULL, false, 5, 'PUBLISHED', now(), now())
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/swarna-creation', '/images/projects/swarna-creation.jpg', 'IMAGE', 'jpg', 66425, 1366, 710, 'Halaman utama website Swarna Creation', 'Swarna Creation website home page'
WHERE NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/swarna-creation');

UPDATE "Project" p SET "coverId" = a."id"
FROM "Asset" a
WHERE p."slug" = 'swarna-creation' AND p."coverId" IS NULL AND a."publicId" = 'local-demo/projects/swarna-creation';

INSERT INTO "_ProjectToSkill" ("A", "B")
SELECT p."id", sk."id" FROM "Project" p, "Skill" sk
WHERE p."slug" = 'swarna-creation' AND sk."name" IN ('HTML', 'CSS', 'JavaScript')
ON CONFLICT DO NOTHING;

-- Peran dari PDF; MR Coffee dan Swarna Creation tidak mencantumkan peran.
UPDATE "Project" SET "role_id" = 'Front-End Developer', "role_en" = 'Front-End Developer'
WHERE "slug" IN ('catfin-r', 'ripe-ai') AND "role_id" IS NULL AND "role_en" IS NULL;
UPDATE "Project" SET "role_id" = 'Frontend Developer', "role_en" = 'Frontend Developer'
WHERE "slug" = 'crypto-pedia' AND "role_id" IS NULL AND "role_en" IS NULL;
