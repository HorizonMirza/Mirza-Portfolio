-- Kartu foto halaman Tentang (Admin → About → Profil, 2026-11-10): foto sendiri (kosong = foto
-- profil), peran sendiri (kosong = peran beranda), dan saklar chip kampus serta chip bendera.
-- Hanya menambah kolom; tampilan tidak berubah sampai pemilik mengisinya.
-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "aboutBandRoles_en" TEXT,
ADD COLUMN     "aboutBandRoles_id" TEXT,
ADD COLUMN     "aboutPhotoId" UUID,
ADD COLUMN     "showCampusChip" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showFlag" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "Profile_aboutPhotoId_key" ON "Profile"("aboutPhotoId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_aboutPhotoId_fkey" FOREIGN KEY ("aboutPhotoId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

