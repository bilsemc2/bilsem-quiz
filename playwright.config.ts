import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import { canRunAuthenticatedFlows, useE2EMockAuth } from './tests/e2e/support/auth';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';
const useManagedWebServer = process.env.PLAYWRIGHT_NO_WEBSERVER !== '1';
const authStatePath = path.resolve('.playwright/.auth/user.json');
const devServerCommand = useE2EMockAuth
  ? 'VITE_E2E_MOCK_AUTH=1 npm run dev -- --host 127.0.0.1 --port 4173'
  : 'npm run dev -- --host 127.0.0.1 --port 4173';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  globalSetup: canRunAuthenticatedFlows
    ? './tests/e2e/support/global.setup.ts'
    : undefined,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1440, height: 960 },
  },
  webServer: useManagedWebServer
    ? {
        command: devServerCommand,
        url: baseURL,
        reuseExistingServer: !process.env.CI && !useE2EMockAuth,
        timeout: 120_000,
      }
    : undefined,
  projects: [
    {
      name: 'chromium-anon',
      testMatch: /critical-routes\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-auth',
      testMatch: /authenticated-routes\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: canRunAuthenticatedFlows ? authStatePath : undefined,
      },
    },
  ],
});
