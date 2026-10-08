// Suara tombol tema, bahasa, dan menu, dibuat langsung dengan Web Audio (tanpa berkas audio, tanpa
// library). Hanya diputar dari klik pengguna (DESIGN.md bagian 22 dan 31).
// Volume diatur Super Admin di /admin/settings (0–100) dan dikirim lewat atribut
// data-sound-volume di <html>; 0 berarti tanpa suara sama sekali.

export const DEFAULT_SOUND_VOLUME = 80

let context: AudioContext | null = null
let master: GainNode | null = null
let noiseBuffer: AudioBuffer | null = null
// dipakai tombol "Coba suara" di admin sebelum pengaturan disimpan
let volumeOverride: number | null = null

function volume() {
  if (volumeOverride !== null) return volumeOverride
  const raw = Number(document.documentElement.dataset.soundVolume)
  return Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : DEFAULT_SOUND_VOLUME
}

function audio() {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  const level = volume()
  if (level <= 0) return null
  try {
    if (!context) {
      context = new Ctor()
      master = context.createGain()
      // kompresor menjaga suara tetap bersih (tidak pecah) di volume tinggi
      const limiter = context.createDynamicsCompressor()
      limiter.threshold.value = -6
      limiter.ratio.value = 8
      master.connect(limiter)
      limiter.connect(context.destination)
      noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate)
      const data = noiseBuffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    }
    master!.gain.value = level / 100
    // resume() ditolak (InvalidStateError) bila halaman berpindah sebelum audio siap, mis. tombol
    // tema ditekan lalu langsung pindah halaman; itu bukan galat, cukup diabaikan
    if (context.state === 'suspended') context.resume().catch(() => {})
    return { ctx: context, out: master!, noise: noiseBuffer! }
  } catch {
    // browser menolak audio: tombol tetap bekerja tanpa suara
    return null
  }
}

// Membuat AudioContext lebih awal (sentuhan/klik pertama di halaman, lewat PageTransitions) agar
// tombol pertama yang berbunyi tidak tersendat menunggu perangkat audio disiapkan.
export function warmUpAudio() {
  audio()
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

function ping(ctx: AudioContext, out: GainNode, freq: number, dur: number, vol: number) {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.frequency.value = freq
  const gain = ctx.createGain()
  envelope(gain, t, vol, 0.003, dur)
  osc.connect(gain)
  gain.connect(out)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

// Menu utama: tik kaca, denting tipis dan pendek karena menu paling sering ditekan.
// Dibuat lebih keras (permintaan pemilik 2026-10-03).
export function playNavSound() {
  const a = audio()
  if (!a) return
  ping(a.ctx, a.out, 2600, 0.14, 0.32)
  ping(a.ctx, a.out, 3950, 0.1, 0.16)
}

// Timeline Pengalaman (pilihan pemilik 2026-10-08, demo A3 "Bip digital"): bip kotak pendek dan
// pelan setiap kali entri aktif berganti saat digulir. Bisa berbunyi beberapa kali dalam satu
// gulir, jadi sengaja singkat (45 ms).
export function playTimelineStepSound() {
  const a = audio()
  if (!a) return
  blip(a.ctx, a.out, { at: 0, freq: 1250, dur: 0.045, vol: 0.07, type: 'square' })
}

// Kartu foto halaman Tentang (pilihan pemilik 2026-10-08, demo B1 "Kilau"): empat nada tinggi
// berurutan seperti cahaya berkilat. Diputar saat kursor masuk dan terus selama kursor bergeser
// di atas kartu (dibatasi di PhotoTilt agar tidak menumpuk).
export function playPhotoShimmerSound() {
  const a = audio()
  if (!a) return
  ;[1568, 1976, 2349, 3136].forEach((freq, i) => {
    const t = a.ctx.currentTime + i * 0.045
    const osc = a.ctx.createOscillator()
    osc.frequency.value = freq
    const gain = a.ctx.createGain()
    envelope(gain, t, 0.09, 0.004, 0.18)
    osc.connect(gain)
    gain.connect(a.out)
    osc.start(t)
    osc.stop(t + 0.23)
  })
}

// Tombol "Coba suara" di admin: memutar suara menu dengan volume yang sedang digeser.
export function previewSound(level: number) {
  volumeOverride = Math.min(100, Math.max(0, level))
  try {
    playNavSound()
  } finally {
    volumeOverride = null
  }
}

// Kartu ID di halaman kontak (pilihan pemilik 2026-10-03, demo suara nomor 6 "Pegas"): saat
// diambil, nada segitiga naik singkat; saat dilepas, pegas bergetar yang makin pelan.
export function playLanyardSound(kind: 'grab' | 'release') {
  const a = audio()
  if (!a) return
  const { ctx, out } = a
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  const gain = ctx.createGain()
  if (kind === 'grab') {
    osc.frequency.setValueAtTime(260, t)
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.125)
    envelope(gain, t, 0.25, 0.005, 0.125)
    osc.connect(gain)
    gain.connect(out)
    osc.start(t)
    osc.stop(t + 0.18)
    return
  }
  // getaran pegas: frekuensi dimodulasi LFO yang melambat dari 18 ke 6 Hz
  osc.frequency.value = 330
  const lfo = ctx.createOscillator()
  lfo.frequency.setValueAtTime(18, t)
  lfo.frequency.exponentialRampToValueAtTime(6, t + 0.5)
  const depth = ctx.createGain()
  depth.gain.value = 70
  lfo.connect(depth)
  depth.connect(osc.frequency)
  envelope(gain, t, 0.32, 0.005, 0.505)
  osc.connect(gain)
  gain.connect(out)
  osc.start(t)
  lfo.start(t)
  osc.stop(t + 0.6)
  lfo.stop(t + 0.6)
}
