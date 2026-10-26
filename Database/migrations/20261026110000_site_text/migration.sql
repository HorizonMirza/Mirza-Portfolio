-- Teks situs yang bisa diubah dari Admin → Teks situs (judul bagian, SEO, kebijakan privasi).
-- Menimpa teks bawaan di messages/*.json; baris kosong berarti memakai teks bawaan.
CREATE TABLE "SiteText" (
    "key" TEXT NOT NULL,
    "value_id" TEXT,
    "value_en" TEXT,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SiteText_pkey" PRIMARY KEY ("key")
);
