import { test, expect } from '@playwright/test';

test.describe('The Luxury Experience Flows', () => {

    test('The Atelier WhatsApp Reservation form should be functional', async ({ page }) => {
        // Visit The Atelier
        await page.goto('/atelier');
        await expect(page.locator('h1')).toContainText(/The Atelier/i);

        // Fill out the reservation form
        await page.fill('input[placeholder*="Aishwarya"]', 'Lady Diana');
        await page.fill('input[type="tel"]', '+919876543210');

        // Select an option
        await page.selectOption('select', { label: 'Bridal Kanjivaram' });

        // Click reserve 
        // Note: We don't actually want to click it and open WhatsApp Web in CI.
        // We check if the button exists and the href logic is sound. We intercept the window.open.

        // Evaluate interception before click
        await page.evaluate(() => {
            window.open = function (url, target) {
                window.__interceptedUrl = url;
                return null; // Don't actually open it
            };
        });

        await page.getByRole('button', { name: /Reserve via WhatsApp/i }).click();

        // Verify the URL constructed correctly
        const interceptedUrl = await page.evaluate(() => window.__interceptedUrl);
        expect(interceptedUrl).toContain('wa.me');
        expect(interceptedUrl).toContain('Lady%20Diana');
        expect(interceptedUrl).toContain('Bridal%20Kanjivaram');
    });

    test('The AI Royal Stylist should open and accept input', async ({ page }) => {
        // Go to homepage
        await page.goto('/');

        // Look for the floating Stylist trigger
        const stylistTrigger = page.locator('button:has(.lucide-sparkles)');
        await expect(stylistTrigger).toBeVisible();
        await stylistTrigger.click();

        // The chat window should appear
        const chatHeader = page.getByText(/Royal Stylist/i);
        await expect(chatHeader).toBeVisible();

        // Type a message
        const input = page.getByPlaceholder(/Describe your desired style/i);
        await input.fill('I am looking for a bridal saree under 50000');

        // Send
        const sendBtn = page.locator('button:has(.lucide-send)');
        await sendBtn.click();

        // See user message
        await expect(page.getByText('I am looking for a bridal saree under 50000')).toBeVisible();

        // Wait for AI response (the mock has a setTimeout of 1500ms)
        // Playwright auto-waits, but we can specifically look for the response card
        await expect(page.getByText(/Here is my personal recommendation/i).or(page.getByText(/I suggest an exquisite/i)).or(page.getByText(/We have stunning authentic pieces/i)).or(page.getByText(/I have scanned our sacred/i))).toBeVisible({ timeout: 5000 });
    });

});
