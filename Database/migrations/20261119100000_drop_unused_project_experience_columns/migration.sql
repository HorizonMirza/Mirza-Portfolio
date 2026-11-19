-- Kolom yang tidak tampil di situs dan tidak bisa diubah dari admin, dihapus atas persetujuan pemilik
-- (2026-11-19, perapian folder Database):
-- - Project.description_id/en: uraian project, dulu hanya dikirim API /api/v1 yang sudah dihapus.
-- - Project.caseStudy_id/en: studi kasus, tidak ditampilkan di halaman detail.
-- - Project.githubRepo: "owner/repo" untuk fitur impor GitHub yang sudah dihapus.
-- - Experience.location: lokasi pengalaman, tidak ditampilkan di mana pun.
-- - Experience.inStory: titik "garis cerita" beranda, bagiannya sudah dihapus.
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "description_id",
DROP COLUMN "description_en",
DROP COLUMN "caseStudy_id",
DROP COLUMN "caseStudy_en",
DROP COLUMN "githubRepo";

-- AlterTable
ALTER TABLE "Experience" DROP COLUMN "location",
DROP COLUMN "inStory";
