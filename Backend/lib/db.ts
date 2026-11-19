// Prisma client (driver adapter PostgreSQL) yang dipakai seluruh kode server (hanya server).

import 'server-only'

import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '@backend/generated/prisma/client'
import { getServerEnv } from '@backend/lib/env'

// Koneksi dibuat saat pertama dipakai, bukan saat modul dimuat.
function createClient() {
  const adapter = new PrismaPg({ connectionString: getServerEnv().DATABASE_URL })
  return new PrismaClient({ adapter })
}

// Simpan satu instance di globalThis agar hot reload saat dev tidak membuka koneksi baru terus.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export function getDb(): PrismaClient {
  globalForPrisma.prisma ??= createClient()
  return globalForPrisma.prisma
}
