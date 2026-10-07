import { PrismaPg } from '@prisma/adapter-pg'
import { hashPassword } from 'better-auth/crypto'
import { config } from 'dotenv'

import { PrismaClient } from '../src/generated/prisma/client'
import { experiences, profile, projects, skillCategories } from '../../Database/seed/seed-data'
import { seedId } from './seed-ids'

config({ path: ['.env.local', '.env'], quiet: true })

// Menjalankan data dari Database/seed/seed-data.ts. Dijalankan dengan `pnpm db:seed` dari Frontend/.
// Seed bersifat idempoten: aman dijalankan berulang, data yang sudah diubah lewat admin
// untuk profil TIDAK ditimpa (hanya dibuat bila belum ada).
//
// Mode `--bootstrap` (dipanggil build production Vercel): konten CV hanya diisi bila database
// masih kosong (belum ada profil), supaya item yang dihapus lewat admin tidak muncul lagi di
// deploy berikutnya. Akun admin tetap dibuat bila belum ada dan ADMIN_EMAIL/ADMIN_PASSWORD diisi.
const bootstrap = process.argv.includes('--bootstrap')

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL belum diisi')
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

  try {
    if (bootstrap && (await db.profile.findUnique({ where: { id: 1 }, select: { id: true } }))) {
      console.log('Bootstrap: database sudah berisi, konten CV tidak diisi ulang.')
      await seedAdmin(db)
      return
    }

    await db.profile.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: profile.name,
        headline_id: profile.headline.id,
        headline_en: profile.headline.en,
        bio_id: profile.bio.id,
        bio_en: profile.bio.en,
        city: profile.city,
        email: process.env.SEED_PROFILE_EMAIL || null,
        whatsapp: process.env.SEED_PROFILE_WHATSAPP || null,
        socials: profile.socials,
        currentRole_id: profile.currentRole.id,
        currentRole_en: profile.currentRole.en,
        aboutRoles_id: profile.aboutRoles.id,
        aboutRoles_en: profile.aboutRoles.en,
        cardRole_id: profile.cardRole.id,
        cardRole_en: profile.cardRole.en,
      },
    })

    for (const [index, category] of skillCategories.entries()) {
      const id = seedId(`skill-category:${category.key}`)
      await db.skillCategory.upsert({
        where: { id },
        update: {},
        create: { id, name_id: category.name.id, name_en: category.name.en, order: index },
      })
      for (const [skillIndex, name] of category.skills.entries()) {
        await db.skill.upsert({
          where: { name },
          update: {},
          create: { name, order: skillIndex, categoryId: id },
        })
      }
    }

    for (const [index, item] of experiences.entries()) {
      const id = seedId(`experience:${item.key}`)
      await db.experience.upsert({
        where: { id },
        update: {},
        create: {
          id,
          type: item.type,
          organization: item.organization,
          organization_en: item.organizationEn ?? null,
          title_id: item.title.id,
          title_en: item.title.en,
          description_id: item.description.id,
          description_en: item.description.en,
          startDate: new Date(item.startDate),
          endDate: item.endDate ? new Date(item.endDate) : null,
          location: item.location,
          employmentType: item.employmentType ?? null,
          order: index,
        },
      })
    }

    for (const [index, item] of projects.entries()) {
      await db.project.upsert({
        where: { slug: item.slug },
        update: {},
        create: {
          slug: item.slug,
          title_id: item.title.id,
          title_en: item.title.en,
          summary_id: item.summary.id,
          summary_en: item.summary.en,
          description_id: item.description.id,
          description_en: item.description.en,
          year: item.year,
          category: item.category,
          featured: true,
          order: index,
          status: 'DRAFT',
          skills: { connect: item.skills.map((name) => ({ name })) },
        },
      })
    }

    await seedAdmin(db)

    const counts = {
      experiences: await db.experience.count(),
      skills: await db.skill.count(),
      projects: await db.project.count(),
    }
    console.log('Seed selesai:', counts)
  } finally {
    await db.$disconnect()
  }
}

// Akun Super Admin dari ADMIN_EMAIL + ADMIN_PASSWORD. Bila akun sudah ada, password TIDAK
// ditimpa (pakai `pnpm admin:reset-password` untuk menggantinya).
async function seedAdmin(db: PrismaClient) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) {
    console.log('ADMIN_EMAIL/ADMIN_PASSWORD kosong, akun admin tidak dibuat.')
    return
  }
  if (password.length < 12) throw new Error('ADMIN_PASSWORD minimal 12 karakter')

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    if (existing.role !== 'SUPER_ADMIN') {
      await db.user.update({ where: { id: existing.id }, data: { role: 'SUPER_ADMIN' } })
    }
    console.log('Akun admin sudah ada, password tidak diubah.')
    return
  }
  // Hanya satu Super Admin (PRD 5.2). Mengganti ADMIN_EMAIL tidak membuat akun kedua.
  const otherAdmin = await db.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
    select: { id: true },
  })
  if (otherAdmin) {
    console.log('Sudah ada Super Admin lain, akun baru tidak dibuat.')
    return
  }

  const passwordHash = await hashPassword(password)
  await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name: process.env.ADMIN_NAME?.trim() || profile.name,
        emailVerified: true,
        role: 'SUPER_ADMIN',
      },
    })
    await tx.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        password: passwordHash,
      },
    })
  })
  console.log('Akun admin dibuat.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
