import { PrismaPg } from '@prisma/adapter-pg'
import { hashPassword } from 'better-auth/crypto'
import { config } from 'dotenv'

import { PrismaClient } from '../src/generated/prisma/client'

config({ path: ['.env.local', '.env'], quiet: true })

// Ganti password Super Admin bila lupa. Pemakaian:
//   ADMIN_EMAIL=... ADMIN_NEW_PASSWORD=... pnpm admin:reset-password
// Semua sesi lama dicabut, jadi login ulang diperlukan di semua perangkat.
async function main() {
  const connectionString = process.env.DATABASE_URL
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_NEW_PASSWORD
  if (!connectionString) throw new Error('DATABASE_URL belum diisi')
  if (!email) throw new Error('ADMIN_EMAIL belum diisi')
  if (!password || password.length < 12) throw new Error('ADMIN_NEW_PASSWORD minimal 12 karakter')

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
  try {
    const user = await db.user.findUnique({ where: { email } })
    if (!user) throw new Error('Akun dengan email tersebut tidak ditemukan')
    const passwordHash = await hashPassword(password)
    const [updated, revoked] = await db.$transaction([
      db.account.updateMany({
        where: { userId: user.id, providerId: 'credential' },
        data: { password: passwordHash },
      }),
      db.session.deleteMany({ where: { userId: user.id } }),
    ])
    if (updated.count === 0) throw new Error('Akun tidak punya login email + password')
    console.log(`Password diganti. ${revoked.count} sesi lama dicabut.`)
  } finally {
    await db.$disconnect()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
