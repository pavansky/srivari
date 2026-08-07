import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { rateLimit } from '@/lib/rate-limit';
import prisma from '@/lib/prisma';
import { getProducts, lastGetProductsError } from '@/lib/db';
import type { FeedProduct } from '@/lib/feeds';
import { getAdapter } from '@/lib/channels/registry';
import { isNotConfiguredError, type ChannelListingStatus } from '@/lib/channels/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/channels/sync
 * Body: { channel: string, productIds?: string[] }
 *
 * Pushes the catalogue (or the selected products) to one channel and records the
 * outcome per product in ChannelListing.
 *
 * When the channel's credentials are absent this is a REAL DRY RUN, not a
 * failure: every product's payload is built and stored with status "draft", and
 * the response says so plainly. That is the whole point — the owner can inspect
 * exactly what would be sent to Amazon or handed to an ONDC seller app before
 * signing up for anything.
 *
 * A raw adapter/database error never reaches the client: failures land in
 * ChannelListing.lastError and come back as a short, human sentence.
 */

/** Live API calls are one network round-trip per product — keep an invocation bounded. */
const MAX_LIVE_PER_SYNC = 25;
/** Dry runs are pure CPU, so a whole catalogue can go through in one pass. */
const MAX_DRY_PER_SYNC = 250;

interface SyncOutcome {
    productId: string;
    name: string;
    status: ChannelListingStatus;
    externalId?: string;
    error?: string;
}

/** True when the DB is missing the ChannelListing table/columns the client expects. */
function schemaOutOfDate(e: any): boolean {
    const code = String(e?.code);
    return code === 'P2021' || code === 'P2022'
        || /does not exist in the current database/i.test(String(e?.message));
}

const SCHEMA_MESSAGE =
    'The channel listing table is not in the database yet. Run the pending Prisma migration, then sync again.';

export async function POST(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    // Syncing is expensive (one upstream call per product) — cap the console.
    const ip = request.headers.get('x-forwarded-for') || 'admin';
    if (!rateLimit(`channel-sync:${ip}`, 12).success) {
        return NextResponse.json(
            { error: 'Too many syncs in a row. Give it a minute and try again.' },
            { status: 429 }
        );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
        return NextResponse.json({ error: 'Send a JSON body with a channel.' }, { status: 400 });
    }

    const channelKey = String((body as any).channel || '').trim().toLowerCase();
    const adapter = getAdapter(channelKey);
    if (!adapter) {
        return NextResponse.json({ error: `Unknown channel "${channelKey}".` }, { status: 400 });
    }
    if (!adapter.listProduct) {
        return NextResponse.json(
            { error: `${adapter.label} does not publish a product catalogue.` },
            { status: 409 }
        );
    }

    const requestedIds: string[] = Array.isArray((body as any).productIds)
        ? (body as any).productIds.map((id: unknown) => String(id)).filter(Boolean)
        : [];

    // --- Catalogue ---
    let allProducts: FeedProduct[];
    try {
        allProducts = (await getProducts(false)) as FeedProduct[];
    } catch (e) {
        console.error('Channel sync: could not load products:', e);
        return NextResponse.json(
            { error: 'Could not read the catalogue right now. Please try again in a moment.' },
            { status: 503 }
        );
    }
    if (allProducts.length === 0) {
        if (lastGetProductsError) {
            console.error('Channel sync: catalogue unavailable:', lastGetProductsError);
            return NextResponse.json(
                { error: 'The catalogue could not be read right now. Please try again in a moment.' },
                { status: 503 }
            );
        }
        return NextResponse.json({ error: 'No products to sync. Add a product first.' }, { status: 409 });
    }

    const wanted = requestedIds.length > 0
        ? allProducts.filter(p => requestedIds.includes(p.id))
        : allProducts;

    // A channel will reject a priced-at-zero or archived item, so leave it out
    // rather than manufacture an "error" listing for it.
    const eligible = wanted.filter(p => !p.isArchived && Number(p.price) > 0);
    const skipped = wanted.length - eligible.length;

    if (eligible.length === 0) {
        return NextResponse.json(
            {
                error: requestedIds.length > 0
                    ? 'None of the selected products can be listed yet — they need a price.'
                    : 'None of your products can be listed yet — they need a price.',
            },
            { status: 409 }
        );
    }

    const configured = (() => {
        try { return adapter.isConfigured(); } catch { return false; }
    })();
    // A live push only happens on a channel that both has an API and has creds.
    const live = configured && adapter.apiBacked;

    const limit = live ? MAX_LIVE_PER_SYNC : MAX_DRY_PER_SYNC;
    const batch = eligible.slice(0, limit);
    const remaining = eligible.length - batch.length;

    // Existing listings for this batch, read once: a dry run must not downgrade a
    // product that is genuinely live on the channel, and must not un-pause one the
    // owner deliberately paused.
    let existing = new Map<string, ChannelListingStatus>();
    try {
        const rows = await prisma.channelListing.findMany({
            where: { channel: adapter.key, productId: { in: batch.map(p => p.id) } },
            select: { productId: true, status: true },
        });
        existing = new Map(rows.map(r => [r.productId, r.status as ChannelListingStatus]));
    } catch (e) {
        if (schemaOutOfDate(e)) {
            console.error('Channel sync: ChannelListing table/columns missing.');
            return NextResponse.json({ error: SCHEMA_MESSAGE }, { status: 503 });
        }
        console.warn('Channel sync: could not read existing listings:', (e as any)?.message);
    }

    /** Statuses a dry run leaves alone — they describe the channel, not this run. */
    const STICKY: ChannelListingStatus[] = ['listed', 'paused'];

    // --- Push ---
    const outcomes: SyncOutcome[] = [];
    let schemaBroken = false;

    for (const product of batch) {
        let status: ChannelListingStatus = 'draft';
        let externalId: string | undefined;
        let payload: unknown = null;
        let error: string | undefined;

        try {
            const result = await adapter.listProduct(product);
            payload = result.payload ?? null;
            externalId = result.externalId;
            // "listed" is claimed only when something really went to a live API.
            const previous = existing.get(product.id);
            status = live && externalId
                ? 'listed'
                : previous && STICKY.includes(previous) ? previous : 'draft';
        } catch (e: any) {
            status = 'error';
            error = isNotConfiguredError(e)
                ? e.configHint
                : String(e?.message || 'Sync failed').slice(0, 400);
            console.error(`Channel sync (${adapter.key}) failed for ${product.id}:`, e?.message);
        }

        try {
            await prisma.channelListing.upsert({
                where: { channel_productId: { channel: adapter.key, productId: product.id } },
                create: {
                    channel: adapter.key,
                    productId: product.id,
                    externalId: externalId || null,
                    status,
                    lastSyncedAt: new Date(),
                    lastError: error || null,
                    payload: (payload ?? undefined) as any,
                },
                update: {
                    // Keep the previous external id when this run did not produce one
                    // (a dry run must not wipe a real ASIN recorded earlier).
                    ...(externalId ? { externalId } : {}),
                    status,
                    lastSyncedAt: new Date(),
                    lastError: error || null,
                    payload: (payload ?? undefined) as any,
                },
            });
        } catch (e: any) {
            if (schemaOutOfDate(e)) {
                schemaBroken = true;
                break;
            }
            // The push may well have succeeded upstream — report the product as
            // synced but flag that we could not record it.
            console.error(`Channel sync: could not record listing for ${product.id}:`, e?.message);
            error = error || 'Listed, but the result could not be saved locally.';
        }

        outcomes.push({ productId: product.id, name: product.name, status, externalId, error });
    }

    if (schemaBroken) {
        console.error('Channel sync: ChannelListing table/columns missing.');
        return NextResponse.json({ error: SCHEMA_MESSAGE }, { status: 503 });
    }

    const listed = outcomes.filter(o => o.status === 'listed').length;
    const drafted = outcomes.filter(o => o.status === 'draft').length;
    const failed = outcomes.filter(o => o.status === 'error').length;

    // Everything whose payload was built without error — 'draft' plus any listing
    // whose earlier 'listed'/'paused' state a dry run deliberately left standing.
    const prepared = outcomes.length - failed;

    const message = (() => {
        const plural = (n: number) => (n === 1 ? '' : 's');
        if (live) {
            const head = `${listed} product${plural(listed)} sent to ${adapter.label}`;
            const tail = failed ? `, ${failed} rejected` : '';
            return `${head}${tail}.`;
        }
        if (!adapter.apiBacked) {
            return `${prepared} product${plural(prepared)} prepared for ${adapter.label}. ${adapter.note}`;
        }
        return `Dry run: ${prepared} payload${plural(prepared)} built and saved. ` +
            `Nothing was sent — ${adapter.label} has no credentials yet. ${adapter.configHint}`;
    })();

    return NextResponse.json({
        channel: adapter.key,
        label: adapter.label,
        configured,
        apiBacked: adapter.apiBacked,
        dryRun: !live,
        listed,
        drafted,
        prepared,
        failed,
        skipped,
        remaining,
        message,
        // Only problems are itemised — a 250-row success list helps nobody. This
        // includes a product that went out fine but whose result we could not
        // record locally, which is exactly the case worth telling the owner about.
        failures: outcomes.filter(o => o.error).slice(0, 20)
            .map(o => ({ productId: o.productId, name: o.name, error: o.error })),
    });
}
