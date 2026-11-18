import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { FilterTabs } from '@/components/admin/filter-tabs'
import { StatusPage, STATUS_CODES, type StatusCode } from '@/components/ui/status-page'
import { getAdminT } from '@backend/lib/admin-lang-server'
import { requireSuperAdminPage } from '@backend/lib/auth-guard'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Halaman Status') }
}

// Kode yang bukan error atau tidak dikirim aplikasi (502 dari server Vercel) hanya bisa dilihat di sini;
// kode lain juga tampil di tempat aslinya. Teks 404, 500, dan 503 memakai namespace yang sudah ada.
const WHERE: Record<StatusCode, string> = {
  200: 'Hanya pratinjau: 200 berarti halaman berhasil dibuka.',
  301: 'Hanya pratinjau: 301 langsung memindahkan ke alamat baru.',
  400: 'Hanya pratinjau: permintaan salah ditolak sebelum halaman dibuat.',
  401: 'Admin: sesi tidak sah atau sudah berakhir.',
  403: 'Admin: masuk dengan akun yang bukan Super Admin.',
  404: 'Situs: alamat yang tidak ada.',
  418: 'Situs: easter egg di /id/418 dan /en/418.',
  429: 'Hanya pratinjau: batas permintaan tampil sebagai pesan di form.',
  500: 'Situs dan admin: halaman gagal dimuat.',
  502: 'Hanya pratinjau: 502 dikirim server Vercel, bukan aplikasi.',
  503: 'Situs: Mode perawatan di Pengaturan.',
}

// Pratinjau halaman status (permintaan pemilik 2026-11-16, DESIGN.md bagian 168): satu kode per tab,
// bahasa mengikuti bahasa admin; tombol di pratinjau hanya contoh (tidak bisa ditekan).
export default async function StatusPreviewPage({ searchParams }: PageProps<'/admin/status'>) {
  await requireSuperAdminPage()
  const raw = Number((await searchParams).code)
  const code: StatusCode = (STATUS_CODES as readonly number[]).includes(raw)
    ? (raw as StatusCode)
    : 404
  const { lang, t } = await getAdminT()
  const [status, notFound, error, maintenance] = await Promise.all([
    getTranslations({ locale: lang, namespace: 'Status' }),
    getTranslations({ locale: lang, namespace: 'NotFound' }),
    getTranslations({ locale: lang, namespace: 'Error' }),
    getTranslations({ locale: lang, namespace: 'Maintenance' }),
  ])
  const text =
    code === 404
      ? { title: notFound('title'), body: notFound('body'), action: notFound('home') }
      : code === 500
        ? { title: error('title'), body: error('body'), action: error('retry') }
        : code === 503
          ? { title: maintenance('title'), body: maintenance('body'), action: null }
          : {
              title: status(`${code}.title`),
              body: status(`${code}.body`),
              action: code === 401 ? status('login') : status('home'),
            }

  return (
    <div className="flex flex-col">
      <h1 className="sr-only">{t('Halaman Status')}</h1>
      <FilterTabs
        stretch
        label={t('Kode Status')}
        items={STATUS_CODES.map((c) => ({
          href: `/admin/status?code=${c}`,
          label: String(c),
          active: c === code,
        }))}
      />
      <section
        aria-label={t('Pratinjau')}
        className="admin-bleed relative overflow-hidden rounded-md border border-border bg-bg"
      >
        <StatusPage
          code={code}
          fullHeight={false}
          title={text.title}
          body={text.body}
          action={
            text.action ? (
              <span
                aria-hidden="true"
                className="inline-flex min-h-11 items-center rounded-full bg-text px-6 font-medium text-bg"
              >
                {text.action}
              </span>
            ) : null
          }
        />
        {/* keterangan tempat kode ini muncul, di pojok kiri bawah pratinjau (revisi pemilik
            2026-11-17); boleh turun baris di layar sempit */}
        <p className="absolute right-4 bottom-3 left-4 text-xs text-muted">{t(WHERE[code])}</p>
      </section>
    </div>
  )
}
