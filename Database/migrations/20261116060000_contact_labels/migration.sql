-- Judul dan teks kecil kartu kontak footer yang bisa diganti admin (revisi pemilik 2026-11-16).
-- Hanya menambah kolom; kosong berarti nama bawaan dan teks dari tautan.
ALTER TABLE "Profile" ADD COLUMN "contactLabels" JSONB NOT NULL DEFAULT '{}';
