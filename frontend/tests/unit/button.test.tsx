// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('merender tombol dengan varian utama secara bawaan', () => {
    render(<Button>Unduh CV</Button>)
    const button = screen.getByRole('button', { name: 'Unduh CV' })
    expect(button).toHaveClass('bg-primary')
  })

  it('asChild memasang gaya ke elemen anak', () => {
    render(
      <Button asChild variant="secondary">
        <a href="https://example.com/cv.pdf">CV</a>
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'CV' })
    expect(link).toHaveAttribute('href', 'https://example.com/cv.pdf')
    expect(link).toHaveClass('border-border-strong')
  })
})
