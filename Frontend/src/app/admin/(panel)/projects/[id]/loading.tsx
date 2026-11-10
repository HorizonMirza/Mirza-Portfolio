import { AdminFormSkeleton } from '@/components/admin/page-skeletons'

// Skeleton shimmer selama data halaman diambil dari database (DESIGN.md bagian 111)
export default function Loading() {
  return (
    <AdminFormSkeleton
      cards={[
        { fields: 6, columns: 2 },
        { fields: 4, tall: 2 },
        { fields: 3, columns: 2 },
      ]}
    />
  )
}
