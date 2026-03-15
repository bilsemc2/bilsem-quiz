import { expect, test } from '@playwright/test';

import {
  canRunAuthenticatedFlows,
  e2eAuthEmail,
  expectedProfileName,
  expectedReferralCode,
  hasGeneralTalentFixture,
  hasMusicTalentFixture,
  isRealBackendAuthFlow,
} from './support/auth';
import { loginWithE2ECredentials } from './support/login';

test.describe('authenticated route flows', () => {
  test.beforeEach(async () => {
    test.skip(
      !canRunAuthenticatedFlows,
      'Set E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD or enable E2E_USE_MOCK_AUTH=1 to run authenticated browser smoke tests.',
    );
  });

  test('interactive login returns users to the protected route they originally requested', async ({
    baseURL,
    browser,
  }) => {
    const context = await browser.newContext({
      baseURL: baseURL ?? undefined,
      storageState: undefined,
    });
    const page = await context.newPage();

    await page.goto('/games/stroop');

    await expect(page).toHaveURL(/\/login$/);
    await loginWithE2ECredentials(page, /\/games\/stroop$/);
    await expect(
      page.getByRole('heading', { name: /stroop testi/i }),
    ).toBeVisible();

    await context.close();
  });

  test('authenticated users can open the profile page without being bounced back to login', async ({
    page,
  }) => {
    await page.goto('/profile');

    await expect(page).toHaveURL(/\/profile$/);
    await expect(
      page.getByRole('button', { name: /profili düzenle/i }),
    ).toBeVisible();
  });

  test('real backend auth surfaces the seeded account identity on the profile page', async ({
    page,
  }) => {
    test.skip(
      !isRealBackendAuthFlow,
      'Requires E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD with mock auth disabled.',
    );

    await page.goto('/profile');

    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole('heading', { level: 1 })).not.toHaveText(/^kullanıcı$/i);

    if (expectedProfileName) {
      await expect(
        page.getByRole('heading', { level: 1, name: expectedProfileName }),
      ).toBeVisible();
    }

    await page.getByRole('button', { name: /profil menüsü/i }).click();
    await expect(page.getByText(e2eAuthEmail, { exact: true })).toBeVisible();
  });

  test('real backend auth preserves the seeded referral code when configured', async ({
    page,
  }) => {
    test.skip(
      !isRealBackendAuthFlow,
      'Requires E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD with mock auth disabled.',
    );
    test.skip(
      !expectedReferralCode,
      'Set E2E_EXPECT_PROFILE_REFERRAL_CODE to validate the seeded referral code.',
    );

    await page.goto('/profile');

    await page.getByRole('button', { name: /arkadaş davet et/i }).click();

    const referralCodeInput = page.locator('input[readonly]').first();
    await expect(referralCodeInput).toHaveValue(expectedReferralCode);
  });

  test('authenticated users can sign out from the navbar profile menu', async ({ page }) => {
    await page.goto('/profile');

    await page.getByRole('button', { name: /profil menüsü/i }).click();

    await expect(
      page.getByRole('button', { name: /çıkış yap/i }),
    ).toBeVisible();

    await page.getByRole('button', { name: /çıkış yap/i }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('link', { name: /^giriş yap$/i }).first(),
    ).toBeVisible();
  });

  test('authenticated users are redirected away from login and signup pages', async ({
    page,
  }) => {
    await page.goto('/login');

    await expect(page).toHaveURL(/\/bilsem$/);
    await expect(page.getByText(/yeteneklerini keşfet/i)).toBeVisible();

    await page.goto('/signup?ref=ARKADAS123');

    await expect(page).toHaveURL(/\/bilsem$/);
    await expect(page.getByText(/yeteneklerini keşfet/i)).toBeVisible();
  });

  test('general talent fixtures can access the exam simulator hub', async ({ page }) => {
    test.skip(
      !hasGeneralTalentFixture,
      'Set E2E_EXPECT_GENERAL_TALENT=1 for a seeded user with Genel Yetenek access.',
    );

    await page.goto('/atolyeler/sinav-simulasyonu');

    await expect(page).toHaveURL(/\/atolyeler\/sinav-simulasyonu$/);
    await expect(
      page.getByRole('heading', { name: /sınav simülasyonu/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /sınavı başlat/i }),
    ).toBeVisible();
  });

  test('music talent fixtures can access the music workshop test shell', async ({ page }) => {
    test.skip(
      !hasMusicTalentFixture,
      'Set E2E_EXPECT_MUSIC_TALENT=1 for a seeded user with Müzik access.',
    );

    await page.goto('/atolyeler/muzik-sinav/tek-ses');

    await expect(page).toHaveURL(/\/atolyeler\/muzik-sinav\/tek-ses$/);
    await expect(
      page.getByRole('heading', { name: /tek ses tekrarı/i }),
    ).toBeVisible();
  });
});
