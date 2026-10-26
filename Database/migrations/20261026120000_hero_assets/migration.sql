-- Foto hero beranda yang bisa diganti dari Admin → Pengaturan. Kosong berarti memakai foto bawaan di repo.
ALTER TABLE "SiteSetting" ADD COLUMN "heroPortraitId" UUID,
ADD COLUMN "heroArmorId" UUID;

CREATE UNIQUE INDEX "SiteSetting_heroPortraitId_key" ON "SiteSetting"("heroPortraitId");
CREATE UNIQUE INDEX "SiteSetting_heroArmorId_key" ON "SiteSetting"("heroArmorId");

ALTER TABLE "SiteSetting" ADD CONSTRAINT "SiteSetting_heroPortraitId_fkey" FOREIGN KEY ("heroPortraitId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SiteSetting" ADD CONSTRAINT "SiteSetting_heroArmorId_fkey" FOREIGN KEY ("heroArmorId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
