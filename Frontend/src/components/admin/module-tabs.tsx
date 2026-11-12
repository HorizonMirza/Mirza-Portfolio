import { FilterTabs } from '@/components/admin/filter-tabs'
import { getAdminT } from '@/lib/admin-lang-server'

// Tiap modul situs publik punya satu menu; teks halamannya dan datanya (profil, skill, pengalaman,
// project) dipisah sebagai tab di dalam modul itu, bukan menu kedua di sidebar.
const TABS = {
  // Home: tab selebar panel, urutan pilihan pemilik (2026-11-11, DESIGN.md bagian 129); tab Foto
  // beranda dihapus 2026-11-12 (foto utama diganti dari tab Peran, foto profil dari Akun)
  home: [
    { label: 'Kartu pembuka', href: '/admin/pages/intro' },
    { label: 'Peran beranda', href: '/admin/roles' },
    { label: 'Skill teknis', href: '/admin/skills' },
  ],
  // tab Teks halaman About dihapus (revisi pemilik 2026-11-12, DESIGN.md bagian 142)
  about: [
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
      // tab selebar panel di semua modul (revisi pemilik 2026-11-12, DESIGN.md bagian 135)
      stretch
      items={TABS[moduleId].map((tab) => ({
        ...tab,
        label: t(tab.label),
        active: tab.href === current,
      }))}
    />
  )
}
