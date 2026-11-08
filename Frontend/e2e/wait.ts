import type { Locator, Page } from '@playwright/test'

// Tunggu semua animasi CSS/Web Animations yang berhingga selesai (animasi tak berujung seperti pita
// project dilewati). Pengganti jeda tetap waitForTimeout yang rawan menutupi regresi atau gagal
// acak di mesin lambat (audit 2026-10-31, GAP-14).
export async function waitForFiniteAnimations(target: Page | Locator) {
  const run = () =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    ).then(() => undefined)
  if ('evaluate' in target && 'goto' in target) await target.evaluate(run)
  else await (target as Locator).evaluate(run)
}

// Batas tunggu alamat berganti setelah navigasi klien (klik tautan, View Transition). Di WebKit CI
// tanpa GPU, halaman tujuan sudah tampil dalam ±0,25 detik tetapi alamat baru berganti setelah lebih
// dari 5 detik (batas bawaan) karena animasi transisi selesai terlambat (trace CI #261 dan #266,
// 2026-11-06); di WebKit lokal versi sama selalu < 1 detik. Isi halaman tetap dicek dengan batas biasa.
export const CLIENT_NAV_TIMEOUT = 15_000

// Halaman publik di-cache (ISR) dan dibuat ulang setelah admin menyimpan; selama itu permintaan
// masih mendapat salinan lama. Saat semua proyek tes berjalan paralel, pembuatan ulang bisa lebih
// lama dari batas bawaan expect.poll (5 detik): terjadi di uji lokal 2026-11-08, tes volume suara.
export const ISR_REFRESH_TIMEOUT = 15_000
