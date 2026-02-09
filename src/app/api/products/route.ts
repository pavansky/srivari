import { NextResponse } from 'next/server';
import { getProducts, saveProduct, deleteProduct } from '@/lib/db';

// --- Product API ---

/**
 * GET Handler
 * Retrieves all products.
 * 
 * @returns {NextResponse} JSON array of products or 500 Error
 */
export async function GET() {
    try {
        const products = await getProducts();
        return NextResponse.json(products);
    } catch (e) {
        console.error(e);
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
        const saved = await saveProduct(body);
        return NextResponse.json({ success: true, product: saved });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to save', details: e instanceof Error ? e.message : String(e) }, { status: 500 });
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
