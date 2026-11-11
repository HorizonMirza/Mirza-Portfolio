-- Admin → Pengaturan dan Admin → Akun (2026-11-11, DESIGN.md bagian 119 dan 120). Hanya menambah
-- kolom dan tabel; semua nilai bawaan sama dengan perilaku situs sebelumnya (tema gelap, bahasa
-- browser, kartu pembuka sekali per sesi browser, form kontak terbuka 5 pesan per jam, kunjungan
-- dihitung dan disimpan 90 hari, boleh diindeks). introEnabled ditambah lagi atas pilihan pemilik
-- (desain Pengaturan 1), setelah dihapus 2026-11-10.
-- AlterTable
ALTER TABLE "SiteSetting" ADD COLUMN     "allowIndexing" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "contactOpen" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "contactPerHour" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "defaultLocale" TEXT NOT NULL DEFAULT 'browser',
ADD COLUMN     "defaultTheme" TEXT NOT NULL DEFAULT 'dark',
ADD COLUMN     "emailOnMessage" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "heroAnimation" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "introEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "introFrequency" TEXT NOT NULL DEFAULT 'visit',
ADD COLUMN     "loginNotify" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trackVisits" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "visitRetentionDays" INTEGER NOT NULL DEFAULT 90,
ADD COLUMN     "whatsappButton" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "LoginEvent" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "kind" TEXT NOT NULL,
    "sessionId" UUID,
    "userAgent" VARCHAR(300),
    "location" VARCHAR(120),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoginEvent_userId_createdAt_idx" ON "LoginEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LoginEvent_createdAt_idx" ON "LoginEvent"("createdAt");

-- CreateIndex
CREATE INDEX "LoginEvent_sessionId_idx" ON "LoginEvent"("sessionId");

-- AddForeignKey
ALTER TABLE "LoginEvent" ADD CONSTRAINT "LoginEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
