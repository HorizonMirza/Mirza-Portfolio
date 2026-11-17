import type { ReactNode } from 'react'

import { AdminText } from '@/components/admin/admin-lang'
import { type PageShape, PageShapeSkeleton } from '@/components/shared/page-shapes'
import { Skeleton, SkeletonLines, SkeletonPage } from '@/components/shared/skeleton'
import { Card } from '@/components/ui/card'

// Skeleton panel admin untuk loading.tsx (DESIGN.md bagian 111). Halaman admin selalu mengambil data
// langsung dari database, jadi skeleton ini tampil setiap pindah menu sampai datanya siap. Sidebar
// dan top bar tetap tampil karena ada di layout; bentuk blok meniru tab modul, daftar, dan tata letak
// tiap halaman.

function Loading({ children }: { children: ReactNode }) {
  return <SkeletonPage label={<AdminText text="Memuat Halaman…" />}>{children}</SkeletonPage>
}

// tab modul: satu baris tombol sama lebar seperti tab Home (bagian 129), turun baris seperti
// FilterTabs, tidak digeser menyamping
function TabsSkeleton({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <div className="admin-bleed mb-6 flex flex-wrap gap-2 py-1">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-11 flex-[1_1_min(8rem,calc(50%-0.25rem))] rounded-md" />
      ))}
    </div>
  )
}

export function AdminDashboardSkeleton() {
  return (
    <Loading>
      {/* meniru desain 01 "Ringkas" (DESIGN.md bagian 165 dan 166), selebar panel isi */}
      <div className="admin-bleed flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-4">
              <Skeleton className="h-3.5 w-28 max-w-full" />
              <Skeleton className="mt-3 h-8 w-20" />
              <Skeleton className="mt-3 h-8 w-full" />
            </div>
          ))}
        </div>
        <Card>
          <span className="flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-9 w-52 rounded-md" />
          </span>
          <Skeleton className="mt-4 h-72 w-full rounded-xl" />
        </Card>
        <div className="grid gap-3 lg:grid-cols-2">
          <Card>
            <Skeleton className="h-6 w-40" />
            <ul className="mt-2 divide-y divide-border">
              {Array.from({ length: 5 }, (_, i) => (
                <li key={i} className="flex items-center gap-3 py-3">
                  <span className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-[min(60%,16rem)]" />
                    <Skeleton className="h-3 w-32" />
                  </span>
                  <Skeleton className="h-5 w-12" />
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-3 h-72 w-full rounded-md" />
          </Card>
        </div>
      </div>
    </Loading>
  )
}

// Pesan: tab Baru/Dibaca/Arsip selebar panel, lalu baris pesan (status, nama, cuplikan, waktu, hapus)
export function AdminListSkeleton() {
  return (
    <Loading>
      <TabsSkeleton count={3} />
      <ul className="admin-bleed divide-y divide-border">
        {Array.from({ length: 10 }, (_, i) => (
          <li key={i} className="flex items-center gap-4 px-2 py-3">
            <Skeleton className="h-5 w-11 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-24 shrink-0 md:w-32" />
            <Skeleton className="hidden h-3.5 flex-1 md:block" />
            <Skeleton className="ml-auto h-3 w-28 shrink-0 md:ml-0" />
            <Skeleton className="size-5 shrink-0 rounded-md" />
          </li>
        ))}
      </ul>
    </Loading>
  )
}

// isi satu pesan: tautan kembali, keterangan waktu dan bahasa, kartu pengirim + isi, lalu tombol
export function AdminMessageSkeleton() {
  return (
    <Loading>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3.5 w-[min(100%,20rem)]" />
        <Card className="flex flex-col gap-4">
          {[0, 1].map((i) => (
            <span key={i} className="flex items-center gap-4">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3.5 w-48" />
            </span>
          ))}
          <SkeletonLines lines={4} className="mt-2" />
          <span className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-9 w-36 rounded-full" />
            <span className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-9 w-24 rounded-full" />
              ))}
            </span>
          </span>
        </Card>
      </div>
    </Loading>
  )
}

// Pengaturan: kelompok Suara (geseran volume, persen, tombol coba per baris), lalu kelompok Tampilan,
// Pesan, Privasi, dan Lanjutan dengan saklar atau pilihan di kanan
export function AdminSettingsSkeleton() {
  const row = (control: ReactNode, i: number) => (
    <span key={i} className="flex items-center justify-between gap-6 px-5 py-4">
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-[min(60%,14rem)]" />
        <Skeleton className="h-3 w-[min(90%,26rem)]" />
      </span>
      {control}
    </span>
  )
  const slider = (
    <span className="flex items-center gap-3">
      <Skeleton className="hidden h-1.5 w-36 rounded-full sm:block" />
      <Skeleton className="h-3.5 w-9" />
      <Skeleton className="size-8 rounded-full" />
    </span>
  )
  return (
    <Loading>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="ml-1 h-3.5 w-16" />
          <Card className="divide-y divide-border p-0">
            {Array.from({ length: 9 }, (_, i) => row(slider, i))}
          </Card>
        </div>
        {[6, 2, 2, 2].map((rows, g) => (
          <div key={g} className="flex flex-col gap-2">
            <Skeleton className="ml-1 h-3.5 w-20" />
            <Card className="divide-y divide-border p-0">
              {Array.from({ length: rows }, (_, i) =>
                row(
                  i % 3 === 0 ? (
                    <Skeleton className="h-9 w-36 rounded-md" />
                  ) : (
                    <Skeleton className="h-7 w-12 rounded-full" />
                  ),
                  i,
                ),
              )}
            </Card>
          </div>
        ))}
      </div>
    </Loading>
  )
}

// Akun (desain 1): foto besar di tengah, nama, lalu kelompok daftar
export function AdminAccountSkeleton() {
  return (
    <Loading>
      <div className="mx-auto flex w-full max-w-xl flex-col gap-7">
        <span className="flex flex-col items-center gap-3 pt-2">
          <Skeleton className="size-32 rounded-full" />
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-5 w-24" />
        </span>
        {/* Info (nama, email, admin sejak), Keamanan (ganti password), Perangkat tertaut */}
        {[3, 1, 3].map((rows, g) => (
          <span key={g} className="flex flex-col gap-2">
            <Skeleton className="ml-1 h-3.5 w-24" />
            <span className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
              {Array.from({ length: rows }, (_, i) => (
                <span key={i} className="flex min-h-16 items-center gap-3.5 px-4 py-2.5">
                  <Skeleton className="size-9 rounded-[10px]" />
                  <span className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-4 w-[min(60%,14rem)]" />
                    <Skeleton className="h-3 w-[min(80%,18rem)]" />
                  </span>
                </span>
              ))}
            </span>
          </span>
        ))}
      </div>
    </Loading>
  )
}

// pratinjau halaman status: deretan tab kode, satu baris keterangan, dan panggung pratinjau
export function AdminStatusSkeleton() {
  return (
    <Loading>
      <div className="flex flex-col">
        <div className="admin-bleed mb-6 flex gap-2 py-1">
          {Array.from({ length: 11 }, (_, i) => (
            <Skeleton key={i} className="h-11 flex-1 rounded-md" />
          ))}
        </div>
        <Skeleton className="mb-3 h-4 w-72 max-w-full" />
        <Skeleton className="admin-bleed h-[28rem] rounded-md" />
      </div>
    </Loading>
  )
}

// Halaman pratinjau 1:1 (permintaan pemilik 2026-11-16: skeleton sesuai layout halaman): tab Beranda
// bila ada, panggung selebar panel berisi bentuk halaman situs yang sama dengan skeleton situs publik,
// lalu baris ID/EN dan tombol Simpan bila halaman aslinya memilikinya.
export function AdminStageSkeleton({
  shape,
  tabs = 0,
  lang = false,
  save = true,
  footer,
}: {
  shape: PageShape
  // jumlah tab modul Beranda (Kartu pembuka, Peran beranda, Skill teknis, GitHub)
  tabs?: number
  // baris pilihan bahasa ID/EN di atas Simpan
  lang?: boolean
  save?: boolean
  // isi tambahan di bawah panggung (mis. pilihan warna GitHub)
  footer?: ReactNode
}) {
  return (
    <Loading>
      <TabsSkeleton count={tabs} />
      <div className="flex flex-col gap-3">
        <div className="admin-bleed overflow-hidden rounded-md border border-border bg-bg/40 px-4 py-6 md:px-8">
          <PageShapeSkeleton shape={shape} />
        </div>
        {footer}
        {lang ? (
          <div className="admin-bleed grid grid-cols-2 gap-2">
            <Skeleton className="h-11 rounded-md" />
            <Skeleton className="h-11 rounded-md opacity-60" />
          </div>
        ) : null}
        {save ? <Skeleton className="admin-bleed h-11 rounded-md" /> : null}
      </div>
    </Loading>
  )
}

// GitHub: panggung grafik kontribusi, lalu lima pilihan warna
export function AdminGithubSkeleton() {
  return (
    <AdminStageSkeleton
      shape="github"
      tabs={4}
      footer={
        <div className="admin-bleed grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12 rounded-md" />
          ))}
        </div>
      }
    />
  )
}
