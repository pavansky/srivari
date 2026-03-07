import { NextResponse } from 'next/server';
import { saveProduct } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
    try {
        const ip = request.headers.get('x-forwarded-for') || 'anonymous';
        const limiter = rateLimit(ip, 20); // Stricter limit for bulk imports

        if (!limiter.success) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        const body = await request.json();
        const { products } = body;

        if (!products || !Array.isArray(products)) {
            return NextResponse.json({ error: 'Invalid payload. Expected an array of products.' }, { status: 400 });
        }

        const results = {
            successful: 0,
            failed: 0,
            errors: [] as string[]
        };

        const batchId = `IMPORT-${Date.now()}`;

        // Instead of processing one by one which takes M*N roundtrips and can timeout,
        // we process in a single Promise.all concurrent block, taking advantage of connection pooling
        const importPromises = products.map(async (row, index) => {
             // Minimal validation before trying to save
            if (!row.name || !row.price || !row.category) {
                 return { success: false, index, error: "Missing required fields (name, price, category)" };
            }
            try {
                // Pass the actor and reference down so it gets logged in the InventoryTransaction
                await saveProduct({
                    ...row,
                    actor: "Admin (CSV Import)",
                    reference: batchId
                });
                return { success: true, index };
            } catch (err) {
                 return { success: false, index, error: err instanceof Error ? err.message : String(err) };
            }
        });

        const outcomes = await Promise.all(importPromises);
        
        for (const out of outcomes) {
            if (out.success) {
                results.successful++;
            } else {
                results.failed++;
                const productName = products[out.index]?.name || 'Unknown';
                results.errors.push(`Row ${out.index + 1} (${productName}): ${out.error}`);
            }
        }

        return NextResponse.json(results);

    } catch (e) {
        console.error("POST /api/products/import ERROR:", e);
        return NextResponse.json({ error: 'Failed to process import', details: e instanceof Error ? e.message : String(e) }, { status: 500 });
    }
}
