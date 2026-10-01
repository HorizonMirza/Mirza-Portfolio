// Animasi "acak huruf" saat ganti bahasa: teks yang terlihat di layar diacak lalu terurai menjadi
// teks bahasa baru dari kiri ke kanan (DESIGN.md bagian 21). Hanya mengubah nodeValue node teks yang
// sudah ada, jadi node milik React tidak diganti dan nilai akhirnya selalu teks asli.

export const LANG_SCRAMBLE_KEY = 'mm-lang-scramble'

const DURATION = 650
const STAGGER = 12
const MAX_NODES = 160
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]

// Teks pada titik progres 0..1: huruf ke-i terkunci ke huruf akhir setelah melewati ambangnya,
// sebelum itu berupa huruf acak. Spasi dan tanda baca tetap, agar susunan kata tidak melompat.
export function scrambleFrame(target: string, progress: number, glyph = randomGlyph) {
  let out = ''
  for (let i = 0; i < target.length; i++) {
    const ch = target[i]
    const lock = 0.25 + (i / target.length) * 0.75
    out += progress >= lock || !/[\p{L}\p{N}]/u.test(ch) ? ch : glyph()
  }
  return out
}

function visibleTextNodes(root: Element) {
  const nodes: Text[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!parent || !node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT
      // pembaca layar dan isian form tidak diganggu
      if (parent.closest('script, style, noscript, textarea, [aria-live], [data-no-scramble]'))
        return NodeFilter.FILTER_REJECT
      const rect = parent.getBoundingClientRect()
      const onScreen =
        rect.width > 1 && rect.height > 1 && rect.bottom > 0 && rect.top < window.innerHeight
      return onScreen ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    },
  })
  while (walker.nextNode() && nodes.length < MAX_NODES) nodes.push(walker.currentNode as Text)
  return nodes
}

// Teks yang sedang terlihat, dicatat sebelum pindah bahasa agar teks yang sama di kedua bahasa
// (nama, kota, GitHub) tidak ikut diacak.
export function visibleTexts(root: Element = document.body) {
  return visibleTextNodes(root).map((node) => node.nodeValue ?? '')
}

export function scrambleVisibleText(root: Element = document.body, unchanged: string[] = []) {
  const skip = new Set(unchanged)
  const nodes = visibleTextNodes(root).filter((node) => !skip.has(node.nodeValue ?? ''))
  const items = nodes.map((node, index) => ({
    node,
    target: node.nodeValue ?? '',
    written: node.nodeValue ?? '',
    delay: Math.min(index * STAGGER, 300),
    done: false,
  }))
  if (items.length === 0) return
  const start = performance.now()
  const frame = (now: number) => {
    let running = false
    for (const item of items) {
      if (item.done) continue
      // React sudah mengganti teks ini di tengah animasi: biarkan nilai barunya
      if (!item.node.isConnected || item.node.nodeValue !== item.written) {
        item.done = true
        continue
      }
      const progress = (now - start - item.delay) / DURATION
      item.written = progress >= 1 ? item.target : scrambleFrame(item.target, Math.max(0, progress))
      item.node.nodeValue = item.written
      if (progress >= 1) item.done = true
      else running = true
    }
    if (running) requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}
