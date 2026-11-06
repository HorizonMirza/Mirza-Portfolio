// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { PhotoLightbox } from '@/features/experience/components/public/photo-lightbox'

// next/image diganti <img> biasa agar tidak butuh konfigurasi gambar Next di jsdom
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: (props: Record<string, unknown>) => <img {...(props as object)} />,
}))

// jsdom belum punya showModal/close untuk <dialog> dan matchMedia: cukup tiru perilaku browser
beforeAll(() => {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
})

afterEach(cleanup)

function setup() {
  render(
    <PhotoLightbox
      src="https://res.cloudinary.com/demo/image/upload/foto.jpg"
      alt="Foto bersama tim"
      width={800}
      height={600}
      caption="PT PGAS Solution"
      detail="Fullstack Developer · Jul 2026 - Sekarang"
      openLabel="Perbesar foto PT PGAS Solution"
      closeLabel="Tutup foto"
    />,
  )
  const dialog = document.querySelector('dialog')!
  return { dialog }
}

describe('PhotoLightbox', () => {
  it('foto membuka dialog berisi foto besar dan keterangan', () => {
    const { dialog } = setup()
    expect(dialog).not.toHaveAttribute('open')
    fireEvent.click(screen.getByRole('button', { name: 'Perbesar foto PT PGAS Solution' }))
    expect(dialog).toHaveAttribute('open')
    expect(dialog).toHaveAccessibleName('PT PGAS Solution')
    expect(dialog.querySelector('figcaption')).toHaveTextContent(
      'PT PGAS SolutionFullstack Developer · Jul 2026 - Sekarang',
    )
    // gambar besar baru diunduh saat dialog terlihat
    expect(dialog.querySelector('img')).toHaveAttribute('loading', 'lazy')
  })

  it('tombol tutup dan klik area gelap menutup dialog, klik foto tidak', () => {
    const { dialog } = setup()
    const open = screen.getByRole('button', { name: 'Perbesar foto PT PGAS Solution' })

    fireEvent.click(open)
    fireEvent.click(screen.getByRole('button', { name: 'Tutup foto', hidden: true }))
    expect(dialog).not.toHaveAttribute('open')

    fireEvent.click(open)
    fireEvent.click(dialog.querySelector('img')!)
    expect(dialog).toHaveAttribute('open')
    fireEvent.click(dialog)
    expect(dialog).not.toHaveAttribute('open')
  })

  it('dengan View Transition foto terbang: nama transisi berpindah dari foto kecil ke foto besar', async () => {
    const names: string[] = []
    const proto = Document.prototype as unknown as {
      startViewTransition?: (update: () => void) => { finished: Promise<void> }
    }
    proto.startViewTransition = function (update) {
      const thumb = document.querySelector<HTMLElement>('button.xp-frame')!
      names.push(`sebelum:${thumb.style.getPropertyValue('view-transition-name')}`)
      update()
      const big = document.querySelector<HTMLElement>('dialog img')!
      names.push(`sesudah:${big.style.getPropertyValue('view-transition-name')}`)
      return { finished: Promise.resolve() }
    }
    try {
      const { dialog } = setup()
      fireEvent.click(screen.getByRole('button', { name: 'Perbesar foto PT PGAS Solution' }))
      await vi.waitFor(() => expect(dialog).toHaveAttribute('open'))
      expect(names).toEqual(['sebelum:xp-photo', 'sesudah:xp-photo'])
      // nama transisi dilepas lagi setelah selesai agar tidak bentrok dengan foto lain
      await vi.waitFor(() =>
        expect(dialog.querySelector('img')!.style.getPropertyValue('view-transition-name')).toBe(
          '',
        ),
      )
      expect(dialog).not.toHaveAttribute('data-morph')
    } finally {
      delete proto.startViewTransition
    }
  })
})
