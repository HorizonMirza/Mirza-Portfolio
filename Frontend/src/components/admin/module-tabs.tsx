import { FilterTabs } from '@/components/admin/filter-tabs'
import { getAdminT } from '@/lib/admin-lang-server'

// Tiap modul situs publik punya satu menu; teks halamannya dan datanya (profil, skill, pengalaman,
// project) dipisah sebagai tab di dalam modul itu, bukan menu kedua di sidebar.
const TABS = {
  home: [
    { label: 'Foto dan peran', href: '/admin/pages/home' },
    // Bagian Awal masuk ke Home sebagai tab (revisi pemilik 2026-11-11)
    { label: 'Kartu pembuka', href: '/admin/pages/intro' },
    { label: 'Skill', href: '/admin/skills' },
  ],
  about: [
    { label: 'Teks halaman', href: '/admin/pages/about' },
    { label: 'Profil', href: '/admin/profile' },
    { label: 'Pendidikan', href: '/admin/education' },
  ],
  experience: [
    { label: 'Teks halaman', href: '/admin/pages/experience' },
    { label: 'Pengalaman', href: '/admin/experience' },
  ],
  projects: [
    { label: 'Teks halaman', href: '/admin/pages/projects' },
    { label: 'Project', href: '/admin/projects' },
  ],
} as const

export type TabbedModule = keyof typeof TABS

export function isTabbedModule(id: string): id is TabbedModule {
  return id in TABS
}

export async function ModuleTabs({
  moduleId,
  current,
}: {
  moduleId: TabbedModule
  current: string
}) {
  const { t } = await getAdminT()
  return (
    <FilterTabs
      label={t('Bagian halaman')}
      items={TABS[moduleId].map((tab) => ({
        ...tab,
        label: t(tab.label),
        active: tab.href === current,
      }))}
    />
  )
}
