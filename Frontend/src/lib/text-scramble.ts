// Animasi "acak huruf" saat ganti bahasa: teks yang terlihat di layar diacak lalu terurai menjadi
// teks bahasa baru dari kiri ke kanan (DESIGN.md bagian 21). Hanya mengubah nodeValue node teks yang
// sudah ada, jadi node milik React tidak diganti dan nilai akhirnya selalu teks asli. Panel admin juga
// mengacak isi kolom form yang terlihat (opsi `fields`, DESIGN.md bagian 116).

export const LANG_SCRAMBLE_KEY = 'mm-lang-scramble'

const DURATION = 650
const STAGGER = 12
const MAX_NODES = 160
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]

// Node atau kolom yang sedang dianimasikan: tidak diambil lagi oleh animasi kedua (mis. setelah teks
// dari server tiba) agar teks acak di tengah animasi tidak dianggap teks akhir.
const active = new WeakSet<object>()

export type ScrambleOptions = {
  // ikut mengacak nilai dan placeholder kolom teks yang terlihat (panel admin)
  fields?: boolean
  max?: number
  // node/kolom yang sudah diacak ke teks akhirnya di sesi ganti bahasa ini (dilewati bila teksnya sama)
  handled?: WeakMap<object, string>
}

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

function onScreen(element: Element | null) {
  if (!element) return false
  const rect = element.getBoundingClientRect()
  return rect.width > 1 && rect.height > 1 && rect.bottom > 0 && rect.top < window.innerHeight
}

function visibleTextNodes(
  root: Element,
  skip: Set<string>,
  max: number,
  handled?: WeakMap<object, string>,
) {
  const nodes: Text[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      const value = node.nodeValue ?? ''
      if (!parent || !value.trim() || skip.has(value) || active.has(node))
        return NodeFilter.FILTER_REJECT
      if (handled?.get(node) === value) return NodeFilter.FILTER_REJECT
      // pembaca layar dan isian form tidak diganggu
      if (parent.closest('script, style, noscript, textarea, [aria-live], [data-no-scramble]'))
        return NodeFilter.FILTER_REJECT
      // pilihan <select>: hanya yang terpilih, diukur dari kotak select-nya
      const box =
        parent instanceof HTMLOptionElement
          ? parent.selected
            ? parent.closest('select')
            : null
          : parent
      return onScreen(box) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    },
  })
  while (walker.nextNode() && nodes.length < max) nodes.push(walker.currentNode as Text)
  return nodes
}

type Field = HTMLInputElement | HTMLTextAreaElement
const TEXT_INPUTS = new Set(['text', 'email', 'url', 'search', 'tel', ''])

// Kolom teks yang terlihat dan tidak sedang diketik; nilainya (atau placeholder bila kosong).
function visibleFields(root: Element, handled?: WeakMap<object, string>) {
  const out: { field: Field; prop: 'value' | 'placeholder'; text: string }[] = []
  for (const field of root.querySelectorAll<Field>('input, textarea')) {
    if (field instanceof HTMLInputElement && !TEXT_INPUTS.has(field.getAttribute('type') ?? ''))
      continue
    if (field.closest('[data-no-scramble]') || field === document.activeElement) continue
    if (!onScreen(field) || active.has(field)) continue
    const prop = field.value ? 'value' : 'placeholder'
    const text = prop === 'value' ? field.value : field.placeholder
    if (text.trim() && handled?.get(field) !== text) out.push({ field, prop, text })
  }
  return out
}

// Teks yang sedang terlihat, dicatat sebelum pindah bahasa agar teks yang sama di kedua bahasa
// (nama, kota, GitHub) tidak ikut diacak.
export function visibleTexts(root: Element = document.body, options: ScrambleOptions = {}) {
  const texts = visibleTextNodes(root, new Set(), options.max ?? MAX_NODES).map(
    (node) => node.nodeValue ?? '',
  )
  if (options.fields) texts.push(...visibleFields(root).map((f) => f.text))
  return texts
}

type Item = {
  read: () => string | null
  write: (value: string) => void
  key: object
  target: string
  written: string
  delay: number
  done: boolean
}

export function scrambleVisibleText(
  root: Element = document.body,
  unchanged: string[] = [],
  options: ScrambleOptions = {},
) {
  const skip = new Set(unchanged)
  const { handled } = options
  const items: Item[] = visibleTextNodes(root, skip, options.max ?? MAX_NODES, handled).map(
    (node) => ({
      read: () => (node.isConnected ? node.nodeValue : null),
      write: (value) => {
        node.nodeValue = value
      },
      key: node,
      target: node.nodeValue ?? '',
      written: node.nodeValue ?? '',
      delay: 0,
      done: false,
    }),
  )
  if (options.fields) {
    for (const { field, prop, text } of visibleFields(root, handled)) {
      if (skip.has(text)) continue
      items.push({
        // kolom yang mulai diketik pengguna berhenti dianimasikan (nilai bukan tulisan animasi)
        read: () =>
          !field.isConnected || field === document.activeElement
            ? null
            : prop === 'value'
              ? field.value
              : field.placeholder,
        write: (value) => {
          if (prop === 'value') field.value = value
          else field.placeholder = value
        },
        key: field,
        target: text,
        written: text,
        delay: 0,
        done: false,
      })
    }
  }
  if (items.length === 0) return
  items.forEach((item, index) => {
    item.delay = Math.min(index * STAGGER, 300)
    active.add(item.key)
    handled?.set(item.key, item.target)
  })
  const finish = (item: Item) => {
    item.done = true
    active.delete(item.key)
  }
  const start = performance.now()
  const frame = (now: number) => {
    let running = false
    for (const item of items) {
      if (item.done) continue
      // React sudah mengganti teks ini di tengah animasi: biarkan nilai barunya
      if (item.read() !== item.written) {
        finish(item)
        continue
      }
      const progress = (now - start - item.delay) / DURATION
      item.written = progress >= 1 ? item.target : scrambleFrame(item.target, Math.max(0, progress))
      item.write(item.written)
      if (progress >= 1) finish(item)
      else running = true
    }
    if (running) requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

// Sesi ganti bahasa: acak teks yang berubah sekarang, lalu amati DOM selama `watchMs` dan acak juga
// teks yang datang belakangan (mis. server component yang tiba bertahap setelah router.refresh()).
// Tiap node hanya diacak sekali per teks akhirnya. Mengembalikan fungsi untuk menghentikan sesi.
export function scrambleLanguageSwitch(
  before: string[],
  options: ScrambleOptions & { watchMs?: number } = {},
) {
  const handled = new WeakMap<object, string>()
  const opts = { ...options, handled }
  let scheduled = 0
  const run = () => {
    scheduled = 0
    scrambleVisibleText(document.body, before, opts)
  }
  run()
  const observer = new MutationObserver((records) => {
    // tulisan animasi sendiri (node yang sedang diacak) tidak memicu pencarian ulang tiap frame
    const fromApp = records.some((r) => r.type === 'childList' || !active.has(r.target))
    if (fromApp && !scheduled) scheduled = requestAnimationFrame(run)
  })
  observer.observe(document.body, { childList: true, subtree: true, characterData: true })
  const stop = () => {
    observer.disconnect()
    if (scheduled) cancelAnimationFrame(scheduled)
  }
  const timer = window.setTimeout(stop, options.watchMs ?? 6000)
  return () => {
    window.clearTimeout(timer)
    stop()
  }
}
