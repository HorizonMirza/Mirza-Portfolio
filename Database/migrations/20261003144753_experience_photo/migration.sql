-- AlterTable
ALTER TABLE "Experience" ADD COLUMN     "photoId" UUID;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
