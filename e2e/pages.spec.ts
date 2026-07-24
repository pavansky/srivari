import { test, expect, Page } from '@playwright/test';

/**
 * Read-only e2e coverage for the secondary pages of the maison.
 *
 * STRICTLY READ-ONLY: no checkout/newsletter/contact/admin submissions.
 * The only POST exercised is /api/orders/track with a fake id (a lookup).
 * Cart/wishlist live in localStorage, so mutating them is safe.
 */

/** Collect page console errors, ignoring favicon and third-party asset noise. */
function collectConsoleErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() !== 'error') return;
        const text = msg.text();
        const url = msg.location()?.url ?? '';
        const isFavicon = text.includes('favicon') || url.includes('favicon');
        const isThirdPartyAsset = /^https?:\/\//.test(url) && !url.includes('localhost');
        const isResource404 = text.includes('Failed to load resource') && (isFavicon || isThirdPartyAsset);
        if (isFavicon || isThirdPartyAsset || isResource404) return;
        errors.push(text);
    });
    return errors;
}

test.describe('The Wishlist', () => {
    test('shows the empty state with a CTA back to the shop', async ({ page }) => {
        await page.goto('/wishlist');

        await expect(page.getByRole('heading', { name: /Your wishlist awaits/i })).toBeVisible();
        await expect(
            page.getByText(/Save the drapes that speak to you/i)
        ).toBeVisible();

        const cta = page.getByRole('link', { name: /Explore Collection/i });
        await expect(cta).toBeVisible();
        await expect(cta).toHaveAttribute('href', '/shop');
    });

    test('saving a piece from its product page adds it to the wishlist, and it can be removed', async ({ page }) => {
        // Derive a live product from the shop grid instead of hardcoding.
        await page.goto('/shop');
        const firstCard = page.locator('a[aria-label^="View "]').first();
        await expect(firstCard).toBeVisible();

        const label = (await firstCard.getAttribute('aria-label'))!;
        const name = label.replace(/^View /, '');
        const href = (await firstCard.getAttribute('href'))!;
        expect(href).toContain('/product/');

        // Visit the product page and tap the heart (localStorage only — safe).
        await page.goto(href);
        const saveButton = page.getByRole('button', { name: `Save ${name} to wishlist` });
        await expect(saveButton).toBeVisible();
        await saveButton.click();

        // The heart toggles to its "remove" state once saved.
        await expect(
            page.getByRole('button', { name: `Remove ${name} from wishlist` })
        ).toBeVisible();

        // The piece now appears on the wishlist page.
        await page.goto('/wishlist');
        await expect(page.getByRole('heading', { name: 'Saved Masterpieces' })).toBeVisible();
        await expect(page.getByRole('heading', { name, exact: true }).first()).toBeVisible();
        await expect(page.getByText(/1 Item/i)).toBeVisible();

        // Remove it again and land back on the empty state.
        await page.getByRole('button', { name: `Remove ${name} from wishlist` }).click();
        await expect(page.getByRole('heading', { name: /Your wishlist awaits/i })).toBeVisible();
    });
});

test.describe('Concierge Tracking', () => {
    test('renders the tracking form with order id and phone fields', async ({ page }) => {
        await page.goto('/order-tracking');

        await expect(page.locator('h2').filter({ hasText: 'Concierge Tracking' })).toBeVisible();
        await expect(page.getByLabel('Order ID')).toBeVisible();
        await expect(page.getByLabel(/Phone Number on the Order/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /Track Order/i })).toBeVisible();
    });

    test('a fake order id shows a friendly not-found message (read-only lookup)', async ({ page }) => {
        await page.goto('/order-tracking');

        await page.getByLabel('Order ID').fill('SR-000000');
        await page.getByLabel(/Phone Number on the Order/i).fill('0000000000');
        await page.getByRole('button', { name: /Track Order/i }).click();

        const alert = page.getByRole('alert').filter({ hasText: /No order found/i });
        await expect(alert).toBeVisible({ timeout: 15000 });
    });
});

test.describe('The Atelier', () => {
    test('reservation form builds a WhatsApp deep link with the guest details', async ({ page }) => {
        await page.goto('/atelier');
        await expect(page.getByRole('heading', { name: 'The Atelier', exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Request Consultation/i })).toBeVisible();

        // Fill out the consultation form.
        await page.getByPlaceholder(/Aishwarya/i).fill('Lady Diana');
        await page.locator('input[type="tel"]').fill('9876543210');
        await page.locator('select').selectOption({ label: 'Bridal Kanjivaram' });

        // Intercept window.open so no WhatsApp tab actually opens.
        await page.evaluate(() => {
            window.open = ((url: string) => {
                (window as any).__interceptedUrl = url;
                return null;
            }) as any;
        });

        await page.getByRole('button', { name: /Reserve via WhatsApp/i }).click();

        const interceptedUrl: string = await page.evaluate(() => (window as any).__interceptedUrl);
        expect(interceptedUrl).toContain('wa.me');
        expect(decodeURIComponent(interceptedUrl)).toContain('Lady Diana');
        expect(decodeURIComponent(interceptedUrl)).toContain('Bridal Kanjivaram');
    });
});

test.describe('About & Contact', () => {
    test('the heritage page tells the Srivari story', async ({ page }) => {
        await page.goto('/about');

        await expect(page.getByRole('heading', { name: 'Our Heritage' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'The Srivari Legacy' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Our Values' })).toBeVisible();
        await expect(page.getByText(/finest handwoven silks/i)).toBeVisible();
    });

    test('the contact page renders headings and concierge channels (never submitted)', async ({ page }) => {
        await page.goto('/contact');

        await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Get in Touch' })).toBeVisible();

        // Contact channels are deep links, not a form on this page — assert they exist.
        await expect(page.getByRole('heading', { name: /Phone & WhatsApp/i })).toBeVisible();
        await expect(page.locator('a[href^="tel:"]').first()).toBeVisible();
        await expect(page.locator('a[href^="mailto:"]').first()).toBeVisible();
        await expect(page.getByText('support@thesrivari.com').first()).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Boutique' })).toBeVisible();
    });
});

test.describe('Policies', () => {
    test('the returns page renders the promise of perfection', async ({ page }) => {
        await page.goto('/returns');

        await expect(page.getByRole('heading', { name: /Our Promise of Perfection/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Our Returns Policy/i })).toBeVisible();
        await expect(page.getByText(/we generally do not accept returns or exchanges/i)).toBeVisible();
        await expect(page.getByRole('heading', { name: /Damaged Packages/i })).toBeVisible();
    });

    test('the shipping policy page renders the journey details', async ({ page }) => {
        await page.goto('/shipping-policy');

        await expect(page.getByRole('heading', { name: /The Journey to You/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Domestic Shipping' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'International Dispatch' })).toBeVisible();
        await expect(page.getByText(/5-7 business days/i)).toBeVisible();
    });
});

test.describe('Virtual Try-On', () => {
    test('the AI mirror shell renders without console errors', async ({ page }) => {
        const errors = collectConsoleErrors(page);

        await page.goto('/try-on');

        await expect(page.getByRole('heading', { name: /Experience the Drape/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Upload Your Photo/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Select Saree/i })).toBeVisible();
        await expect(page.getByLabel('Upload your photo')).toBeAttached();

        // Let client hydration and the product fetch settle briefly.
        await page.waitForTimeout(500);
        expect(errors).toEqual([]);
    });
});

test.describe('Authentication surfaces', () => {
    test('the login page offers social sign-in', async ({ page }) => {
        await page.goto('/login');

        await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Continue with Facebook/i })).toBeVisible();
        await expect(page.getByText(/Secure Access/i)).toBeVisible();
    });

    test('/orders redirects unauthenticated visitors toward account/login', async ({ page }) => {
        await page.goto('/orders');
        await page.waitForURL(/\/(account|login)(\?.*)?$/, { timeout: 15000 });
        await expect(page).toHaveURL(/\/(account|login)(\?.*)?$/);
    });

    test('/account redirects unauthenticated visitors to /login', async ({ page }) => {
        await page.goto('/account');
        await page.waitForURL(/\/login(\?.*)?$/, { timeout: 15000 });
        await expect(page).toHaveURL(/\/login(\?.*)?$/);
    });
});

test.describe('SEO endpoints', () => {
    test('sitemap.xml responds 200 and lists the shop', async ({ request }) => {
        const res = await request.get('/sitemap.xml');
        expect(res.status()).toBe(200);
        const body = await res.text();
        expect(body).toContain('<urlset');
        expect(body).toContain('/shop');
    });

    test('robots.txt responds 200 with crawl rules', async ({ request }) => {
        const res = await request.get('/robots.txt');
        expect(res.status()).toBe(200);
        const body = await res.text();
        expect(body).toContain('User-Agent');
        expect(body).toContain('Disallow: /admin/');
    });
});
