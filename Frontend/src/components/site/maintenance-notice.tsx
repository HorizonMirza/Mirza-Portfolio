import { getTranslations } from 'next-intl/server'

// Pengganti seluruh isi situs publik saat Mode perawatan dinyalakan di Admin → Pengaturan (DESIGN.md
// bagian 119). Panel admin tidak terpengaruh. Halaman diberi noindex lewat metadata layout.
export async function MaintenanceNotice({ name }: { name: string }) {
  const t = await getTranslations('Maintenance')
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-6 py-16">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <p className="text-sm tracking-wide text-muted">{name}</p>
        <h1 className="text-h2 font-bold">{t('title')}</h1>
        <p className="text-muted">{t('body')}</p>
      </div>
    </main>
  )
}
