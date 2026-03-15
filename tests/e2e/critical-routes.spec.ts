import { expect, test } from '@playwright/test';

test.describe('critical route flows', () => {
  test('public login page renders for anonymous users', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole('heading', { name: /hoş geldiniz/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /giriş yap/i }),
    ).toBeVisible();
  });

  test('forgot-password modal opens, validates input, and closes for anonymous users', async ({
    page,
  }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: /şifremi unuttum/i }).click();

    await expect(
      page.getByRole('heading', { name: /şifre sıfırlama/i }),
    ).toBeVisible();

    const resetEmailInput = page.getByPlaceholder('ornek@email.com').nth(1);
    const sendLinkButton = page.getByRole('button', { name: /bağlantı gönder/i });

    await expect(sendLinkButton).toBeDisabled();
    await resetEmailInput.fill('ogrenci@example.com');
    await expect(sendLinkButton).toBeEnabled();

    await page.getByRole('button', { name: /kapat/i }).click();

    await expect(
      page.getByRole('heading', { name: /şifre sıfırlama/i }),
    ).toBeHidden();
  });

  test('forgot-password request shows success feedback when the auth endpoint accepts the reset email', async ({
    page,
  }) => {
    let recoverRequestCount = 0;

    await page.route('**/auth/v1/recover**', async (route) => {
      recoverRequestCount += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}',
      });
    });

    await page.goto('/login');
    await page.getByRole('button', { name: /şifremi unuttum/i }).click();

    await page.getByPlaceholder('ornek@email.com').nth(1).fill('ogrenci@example.com');
    await page.getByRole('button', { name: /bağlantı gönder/i }).click();

    await expect(
      page.getByText(/şifre sıfırlama bağlantısı gönderildi/i),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /bağlantı gönder/i }),
    ).toBeHidden();
    await expect.poll(() => recoverRequestCount).toBe(1);
  });

  test('login page can route anonymous users to signup and signup preserves referral query state', async ({
    page,
  }) => {
    await page.goto('/login');
    await page
      .locator('p', { hasText: 'Hesabınız yok mu?' })
      .getByRole('link', { name: /^kayıt ol$/i })
      .click();

    await expect(page).toHaveURL(/\/signup$/);
    await expect(
      page.getByRole('heading', { name: /hesap oluştur/i }),
    ).toBeVisible();

    await page.goto('/signup?ref=ARKADAS123');

    await expect(page.locator('input[name="referralCode"]')).toHaveValue('ARKADAS123');
    await expect(page.getByText(/sen ve arkadaşın 50 xp kazanacaksınız/i)).toBeVisible();

    await page
      .locator('p', { hasText: 'Zaten hesabın var mı?' })
      .getByRole('link', { name: /^giriş yap$/i })
      .click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('public workshop landing pages stay accessible without auth', async ({ page }) => {
    await page.goto('/atolyeler/genel-yetenek');

    await expect(page).toHaveURL(/\/atolyeler\/genel-yetenek$/);
    await expect(
      page.getByRole('heading', { name: /genel yetenek/i }),
    ).toBeVisible();
  });

  test('legacy music workshop route redirects to the current workshop landing page', async ({ page }) => {
    await page.goto('/atolyeler/muzik');

    await expect(page).toHaveURL(/\/atolyeler\/muzik-sinav$/);
  });

  test('anonymous users are redirected to login from protected brain trainer routes', async ({ page }) => {
    await page.goto('/games/stroop');

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole('heading', { name: /hoş geldiniz/i }),
    ).toBeVisible();
  });

  test('anonymous users are redirected to login from protected profile routes', async ({ page }) => {
    await page.goto('/profile');

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole('button', { name: /giriş yap/i }),
    ).toBeVisible();
  });

  test('anonymous users are redirected to login from protected exam simulator routes', async ({ page }) => {
    await page.goto('/atolyeler/sinav-simulasyonu');

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole('heading', { name: /hoş geldiniz/i }),
    ).toBeVisible();
  });
});
