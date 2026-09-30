import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT ?? 3100)
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`

// Di sandbox tanpa unduhan browser, arahkan ke Chromium yang sudah terpasang.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    launchOptions: { executablePath },
  },
  projects: [
    // login admin sekali, sesinya dipakai tes di e2e/admin
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, dependencies: ['setup'] },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, dependencies: ['setup'] },
    // Firefox, WebKit (Safari), dan iPhone dijalankan di CI (E2E_ALL_BROWSERS=1). Di sandbox lokal
    // hanya Chromium yang terpasang.
    ...(process.env.E2E_ALL_BROWSERS
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] }, dependencies: ['setup'] },
          { name: 'webkit', use: { ...devices['Desktop Safari'] }, dependencies: ['setup'] },
          { name: 'iphone', use: { ...devices['iPhone 14'] }, dependencies: ['setup'] },
        ]
      : []),
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `pnpm start --port ${PORT}`,
        url: `${baseURL}/api/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
