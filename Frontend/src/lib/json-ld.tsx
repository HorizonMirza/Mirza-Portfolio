// Data terstruktur JSON-LD. `<` di-escape agar isi dari database tidak bisa menutup tag <script>
// (pola resmi Next.js), jadi dangerouslySetInnerHTML di sini aman: isinya JSON, bukan HTML.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
