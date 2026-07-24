import { test, expect, Page } from '@playwright/test';

/**
 * E2E coverage for /shop — the maison "Collection" page.
 *
 * STRICTLY READ-ONLY: these tests never submit forms or call writing APIs.
 * Filtering, sorting, view modes and the quick-view modal are all client-side.
 */

/** Quick-view buttons exist 1:1 with product cards on /shop (both grid & list). */
const quickViewButtons = (page: Page) =>
    page.locator('button[aria-label^="Quick view of"]');

/** A product card root: the .group element that owns a quick-view button. */
const productCards = (page: Page) =>
    page
        .locator('div.group')
        .filter({ has: page.locator('button[aria-label^="Quick view of"]') });

/** Parse N from the "Showing N items" command-bar label (lg viewports only). */
async function getShowingCount(page: Page): Promise<number> {
    const label = page.getByText(/Showing \d+ items/i);
    await expect(label).toBeVisible();
    const text = (await label.textContent()) ?? '';
    return Number(text.match(/\d+/)![0]);
}

/** Card prices in DOM order, parsed from the ₹x,xxx serif spans. */
async function getCardPrices(page: Page): Promise<number[]> {
    const texts = await productCards(page).locator('span.font-serif').allTextContents();
    return texts
        .filter((t) => t.includes('₹'))
        .map((t) => Number(t.replace(/[^0-9]/g, '')))
        .filter((n) => n > 0);
}

async function openFilterDrawer(page: Page) {
    await page.getByRole('button', { name: /Filter & Sort/ }).click();
    await expect(page.getByRole('heading', { name: 'Filter & Sort' })).toBeVisible();
}

/** Close the drawer and wait for its exit animation to fully unmount it. */
async function closeFilterDrawer(page: Page, via: 'close' | 'results' = 'close') {
    if (via === 'results') {
        await page.getByRole('button', { name: /View Results/ }).click();
    } else {
        await page.getByRole('button', { name: 'Close filters' }).click();
    }
    await expect(page.getByRole('heading', { name: 'Filter & Sort' })).toBeHidden();
}

test.describe('Shop — editorial header & product grid', () => {
    test('renders the Collection header band and a populated grid whose count matches the label', async ({ page }) => {
        await page.goto('/shop');

        // sr-only page h1 + visible SectionHeader h2
        await expect(
            page.getByRole('heading', { level: 1, name: 'The Collection' }),
        ).toHaveCount(1);
        await expect(
            page.getByRole('heading', { level: 2, name: 'The Collection' }),
        ).toBeVisible();
        await expect(page.getByText('The Srivari Atelier')).toBeVisible();

        // At least one product card, and "Showing N items" agrees with the card count
        await expect(productCards(page).first()).toBeVisible();
        const shown = await getShowingCount(page);
        expect(shown).toBeGreaterThanOrEqual(1);
        await expect(quickViewButtons(page)).toHaveCount(shown);
    });
});

test.describe('Shop — filter drawer', () => {
    test('drawer exposes search, sort, price, availability and category controls; category filter applies and clears', async ({ page }) => {
        await page.goto('/shop');
        await expect(productCards(page).first()).toBeVisible();
        const fullCount = await getShowingCount(page);

        await openFilterDrawer(page);

        // Search
        await expect(page.getByLabel('Search collection')).toBeVisible();

        // Sort options
        for (const opt of ['Featured', 'Newest Arrivals', 'Price: Low to High', 'Price: High to Low']) {
            await expect(page.getByRole('button', { name: opt })).toBeVisible();
        }

        // Price range: min/max inputs, slider, preset chips
        await expect(page.getByLabel('Min', { exact: true })).toBeVisible();
        await expect(page.getByLabel('Max', { exact: true })).toBeVisible();
        await expect(page.getByLabel('Maximum price')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Under ₹5,000' })).toBeVisible();
        await expect(page.getByRole('button', { name: '₹30,000+' })).toBeVisible();

        // Availability switch
        await expect(page.getByRole('switch', { name: 'In stock only' })).toBeVisible();

        // Category checkboxes (derived from live catalogue)
        const checkboxes = page.getByRole('checkbox');
        expect(await checkboxes.count()).toBeGreaterThanOrEqual(1);

        // Apply the first category filter
        const firstCategoryRow = page
            .locator('label')
            .filter({ has: page.getByRole('checkbox') })
            .first();
        const categoryName = (await firstCategoryRow.innerText()).trim();
        await firstCategoryRow.getByRole('checkbox').check();
        await expect(firstCategoryRow.getByRole('checkbox')).toBeChecked();

        await closeFilterDrawer(page, 'results');

        // Active chip is shown and the grid reflects the filter
        await expect(
            page.getByRole('button', { name: `Remove ${categoryName} filter` }),
        ).toBeVisible();
        const filteredCount = await getShowingCount(page);
        expect(filteredCount).toBeGreaterThanOrEqual(1);
        expect(filteredCount).toBeLessThanOrEqual(fullCount);
        await expect(quickViewButtons(page)).toHaveCount(filteredCount);

        // Clear all resets the grid and removes the chip
        await page.getByRole('button', { name: 'Clear All' }).click();
        await expect(
            page.getByRole('button', { name: `Remove ${categoryName} filter` }),
        ).toBeHidden();
        await expect(quickViewButtons(page)).toHaveCount(fullCount);
    });

    test('search inside the drawer filters the grid by name', async ({ page }) => {
        await page.goto('/shop');
        await expect(productCards(page).first()).toBeVisible();

        await openFilterDrawer(page);
        await page.getByLabel('Search collection').fill('Ivory');
        await closeFilterDrawer(page, 'results');

        await expect(
            page.getByRole('heading', { level: 3, name: 'Ivory', exact: true }),
        ).toBeVisible();
        await expect(quickViewButtons(page)).toHaveCount(1);
        await expect(quickViewButtons(page).first()).toHaveAttribute(
            'aria-label',
            'Quick view of Ivory',
        );
    });

    test('sorting by Price: Low to High orders cards by ascending price', async ({ page }) => {
        await page.goto('/shop');
        await expect(productCards(page).first()).toBeVisible();

        await openFilterDrawer(page);
        await page.getByRole('button', { name: 'Price: Low to High' }).click();
        await closeFilterDrawer(page, 'results');

        await expect
            .poll(async () => {
                const prices = await getCardPrices(page);
                if (prices.length < 2) return 'not-enough-prices';
                const ascending = prices.every((p, i) => i === 0 || prices[i - 1] <= p);
                return ascending && prices[0] <= prices[prices.length - 1]
                    ? 'ascending'
                    : `unsorted: ${prices.join(',')}`;
            })
            .toBe('ascending');
    });
});

test.describe('Shop — view modes', () => {
    test('toggles between list view and standard grid view', async ({ page }) => {
        await page.goto('/shop');
        await expect(productCards(page).first()).toBeVisible();

        // Default is standard grid
        await expect(
            page.getByRole('button', { name: 'Standard grid view' }),
        ).toHaveAttribute('aria-pressed', 'true');

        // Switch to list view — list cards use the "View details of <name>" links
        await page.getByRole('button', { name: 'List view' }).click();
        await expect(page.getByRole('button', { name: 'List view' })).toHaveAttribute(
            'aria-pressed',
            'true',
        );
        await expect(
            page.locator('a[aria-label^="View details of"]').first(),
        ).toBeVisible();

        // Back to grid — list-specific links disappear, cards remain
        await page.getByRole('button', { name: 'Standard grid view' }).click();
        await expect(
            page.getByRole('button', { name: 'Standard grid view' }),
        ).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('a[aria-label^="View details of"]')).toHaveCount(0);
        await expect(productCards(page).first()).toBeVisible();
    });
});

test.describe('Shop — quick view', () => {
    test('opens the quick-view modal with name, price and add-to-cart CTA, then closes it', async ({ page }) => {
        await page.goto('/shop');
        const card = productCards(page).first();
        await expect(card).toBeVisible();

        // Derive the product name from the card's own quick-view button
        const qvButton = card.locator('button[aria-label^="Quick view of"]');
        const label = (await qvButton.getAttribute('aria-label'))!;
        const name = label.replace(/^Quick view of /, '');

        // The action rail is revealed on hover
        await card.hover();
        await qvButton.click();

        // Modal: product name (h2), a serif ₹ price line, and the CTA
        await expect(
            page.getByRole('heading', { level: 2, name, exact: true }),
        ).toBeVisible();
        await expect(page.locator('p.font-serif').filter({ hasText: '₹' })).toBeVisible();
        await expect(
            page.getByRole('button', { name: /Add to Cart|Out of Stock/ }),
        ).toBeVisible();
        await expect(page.getByRole('link', { name: /View Full Details/ })).toBeVisible();

        // Close it
        await page.getByRole('button', { name: 'Close quick view' }).click();
        await expect(
            page.getByRole('heading', { level: 2, name, exact: true }),
        ).toBeHidden();
    });
});

test.describe('Shop — deep links', () => {
    test('/shop?category=Silk pre-applies the category filter with an active chip', async ({ page }) => {
        await page.goto('/shop?category=Silk');

        await expect(
            page.getByRole('button', { name: 'Remove Silk filter' }),
        ).toBeVisible();
        await expect(productCards(page).first()).toBeVisible();
        const shown = await getShowingCount(page);
        expect(shown).toBeGreaterThanOrEqual(1);
        await expect(quickViewButtons(page)).toHaveCount(shown);
    });

    test('/shop?q=Ivory shows the matching product', async ({ page }) => {
        await page.goto('/shop?q=Ivory');

        await expect(
            page.getByRole('heading', { level: 3, name: 'Ivory', exact: true }),
        ).toBeVisible();
        await expect(quickViewButtons(page)).toHaveCount(1);

        // The deep-linked query is reflected inside the filter drawer's search box
        await openFilterDrawer(page);
        await expect(page.getByLabel('Search collection')).toHaveValue('Ivory');
    });
});

test.describe('Shop — console hygiene', () => {
    test('loads without console errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() !== 'error') return;
            const url = msg.location().url || '';
            // Ignore favicon 404s and failed loads from third-party image hosts
            if (url.includes('favicon')) return;
            if (url && !url.includes('localhost:3000')) return;
            errors.push(`${msg.text()} (${url})`);
        });

        await page.goto('/shop');
        await expect(productCards(page).first()).toBeVisible();
        await page.waitForTimeout(500); // allow hydration/entrance animations to settle

        expect(errors).toEqual([]);
    });
});
