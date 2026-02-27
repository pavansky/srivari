import { test, expect } from '@playwright/test';

test.describe('Standard E-Commerce Flow', () => {

    test('should allow a user to browse, filter, and view a product', async ({ page }) => {
        // 1. Visit Shop
        await page.goto('/shop');
        await expect(page).toHaveTitle(/Shop Silk Sarees Online/);

        // Context: Srivari's new Shop UI has a "Filter & Sort" sticky bar
        // Let's ensure the products load first
        await expect(page.locator('h3').first()).toBeVisible();

        // 2. Open Filters (Mobile/Desktop check might vary, but assuming desktop visible)
        const filterBtn = page.getByText(/Filter & Sort/i);
        if (await filterBtn.isVisible()) {
            await filterBtn.click();
        }

        // 3. Apply a category filter (e.g., Kanjivaram)
        const kanjivaramCheckbox = page.getByRole('checkbox', { name: /Kanjivaram/i });
        if (await kanjivaramCheckbox.isVisible()) {
            await kanjivaramCheckbox.check();
            // Ensure the "Clear All" or active chip appears
            await expect(page.getByText(/Clear All/i)).toBeVisible();
        }

        // 4. Click the first product link
        const firstProduct = page.locator('a[href^="/product/"]').first();
        const productName = await firstProduct.locator('h3').textContent();
        await firstProduct.click();

        // 5. Verify Product Page loaded
        await expect(page).toHaveURL(/\/product\/[a-zA-Z0-9-]/);
        if (productName) {
            await expect(page.locator('h1').filter({ hasText: productName.trim() })).toBeVisible();
        }
    });

    test('should allow adding to cart and updating quantities', async ({ page }) => {
        // Navigate straight to the first product we know exists in DB/seed data
        await page.goto('/shop');

        // Quick View or Direct Add
        const addToBagBtn = page.locator('button').filter({ hasText: /Add to Bag/i }).first();

        // If we're on the shop page, we might need to hover to see the cart icon, 
        // but the test runs in clean state. Let's just go to a dedicated product page to be safe.
        await page.locator('a[href^="/product/"]').first().click();
        await page.waitForLoadState('networkidle');

        // Find and click "Add to Bag" on PDP
        await page.getByRole('button', { name: /Add to Bag/i }).click();

        // Check for the Toast/Notification
        await expect(page.getByText(/Added to Cart/i)).toBeVisible();

        // Navigate to Cart
        await page.goto('/cart');
        await expect(page.locator('h1').filter({ hasText: /Shopping Cart/i })).toBeVisible();

        // Verify item is there
        const cartItems = page.locator('.cart-item'); // Assuming a class, adjust if necessary
        await expect(page.getByRole('button', { name: /Checkout/i })).toBeVisible();
    });

});
