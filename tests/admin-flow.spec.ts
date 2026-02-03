import { test, expect } from '@playwright/test';

test.describe('Admin and Shop Synchronization', () => {
    const TEST_PRODUCT = {
        name: `Test Silk Saree ${Date.now()}`,
        price: 35000,
        description: 'A luxurious test saree for verification.',
        category: 'Silk',
        stock: 10
    };

    test('should verify full flow: admin add, home view, cart, and page navigation', async ({ page }) => {
        // 1. Go to Admin Page
        // 1. Go to Admin Page
        await page.goto('http://localhost:3001/admin');

        // Handle Login
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button:has-text("Login")');

        await expect(page).toHaveTitle(/Srivari|Admin/i);
        await expect(page.getByRole('heading', { name: "Admin Dashboard" })).toBeVisible();

        // 2. Add New Product
        await page.locator('input[type="text"]').first().fill(TEST_PRODUCT.name);

        // Fill Price
        const priceInputs = page.locator('input[type="number"]');
        await priceInputs.first().fill(TEST_PRODUCT.price.toString()); // Price
        await priceInputs.nth(1).fill(TEST_PRODUCT.stock.toString()); // Stock

        await page.locator('select').selectOption(TEST_PRODUCT.category);
        await page.locator('textarea').fill(TEST_PRODUCT.description);
        await page.locator('input[type="checkbox"]').first().check(); // Check Featured

        // Submit
        await page.click('button[type="submit"]');

        // Verify it appears in the inventory list on Admin page
        await expect(page.locator(`text=${TEST_PRODUCT.name}`)).toBeVisible();

        // 3. Verify in Home Page
        await page.goto('http://localhost:3001/');
        const productCard = page.locator(`text=${TEST_PRODUCT.name}`);
        await expect(productCard).toBeVisible();

        // 4. Click 'View' to go to Product Details
        await page.locator('div.group', { has: page.locator(`text=${TEST_PRODUCT.name}`) })
            .getByRole('button', { name: 'View' })
            .click();

        // 5. Verify Product Page URL and Content
        await expect(page).toHaveURL(/\/product\/.*/);

        // STRICT MODE FIX: Be specific about which heading we expect
        await expect(page.getByRole('heading', { name: TEST_PRODUCT.name, level: 1 })).toBeVisible();

        // 6. Add to Cart
        page.once('dialog', async dialog => {
            expect(dialog.message()).toContain('Added to cart');
            await dialog.accept();
        });

        await page.getByRole('button', { name: 'Add to Cart' }).click();

        // 7. Verify Cart Count in Navbar
        // Waiting for the cart count to update/appear
        // Using a reliable selector for the badge
        // 7. Verify Cart Navigation
        // Click the cart icon in navbar
        // It's wrapped in a Link now, so we find the link or the button inside
        await page.locator('nav a[href="/cart"]').first().click({ force: true });

        // 8. Verify Cart Page
        await expect(page).toHaveURL(/.*\/cart/);
        await expect(page.getByRole('heading', { name: /Shopping Cart/i })).toBeVisible();
        // Check if item is listed
        await expect(page.locator(`text=${TEST_PRODUCT.name}`)).toBeVisible();

        // Verify Checkout Button
        const checkoutBtn = page.getByRole('button', { name: /Checkout via WhatsApp/i });
        await expect(checkoutBtn).toBeVisible();

        // 9. Verify About and Contact Pages
        await page.goto('http://localhost:3001/about');
        await expect(page.getByRole('heading', { name: 'Our Heritage' })).toBeVisible();

        await page.goto('http://localhost:3001/contact');
        await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible();

        console.log('Test Passed: Full flow verified including Cart Page interaction.');
    });
});
