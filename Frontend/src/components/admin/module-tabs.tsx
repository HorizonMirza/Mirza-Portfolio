import { FilterTabs } from '@/components/admin/filter-tabs'

// Tiap modul situs publik punya satu menu; teks halamannya dan datanya (profil, skill, pengalaman,
// project) dipisah sebagai tab di dalam modul itu, bukan menu kedua di sidebar.
const TABS = {
  home: [
    { label: 'Teks dan foto hero', href: '/admin/pages/home' },
    { label: 'Skill', href: '/admin/skills' },
  ],
  about: [
    { label: 'Teks halaman', href: '/admin/pages/about' },
    { label: 'Profil', href: '/admin/profile' },
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

export function ModuleTabs({ moduleId, current }: { moduleId: TabbedModule; current: string }) {
  return (
    <FilterTabs
      label="Bagian halaman"
      items={TABS[moduleId].map((tab) => ({ ...tab, active: tab.href === current }))}
    />
  )
}
