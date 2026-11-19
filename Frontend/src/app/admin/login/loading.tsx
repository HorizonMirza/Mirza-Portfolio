// Skeleton shimmer halaman masuk admin: latar hitam dan kartu form yang sama
// bentuknya dengan LoginForm, tampil selama sesi diperiksa di server.

import { AdminText } from '@/components/admin/admin-lang'
import { Skeleton, SkeletonPage } from '@/components/shared/skeleton'

export default function Loading() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-black text-white [color-scheme:dark]">
      <SkeletonPage
        label={<AdminText text="Memuat Halaman…" />}
        className="relative z-10 flex min-h-dvh w-full flex-col items-center justify-center px-4 py-12"
      >
        <div className="flex w-full max-w-sm flex-col items-center gap-6">
          <Skeleton className="size-14 rounded-full" />
          <Skeleton className="h-7 w-40" />
          <div className="flex w-full flex-col gap-4">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full rounded-full" />
          </div>
        </div>
      </SkeletonPage>
    </div>
  )
}
