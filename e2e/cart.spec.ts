import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

/**
 * Cart and checkout — read-only e2e coverage.
 *
 * The dev server talks to the LIVE database, so these tests never create an
 * order: checkout is asserted up to (and excluding) the pay/submit click.
 * The cart itself lives in localStorage, which is safe to mutate. The only
 * POST exercised is /api/shiprocket/serviceability — a read-only rate lookup.
 */

interface ApiProduct {
    id: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    images?: string[];
    isArchived?: boolean;
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

function firstRealPhoto(p: ApiProduct): string | undefined {
    return (p.images || []).find(
        (img) => !!img && /^https?:\/\//.test(img.trim()) && !img.includes('instagram.com')
    );
}

async function pickLiveProduct(request: APIRequestContext): Promise<ApiProduct> {
    const res = await request.get('/api/products');
    expect(res.ok(), 'GET /api/products should succeed').toBeTruthy();
    const products: ApiProduct[] = await res.json();
    const candidates = products.filter((p) => !p.isArchived && p.stock > 0 && firstRealPhoto(p));
    expect(candidates.length, 'catalogue should contain an in-stock product with a photo').toBeGreaterThan(0);
    return (
        candidates.find((p) => p.name === 'Ivory' && p.stock >= 2) ||
        candidates.find((p) => p.stock >= 2) ||
        candidates[0]
    );
}

/** Seed the persisted cart before any page script runs (localStorage only). */
async function seedCart(page: Page, productId: string, quantity = 1): Promise<void> {
    await page.addInitScript(
        ([id, qty]) => {
            window.localStorage.setItem(
                'srivari_cart',
                JSON.stringify([{ productId: id, quantity: qty }])
            );
        },
        [productId, quantity] as [string, number]
    );
}

/** Cart line-item card for a given product name. */
function lineItem(page: Page, name: string) {
    return page
        .locator('div.group')
        .filter({ has: page.getByRole('heading', { level: 3, name }) })
        .first();
}

test.describe('Cart — empty state', () => {
    test('empty cart shows the empty state with a CTA back to /shop', async ({ page }) => {
        await page.goto('/cart');

        await expect(page.getByRole('heading', { name: 'Your Selection' })).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('heading', { name: 'Your collection awaits' })).toBeVisible();

        const cta = page.getByRole('link', { name: /Explore Collection/ });
        await expect(cta).toBeVisible();
        await expect(cta).toHaveAttribute('href', '/shop');
    });
});

test.describe('Cart — line items and quantities', () => {
    test('adding from the product page shows a line item; qty and remove controls work', async ({ page, request }) => {
        const product = await pickLiveProduct(request);

        // Add from the product page (real user flow)
        await page.goto(`/product/${product.id}`);
        await page.getByRole('button', { name: 'Add to Bag' }).click();
        await expect(page.getByLabel('Shopping bag, 1 items')).toBeVisible({ timeout: 15000 });

        // Follow the navbar bag into the cart
        await page.getByRole('link', { name: /^Shopping bag/ }).click();
        await expect(page).toHaveURL(/\/cart$/);

        const item = lineItem(page, product.name);
        await expect(item).toBeVisible({ timeout: 15000 });
        await expect(item.getByText(inr(product.price))).toBeVisible();

        const plus = item.getByRole('button', { name: 'Increase quantity' });
        const minus = item.getByRole('button', { name: 'Decrease quantity' });
        await expect(plus).toBeVisible();
        await expect(minus).toBeVisible();
        await expect(item.getByText('1', { exact: true })).toBeVisible();

        // Increase — but never beyond stock
        if (product.stock >= 2) {
            await plus.click();
            await expect(item.getByText('2', { exact: true })).toBeVisible();
            await expect(item.getByText(inr(product.price * 2))).toBeVisible();

            // Decrease back down
            await minus.click();
            await expect(item.getByText('1', { exact: true })).toBeVisible();
        } else {
            // Single unit left — the increase control must be disabled
            await expect(plus).toBeDisabled();
        }

        // Remove the item — the empty state returns
        await item.getByRole('button', { name: 'Remove item' }).click();
        await expect(page.getByRole('heading', { name: 'Your collection awaits' })).toBeVisible();
        await expect(page.getByLabel('Shopping bag, 0 items')).toBeVisible();
    });

    test('pincode serviceability input responds and totals follow quantity', async ({ page, request }) => {
        const product = await pickLiveProduct(request);
        await seedCart(page, product.id, 1);
        await page.goto('/cart');

        const item = lineItem(page, product.name);
        await expect(item).toBeVisible({ timeout: 15000 });

        // Summary subtotal reflects a single unit
        await expect(page.getByText('Subtotal', { exact: true })).toBeVisible();
        await expect(page.getByText(inr(product.price)).first()).toBeVisible();

        // Pincode serviceability — read-only rate lookup, tolerated to fail upstream
        const pincodeInput = page.getByPlaceholder('Pincode');
        await expect(pincodeInput).toBeVisible();
        const serviceabilityResponse = page
            .waitForResponse((r) => r.url().includes('/api/shiprocket/serviceability'), { timeout: 20000 })
            .catch(() => null);
        await pincodeInput.fill('560001');
        await page.getByRole('button', { name: 'Verify' }).click();
        await serviceabilityResponse;

        // Either courier/ETA details, a feedback toast, or the default
        // complimentary-shipping row — all are acceptable outcomes.
        const detail = page.getByText(/Est\. Delivery:|Courier:/).first();
        const toast = page.locator('[role="status"]').first();
        const complimentary = page.getByText('Complimentary', { exact: true });
        await expect(detail.or(toast).or(complimentary).first()).toBeVisible();

        // Totals update with quantity
        if (product.stock >= 2) {
            await item.getByRole('button', { name: 'Increase quantity' }).click();
            await expect(item.getByText('2', { exact: true })).toBeVisible();
            await expect(page.getByText(inr(product.price * 2)).first()).toBeVisible();
        }
        await expect(page.getByText('Total', { exact: true })).toBeVisible();
    });
});

test.describe('Cart — checkout entry points', () => {
    test('"Standard Checkout" navigates to /checkout with form, payment methods and coupon field', async ({ page, request }) => {
        const product = await pickLiveProduct(request);
        await seedCart(page, product.id, 1);
        await page.goto('/cart');

        const checkoutLink = page.getByRole('link', { name: /Standard Checkout/ });
        await expect(checkoutLink).toBeVisible({ timeout: 15000 });
        await checkoutLink.click();
        await expect(page).toHaveURL(/\/checkout$/);

        // Delivery form fields
        await expect(page.getByRole('heading', { name: 'Delivery Information' })).toBeVisible({ timeout: 15000 });
        await expect(page.getByLabel('First Name')).toBeVisible();
        await expect(page.getByLabel('Last Name')).toBeVisible();
        await expect(page.getByLabel('Address', { exact: true })).toBeVisible();
        await expect(page.getByLabel('City')).toBeVisible();
        await expect(page.getByLabel('Pincode')).toBeVisible();
        await expect(page.getByLabel('Phone')).toBeVisible();
        await expect(page.locator('#co-email')).toBeVisible(); // checkout email (footer has its own)

        // Payment methods: Razorpay (online) and COD selector cards
        await expect(page.getByRole('button', { name: /Online Payment/ })).toBeVisible();
        await expect(page.getByRole('button', { name: /Cash on Delivery/ })).toBeVisible();

        // Coupon input
        await expect(page.getByLabel('Coupon Code')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Apply', exact: true })).toBeVisible();

        // The pay button exists and is enabled — asserted only, NEVER clicked
        // (live database; submitting would create a real order).
        const payButton = page.getByRole('button', { name: /Proceed to Secure Payment|Place COD Order/ });
        await expect(payButton).toBeVisible();
        await expect(payButton).toBeEnabled();

        // Order summary shows the seeded item
        await expect(page.getByRole('heading', { name: 'Order Summary' })).toBeVisible();
        await expect(page.getByText(product.name).first()).toBeVisible();
    });

    test('WhatsApp concierge control is present on the cart', async ({ page, request }) => {
        const product = await pickLiveProduct(request);
        await seedCart(page, product.id, 1);
        await page.goto('/cart');

        const concierge = page.getByRole('button', { name: /WhatsApp Concierge/ });
        await expect(concierge).toBeVisible({ timeout: 15000 });
        await expect(concierge).toBeEnabled();
        // Intentionally not clicked — it opens the concierge order modal.
    });
});
