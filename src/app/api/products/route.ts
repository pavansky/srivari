import { NextResponse } from 'next/server';
import { getProducts, saveProduct, deleteProduct, lastGetProductsError } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

// --- Product API ---

/**
 * GET Handler
 * Retrieves all products. Public — but archived products (and admin-only cost
 * fields) are only included for authenticated admins.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('archived') === 'true';

    try {
        // Simple Rate Limiting (100 reqs/min per IP by default). Locally, every
        // request shares one "anonymous" bucket, so e2e runs need a higher cap —
        // override via PRODUCTS_RATE_LIMIT in .env.local only.
        const ip = request.headers.get('x-forwarded-for') || 'anonymous';
        const limiter = rateLimit(ip, Number(process.env.PRODUCTS_RATE_LIMIT) || 100);

        if (!limiter.success) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        let isAdmin = false;
        if (includeArchived) {
            isAdmin = !(await requireAdmin(request));
        }

        const products = await getProducts(includeArchived && isAdmin);

        // Signal a swallowed DB outage (getProducts returned [] on error) so
        // admin surfaces can distinguish it from a genuinely empty catalogue.
        // Header only — the 200 + [] body keeps lenient public consumers working.
        const headers = lastGetProductsError ? { 'X-Data-Unavailable': '1' } : undefined;

        if (isAdmin) return NextResponse.json(products, headers ? { headers } : undefined);

        // Strip internal cost/supplier fields from the public payload
        const publicProducts = products.map(({ priceCps, shipping, supplierId, supplierName, locationBin, ...rest }) => rest);
        return NextResponse.json(publicProducts, headers ? { headers } : undefined);
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

/**
 * POST Handler — admin only.
 * Saves (Create/Update) a product.
 */
export async function POST(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const body = await request.json();
        if (!body?.name || typeof body.name !== 'string') {
            return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
        }
        const saved = await saveProduct(body);
        return NextResponse.json({ success: true, product: saved });
    } catch (e) {
        console.error("POST /api/products ERROR:", e);
        return NextResponse.json({ error: 'Failed to save', details: e instanceof Error ? e.message : String(e) }, { status: 500 });
    }
}

/**
 * PUT Handler — admin only.
 * Same as POST, handles updates for inline stock editing and bulk operations.
 */
export async function PUT(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const body = await request.json();
        const saved = await saveProduct(body);
        return NextResponse.json({ success: true, product: saved });
    } catch (e) {
        console.error("PUT /api/products ERROR:", e);
        return NextResponse.json({ error: 'Failed to update', details: e instanceof Error ? e.message : String(e) }, { status: 500 });
    }
}

/**
 * DELETE Handler — admin only.
 * Soft-deletes (archives) a product by ID (passed as query param).
 */
export async function DELETE(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await deleteProduct(id);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}

/**
 * PATCH Handler — admin only.
 * Restores a softly deleted product by ID (passed as query param).
 */
export async function PATCH(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const action = searchParams.get('action');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        if (action === 'restore') {
            const { restoreProduct } = await import('@/lib/db');
            await restoreProduct(id);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to process patch' }, { status: 500 });
    }
}
