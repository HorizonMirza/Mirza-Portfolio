import type { ReactNode } from 'react'

import { Skeleton, SkeletonLines, SkeletonPage } from '@/components/shared/skeleton'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Skeleton panel admin untuk loading.tsx (DESIGN.md bagian 111). Halaman admin selalu mengambil data
// langsung dari database, jadi skeleton ini tampil setiap pindah menu sampai datanya siap. Sidebar
// dan top bar tetap tampil karena ada di layout; bentuk blok meniru PageHeader, tab modul, tabel
// data, daftar, dan kartu form.

function Loading({ children }: { children: ReactNode }) {
  return <SkeletonPage label="Memuat halaman…">{children}</SkeletonPage>
}

function HeaderSkeleton({ action = false }: { action?: boolean }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <span className="flex min-w-0 flex-1 flex-col gap-3">
        <Skeleton className="h-10 w-48 sm:h-14 sm:w-64" />
        <Skeleton className="h-4 w-[min(100%,32rem)]" />
      </span>
      {action ? <Skeleton className="h-11 w-28 rounded-full" /> : null}
    </div>
  )
}

// tab modul (ModuleTabs) dan tab filter (FilterTabs) memakai kapsul yang sama
function TabsSkeleton({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <div className="mb-4 flex flex-wrap gap-1 rounded-3xl border border-border bg-surface-2 p-1 sm:inline-flex">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-9 w-24 rounded-full" />
      ))}
    </div>
  )
}

function FieldSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <span className="flex flex-col gap-2">
      <Skeleton className="h-3.5 w-28" />
      <Skeleton className={cn('w-full rounded-xl', tall ? 'h-28' : 'h-11')} />
    </span>
  )
}

export function AdminDashboardSkeleton() {
  return (
    <Loading>
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-4">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="mt-3 h-8 w-16" />
            </div>
          ))}
        </div>
        <Card>
          <Skeleton className="h-6 w-72 max-w-full" />
          <Skeleton className="mt-2 h-3.5 w-56" />
          <Skeleton className="mt-4 h-48 w-full rounded-xl" />
        </Card>
        <Card>
          <span className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </span>
          <ul className="mt-3 divide-y divide-border">
            {Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="flex flex-col gap-2 py-3">
                <Skeleton className="h-4 w-[min(70%,22rem)]" />
                <Skeleton className="h-3 w-48" />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Loading>
  )
}

// halaman berisi tabel data (Project, Experience, Pendidikan): pencarian, tabel di layar lebar,
// kartu di layar sempit
export function AdminTableSkeleton({ tabs = 0, columns = 5 }: { tabs?: number; columns?: number }) {
  const rows = 6
  return (
    <Loading>
      <HeaderSkeleton action />
      <TabsSkeleton count={tabs} />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-11 w-full max-w-sm rounded-xl" />
        <ul className="grid gap-3 md:grid-cols-2 xl:hidden">
          {Array.from({ length: 4 }, (_, i) => (
            <li
              key={i}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4"
            >
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <span className="flex gap-2">
                <Skeleton className="h-9 w-20 rounded-full" />
                <Skeleton className="h-9 w-20 rounded-full" />
              </span>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-hidden rounded-2xl border border-border xl:block">
          <div className="flex gap-6 bg-surface-2 px-4 py-3">
            {Array.from({ length: columns }, (_, i) => (
              <Skeleton key={i} className={cn('h-3.5', i === 0 ? 'w-40' : 'w-20')} />
            ))}
          </div>
          {Array.from({ length: rows }, (_, i) => (
            <div
              key={i}
              className="flex items-center gap-6 border-t border-border bg-surface px-4 py-4"
            >
              {Array.from({ length: columns }, (_, k) => (
                <Skeleton
                  key={k}
                  className={cn(
                    'h-3.5',
                    k === 0 ? 'w-56' : k === columns - 1 ? 'ml-auto w-32' : 'w-20',
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </Loading>
  )
}

// halaman berisi daftar dengan tab filter dan nomor halaman (Pesan, Log audit)
export function AdminListSkeleton() {
  return (
    <Loading>
      <HeaderSkeleton />
      <TabsSkeleton count={3} />
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i} className="flex items-center justify-between gap-4 p-4">
            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-[min(70%,24rem)]" />
              <Skeleton className="h-3 w-[min(50%,16rem)]" />
            </span>
            <Skeleton className="h-6 w-16 rounded-full" />
          </li>
        ))}
      </ul>
      <span className="mt-4 flex justify-end gap-2">
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </span>
    </Loading>
  )
}

type FormCard = { fields: number; columns?: 1 | 2; tall?: number }

// halaman form (Profil, Pengaturan, Akun, teks halaman, tambah/ubah data)
export function AdminFormSkeleton({
  tabs = 0,
  cards = [
    { fields: 4, columns: 2 },
    { fields: 3, tall: 1 },
  ],
  narrow = false,
}: {
  tabs?: number
  cards?: FormCard[]
  narrow?: boolean
}) {
  return (
    <Loading>
      <HeaderSkeleton />
      <TabsSkeleton count={tabs} />
      <div className={cn('flex flex-col gap-6', narrow && 'max-w-lg')}>
        {cards.map((card, i) => (
          <Card key={i} className="flex flex-col gap-5">
            <Skeleton className="h-6 w-44" />
            <div className={cn('grid gap-5', card.columns === 2 && 'md:grid-cols-2')}>
              {Array.from({ length: card.fields }, (_, k) => (
                <FieldSkeleton key={k} tall={k >= card.fields - (card.tall ?? 0)} />
              ))}
            </div>
          </Card>
        ))}
        <Skeleton className="h-11 w-28 self-end rounded-full" />
      </div>
    </Loading>
  )
}

// isi satu pesan
export function AdminMessageSkeleton() {
  return (
    <Loading>
      <HeaderSkeleton />
      <Card className="flex flex-col gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <span key={i} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </span>
        ))}
        <SkeletonLines lines={6} className="mt-2" />
      </Card>
    </Loading>
  )
}
