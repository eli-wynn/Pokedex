// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: [
    {
      command: 'node server.js',
      cwd: 'server',
      port: 5000,
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'npx serve -s build -l 3000',
      cwd: 'client',
      port: 3000,
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
});
