const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/browser',
  timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:4200', reducedMotion: 'reduce' },
  projects: [
    { name: 'desktop', testIgnore: /admin\.spec/, use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', testIgnore: /admin\.spec/, use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
    // Gestion des articles : n'existe qu'en développement → serveur Vite, API simulée dans le test
    { name: 'admin', testMatch: /admin\.spec/, use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:4201' } }
  ],
  webServer: [
    {
      command: 'npm run build && node scripts/serve.cjs dist',
      url: 'http://127.0.0.1:4200',
      reuseExistingServer: !process.env.CI
    },
    {
      command: 'npx vite --port 4201 --strictPort',
      url: 'http://127.0.0.1:4201',
      reuseExistingServer: !process.env.CI
    }
  ]
});
