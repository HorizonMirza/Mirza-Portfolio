// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { PhotoLightbox } from '@/features/experience/components/public/photo-lightbox'

// next/image diganti <img> biasa agar tidak butuh konfigurasi gambar Next di jsdom
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: (props: Record<string, unknown>) => <img {...(props as object)} />,
}))

// jsdom belum punya showModal/close untuk <dialog>: cukup atur atribut open seperti browser
beforeAll(() => {
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
})
