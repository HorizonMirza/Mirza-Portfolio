import { Skeleton, SkeletonLines } from '@/components/shared/skeleton'
import { cn } from '@/lib/utils'

// Bentuk skeleton shimmer tiap halaman situs (permintaan pemilik 2026-11-16: skeleton harus sesuai
// layout halaman yang sedang dimuat). Dipakai di dua tempat dengan bentuk yang sama:
// - situs publik: NavigationSkeleton saat pindah halaman;
// - panel admin: panggung pratinjau 1:1 di loading.tsx (components/admin/page-skeletons.tsx).
// Tanpa hook, jadi aman untuk server maupun client component.
export type PageShape =
  | 'home'
  | 'about'
  | 'experience'
  | 'projects'
  | 'project'
  | 'contact'
  | 'text'
  | 'intro'
  | 'skills'
  | 'github'
  | 'navbar'
  | 'footer'

// judul halaman di tengah, huruf besar (Tentang, Pengalaman, Project)
function CenterTitle({ className }: { className?: string }) {
  return <Skeleton className={cn('mx-auto h-9 w-[min(70%,18rem)] md:h-11', className)} />
}

// bingkai jendela browser untuk tangkapan layar project
function BrowserFrame({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex w-full flex-col overflow-hidden rounded-lg border border-border',
        className,
      )}
    >
      <span className="flex items-center gap-1.5 border-b border-border px-3 py-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="size-2 rounded-full" />
        ))}
        <Skeleton className="ml-2 h-3 w-[min(50%,14rem)]" />
      </span>
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
    </span>
  )
}

function Home() {
  // hero setinggi layar: nama besar dua baris di belakang potret, peran di pojok kiri dan kanan bawah
  return (
    <span className="relative block h-[calc(100svh-7rem)] min-h-96 w-full">
      <Skeleton className="absolute top-[6%] left-1/2 h-[17%] w-[78%] -translate-x-1/2" />
      <Skeleton className="absolute top-[26%] left-1/2 h-[17%] w-full -translate-x-1/2" />
      <Skeleton className="absolute bottom-0 left-1/2 h-[90%] w-[min(60%,30rem)] -translate-x-1/2 rounded-t-[45%] rounded-b-none bg-[color-mix(in_srgb,var(--text)_13%,var(--bg))]" />
      <Skeleton className="absolute bottom-6 left-0 h-3 w-[min(28%,10rem)]" />
      <Skeleton className="absolute right-0 bottom-6 h-3 w-[min(28%,10rem)]" />
    </span>
  )
}

function About() {
  // judul di tengah lalu satu kartu besar: pita atas (foto kartu ID menjorok + nama besar dan peran),
  // di bawahnya Tentang saya (kolom sempit) dan Pendidikan (kolom lebar)
  return (
    <span className="flex w-full flex-col gap-8 pt-4">
      <CenterTitle />
      <span className="flex flex-col overflow-hidden rounded-xl border border-border">
        <span className="flex items-center gap-5 bg-surface px-4 py-5 md:gap-10 md:px-14 md:py-6">
          <Skeleton className="aspect-[4/5] w-24 shrink-0 rounded-2xl md:w-60" />
          <span className="flex min-w-0 flex-1 flex-col gap-3">
            <Skeleton className="h-8 w-[95%] md:h-16" />
            <Skeleton className="h-3 w-[min(80%,24rem)] md:h-4" />
          </span>
        </span>
        <span className="grid gap-8 px-4 py-6 md:grid-cols-[2fr_3fr] md:gap-10 md:px-11 md:py-8">
          <span className="flex flex-col gap-3">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-px w-full rounded-none" />
            <SkeletonLines lines={7} />
          </span>
          <span className="flex flex-col gap-3">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-px w-full rounded-none" />
            {[0, 1].map((i) => (
              <span
                key={i}
                className="flex items-center gap-5 rounded-2xl border border-border p-5 md:p-6"
              >
                <Skeleton className="size-14 shrink-0 rounded-xl" />
                <span className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-24" />
                </span>
              </span>
            ))}
          </span>
        </span>
      </span>
    </span>
  )
}

function Experience() {
  // garis waktu di tengah; isi berselang kiri dan kanan, tahun di sisi seberang
  return (
    <span className="mx-auto flex w-full max-w-4xl flex-col gap-10 pt-4">
      <CenterTitle />
      <span className="relative flex flex-col gap-12">
        <span aria-hidden="true" className="absolute inset-y-0 left-4 w-px bg-border md:left-1/2" />
        {[0, 1, 2].map((i) => {
          const flip = i % 2 === 1
          const text = (
            <span className={cn('flex flex-col gap-2', flip ? 'md:items-start' : 'md:items-end')}>
              <Skeleton className="h-4 w-[min(100%,18rem)]" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-28" />
              <SkeletonLines lines={3} className="w-full max-w-sm" />
            </span>
          )
          const year = <Skeleton className={cn('h-7 w-20', flip ? 'md:justify-self-end' : '')} />
          return (
            <span
              key={i}
              className="grid grid-cols-[2rem_1fr] items-start gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-6"
            >
              <span className="hidden md:block">{flip ? year : text}</span>
              <Skeleton className="size-8 rounded-md md:size-9" />
              <span className="md:hidden">{text}</span>
              <span className="hidden md:block">{flip ? text : year}</span>
            </span>
          )
        })}
      </span>
    </span>
  )
}

function Projects() {
  // baris zig-zag: tangkapan layar dalam bingkai browser dan teks project, nomor besar
  return (
    <span className="mx-auto flex w-full max-w-5xl flex-col gap-12 pt-4">
      <CenterTitle />
      {[0, 1].map((i) => (
        <span key={i} className="grid items-center gap-6 md:grid-cols-2 md:gap-10">
          <BrowserFrame className={i % 2 ? 'md:order-2' : ''} />
          <span className="flex flex-col gap-3">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-5 w-[85%]" />
            <SkeletonLines lines={3} />
            <Skeleton className="h-12 w-16 self-end" />
          </span>
        </span>
      ))}
    </span>
  )
}

function Project() {
  return (
    <span className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 pt-4">
      <Skeleton className="h-3.5 w-32 self-start" />
      <Skeleton className="h-5 w-28 rounded-full" />
      <Skeleton className="h-8 w-[min(90%,34rem)]" />
      <span className="flex gap-3">
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </span>
      <BrowserFrame className="mt-4" />
    </span>
  )
}

function Contact() {
  // kartu ID bertali di kiri, judul dan form di kanan
  return (
    <span className="grid w-full gap-10 pt-4 lg:grid-cols-[16rem_1fr] lg:gap-14">
      <span className="hidden flex-col items-center lg:flex">
        <Skeleton className="h-24 w-3 rounded-none" />
        <Skeleton className="h-72 w-52 rounded-xl" />
      </span>
      <span className="flex flex-col gap-5">
        <Skeleton className="h-9 w-[min(100%,20rem)] md:h-11" />
        <Skeleton className="h-3.5 w-[min(100%,26rem)]" />
        <span className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <span key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-11 w-full rounded-md" />
            </span>
          ))}
        </span>
        <span className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-11 w-full rounded-md" />
        </span>
        <span className="flex flex-col gap-2">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-36 w-full rounded-md" />
        </span>
        <Skeleton className="h-10 w-32 rounded-full" />
      </span>
    </span>
  )
}

function Text() {
  // halaman teks (Kebijakan privasi): label kecil, judul, pembuka, lalu bagian-bagian
  return (
    <span className="flex max-w-3xl flex-col gap-6 pt-6 md:pt-10">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="h-10 w-[min(100%,24rem)]" />
      <SkeletonLines lines={2} className="max-w-xl" />
      {[0, 1, 2].map((i) => (
        <span key={i} className="flex flex-col gap-3">
          <Skeleton className="h-4 w-44" />
          <SkeletonLines lines={3} />
        </span>
      ))}
    </span>
  )
}

function Intro() {
  // kartu pembuka di tengah panggung berpola kotak commit
  return (
    <span className="relative grid h-[min(62vh,34rem)] w-full place-items-center">
      <span className="flex w-[min(100%,24rem)] flex-col gap-3 rounded-lg border border-border bg-bg p-5">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-6 w-48" />
        <SkeletonLines lines={3} />
        <Skeleton className="mt-2 h-9 w-full rounded-md" />
      </span>
    </span>
  )
}

function Skills() {
  return (
    <span className="flex w-full flex-col items-center gap-6 py-6">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="aspect-square w-[min(80%,22rem)] rounded-full" />
      <Skeleton className="h-6 w-24 rounded-full" />
    </span>
  )
}

function Github() {
  return (
    <span className="flex w-full flex-col gap-5 py-4">
      <Skeleton className="mx-auto h-6 w-32" />
      <Skeleton className="h-3.5 w-56" />
      <Skeleton className="h-40 w-full rounded-md" />
      <span className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <span key={i} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-12" />
          </span>
        ))}
      </span>
    </span>
  )
}

function Navbar() {
  // bilah navigasi situs: foto bulat, menu di tengah, bahasa dan tema di kanan
  return (
    <span className="flex w-full items-center gap-3 rounded-full border border-border px-3 py-2">
      <Skeleton className="size-7 rounded-full" />
      <span className="mx-auto flex gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-3.5 w-14" />
        ))}
      </span>
      <Skeleton className="size-7 rounded-full" />
      <Skeleton className="size-7 rounded-full" />
    </span>
  )
}

function Footer() {
  // judul kecil lalu kartu kontak tiga kolom dua baris
  return (
    <span className="flex w-full flex-col gap-4 py-2">
      <Skeleton className="h-4 w-28" />
      <span className="grid gap-3 md:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="flex flex-col gap-2 rounded-md border border-border p-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-full rounded-md" />
          </span>
        ))}
      </span>
      <Skeleton className="h-3 w-40" />
    </span>
  )
}

export function PageShapeSkeleton({ shape }: { shape: PageShape }) {
  switch (shape) {
    case 'home':
      return <Home />
    case 'about':
      return <About />
    case 'experience':
      return <Experience />
    case 'projects':
      return <Projects />
    case 'project':
      return <Project />
    case 'contact':
      return <Contact />
    case 'intro':
      return <Intro />
    case 'skills':
      return <Skills />
    case 'github':
      return <Github />
    case 'navbar':
      return <Navbar />
    case 'footer':
      return <Footer />
    default:
      return <Text />
  }
}
