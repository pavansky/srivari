import { NextResponse } from 'next/server';
import { saveProduct } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { requireAdmin } from '@/lib/adminAuth';

export async function POST(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

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
        // Cap the payload so a huge CSV can't open thousands of concurrent DB
        // writes at once (pool exhaustion / function timeout).
        if (products.length > 1000) {
            return NextResponse.json({ error: 'Import too large. Please split into files of 1000 rows or fewer.' }, { status: 413 });
        }

        const results = {
            successful: 0,
            failed: 0,
            errors: [] as string[]
        };

        const batchId = `IMPORT-${Date.now()}`;

        const saveRow = async (row: any, index: number) => {
            if (!row.name || !row.price || !row.category) {
                return { success: false, index, error: "Missing required fields (name, price, category)" };
            }
            try {
                await saveProduct({ ...row, actor: "Admin (CSV Import)", reference: batchId });
                return { success: true, index };
            } catch (err) {
                return { success: false, index, error: err instanceof Error ? err.message : String(err) };
            }
        };

        // Bounded concurrency: process in chunks of 25 so we get pool-friendly
        // parallelism without launching one connection per row.
        const CHUNK = 25;
        const outcomes: { success: boolean; index: number; error?: string }[] = [];
        for (let start = 0; start < products.length; start += CHUNK) {
            const slice = products.slice(start, start + CHUNK);
            const chunkResults = await Promise.all(slice.map((row, i) => saveRow(row, start + i)));
            outcomes.push(...chunkResults);
        }

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
