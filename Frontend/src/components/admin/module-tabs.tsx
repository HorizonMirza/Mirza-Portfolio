// Tab di dalam modul admin (mis. Home: Kartu Pembuka, Peran, Skill teknis, GitHub).

import { FilterTabs } from '@/components/admin/filter-tabs'

import { getAdminT } from '@backend/lib/admin-lang-server'

// Tiap modul situs publik punya satu menu; teks halamannya dan datanya (profil, skill, pengalaman,
// project) dipisah sebagai tab di dalam modul itu, bukan menu kedua di sidebar.
const TABS = {
  // Home: tab selebar panel. About dan Experience tanpa tab (foto profil diganti dari Akun).
  home: [
    { label: 'Kartu Pembuka', href: '/admin/pages/intro' },
    { label: 'Peran Beranda', href: '/admin/roles' },
    { label: 'Skill Teknis', href: '/admin/skills' },
    { label: 'GitHub', href: '/admin/github' },
  ],
} as const

type TabbedModule = keyof typeof TABS

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
      label={t('Bagian Halaman')}
      // tab selebar panel di semua modul
      stretch
      items={TABS[moduleId].map((tab) => ({
        ...tab,
        label: t(tab.label),
        active: tab.href === current,
      }))}
    />
  )
}
