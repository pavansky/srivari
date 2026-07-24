import { test, expect, type Page } from '@playwright/test';

/**
 * Homepage (/) e2e coverage — STRICTLY READ-ONLY.
 * No forms are ever submitted; no write APIs are ever called.
 */

/** Hero wordmark — scoped to <main> because the navbar logo is also an h1 "THE SRIVARI". */
const heroWordmark = (page: Page) =>
    page.locator('main').getByRole('heading', { name: 'THE SRIVARI', level: 1 });

test.describe('Homepage — hero', () => {
    test('renders wordmark, tagline and Explore CTA', async ({ page }) => {
        await page.goto('/');

        await expect(heroWordmark(page)).toBeVisible();
        await expect(page.getByText('Royalty Woven').first()).toBeVisible();
        await expect(
            page.getByText(/Handwoven silk sarees for the modern royalty/i)
        ).toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Explore the Collection' })
        ).toBeVisible();
    });

    test('Explore CTA scrolls to the collections section without changing the URL', async ({ page }) => {
        await page.goto('/');

        const cta = page.getByRole('button', { name: 'Explore the Collection' });
        await expect(cta).toBeVisible();
        await cta.click();

        // Smooth-scroll target is #collections (Shop by Collection); URL must not change.
        await expect(page).toHaveURL('/');
        await expect(
            page.getByRole('heading', { name: 'Shop by Collection' })
        ).toBeInViewport({ timeout: 10000 });
    });
});

test.describe('Homepage — major sections', () => {
    test('Shop by Collection tiles link to /shop?category=…', async ({ page }) => {
        await page.goto('/');

        await expect(
            page.getByRole('heading', { name: 'Shop by Collection' })
        ).toBeVisible();

        const tiles = page.locator('#collections a[aria-label^="Shop the "]');
        const count = await tiles.count();
        expect(count).toBeGreaterThanOrEqual(3);

        for (let i = 0; i < count; i++) {
            const href = await tiles.nth(i).getAttribute('href');
            expect(href).toMatch(/^\/shop\?category=/);
        }

        // Spot-check a known-stable category tile.
        await expect(
            page.getByRole('link', { name: 'Shop the Kanjivaram collection' })
        ).toHaveAttribute('href', /\/shop\?category=Kanjivaram/);
    });

    test('Featured Masterpieces and The Srivari Legacy sections render', async ({ page }) => {
        await page.goto('/');

        await expect(
            page.getByRole('heading', { name: 'Featured Masterpieces' })
        ).toBeVisible();
        await expect(
            page.getByRole('heading', { name: 'The Srivari Legacy' })
        ).toBeVisible();
    });

    test('New Arrivals renders product cards with names and product links', async ({ page }) => {
        await page.goto('/');

        const section = page
            .locator('section')
            .filter({ has: page.getByRole('heading', { name: 'New Arrivals' }) });
        await expect(section.getByRole('heading', { name: 'New Arrivals' })).toBeVisible();

        const cardLinks = section.locator('a[aria-label^="View "]');
        const count = await cardLinks.count();
        expect(count).toBeGreaterThanOrEqual(1);
        expect(count).toBeLessThanOrEqual(4);

        for (let i = 0; i < count; i++) {
            const href = await cardLinks.nth(i).getAttribute('href');
            expect(href).toMatch(/^\/product\//);
        }

        // Each card shows its name in an <h3>.
        const firstName = (await section.locator('.group h3').first().textContent())?.trim();
        expect(firstName?.length).toBeGreaterThan(0);
    });

    test('Royal Patrons shows a testimonial quote', async ({ page }) => {
        await page.goto('/');

        const section = page
            .locator('section')
            .filter({ has: page.getByRole('heading', { name: 'Royal Patrons' }) });
        await expect(section.getByRole('heading', { name: 'Royal Patrons' })).toBeVisible();

        const quote = section.locator('blockquote');
        await expect(quote).toBeVisible();
        const text = (await quote.textContent())?.trim();
        expect(text?.length).toBeGreaterThan(10);
    });

    test('Follow Our Journey band links to the Srivari Instagram', async ({ page }) => {
        await page.goto('/');

        await expect(
            page.getByRole('heading', { name: 'Follow Our Journey' })
        ).toBeVisible();

        const handle = page.getByRole('link', { name: '@thesrivari' });
        await expect(handle).toBeVisible();
        await expect(handle).toHaveAttribute('href', /instagram\.com\/thesrivari/);
    });

    test('newsletter band shows heading and email input (never submitted)', async ({ page }) => {
        await page.goto('/');

        await expect(
            page.getByRole('heading', { name: 'First to the Loom' })
        ).toBeVisible();

        // Scoped by id — the footer carries a second newsletter form.
        const email = page.locator('#home-newsletter-email');
        await expect(email).toBeVisible();
        await expect(email).toHaveAttribute('type', 'email');
        await expect(email).toHaveAttribute('placeholder', 'Your email address');

        // The Join button exists next to it. DO NOT click / submit — live database.
        const band = page
            .locator('section')
            .filter({ has: page.getByRole('heading', { name: 'First to the Loom' }) });
        await expect(band.getByRole('button', { name: 'Join' })).toBeVisible();
    });

    test('footer renders shop, order-tracking and social links', async ({ page }) => {
        await page.goto('/');

        const footer = page.getByRole('contentinfo');
        await footer.scrollIntoViewIfNeeded();

        await expect(
            footer.getByRole('link', { name: 'Shop All Sarees' })
        ).toHaveAttribute('href', '/shop');
        await expect(
            footer.getByRole('link', { name: 'Order Tracking' })
        ).toHaveAttribute('href', '/order-tracking');
        await expect(
            footer.getByRole('link', { name: 'The Srivari on Instagram' })
        ).toHaveAttribute('href', /instagram\.com\/thesrivari/);
        await expect(
            footer.getByRole('link', { name: 'The Srivari on Facebook' })
        ).toHaveAttribute('href', /facebook\.com/);
    });
});

test.describe('Homepage — navbar', () => {
    test('all five nav links point at the right routes', async ({ page }) => {
        await page.goto('/');

        const nav = page.getByRole('navigation', { name: 'Main Navigation' });
        await expect(nav).toBeVisible();

        const expected: Array<[string, string]> = [
            ['SHOP', '/shop'],
            ['COLLECTIONS', '/collections'],
            ['ATELIER', '/atelier'],
            ['ABOUT', '/about'],
            ['CONTACT', '/contact'],
        ];
        for (const [label, href] of expected) {
            const link = nav.getByRole('menuitem', { name: label, exact: true });
            await expect(link).toBeVisible();
            await expect(link).toHaveAttribute('href', href);
        }

        // Icon actions present too.
        await expect(nav.getByRole('button', { name: 'Open search' })).toBeVisible();
        await expect(nav.getByRole('link', { name: /^Wishlist/ })).toBeVisible();
        await expect(nav.getByRole('link', { name: /^Shopping bag/ })).toBeVisible();
    });

    test('SHOP link navigates to /shop and back returns home', async ({ page }) => {
        await page.goto('/');

        const nav = page.getByRole('navigation', { name: 'Main Navigation' });
        await nav.getByRole('menuitem', { name: 'SHOP', exact: true }).click();
        await expect(page).toHaveURL(/\/shop/, { timeout: 30000 });

        await page.goBack();
        await expect(page).toHaveURL('/', { timeout: 30000 });
        await expect(heroWordmark(page)).toBeVisible();
    });

    test('search overlay opens via "Open search" and closes with Escape', async ({ page }) => {
        await page.goto('/');

        await page.getByRole('button', { name: 'Open search' }).click();

        const overlay = page.getByRole('dialog', { name: 'Search the store' });
        await expect(overlay).toBeVisible();
        await expect(
            overlay.getByPlaceholder(/Search 'Kanjivaram'/)
        ).toBeVisible();

        await page.keyboard.press('Escape');
        await expect(overlay).toBeHidden();
    });
});

test.describe('Homepage — product navigation', () => {
    test('clicking a New Arrivals card opens its product page', async ({ page }) => {
        await page.goto('/');

        const section = page
            .locator('section')
            .filter({ has: page.getByRole('heading', { name: 'New Arrivals' }) });
        const firstCard = section.locator('a[aria-label^="View "]').first();
        await expect(firstCard).toBeVisible();

        const href = await firstCard.getAttribute('href');
        expect(href).toMatch(/^\/product\/.+/);

        await firstCard.scrollIntoViewIfNeeded();
        await firstCard.click();
        await page.waitForURL(/\/product\/.+/, { timeout: 45000 });
        expect(new URL(page.url()).pathname).toBe(href);
    });
});

test.describe('Homepage — console hygiene', () => {
    test('no console errors on load', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() !== 'error') return;
            const url = msg.location()?.url ?? '';
            // Ignore favicon 404s and failures from third-party hosts (image CDNs etc.).
            if (url.includes('favicon')) return;
            if (/^https?:\/\//.test(url) && !url.includes('localhost')) return;
            if (msg.text().includes('favicon')) return;
            // Ignore 429s: parallel e2e workers can trip the dev server's rate
            // limiter — self-inflicted test load, not a page defect.
            if (msg.text().includes('429 (Too Many Requests)')) return;
            errors.push(`${msg.text()}${url ? ` (${url})` : ''}`);
        });

        await page.goto('/');
        await expect(heroWordmark(page)).toBeVisible();
        // Give hydration + entrance animations a beat to surface any runtime errors.
        await page.waitForTimeout(500);

        expect(errors).toEqual([]);
    });
});

test.describe('Homepage — mobile smoke (375x812)', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('hero renders and the hamburger drawer opens and closes', async ({ page }) => {
        await page.goto('/');

        await expect(heroWordmark(page)).toBeVisible();

        // Open the drawer.
        await page.getByRole('button', { name: 'Toggle mobile menu' }).click();
        const drawer = page.getByRole('dialog', { name: 'Mobile menu' });
        await expect(drawer).toBeVisible();

        // Nav links inside the drawer.
        for (const label of ['HOME', 'SHOP', 'COLLECTIONS', 'ATELIER', 'ABOUT', 'CONTACT']) {
            await expect(drawer.getByRole('link', { name: label, exact: true })).toBeVisible();
        }

        // Close the drawer.
        await drawer.getByRole('button', { name: 'Close mobile menu' }).click();
        await expect(drawer).toBeHidden();
    });
});
