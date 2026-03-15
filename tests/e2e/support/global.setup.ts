import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { chromium, type FullConfig } from '@playwright/test';

import {
  authStatePath,
  canRunAuthenticatedFlows,
} from './auth';
import { loginWithE2ECredentials } from './login';

export default async function globalSetup(config: FullConfig) {
  if (!canRunAuthenticatedFlows) {
    return;
  }

  mkdirSync(path.dirname(authStatePath), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: config.projects[0]?.use?.baseURL as string | undefined,
  });
  const page = await context.newPage();

  await page.goto('/login');
  await loginWithE2ECredentials(page, /\/bilsem$/);
  await context.storageState({ path: authStatePath });
  await browser.close();
}
