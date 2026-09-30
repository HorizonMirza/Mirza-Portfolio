import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'

// Markdown dari admin selalu disanitasi (tanpa HTML mentah) sebelum ditampilkan.
export function MarkdownView({ source }: { source: string }) {
  return (
    <div className="prose-sm flex flex-col gap-3 text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_h2]:text-h3 [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc">
      <ReactMarkdown rehypePlugins={[rehypeSanitize]} skipHtml>
        {source}
      </ReactMarkdown>
    </div>
  )
}
