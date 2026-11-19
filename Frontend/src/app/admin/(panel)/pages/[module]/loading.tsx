'use client'

// Skeleton shimmer sesuai modul yang dibuka. loading.tsx tidak menerima
// params, jadi modulnya dibaca dari alamat: Kartu pembuka (tab Beranda), Kontak, Navigasi, Kaki Halaman.

import { usePathname } from 'next/navigation'

import { AdminStageSkeleton } from '@/components/admin/page-skeletons'

export default function Loading() {
  const id = usePathname().split('/').pop()
  if (id === 'intro') return <AdminStageSkeleton shape="intro" tabs={4} lang />
  if (id === 'contact') return <AdminStageSkeleton shape="contact" lang />
  if (id === 'navbar') return <AdminStageSkeleton shape="navbar" lang />
  return <AdminStageSkeleton shape="footer" />
}
