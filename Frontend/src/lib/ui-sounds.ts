// Suara tombol tema dan bahasa, dibuat langsung dengan Web Audio (tanpa berkas audio, tanpa library).
// Hanya diputar dari klik pengguna, dengan volume pelan (DESIGN.md bagian 22).

const VOLUME = 0.4

let context: AudioContext | null = null
let master: GainNode | null = null
let noiseBuffer: AudioBuffer | null = null

function audio() {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  try {
    if (!context) {
      context = new Ctor()
      master = context.createGain()
      master.gain.value = VOLUME
      master.connect(context.destination)
      noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate)
      const data = noiseBuffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    }
    if (context.state === 'suspended') void context.resume()
    return { ctx: context, out: master!, noise: noiseBuffer! }
  } catch {
    // browser menolak audio: tombol tetap bekerja tanpa suara
    return null
  }
}

function envelope(gain: GainNode, t: number, peak: number, attack: number, dur: number) {
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(peak, t + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
}

// Tema: desir angin, derau tersaring yang menyapu turun saat ke gelap dan naik saat ke terang.
export function playThemeSound(toDark: boolean) {
  const a = audio()
  if (!a) return
  const { ctx, out, noise } = a
  const t = ctx.currentTime
  const dur = 0.38
  const source = ctx.createBufferSource()
  source.buffer = noise
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = 1.4
  filter.frequency.setValueAtTime(toDark ? 3200 : 400, t)
  filter.frequency.exponentialRampToValueAtTime(toDark ? 380 : 3200, t + dur)
  const gain = ctx.createGain()
  envelope(gain, t, 0.32, 0.08, dur)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(out)
  source.start(t, Math.random() * 0.5)
  source.stop(t + dur + 0.05)
}

function blip(
  ctx: AudioContext,
  out: GainNode,
  {
    at,
    freq,
    dur,
    vol,
    type,
  }: { at: number; freq: number; dur: number; vol: number; type: OscillatorType },
) {
  const t = ctx.currentTime + at
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.value = freq
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 3000
  const gain = ctx.createGain()
  envelope(gain, t, vol, 0.004, dur)
  osc.connect(filter)
  filter.connect(gain)
  gain.connect(out)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

// Bahasa: acak digital, rentetan bip acak selama huruf diacak (selaras dengan animasi 650 ms),
// ditutup satu nada saat teks selesai terurai. Ke English sedikit lebih tinggi.
export function playLanguageSound(toEnglish: boolean) {
  const a = audio()
  if (!a) return
  const { ctx, out } = a
  const spread = toEnglish ? 1500 : 900
  for (let i = 0; i < 12; i++) {
    blip(ctx, out, {
      at: i * 0.05,
      freq: 700 + Math.random() * spread,
      dur: 0.03,
      vol: 0.08,
      type: 'square',
    })
  }
  blip(ctx, out, { at: 0.62, freq: toEnglish ? 1320 : 990, dur: 0.12, vol: 0.18, type: 'sine' })
}
