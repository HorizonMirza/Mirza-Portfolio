import { ArrowRight } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

// Tombol "flow" (komponen 21st.dev xubohuah/flow-button), disesuaikan: warna dari token tema
// (ikut mode terang/gelap), bisa dipakai sebagai tautan lewat flowButtonClassName + FlowButtonContent,
// dan transisi mati pada prefers-reduced-motion. Saat disorot: lingkaran mengisi tombol, panah kanan
// keluar dan panah kiri masuk.
export const flowButtonClassName =
  'group relative inline-flex min-h-11 cursor-pointer items-center gap-1 overflow-hidden rounded-[100px] border-[1.5px] border-text/40 bg-transparent px-8 py-3 text-sm font-semibold text-text transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:rounded-[12px] hover:border-transparent hover:text-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-note active:scale-[0.95] motion-reduce:transition-none'

export function FlowButtonContent({ text }: { text: string }) {
  return (
    <>
      {/* panah kiri: masuk dari luar saat disorot */}
      <ArrowRight
        aria-hidden="true"
        className="absolute left-[-25%] z-[9] size-4 transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:left-4 motion-reduce:transition-none"
      />
      <span className="relative z-[1] -translate-x-3 transition-all duration-[800ms] ease-out group-hover:translate-x-3 motion-reduce:transition-none">
        {text}
      </span>
      {/* lingkaran yang membesar mengisi tombol */}
      <span
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-text opacity-0 transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:size-[220px] group-hover:opacity-100 motion-reduce:transition-none"
      />
      {/* panah kanan: keluar saat disorot */}
      <ArrowRight
        aria-hidden="true"
        className="absolute right-4 z-[9] size-4 transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:right-[-25%] motion-reduce:transition-none"
      />
    </>
  )
}

export function FlowButton({
  text = 'Modern Button',
  className,
  type = 'button',
  ...props
}: { text?: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={cn(flowButtonClassName, className)} {...props}>
      <FlowButtonContent text={text} />
    </button>
  )
}
