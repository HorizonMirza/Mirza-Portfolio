'use client'

import Image, { type StaticImageData } from 'next/image'

import { Link, usePathname } from '@/i18n/navigation'
import { scrollToTop } from '@/lib/scroll'
import { playNavSound } from '@/lib/ui-sounds'
import { cn } from '@/lib/utils'

// Foto profil di topbar: kembali ke beranda dengan suara dan arah geser yang sama seperti menu
// Beranda (menu paling kiri, jadi selalu mundur). Di beranda sendiri: gulir ke bagian paling atas.
export function HomeAvatarLink({
  name,
  photo,
  className,
}: {
  name: string
  photo: string | StaticImageData
  className?: string
}) {
  const pathname = usePathname()
  const atHome = pathname === '/'
  return (
    <Link
      href="/"
      aria-current={atHome ? 'page' : undefined}
      transitionTypes={['nav-back']}
      onClick={(event) => {
        playNavSound()
        if (!atHome) return
        event.preventDefault()
        scrollToTop()
      }}
      className={cn(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-full p-1',
        className,
      )}
    >
      <Image
        src={photo}
        alt=""
        width={72}
        height={72}
        sizes="36px"
        className="size-full rounded-full object-cover"
      />
      <span className="sr-only">{name}</span>
    </Link>
  )
}
