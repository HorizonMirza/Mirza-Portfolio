-- Foto kartu ID di halaman Kontak bisa diganti admin (2026-11-15, DESIGN.md bagian 152).
-- Hanya menambah kolom opsional; kosong = potret hero seperti sebelumnya.
-- AlterTable
ALTER TABLE "SiteSetting" ADD COLUMN     "contactPhotoId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "SiteSetting_contactPhotoId_key" ON "SiteSetting"("contactPhotoId");

-- AddForeignKey
ALTER TABLE "SiteSetting" ADD CONSTRAINT "SiteSetting_contactPhotoId_fkey" FOREIGN KEY ("contactPhotoId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
