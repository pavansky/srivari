import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';
import { getProducts, lastGetProductsError } from '@/lib/db';
import type { FeedProduct } from '@/lib/feeds';
import { getAdapter, getAdapters } from '@/lib/channels/registry';
import type { ChannelListingStatus } from '@/lib/channels/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/channels
 *   Lists every registered sales channel with its capabilities, whether its
 *   credentials are present, the env vars to set when they are not, and how many
 *   ChannelListing rows sit in each status.
 *
 * GET /api/admin/channels?channel=<key>&download=1
 *   Streams that channel's catalogue artefact — the JSON_LISTINGS_FEED document
 *   for Amazon, the on_search catalogue for ONDC, the onboarding CSV for the
 *   manual partner sheet.
 *
 * The channel list itself never touches the network: it is built from the
 * registry, so it answers instantly and works with zero credentials configured.
 */

const LISTING_STATUSES: ChannelListingStatus[] = ['draft', 'listed', 'paused', 'error'];

type CountsByStatus = Record<string, number> & { total: number };

function emptyCounts(): CountsByStatus {
    const counts = { total: 0 } as CountsByStatus;
    for (const status of LISTING_STATUSES) counts[status] = 0;
    return counts;
}

/**
 * Listing counts per channel. Returns null (not an error) when the table cannot
 * be read — the console still renders every channel, just without numbers.
 */
async function listingCounts(): Promise<Record<string, CountsByStatus> | null> {
    try {
        const rows = await prisma.channelListing.groupBy({
            by: ['channel', 'status'],
            _count: { _all: true },
        });

        const byChannel: Record<string, CountsByStatus> = {};
        for (const row of rows) {
            const bucket = (byChannel[row.channel] ||= emptyCounts());
            const n = row._count?._all || 0;
            bucket[row.status] = (bucket[row.status] || 0) + n;
            bucket.total += n;
        }
        return byChannel;
    } catch (e) {
        console.warn('Channels: listing counts unavailable:', (e as any)?.message);
        return null;
    }
}

/** Last successful sync per channel, best-effort. */
async function lastSynced(): Promise<Record<string, string>> {
    try {
        const rows = await prisma.channelListing.groupBy({
            by: ['channel'],
            _max: { lastSyncedAt: true },
        });
        const out: Record<string, string> = {};
        for (const row of rows) {
            if (row._max?.lastSyncedAt) out[row.channel] = row._max.lastSyncedAt.toISOString();
        }
        return out;
    } catch {
        return {};
    }
}

async function downloadFor(channelKey: string) {
    const adapter = getAdapter(channelKey);
    if (!adapter) {
        return NextResponse.json({ error: `Unknown channel "${channelKey}".` }, { status: 400 });
    }
    if (!adapter.buildExport) {
        return NextResponse.json(
            { error: `${adapter.label} has no downloadable catalogue.` },
            { status: 409 }
        );
    }

    let products: FeedProduct[];
    try {
        products = (await getProducts(false)) as FeedProduct[];
    } catch (e) {
        console.error('Channels: could not load products for export:', e);
        return NextResponse.json(
            { error: 'Could not read the catalogue right now. Please try again in a moment.' },
            { status: 503 }
        );
    }

    // getProducts() answers [] rather than throwing during a DB outage, so tell
    // an outage apart from a genuinely empty catalogue before blaming the owner.
    if (products.length === 0) {
        if (lastGetProductsError) {
            console.error('Channels: catalogue unavailable:', lastGetProductsError);
            return NextResponse.json(
                { error: 'The catalogue could not be read right now. Please try again in a moment.' },
                { status: 503 }
            );
        }
        return NextResponse.json({ error: 'No products to export. Add a product first.' }, { status: 409 });
    }

    let file;
    try {
        file = adapter.buildExport(products);
    } catch (e) {
        console.error(`Channels: ${adapter.key} export failed:`, e);
        return NextResponse.json(
            { error: `Could not build the ${adapter.label} catalogue. Please try again.` },
            { status: 500 }
        );
    }

    if (file.count === 0) {
        return NextResponse.json(
            { error: `None of your ${products.length} products can go to ${adapter.label} yet (they need a price).` },
            { status: 409 }
        );
    }

    return new NextResponse(file.body, {
        status: 200,
        headers: {
            'Content-Type': file.contentType,
            'Content-Disposition': `attachment; filename="${file.filename}"`,
            'Cache-Control': 'no-store',
            'X-Channel-Items': String(file.count),
        },
    });
}

export async function GET(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const channelKey = (searchParams.get('channel') || '').trim().toLowerCase();
    const wantsDownload = searchParams.get('download') === '1';

    if (wantsDownload) return downloadFor(channelKey);

    const [counts, synced] = await Promise.all([listingCounts(), lastSynced()]);

    const channels = getAdapters().map(adapter => {
        const configured = (() => {
            try {
                return adapter.isConfigured();
            } catch (e) {
                console.warn(`Channels: ${adapter.key} isConfigured() threw:`, (e as any)?.message);
                return false;
            }
        })();

        return {
            key: adapter.key,
            label: adapter.label,
            blurb: adapter.blurb,
            configured,
            apiBacked: adapter.apiBacked,
            configHint: adapter.configHint,
            note: adapter.note,
            docsUrl: adapter.docsUrl,
            capabilities: adapter.capabilities,
            canDownload: Boolean(adapter.buildExport),
            listings: counts?.[adapter.key] || emptyCounts(),
            lastSyncedAt: synced[adapter.key] || null,
        };
    });

    return NextResponse.json(
        {
            channels,
            // Distinguishes "no listings yet" from "we could not read them".
            listingCountsAvailable: counts !== null,
        },
        { headers: { 'Cache-Control': 'no-store' } }
    );
}
