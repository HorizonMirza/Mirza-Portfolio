-- Pilihan pemilik 2026-10-08 (demo bagian baru beranda nomor 1 dan 2): angka pencapaian dari CV
-- dan garis cerita "Dari komunitas ke software" yang titiknya dipilih dari Pengalaman.
ALTER TABLE "Experience" ADD COLUMN "inStory" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "Highlight" (
    "id" UUID NOT NULL,
    "value" INTEGER NOT NULL,
    "suffix" TEXT NOT NULL DEFAULT '',
    "label_id" TEXT NOT NULL,
    "label_en" TEXT NOT NULL,
    "source" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Highlight_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Highlight_status_order_idx" ON "Highlight"("status", "order");

-- Isi awal: angka dari CV (CONTENT.md bagian 7). Bisa diubah atau dihapus di Admin -> Angka.
INSERT INTO "Highlight" ("id", "value", "suffix", "label_id", "label_en", "source", "order", "updatedAt") VALUES
  (gen_random_uuid(), 1000, '+', 'anggota di Reclub', 'members on Reclub', 'Ace Padel Club', 1, now()),
  (gen_random_uuid(), 300, '+', 'anggota aktif di WhatsApp', 'active WhatsApp members', 'Ace Padel Club', 2, now()),
  (gen_random_uuid(), 128, '+', 'peserta per turnamen', 'players per tournament', 'Horizon Organizer', 3, now()),
  (gen_random_uuid(), 30, '+', 'siswa didaftarkan', 'students enrolled', 'Algo Bootcamp', 4, now());

-- Titik garis cerita awal (CONTENT.md bagian 2): Warnet Mobile -> Horizon Organizer -> Bina Nusantara
-- -> Ace Padel Club -> PT PGAS Solution. Bisa diubah lewat centang di Admin -> Pengalaman.
UPDATE "Experience" SET "inStory" = true
WHERE "organization" IN ('Warnet Mobile', 'Horizon Organizer', 'Ace Padel Club', 'PT PGAS Solution')
   OR ("type" = 'EDUCATION' AND "organization" ILIKE '%Bina Nusantara%');
