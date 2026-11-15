-- Chip umum di kartu foto halaman Tentang (2026-11-15, DESIGN.md bagian 148): teks dan logo bisa
-- diubah admin (mis. logo perusahaan). Hanya menambah kolom opsional; kosong = pendidikan terbaru
-- seperti sebelumnya.
-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "aboutChipLabel_en" TEXT,
ADD COLUMN     "aboutChipLabel_id" TEXT,
ADD COLUMN     "aboutChipLogoId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "Profile_aboutChipLogoId_key" ON "Profile"("aboutChipLogoId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_aboutChipLogoId_fkey" FOREIGN KEY ("aboutChipLogoId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
