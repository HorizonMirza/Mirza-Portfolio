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

// Sesi ganti bahasa panel admin (DESIGN.md bagian 117): semua teks yang berubah diacak dan selesai
// BERSAMAAN. Teks client component berganti seketika, teks server component tiba belakangan dan
// bertahap setelah router.refresh(). Maka:
// 1. tahan: teks yang berubah, serta teks lama yang diperkirakan akan berganti (`willChange`, mis.
//    judul dari server), langsung tampil sebagai huruf acak dan ditahan acak;
// 2. teks baru yang tiba dari server (MutationObserver) ikut ditahan; nilai akhir tiap node selalu
//    diambil dari tulisan terakhir React;
// 3. lepas: setelah `settled()` benar dan DOM tenang `quietMs`, atau paling lama `holdMs`, semua
//    teks terurai serempak dengan durasi dan awal yang sama (tanpa jeda bertingkat).
// Mengembalikan fungsi untuk menghentikan sesi (teks langsung dikembalikan ke nilai akhirnya).
export function scrambleLanguageSwitch(
  before: string[],
  options: ScrambleOptions & {
    willChange?: (text: string) => boolean
    settled?: () => boolean
    holdMs?: number
    quietMs?: number
  } = {},
) {
  const skip = new Set(before)
  const max = options.max ?? MAX_NODES
  const items = new Map<object, Item>()
  const sessionStart = performance.now()
  let lastAppChange = sessionStart
  let releasedAt = 0
  let frameId = 0
  let stopped = false

  // acakan pertama ditulis langsung (sebelum layar digambar), agar teks baru tidak sempat terlihat utuh
  const hold = (item: Item) => {
    item.written = scrambleFrame(item.target, 0)
    item.write(item.written)
    active.add(item.key)
  }

  const addNode = (node: Text) => {
    if (items.has(node) || items.size >= max) return
    const value = node.nodeValue ?? ''
    const item: Item = {
      read: () => (node.isConnected ? node.nodeValue : null),
      write: (v) => {
        node.nodeValue = v
      },
      key: node,
      target: value,
      written: value,
      delay: 0,
      done: false,
    }
    items.set(node, item)
    hold(item)
  }
  const addField = (field: Field, prop: 'value' | 'placeholder', text: string) => {
    if (items.has(field) || items.size >= max) return
    const item: Item = {
      read: () =>
        !field.isConnected || field === document.activeElement
          ? null
          : prop === 'value'
            ? field.value
            : field.placeholder,
      write: (v) => {
        if (prop === 'value') field.value = v
        else field.placeholder = v
      },
      key: field,
      target: text,
      written: text,
      delay: 0,
      done: false,
    }
    items.set(field, item)
    hold(item)
  }

  // cari teks yang berubah (bukan teks lama) atau teks lama yang diperkirakan berganti
  const collect = () => {
    const predict = options.willChange
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const value = node.nodeValue ?? ''
        if (!value.trim() || items.has(node)) return NodeFilter.FILTER_REJECT
        if (skip.has(value) && !predict?.(value)) return NodeFilter.FILTER_REJECT
        const parent = node.parentElement
        if (!parent) return NodeFilter.FILTER_REJECT
        if (parent.closest('script, style, noscript, textarea, [aria-live], [data-no-scramble]'))
          return NodeFilter.FILTER_REJECT
        const box =
          parent instanceof HTMLOptionElement
            ? parent.selected
              ? parent.closest('select')
              : null
            : parent
        return onScreen(box) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
      },
    })
    while (walker.nextNode() && items.size < max) addNode(walker.currentNode as Text)
    if (options.fields) {
      for (const { field, prop, text } of visibleFields(document.body)) {
        if (!items.has(field) && !skip.has(text)) addField(field, prop, text)
      }
    }
  }

  const frame = (now: number) => {
    frameId = 0
    if (stopped) return
    if (
      !releasedAt &&
      (now - sessionStart >= (options.holdMs ?? 1500) ||
        ((options.settled?.() ?? true) && now - lastAppChange >= (options.quietMs ?? 150)))
    )
      releasedAt = now
    let running = !releasedAt
    for (const item of items.values()) {
      if (item.done) continue
      const current = item.read()
      if (current === null) {
        // node dilepas React atau kolom mulai diketik: berhenti tanpa menulis apa pun
        item.done = true
        active.delete(item.key)
        continue
      }
      // React menulis teks baru (mis. judul dari server tiba): itulah teks akhirnya
      if (current !== item.written) item.target = current
      const progress = releasedAt ? (now - releasedAt) / DURATION : 0
      item.written = progress >= 1 ? item.target : scrambleFrame(item.target, progress)
      item.write(item.written)
      if (progress >= 1) {
        item.done = true
        active.delete(item.key)
      } else running = true
    }
    if (running) frameId = requestAnimationFrame(frame)
    else stop()
  }

  const observer = new MutationObserver((records) => {
    // tulisan animasi sendiri (node yang sedang diacak) tidak dihitung sebagai perubahan halaman
    if (!records.some((r) => r.type === 'childList' || !active.has(r.target))) return
    lastAppChange = performance.now()
    if (!stopped) collect()
  })

  function stop() {
    if (stopped) return
    stopped = true
    observer.disconnect()
    if (frameId) cancelAnimationFrame(frameId)
    for (const item of items.values()) {
      if (item.done) continue
      const current = item.read()
      if (current !== null) item.write(current === item.written ? item.target : current)
      active.delete(item.key)
    }
  }

  collect()
  observer.observe(document.body, { childList: true, subtree: true, characterData: true })
  frameId = requestAnimationFrame(frame)
  return stop
}
