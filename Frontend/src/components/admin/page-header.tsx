import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {/* lebih kecil di HP agar judul panjang (mis. nama project) tidak memakan layar */}
        <h1 className="text-h2 font-bold break-words sm:text-h1">{title}</h1>
        {description ? <p className="mt-2 max-w-prose text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  )
}
