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
