import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'

import { cn } from '@/lib/utils'

// Markdown dari admin selalu disanitasi (tanpa HTML mentah) sebelum ditampilkan.
// Judul di dalam konten diturunkan satu tingkat agar halaman tetap punya satu h1.
export function MarkdownView({
  source,
  size = 'sm',
  className,
}: {
  source: string
  size?: 'sm' | 'base'
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-4 [&_h2]:text-h3 [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:font-semibold [&_li]:ml-5 [&_li]:pl-1 [&_ol]:list-decimal [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1',
        size === 'sm' ? 'text-sm leading-relaxed' : 'max-w-prose',
        className,
      )}
    >
      <ReactMarkdown
        rehypePlugins={[rehypeSanitize]}
        skipHtml
        components={{ h1: 'h2', h2: 'h3', h3: 'h4' }}
      >
        {source}
      </ReactMarkdown>
    </div>
  )
}
