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
    <div className="sticky bottom-20 -mx-2 flex justify-end gap-2 rounded-2xl border border-border bg-bg/95 px-3 py-3 backdrop-blur md:static md:mx-0 md:rounded-none md:border-0 md:bg-transparent md:px-0 md:backdrop-blur-none">
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
