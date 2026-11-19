// Pengganti seluruh isi situs publik saat Mode perawatan dinyalakan di Admin → Pengaturan (DESIGN.md
// bagian 5.8 dan 6), tampil sebagai halaman status 503. Panel admin tidak
// terpengaruh. Halaman diberi noindex lewat metadata layout.

import { getTranslations } from 'next-intl/server'

import { StatusPage } from '@/components/ui/status-page'

export async function MaintenanceNotice({ name }: { name: string }) {
  const t = await getTranslations('Maintenance')
  return (
    <main id="main">
      <StatusPage code={503} eyebrow={name} title={t('title')} body={t('body')} />
    </main>
  )
}
