import { NextResponse } from 'next/server';
import { getProducts, saveProduct, deleteProduct, lastGetProductsError } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// --- Product API ---

/**
 * GET Handler
 * Retrieves all products.
 * 
 * @returns {NextResponse} JSON array of products or 500 Error
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('archived') === 'true';
    const debug = searchParams.get('debug') === 'true';

    try {
        // Simple Rate Limiting (100 reqs/min)
        const ip = request.headers.get('x-forwarded-for') || 'anonymous';
        const limiter = rateLimit(ip, 100);

        if (!limiter.success) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        const products = await getProducts(includeArchived);
        
        if (debug && products.length === 0) {
            // Debug: Try a raw prisma query to see the exact error
            const prisma = (await import('@/lib/prisma')).default;
            try {
                const count = await prisma.product.count();
                return NextResponse.json({ debug: true, productCount: count, products, dbConnected: true, getProductsError: lastGetProductsError });
            } catch (dbError: any) {
                return NextResponse.json({ 
                    debug: true, 
                    dbConnected: false, 
                    error: dbError.message,
                    code: dbError.code,
                    meta: dbError.meta,
                    hasDbUrl: !!process.env.DATABASE_URL,
                    hasDirectUrl: !!process.env.DIRECT_URL
                });
            }
        }

        return NextResponse.json(products);
    } catch (e: any) {
        console.error(e);
        if (debug) {
            return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
        }
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

/**
 * POST Handler
 * Saves (Create/Update) a product.
 * Expects a JSON body matching the Product interface.
 * 
 * @param {Request} request - The incoming HTTP request
 * @returns {NextResponse} JSON with success status and saved product, or 500 Error
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("POST /api/products body:", JSON.stringify(body, null, 2));
        const saved = await saveProduct(body);
        return NextResponse.json({ success: true, product: saved });
    } catch (e) {
        console.error("POST /api/products ERROR:", e);
        return NextResponse.json({ error: 'Failed to save', details: e instanceof Error ? e.message : String(e) }, { status: 500 });
    }
}

/**
 * PUT Handler
 * Same as POST, handles updates for inline stock editing and bulk operations.
 */
export async function PUT(request: Request) {
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
 * DELETE Handler
 * Deletes a product by ID (passed as query param).
 * 
 * @param {Request} request - The incoming HTTP request containing ?id=...
 * @returns {NextResponse} JSON success status or error
 */
export async function DELETE(request: Request) {
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
 * PATCH Handler
 * Restores a softly deleted product by ID (passed as query param).
 */
export async function PATCH(request: Request) {
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
