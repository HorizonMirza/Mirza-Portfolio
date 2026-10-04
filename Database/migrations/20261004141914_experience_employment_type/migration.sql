-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'SELF_EMPLOYED', 'FREELANCE', 'CONTRACT', 'INTERNSHIP', 'APPRENTICESHIP', 'SEASONAL', 'VOLUNTEER');

-- AlterTable
ALTER TABLE "Experience" ADD COLUMN     "employmentType" "EmploymentType";

-- Data: jenis pekerjaan yang sudah dikonfirmasi pemilik (2026-10-04). Entri lain diisi dari admin.
UPDATE "Experience" SET "employmentType" = 'INTERNSHIP'
WHERE "organization" = 'PT PGAS Solution' AND "employmentType" IS NULL;
