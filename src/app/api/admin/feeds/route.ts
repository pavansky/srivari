import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getProducts, lastGetProductsError } from '@/lib/db';
import { FEED_FORMATS, buildFeed, isFeedFormat, type FeedProduct } from '@/lib/feeds';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/feeds?format=meta|google|marketplace
 *
 * Streams the catalogue as a CSV feed for an external sales channel.
 * Archived products are excluded. `X-Feed-Rows` / `X-Feed-Skipped` let the
 * admin console report what actually went into the file.
 */
export async function GET(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'meta').trim().toLowerCase();

    if (!isFeedFormat(format)) {
        return NextResponse.json(
            { error: `Unknown feed format "${format}". Use one of: ${FEED_FORMATS.join(', ')}.` },
            { status: 400 }
        );
    }

    let products: FeedProduct[];
    try {
        products = (await getProducts(false)) as FeedProduct[];
    } catch (e) {
        console.error('Feed export: could not load products:', e);
        return NextResponse.json(
            { error: 'Could not read the catalogue right now. Please try again in a moment.' },
            { status: 503 }
        );
    }

    // getProducts() returns [] rather than throwing when the DB is unreachable,
    // so distinguish an outage from a genuinely empty catalogue before telling
    // the admin to "add a product".
    if (products.length === 0) {
        if (lastGetProductsError) {
            console.error('Feed export: catalogue unavailable:', lastGetProductsError);
            return NextResponse.json(
                { error: 'The catalogue could not be read right now. Please try again in a moment.' },
                { status: 503 }
            );
        }
        return NextResponse.json(
            { error: 'No products to export. Add a product first.' },
            { status: 409 }
        );
    }

    const feed = buildFeed(format, products);

    if (feed.rows === 0) {
        return NextResponse.json(
            {
                error: feed.skippedReason
                    ? `None of your ${products.length} products can be exported to this channel (${feed.skippedReason}).`
                    : 'Nothing to export for this channel.',
            },
            { status: 409 }
        );
    }

    return new NextResponse(feed.csv, {
        status: 200,
        headers: {
            'Content-Type': feed.contentType,
            'Content-Disposition': `attachment; filename="${feed.filename}"`,
            'Cache-Control': 'no-store',
            'X-Feed-Rows': String(feed.rows),
            'X-Feed-Skipped': String(feed.skipped),
        },
    });
}
