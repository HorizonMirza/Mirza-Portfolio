'use client'

import { usePathname } from 'next/navigation'

import { AdminStageSkeleton } from '@/components/admin/page-skeletons'

// Skeleton shimmer sesuai modul yang dibuka (DESIGN.md bagian 111 dan 169). loading.tsx tidak menerima
// params, jadi modulnya dibaca dari alamat: Kartu pembuka (tab Beranda), Kontak, Navigasi, Kaki Halaman.
export default function Loading() {
  const id = usePathname().split('/').pop()
  if (id === 'intro') return <AdminStageSkeleton shape="intro" tabs={4} lang />
  if (id === 'contact') return <AdminStageSkeleton shape="contact" lang />
  if (id === 'navbar') return <AdminStageSkeleton shape="navbar" lang />
  return <AdminStageSkeleton shape="footer" />
}
