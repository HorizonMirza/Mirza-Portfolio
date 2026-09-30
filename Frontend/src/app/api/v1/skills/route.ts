import { getPublicSkills } from '@/features/skills/public'

import { apiLocale, ok, options, text } from '../helpers'

export async function GET(request: Request) {
  const locale = apiLocale(request)
  const categories = await getPublicSkills()
  return ok(
    categories.map((c) => ({
      name: text(c, 'name', locale),
      skills: c.skills.map((s) => ({ name: s.name, projects: s.projectSlugs })),
    })),
    { locale },
  )
}

export const OPTIONS = options
