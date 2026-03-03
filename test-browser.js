import { chromium } from 'playwright';
import * as dotenv from 'dotenv';
dotenv.config();

(async () => {
    // Setup browser with permissions granted for microphone
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        permissions: ['microphone']
    });
    const page = await context.newPage();

    console.log("Navigating to local dev server...");
    await page.goto('http://localhost:5173/atolyeler/muzik/single-note');

    // We need to log in. Since we don't have a specific test user's password, 
    // we will just wait and monitor network to see if we're redirected to login.
    console.log("Checking if redirected to login...");
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log("Current URL:", currentUrl);

    if (currentUrl.includes('/login') || currentUrl.includes('/giris')) {
        console.log("User is not logged in. Playwright cannot proceed without credentials.");
        await browser.close();
        return;
    }

    console.log("Listening to network requests...");
    page.on('response', response => {
        if (response.url().includes('music_test_results')) {
            console.log(`\n--- Supabase DB Response ---`);
            console.log(`URL: ${response.url()}`);
            console.log(`Status: ${response.status()}`);
        }
    });

    console.log("Clicking the start button...");
    // Try to find the start button (assuming it's a microphone or "Notayı Dinlet" etc)
    try {
        const playButton = await page.getByRole('button', { name: /Notayı Dinlet/i });
        if (await playButton.isVisible()) {
            await playButton.click();
            console.log("Play button clicked. Waiting 5s for action...");
            await page.waitForTimeout(5000);

            const micButton = await page.getByRole('button', { name: /Söyle/i });
            if (await micButton.isVisible()) {
                await micButton.click();
                console.log("Mic button clicked. Waiting 5s for recording...");
                await page.waitForTimeout(5000);
                await micButton.click(); // stop recording
            }
        }
    } catch (e) {
        console.log("Could not find standard test buttons:", e.message);
    }

    console.log("Watching for 10 seconds for any network activity...");
    await page.waitForTimeout(10000);

    await browser.close();
})();
