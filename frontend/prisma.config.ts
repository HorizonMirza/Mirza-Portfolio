import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'

// Sama seperti Next.js: .env.local lebih diutamakan daripada .env
config({ path: ['.env.local', '.env'], quiet: true })

// Migrasi memakai koneksi langsung (DIRECT_URL, tanpa pooler Neon) bila tersedia.
// `prisma generate` tidak butuh koneksi, jadi URL boleh kosong saat install/CI.
export default defineConfig({
  // skema, migrasi, dan data seed disimpan di folder database/ di akar repo
  schema: '../database/schema.prisma',
  migrations: {
    path: '../database/migrations',
    seed: 'tsx scripts/seed.ts',
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
})
