import { AdminFormSkeleton } from '@/components/admin/page-skeletons'

// Skeleton shimmer selama data halaman diambil dari database (DESIGN.md bagian 111)
export default function Loading() {
  return (
    <AdminFormSkeleton
      tabs={2}
      cards={[
        { fields: 1, tall: 1 },
        { fields: 2, columns: 2 },
        { fields: 4, tall: 1 },
      ]}
    />
  )
}
