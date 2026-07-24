import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * Product detail page (PDP) — read-only e2e coverage.
 *
 * These tests run against the LIVE database, so they never submit forms or
 * call write APIs. Product data is derived at runtime from GET /api/products
 * so the suite survives catalogue changes; "Ivory" is preferred when present
 * because it is a known-stable product with a real photograph.
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

/** First image that is a real remote photo (not an Instagram permalink or empty). */
function firstRealPhoto(p: ApiProduct): string | undefined {
    return (p.images || []).find(
        (img) => !!img && /^https?:\/\//.test(img.trim()) && !img.includes('instagram.com')
    );
}

/** Pick a live, in-stock product that renders a real photograph. */
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

test.describe('Product page — gallery, pricing and stock', () => {
    test('navigating from /shop renders gallery with zari frame, category tag, name, serif price and stock mark', async ({ page, request }) => {
        const product = await pickLiveProduct(request);

        await page.goto('/shop');
        const cardLink = page.getByRole('link', { name: `View ${product.name}` }).first();
        await expect(cardLink).toBeVisible({ timeout: 15000 });
        await cardLink.click();
        await expect(page).toHaveURL(new RegExp(`/product/${product.id}$`), { timeout: 15000 });

        // Name as the page <h1>
        await expect(
            page.getByRole('heading', { level: 1, name: product.name })
        ).toBeVisible({ timeout: 15000 });

        // Gallery frame with the always-on double zari (gold) inset borders
        const frame = page.locator('.cursor-zoom-in').first();
        await expect(frame).toBeVisible();
        const zariBorders = frame.locator('[class*="border-[#D4AF37]"]');
        expect(await zariBorders.count()).toBeGreaterThanOrEqual(2);

        // Category micro-label overlaid on the gallery
        await expect(frame.getByText(product.category, { exact: true })).toBeVisible();

        // Serif price in rupees
        const price = page.locator('p.font-serif', { hasText: '₹' }).first();
        await expect(price).toBeVisible();
        await expect(price).toHaveText(inr(product.price));

        // Stock mark (scarcity or availability)
        await expect(
            page.getByText(/Only \d+ remain|In Stock|Sold Out/).first()
        ).toBeVisible();
    });

    test('quantity stepper respects minimum 1 and maximum stock', async ({ page, request }) => {
        const product = await pickLiveProduct(request);
        await page.goto(`/product/${product.id}`);

        const qty = page.locator('span[aria-live="polite"]').first();
        const minus = page.getByRole('button', { name: 'Decrease quantity' });
        const plus = page.getByRole('button', { name: 'Increase quantity' });

        await expect(qty).toHaveText('1', { timeout: 15000 });

        // Minimum is 1 — decreasing at 1 must not go lower
        await minus.click();
        await expect(qty).toHaveText('1');

        if (product.stock <= 10) {
            // Walk up to the stock ceiling, then verify it is capped there
            for (let i = 0; i < product.stock - 1; i++) {
                await plus.click();
            }
            await expect(qty).toHaveText(String(product.stock));
            await plus.click();
            await expect(qty).toHaveText(String(product.stock));
        } else {
            // Large stock: just prove the stepper increments
            await plus.click();
            await expect(qty).toHaveText('2');
        }

        // And back down
        await minus.click();
        if (product.stock > 1) {
            await expect(qty).not.toHaveText('0');
        } else {
            await expect(qty).toHaveText('1');
        }
    });
});

test.describe('Product page — cart and wishlist actions', () => {
    test('"Add to Bag" increments the navbar shopping bag badge', async ({ page, request }) => {
        const product = await pickLiveProduct(request);
        await page.goto(`/product/${product.id}`);

        // Fresh context — bag starts empty
        await expect(page.getByLabel('Shopping bag, 0 items')).toBeVisible({ timeout: 15000 });

        await page.getByRole('button', { name: 'Add to Bag' }).click();

        // Confirmation toast + badge increments to 1
        await expect(page.getByRole('status').filter({ hasText: 'Added to Bag' })).toBeVisible();
        await expect(page.getByLabel('Shopping bag, 1 items')).toBeVisible();
    });

    test('wishlist heart toggles pressed state and updates the wishlist badge', async ({ page, request }) => {
        const product = await pickLiveProduct(request);
        await page.goto(`/product/${product.id}`);

        const saveBtn = page.getByRole('button', { name: `Save ${product.name} to wishlist` });
        await expect(saveBtn).toBeVisible({ timeout: 15000 });
        await expect(saveBtn).toHaveAttribute('aria-pressed', 'false');
        await expect(page.getByLabel('Wishlist, 0 items')).toBeVisible();

        await saveBtn.click();

        const removeBtn = page.getByRole('button', { name: `Remove ${product.name} from wishlist` });
        await expect(removeBtn).toBeVisible();
        await expect(removeBtn).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByLabel('Wishlist, 1 items')).toBeVisible();

        // Toggle back off
        await removeBtn.click();
        await expect(saveBtn).toHaveAttribute('aria-pressed', 'false');
        await expect(page.getByLabel('Wishlist, 0 items')).toBeVisible();
    });
});

test.describe('Product page — content sections', () => {
    test('"Details & Care" accordion expands and collapses', async ({ page, request }) => {
        const product = await pickLiveProduct(request);
        await page.goto(`/product/${product.id}`);

        const detailsToggle = page.getByRole('button', { name: 'Details & Care' });
        await expect(detailsToggle).toBeVisible({ timeout: 15000 });

        // First panel is open by default — its "Weave" field is visible
        const weaveField = page.getByText('Weave', { exact: true });
        await expect(weaveField).toBeVisible();

        // Collapse
        await detailsToggle.click();
        await expect(weaveField).toBeHidden();

        // Expand again
        await detailsToggle.click();
        await expect(weaveField).toBeVisible();
    });

    test('provenance and reviews sections render; review form opens without submitting', async ({ page, request }) => {
        const product = await pickLiveProduct(request);
        await page.goto(`/product/${product.id}`);

        // Provenance ("The Journey of the Saree") section
        await expect(
            page.getByRole('heading', { name: 'The Journey of the Saree' })
        ).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('heading', { name: 'The Loom' })).toBeVisible();

        // Reviews section heading
        await expect(page.getByRole('heading', { name: 'Reviews', exact: true })).toBeVisible();

        // Open the write-a-review form — assert fields only, NEVER submit
        const writeToggle = page.getByRole('button', { name: 'Write a Review' });
        await expect(writeToggle).toHaveAttribute('aria-expanded', 'false');
        await writeToggle.click();
        await expect(writeToggle).toHaveAttribute('aria-expanded', 'true');
        await expect(page.getByLabel(/Your Name/)).toBeVisible();
        await expect(page.getByLabel(/Your Review/)).toBeVisible();
        await expect(page.getByRole('button', { name: 'Submit Review' })).toBeVisible();
        // Intentionally no submission: live database.
    });

    test('related products section renders when present', async ({ page, request }) => {
        const product = await pickLiveProduct(request);
        await page.goto(`/product/${product.id}`);
        await expect(
            page.getByRole('heading', { level: 1, name: product.name })
        ).toBeVisible({ timeout: 15000 });

        const related = page.locator('section[aria-label="Related products"]');
        if ((await related.count()) > 0) {
            await expect(related.getByRole('heading', { name: 'You May Also Adore' })).toBeVisible();
            expect(await related.locator('h3').count()).toBeGreaterThan(0);
        } else {
            // No sibling products from the same loom right now — tolerated.
            expect(await related.count()).toBe(0);
        }
    });

    test('page embeds Product JSON-LD structured data', async ({ page, request }) => {
        const product = await pickLiveProduct(request);
        await page.goto(`/product/${product.id}`);
        await expect(
            page.getByRole('heading', { level: 1, name: product.name })
        ).toBeVisible({ timeout: 15000 });

        const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
        const productLd = scripts.find((t) => t.includes('"@type":"Product"'));
        expect(productLd, 'a JSON-LD block with "@type":"Product" should exist').toBeTruthy();
        expect(productLd).toContain(product.name);
    });
});

test.describe('Product page — error handling', () => {
    test('unknown product id renders the product-specific 404 page', async ({ page }) => {
        await page.goto('/product/definitely-not-a-real-product-id-e2e');
        // /product/* uses its own cream 404 (the root one is obsidian, which would
        // clash with the light navbar this route renders).
        await expect(page.getByRole('heading', { name: /left the atelier/i })).toBeVisible({ timeout: 15000 });
        await expect(page.getByText('404', { exact: true })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Browse the Collection' })).toBeVisible();
    });
});
