import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// WCAG 2.2 AA (DESIGN.md bagian 8). Dicek di kedua bahasa dan kedua tema.
for (const locale of ['id', 'en'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`beranda /${locale} (${theme}) tanpa pelanggaran aksesibilitas`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.goto(`/${locale}`)
      await expect(page.locator('html')).toHaveClass(new RegExp(theme))

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
      expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
    })
  }
}
