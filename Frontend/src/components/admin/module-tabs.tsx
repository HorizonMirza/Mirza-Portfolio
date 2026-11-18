import { FilterTabs } from '@/components/admin/filter-tabs'
import { getAdminT } from '@backend/lib/admin-lang-server'

// Tiap modul situs publik punya satu menu; teks halamannya dan datanya (profil, skill, pengalaman,
// project) dipisah sebagai tab di dalam modul itu, bukan menu kedua di sidebar.
const TABS = {
  // Home: tab selebar panel, urutan pilihan pemilik (2026-11-11); tab Foto
  // beranda dihapus 2026-11-12 (foto profil diganti dari Akun). About dan Experience tanpa tab sejak
  // 2026-11-13
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
      // tab selebar panel di semua modul (revisi pemilik 2026-11-12)
      stretch
      items={TABS[moduleId].map((tab) => ({
        ...tab,
        label: t(tab.label),
        active: tab.href === current,
      }))}
    />
  )
}
