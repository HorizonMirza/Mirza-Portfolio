import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'

import { PrismaClient } from '../src/generated/prisma/client'
import { experiences, profile, projects, skillCategories } from '../../Database/seed/seed-data'

config({ path: ['.env.local', '.env'], quiet: true })

// Menjalankan data dari Database/seed/seed-data.ts. Dijalankan dengan `pnpm db:seed` dari Frontend/.
// Seed bersifat idempoten: aman dijalankan berulang, data yang sudah diubah lewat admin
// untuk profil TIDAK ditimpa (hanya dibuat bila belum ada).
async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL belum diisi')
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

  try {
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
      },
    })

    for (const [index, category] of skillCategories.entries()) {
      const id = `seed-skillcat-${category.key}`
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
      const id = `seed-exp-${item.key}`
      await db.experience.upsert({
        where: { id },
        update: {},
        create: {
          id,
          type: item.type,
          organization: item.organization,
          title_id: item.title.id,
          title_en: item.title.en,
          description_id: item.description.id,
          description_en: item.description.en,
          startDate: new Date(item.startDate),
          endDate: item.endDate ? new Date(item.endDate) : null,
          location: item.location,
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

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
