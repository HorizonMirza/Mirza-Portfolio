import Link from 'next/link'

import { Button } from '@/components/ui/button'

// Tombol simpan menempel di bawah layar HP agar selalu terjangkau.
export function FormFooter({
  pending,
  cancelHref,
  submitLabel = 'Simpan',
}: {
  pending: boolean
  cancelHref?: string
  submitLabel?: string
}) {
  return (
    <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:backdrop-blur-none">
      {cancelHref ? (
        <Button variant="secondary" asChild>
          <Link href={cancelHref}>Batal</Link>
        </Button>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Menyimpan…' : submitLabel}
      </Button>
    </div>
  )
}
