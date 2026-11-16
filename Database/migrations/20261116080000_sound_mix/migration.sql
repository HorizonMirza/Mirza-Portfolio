-- Volume tiap suara situs yang diatur admin (revisi pemilik 2026-11-16).
-- Hanya menambah kolom; kosong berarti semua suara memakai volume penuh dari volume utama.
ALTER TABLE "SiteSetting" ADD COLUMN "soundMix" JSONB NOT NULL DEFAULT '{}';
