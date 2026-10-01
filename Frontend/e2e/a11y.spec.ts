import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// WCAG 2.2 AA (DESIGN.md bagian 8). Dicek di kedua bahasa dan kedua tema.
// Kontras diukur pada keadaan akhir; animasi reveal sesaat dimatikan lewat reduced-motion.
test.use({ contextOptions: { reducedMotion: 'reduce' } })

const PAGES = ['', '/about', '/experience', '/projects', '/contact', '/privacy']

for (const locale of ['id', 'en'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`halaman publik /${locale} (${theme}) tanpa pelanggaran aksesibilitas`, async ({
      page,
    }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      const failures: string[] = []
      for (const path of PAGES) {
        const response = await page.goto(`/${locale}${path}`)
        expect(response?.status(), path).toBe(200)
        await expect(page.locator('html')).toHaveClass(new RegExp(theme))
        await expect(page.getByRole('heading', { level: 1 }), path).toHaveCount(1)
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze()
        failures.push(...results.violations.map((v) => `${path} ${v.id}: ${v.help}`))
      }
      expect(failures).toEqual([])
    })
  }
}
