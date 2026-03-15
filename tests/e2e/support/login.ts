import { expect, type Page } from '@playwright/test';

import { e2eAuthEmail, e2eAuthPassword } from './auth';

export const loginWithE2ECredentials = async (
  page: Page,
  expectedUrl: RegExp = /\/bilsem$/,
) => {
  if (!e2eAuthEmail || !e2eAuthPassword) {
    throw new Error(
      'E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD are required for interactive login flows.',
    );
  }

  await page.getByPlaceholder('ornek@email.com').fill(e2eAuthEmail);
  await page.getByPlaceholder('••••••••').fill(e2eAuthPassword);
  await page.getByRole('button', { name: /giriş yap/i }).click();

  await expect(page).toHaveURL(expectedUrl);
};
