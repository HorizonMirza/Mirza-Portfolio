import { getTranslations } from 'next-intl/server'

import { StatusPage } from '@/components/ui/status-page'

// Pengganti seluruh isi situs publik saat Mode perawatan dinyalakan di Admin → Pengaturan (DESIGN.md
// bagian 119), tampil sebagai halaman status 503 (revisi pemilik 2026-11-16). Panel admin tidak
// terpengaruh. Halaman diberi noindex lewat metadata layout.
export async function MaintenanceNotice({ name }: { name: string }) {
  const t = await getTranslations('Maintenance')
  return (
    <main id="main">
      <StatusPage code={503} eyebrow={name} title={t('title')} body={t('body')} />
    </main>
  )
}
