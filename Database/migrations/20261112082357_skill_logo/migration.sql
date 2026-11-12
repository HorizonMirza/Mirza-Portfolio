-- Logo skill yang bisa diunggah dari Admin → Home → Skill teknis (2026-11-12, DESIGN.md bagian 143).
-- Hanya menambah kolom opsional; skill tanpa logo unggahan tetap memakai logo bawaan atau ikon.
-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "logoId" UUID;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
