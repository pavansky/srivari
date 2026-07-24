import { test, expect, Page, ConsoleMessage } from '@playwright/test';

/**
 * Admin console (Command Center) — STRICTLY READ-ONLY smoke tests.
 *
 * Dev bypass (NEXT_PUBLIC_ADMIN_DEV_BYPASS=1) makes /admin reachable without
 * a session. These tests only navigate and assert rendering. They never click
 * Save / Add / Delete / Approve / status selects / toggles, and never submit
 * any form — opening and closing modals/collapsible forms is the limit.
 */

const SIDEBAR_NAV = [
    'Dashboard',
    'Products',
    'Orders',
    'Customers',
    'Analytics',
    'Coupons',
    'Reviews',
    'Suppliers',
];

const sidebar = (page: Page) => page.locator('aside');

test.describe('Admin dashboard (/admin)', () => {
    test('sidebar shows Command Center branding, all 8 nav entries and Quick search', async ({ page }) => {
        await page.goto('/admin');
        const aside = sidebar(page);
        await expect(aside.getByText('Command Center')).toBeVisible({ timeout: 30000 });
        await expect(aside.getByText('The Srivari')).toBeVisible();
        for (const label of SIDEBAR_NAV) {
            await expect(aside.getByRole('link', { name: label })).toBeVisible();
        }
        await expect(aside.getByRole('button', { name: /Quick search/ })).toBeVisible();
    });

    test('stat cards, Needs Attention panel and Recent Orders block render', async ({ page }) => {
        await page.goto('/admin');
        await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible({ timeout: 30000 });

        for (const label of ['Total Revenue', 'Active Orders', 'Stock Value', 'Stock Alerts', "Today's Orders"]) {
            await expect(page.getByText(label, { exact: true })).toBeVisible();
        }

        await expect(page.getByRole('heading', { name: '14-Day Revenue' })).toBeVisible();

        await expect(page.getByRole('heading', { name: 'Needs Attention' })).toBeVisible();
        await expect(page.getByText('Orders awaiting action')).toBeVisible();
        await expect(page.getByText('Low stock pieces')).toBeVisible();
        await expect(page.getByText('Reviews to moderate')).toBeVisible();

        await expect(page.getByRole('heading', { name: 'Recent Orders' })).toBeVisible();
        await expect(page.getByRole('link', { name: /View all/ })).toBeVisible();
    });

    test('no console errors on the dashboard', async ({ page }) => {
        const errors: string[] = [];
        const isIgnored = (msg: ConsoleMessage) => {
            const url = msg.location().url || '';
            const text = msg.text();
            if (/favicon/i.test(url) || /favicon/i.test(text)) return true;
            // Resource failures from third-party hosts (image CDNs etc.)
            if (url && !url.includes('localhost:3000')) return true;
            return false;
        };
        page.on('console', msg => {
            if (msg.type() !== 'error') return;
            if (isIgnored(msg)) return;
            errors.push(`${msg.text()} [${msg.location().url}]`);
        });

        await page.goto('/admin');
        await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible({ timeout: 30000 });
        // Let the admin data fetches settle before judging the console
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

        expect(errors).toEqual([]);
    });

    test('Cmd+K command palette opens via keyboard and Quick search button, closes with Escape', async ({ page }) => {
        await page.goto('/admin');
        const aside = sidebar(page);
        await expect(aside.getByRole('link', { name: 'Dashboard' })).toBeVisible({ timeout: 30000 });

        const paletteInput = page.getByLabel('Command palette search');

        // Keyboard shortcut
        await page.keyboard.press('ControlOrMeta+k');
        await expect(paletteInput).toBeVisible();
        await expect(page.getByText('Navigate', { exact: true })).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(paletteInput).toBeHidden();

        // Quick search button
        await aside.getByRole('button', { name: /Quick search/ }).click();
        await expect(paletteInput).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(paletteInput).toBeHidden();
    });
});

test.describe('Admin products (/admin/products)', () => {
    test('filters bar, product rows with prices and stock steppers, Import/Export render', async ({ page }) => {
        await page.goto('/admin/products');
        await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible({ timeout: 30000 });

        // Filters bar
        await expect(page.getByLabel('Search products')).toBeVisible();
        await expect(page.getByLabel('Filter by category')).toBeVisible();
        await expect(page.getByLabel('Filter by supplier')).toBeVisible();
        await expect(page.getByLabel('Filter by stock level')).toBeVisible();
        await expect(page.getByLabel('Sort products')).toBeVisible();

        // Import / Export / Add controls
        await expect(page.getByRole('button', { name: 'Import CSV' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Export CSV' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Add Product' })).toBeVisible();

        // Wait for live inventory to load
        await expect(page.getByText(/active piece/)).toBeVisible({ timeout: 30000 });

        // Desktop table rows: name, price, stock steppers present (never clicked)
        const rows = page.locator('table tbody tr');
        await expect(rows.first()).toBeVisible({ timeout: 30000 });
        const firstRow = rows.first();
        await expect(firstRow.locator('td').nth(1).locator('p').first()).toHaveText(/\S/);
        await expect(firstRow.getByText(/₹/).first()).toBeVisible();
        await expect(firstRow.getByRole('button', { name: /Increase stock for/ })).toBeVisible();
        await expect(firstRow.getByRole('button', { name: /Decrease stock for/ })).toBeVisible();
    });

    test('"Add Product" toggles the form open and closed without saving', async ({ page }) => {
        await page.goto('/admin/products');
        await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible({ timeout: 30000 });

        await page.getByRole('button', { name: 'Add Product' }).click();

        const nameInput = page.getByPlaceholder('e.g. Royal Kanjivaram Silk');
        await expect(nameInput).toBeVisible();
        await expect(page.getByText('Product Name', { exact: true })).toBeVisible();
        await expect(page.getByText('Selling Price', { exact: true })).toBeVisible();
        await expect(page.getByText('Inventory Stock', { exact: true })).toBeVisible();
        await expect(page.getByText('Product Category', { exact: true })).toBeVisible();

        // Close (the toggle button now reads "Close") — nothing is saved
        await page.getByRole('button', { name: 'Close', exact: true }).click();
        await expect(nameInput).toBeHidden();
        await expect(page.getByRole('button', { name: 'Add Product' })).toBeVisible();
    });
});

test.describe('Admin orders (/admin/orders)', () => {
    test('status tabs with counts, search input and ledger render', async ({ page }) => {
        await page.goto('/admin/orders');
        await expect(page.getByRole('heading', { name: 'Order Ledger' })).toBeVisible({ timeout: 30000 });

        for (const label of ['All', 'Needs Action', 'Shipped', 'Delivered', 'Cancelled']) {
            await expect(
                page.getByRole('button', { name: new RegExp(`^${label}\\s+\\d+$`) })
            ).toBeVisible();
        }
        await expect(page.getByLabel('Search orders')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Record Manual Order' })).toBeVisible();

        // Loaded: order cards (status select per order) or the empty state
        const orderStatusSelect = page.getByLabel(/^Status for order /).first();
        const emptyState = page.getByText('No orders match');
        await expect(orderStatusSelect.or(emptyState).first()).toBeVisible({ timeout: 30000 });
    });

    test('"Record Manual Order" opens the modal with fields and closes without submitting', async ({ page }) => {
        await page.goto('/admin/orders');
        await expect(page.getByRole('heading', { name: 'Order Ledger' })).toBeVisible({ timeout: 30000 });

        await page.getByRole('button', { name: 'Record Manual Order' }).click();

        await expect(page.getByRole('heading', { name: 'Record Manual Order' })).toBeVisible();
        await expect(page.getByText('Customer Name *')).toBeVisible();
        await expect(page.getByText('Phone *', { exact: true })).toBeVisible();
        await expect(page.getByText('Email (optional)')).toBeVisible();
        await expect(page.getByLabel('Product', { exact: true })).toBeVisible();
        await expect(page.getByText('Quantity', { exact: true })).toBeVisible();
        // Submit button exists but is NEVER clicked
        await expect(page.getByRole('button', { name: 'Record Order' })).toBeVisible();

        await page.getByRole('button', { name: 'Close manual order form' }).click();
        await expect(page.getByRole('heading', { name: 'Record Manual Order' })).toBeHidden();
    });
});

test.describe('Admin customers (/admin/customers)', () => {
    test('stat cards and customer table or empty state render', async ({ page }) => {
        await page.goto('/admin/customers');
        await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible({ timeout: 30000 });

        for (const label of ['Total Customers', 'Repeat Rate', 'Avg Lifetime Value', 'New This Month']) {
            await expect(page.getByText(label, { exact: true })).toBeVisible();
        }
        await expect(page.getByLabel('Search customers')).toBeVisible();
        await expect(page.getByLabel('Sort customers')).toBeVisible();

        // Loaded state
        await expect(page.getByText(/unique customer/)).toBeVisible({ timeout: 30000 });

        const table = page.locator('table');
        const emptyState = page.getByText('No customers yet');
        await expect(table.or(emptyState).first()).toBeVisible();
    });
});

test.describe('Admin analytics (/admin/analytics)', () => {
    test('range pills switch and analytics cards render', async ({ page }) => {
        await page.goto('/admin/analytics');
        await expect(page.getByRole('heading', { name: 'Business Intelligence' })).toBeVisible({ timeout: 30000 });

        const pill7 = page.getByRole('button', { name: '7d' });
        const pill30 = page.getByRole('button', { name: '30d' });
        const pill90 = page.getByRole('button', { name: '90d' });
        await expect(pill30).toHaveAttribute('aria-pressed', 'true');

        // Switching ranges is a client-side, read-only interaction
        await pill7.click();
        await expect(pill7).toHaveAttribute('aria-pressed', 'true');
        await expect(pill30).toHaveAttribute('aria-pressed', 'false');
        await expect(page.getByRole('heading', { name: /Revenue · Last 7 days/ })).toBeVisible();

        await pill90.click();
        await expect(pill90).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByRole('heading', { name: /Revenue · Last 90 days/ })).toBeVisible();

        // Insight cards
        for (const heading of ['Order Funnel', 'Top Sellers', 'Revenue by Category', 'Top Customers', 'Inventory Health', 'Recent Activity']) {
            await expect(page.getByRole('heading', { name: heading })).toBeVisible();
        }

        for (const label of ['Revenue', 'Orders', 'Avg Order Value', 'Est. Gross Profit']) {
            await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
        }
    });
});

test.describe('Admin coupons (/admin/coupons)', () => {
    test('stat mini-cards and coupon list or empty state render', async ({ page }) => {
        await page.goto('/admin/coupons');
        await expect(page.getByRole('heading', { name: 'Coupons & Offers' })).toBeVisible({ timeout: 30000 });

        for (const label of ['Active Coupons', 'Total Redemptions', 'Expiring in 7 Days']) {
            await expect(page.getByText(label, { exact: true })).toBeVisible();
        }

        await expect(page.getByRole('heading', { name: 'All Coupons' })).toBeVisible();
        const table = page.locator('table');
        const emptyState = page.getByText('No coupons yet');
        await expect(table.or(emptyState).first()).toBeVisible({ timeout: 30000 });
    });

    test('"New Coupon" toggles the form open with fields and closes without saving', async ({ page }) => {
        await page.goto('/admin/coupons');
        await expect(page.getByRole('heading', { name: 'Coupons & Offers' })).toBeVisible({ timeout: 30000 });

        await page.getByRole('button', { name: 'New Coupon' }).click();

        const form = page.locator('form');
        const codeInput = form.getByPlaceholder('e.g. FESTIVE20');
        await expect(codeInput).toBeVisible();
        await expect(form.getByText('Code', { exact: true })).toBeVisible();
        await expect(form.getByText('Type', { exact: true })).toBeVisible();
        await expect(form.getByText('Value', { exact: true })).toBeVisible();
        await expect(form.getByText('Expires At', { exact: true })).toBeVisible();
        // Submit button exists but is NEVER clicked
        await expect(form.getByRole('button', { name: 'Create Coupon' })).toBeVisible();

        // Cancel is type="button" — closes without saving
        await form.getByRole('button', { name: 'Cancel', exact: true }).click();
        await expect(codeInput).toBeHidden();
        await expect(page.getByRole('button', { name: 'New Coupon' })).toBeVisible();
    });
});

test.describe('Admin reviews (/admin/reviews)', () => {
    test('moderation tabs and review cards or empty state render', async ({ page }) => {
        await page.goto('/admin/reviews');
        await expect(page.getByRole('heading', { name: 'Reviews' })).toBeVisible({ timeout: 30000 });

        for (const label of ['Pending', 'Approved', 'All']) {
            await expect(
                page.getByRole('button', { name: new RegExp(`^${label}\\s+\\d+$`) })
            ).toBeVisible();
        }
        await expect(page.getByText('Average Rating')).toBeVisible();

        // Loaded: either the tab's empty state or review star rows appear
        const emptyState = page.getByText(/No pending reviews|No approved reviews|No reviews yet/);
        const starRow = page.getByRole('img', { name: /out of 5 stars/ }).first();
        await expect(emptyState.or(starRow).first()).toBeVisible({ timeout: 30000 });
    });
});

test.describe('Admin suppliers (/admin/suppliers)', () => {
    test('supplier form card and list or empty state render (no save)', async ({ page }) => {
        await page.goto('/admin/suppliers');
        await expect(page.getByRole('heading', { name: 'Suppliers' })).toBeVisible({ timeout: 30000 });

        await expect(page.getByText('Total Suppliers')).toBeVisible();
        await expect(page.getByText('Products Linked')).toBeVisible();

        // Form card renders with all fields — form is NEVER submitted
        await expect(page.getByRole('heading', { name: 'Add Supplier' })).toBeVisible();
        const form = page.locator('form');
        await expect(form.getByText('Name *', { exact: true })).toBeVisible();
        await expect(form.getByText('Contact Person', { exact: true })).toBeVisible();
        await expect(form.getByText('Email', { exact: true })).toBeVisible();
        await expect(form.getByText('Phone', { exact: true })).toBeVisible();
        await expect(form.getByText('Address', { exact: true })).toBeVisible();
        await expect(form.getByText('Notes', { exact: true })).toBeVisible();
        await expect(form.getByRole('button', { name: 'Add Supplier' })).toBeVisible();

        await expect(page.getByLabel('Search suppliers')).toBeVisible();

        // Loaded: supplier cards (h4 vendor names) or the empty state
        const supplierCard = page.locator('h4').first();
        const emptyState = page.getByText('No suppliers yet');
        await expect(supplierCard.or(emptyState).first()).toBeVisible({ timeout: 30000 });
    });
});
