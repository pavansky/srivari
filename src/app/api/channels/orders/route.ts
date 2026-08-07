import { NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';
import prisma from '@/lib/prisma';
import { createOrder as saveOrderToDb } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { isChannelKey } from '@/lib/channels/registry';
import { SELLER } from '@/config/commerce';
import { computeGst, invoiceNumber, type GstSummary } from '@/lib/gst';

export const dynamic = 'force-dynamic';

/**
 * POST /api/channels/orders — ingest an order placed on a sales channel.
 *
 * AUTH: a shared secret in `x-channel-secret` (or `Authorization: Bearer …`),
 * compared in constant time against CHANNEL_INGEST_SECRET. It FAILS CLOSED: with
 * the env var unset every request is rejected 401, so an unconfigured deployment
 * can never have orders (and stock movements) injected into it.
 *
 * PRICES ARE NEVER TRUSTED. Exactly like /api/orders/create, every line is
 * re-priced from our own product table; the channel's declared total is recorded
 * for reconciliation only. A channel that says a ₹18,000 saree cost ₹1 gets an
 * order for ₹18,000 and a mismatch flag.
 *
 * IDEMPOTENT on the channel's order id. The internal order id is *derived* from
 * `channel + channelOrderId` (SHA-256), so a replay collides on the primary key
 * inside the same transaction that would have taken stock — a retrying webhook
 * cannot double-decrement inventory even if two deliveries race. The
 * `channel_order_id` column is written too, and is what humans query on.
 *
 * Body:
 *   { channel, channelOrderId, customer: { name, phone?, email?, address?, city?,
 *     state?, pincode? }, items: [{ sku | productId, quantity, price }],
 *     total, paymentMethod?, placedAt?, shippingCost? }
 */

const MAX_ITEMS = 50;
const MAX_QTY_PER_LINE = 100;
const MAX_SHIPPING = 5000;

/** Channel-declared payment wording → the store's own payment method vocabulary. */
function mapPaymentMethod(declared: unknown): 'COD' | 'Manual' {
    const raw = String(declared || '').trim().toLowerCase();
    if (raw === 'cod' || raw.includes('cash on delivery') || raw.includes('cashondelivery')) return 'COD';
    // Everything prepaid was settled by the marketplace, not by our Razorpay
    // account — recording it as 'Razorpay' would corrupt payment reconciliation.
    return 'Manual';
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

function presentedSecret(request: Request): string {
    const header = request.headers.get('x-channel-secret');
    if (header) return header.trim();
    const auth = request.headers.get('authorization') || '';
    return auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
}

function secretsMatch(a: string, b: string): boolean {
    // Hash both sides first so timingSafeEqual always gets equal-length buffers
    // (it throws otherwise, and the length itself would leak).
    const ha = createHash('sha256').update(a).digest();
    const hb = createHash('sha256').update(b).digest();
    return timingSafeEqual(ha, hb);
}

function authorize(request: Request): NextResponse | null {
    const expected = (process.env.CHANNEL_INGEST_SECRET || '').trim();
    if (!expected) {
        console.warn('Channel order ingest rejected: CHANNEL_INGEST_SECRET is not set.');
        return NextResponse.json(
            { error: 'Channel order ingestion is not enabled on this deployment. Set CHANNEL_INGEST_SECRET.' },
            { status: 401 }
        );
    }
    const presented = presentedSecret(request);
    if (!presented || !secretsMatch(presented, expected)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return null;
}

/* ------------------------------------------------------------------ */
/* Identity                                                            */
/* ------------------------------------------------------------------ */

/**
 * Deterministic internal order id for a channel order. Same channel + same
 * channel order id always yields the same id, which is what makes ingestion
 * idempotent at the database's own unique index rather than at a read-then-write
 * check that two concurrent deliveries could both pass.
 */
function internalOrderId(channel: string, channelOrderId: string): string {
    const digest = createHash('sha256').update(`${channel}:${channelOrderId}`).digest('hex');
    return `SR-${digest.slice(0, 10).toUpperCase()}`;
}

function isUniqueViolation(e: any): boolean {
    return String(e?.code) === 'P2002' || /Unique constraint/i.test(String(e?.message));
}

/** True when the DB is behind the Prisma client (a column the client expects is missing). */
function schemaOutOfDate(e: any): boolean {
    return String(e?.code) === 'P2022'
        || /does not exist in the current database/i.test(String(e?.message));
}

/**
 * True when `Order.channel` / `Order.channel_order_id` are not usable on this
 * deployment — either the Prisma schema predates them (a client-side validation
 * error, no error code) or the database column is missing (P2022).
 *
 * Both are survivable: the internal order id is derived from the channel order
 * id, so idempotency and order creation never depend on these columns. Only the
 * queryable channel provenance is lost, and that is also mirrored into the
 * `customer` JSON, which every deployment has.
 */
function channelColumnsUnavailable(e: any): boolean {
    if (schemaOutOfDate(e)) return true;
    const name = String(e?.name || '');
    const message = String(e?.message || '');
    return name === 'PrismaClientValidationError'
        || /Unknown (?:argument|arg|field)/i.test(message);
}

function orderSummary(order: any, duplicate: boolean) {
    return {
        success: true,
        duplicate,
        orderId: order.id,
        status: order.status,
        total: order.total,
    };
}

/* ------------------------------------------------------------------ */
/* Handler                                                             */
/* ------------------------------------------------------------------ */

export async function POST(request: Request) {
    const denied = authorize(request);
    if (denied) return denied;

    const ip = request.headers.get('x-forwarded-for') || 'channel';
    if (!rateLimit(`channel-order:${ip}`, 120).success) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    try {
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ error: 'Send a JSON body.' }, { status: 400 });
        }

        // --- Channel identity ---
        const channel = String((body as any).channel || '').trim().toLowerCase();
        if (!isChannelKey(channel)) {
            return NextResponse.json({ error: `Unknown channel "${channel}".` }, { status: 400 });
        }

        const channelOrderId = String((body as any).channelOrderId || '').trim().slice(0, 120);
        if (!channelOrderId) {
            return NextResponse.json({ error: 'channelOrderId is required.' }, { status: 400 });
        }

        const orderId = internalOrderId(channel, channelOrderId);

        // --- Idempotency (fast path) ---
        const alreadyById = await prisma.order.findUnique({ where: { id: orderId } });
        if (alreadyById) return NextResponse.json(orderSummary(alreadyById, true));

        // Also honour an order recorded under a different internal id (e.g. keyed
        // in by hand from the marketplace dashboard) — best effort, because the
        // column may not exist on a database that is behind the schema.
        try {
            const alreadyByChannel = await (prisma.order as any).findFirst({
                where: { channel_order_id: channelOrderId, channel },
            });
            if (alreadyByChannel) return NextResponse.json(orderSummary(alreadyByChannel, true));
        } catch (e) {
            if (!channelColumnsUnavailable(e)) throw e;
            console.warn('Channel order: channel columns unavailable, relying on the derived order id for idempotency.');
        }

        // --- Customer ---
        const customer = ((body as any).customer || {}) as Record<string, unknown>;
        const name = String(customer.name || '').trim().slice(0, 120);
        if (!name) {
            return NextResponse.json({ error: 'customer.name is required.' }, { status: 400 });
        }
        const phone = String(customer.phone || '').trim().slice(0, 20);
        const email = String(customer.email || '').trim().slice(0, 160);
        const address = String(customer.address || '').trim().slice(0, 400);
        const city = String(customer.city || '').trim().slice(0, 80);
        const stateInput = String(customer.state || '').trim().slice(0, 60);
        const rawPincode = String(customer.pincode || '').trim();
        const pincode = /^\d{6}$/.test(rawPincode) ? rawPincode : '';

        // --- Items: aggregate duplicates before pricing, as checkout does ---
        const rawItems = Array.isArray((body as any).items) ? (body as any).items : [];
        if (rawItems.length === 0) {
            return NextResponse.json({ error: 'items must contain at least one line.' }, { status: 400 });
        }
        if (rawItems.length > MAX_ITEMS) {
            return NextResponse.json({ error: `Too many line items (max ${MAX_ITEMS}).` }, { status: 400 });
        }

        const byProductId = new Map<string, number>();
        const bySku = new Map<string, number>();
        for (const item of rawItems) {
            // A zero/negative quantity is a cancelled or refunded line — skip it
            // rather than silently rounding it up to one unit of real stock.
            const rawQty = Math.trunc(Number(item?.quantity));
            if (!Number.isFinite(rawQty) || rawQty < 1) continue;
            const quantity = Math.min(rawQty, MAX_QTY_PER_LINE);

            const productId = String(item?.productId || '').trim();
            const sku = String(item?.sku || '').trim();
            if (productId) byProductId.set(productId, (byProductId.get(productId) || 0) + quantity);
            else if (sku) bySku.set(sku, (bySku.get(sku) || 0) + quantity);
        }
        if (byProductId.size === 0 && bySku.size === 0) {
            return NextResponse.json(
                { error: 'No sellable lines: every item needs a productId or a sku and a quantity of at least 1.' },
                { status: 400 }
            );
        }

        // Archived (soft-deleted) products are still resolved: the sale already
        // happened on the marketplace, and refusing it would simply lose the order.
        const dbProducts = await prisma.product.findMany({
            where: {
                OR: [
                    { id: { in: Array.from(byProductId.keys()) } },
                    { sku: { in: Array.from(bySku.keys()) } },
                ],
            },
            select: {
                id: true, sku: true, name: true, price: true, stock: true,
                category: true, hsnCode: true, gstRate: true, deletedAt: true,
            },
        });

        const byId = new Map(dbProducts.map(p => [p.id, p]));
        const bySkuLookup = new Map(dbProducts.filter(p => p.sku).map(p => [p.sku as string, p]));

        const verifiedItems: { productId: string; productName: string; quantity: number; price: number; sku?: string }[] = [];
        const taxItems: { price: number; quantity: number; category?: string | null; name?: string | null; hsnCode?: string | null; gstRate?: number | null }[] = [];
        const unmatched: string[] = [];
        const archived: string[] = [];

        // Merge both keyings into one quantity map keyed by our product id, so an
        // order that names the same saree once by sku and once by id is one line.
        const resolved = new Map<string, { product: (typeof dbProducts)[number]; quantity: number }>();
        const addResolved = (product: (typeof dbProducts)[number] | undefined, key: string, quantity: number) => {
            if (!product) { unmatched.push(key); return; }
            const existing = resolved.get(product.id);
            if (existing) existing.quantity += quantity;
            else resolved.set(product.id, { product, quantity });
        };
        for (const [id, quantity] of byProductId) addResolved(byId.get(id), id, quantity);
        for (const [sku, quantity] of bySku) addResolved(bySkuLookup.get(sku), sku, quantity);

        if (unmatched.length > 0) {
            return NextResponse.json(
                {
                    error: `No product matches: ${unmatched.slice(0, 5).join(', ')}. ` +
                        'Set the SKU on the product so channel orders can be matched.',
                    unmatched,
                },
                { status: 400 }
            );
        }

        for (const { product, quantity } of resolved.values()) {
            if (product.deletedAt) archived.push(product.name);
            verifiedItems.push({
                productId: product.id,
                productName: product.name,
                quantity,
                price: product.price,
                ...(product.sku ? { sku: product.sku } : {}),
            });
            taxItems.push({
                price: product.price,
                quantity,
                category: product.category,
                name: product.name,
                hsnCode: product.hsnCode ?? null,
                gstRate: product.gstRate ?? null,
            });
        }

        // --- Money (ours, not theirs) ---
        const subtotal = verifiedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const shippingCost = Math.min(
            Math.max(Math.round(Number((body as any).shippingCost) || 0), 0),
            MAX_SHIPPING
        );
        const total = subtotal + shippingCost;
        const declaredTotal = Math.round(Number((body as any).total) || 0);
        const totalMismatch = declaredTotal > 0 && Math.abs(declaredTotal - total) >= 1;
        if (totalMismatch) {
            console.warn(
                `Channel order ${channel}/${channelOrderId}: declared total ₹${declaredTotal} ` +
                `but our catalogue prices give ₹${total}. Recording ours.`
            );
        }

        const paymentMethod = mapPaymentMethod((body as any).paymentMethod);

        // --- GST (prices are GST-inclusive; tax is extracted, never added) ---
        let gst: GstSummary | null = null;
        try {
            gst = computeGst(taxItems, stateInput);
        } catch (e) {
            console.warn('Channel order: GST computation failed, continuing without a snapshot:', e);
        }

        // --- Create (stock is taken atomically by createOrder) ---
        let created: any;
        try {
            created = await saveOrderToDb(
                {
                    id: orderId,
                    customerName: name,
                    customerPhone: phone,
                    customerEmail: email,
                    address: address || 'N/A',
                    items: verifiedItems,
                    amount: subtotal,
                    shippingCost,
                    totalAmount: total,
                    // 'Placed' = confirmed and stock held, the same state an
                    // offline/COD order lands in.
                    status: 'Placed',
                    paymentMethod,
                } as any,
                { skipStockDecrement: false }
            );
        } catch (e: any) {
            if (String(e?.message).startsWith('INSUFFICIENT_STOCK:')) {
                const productName = String(e.message).split(':')[1] || 'an item';
                // Deliberately not recorded: silently accepting would oversell.
                // The channel can safely retry once stock is corrected — this
                // endpoint is idempotent.
                return NextResponse.json(
                    {
                        error: `Not enough stock for ${productName}. Restock and resend this order.`,
                        channelOrderId,
                    },
                    { status: 409 }
                );
            }
            if (isUniqueViolation(e)) {
                // A concurrent delivery of the same channel order won the race.
                const winner = await prisma.order.findUnique({ where: { id: orderId } });
                if (winner) return NextResponse.json(orderSummary(winner, true));
            }
            if (schemaOutOfDate(e)) {
                console.error('Channel order: database schema is behind the Prisma client —', e?.message);
                return NextResponse.json(
                    { error: 'The database is behind the app schema. Run the pending migration and resend.' },
                    { status: 503 }
                );
            }
            throw e;
        }

        // --- Snapshots, written after the order is safely saved ---
        // Both are best-effort and independent: a missing new column must never
        // cost us the channel provenance stored in the customer JSON.
        await recordChannelProvenance(orderId, created?.customer, {
            channel,
            channelOrderId,
            city,
            state: stateInput,
            pincode,
            deliveryMethod: 'Courier',
            channelPaymentMethod: String((body as any).paymentMethod || '').slice(0, 40),
            channelDeclaredTotal: declaredTotal || undefined,
            placedAt: String((body as any).placedAt || '').slice(0, 40) || undefined,
        });
        await recordChannelColumns(orderId, channel, channelOrderId, gst);

        return NextResponse.json({
            success: true,
            duplicate: false,
            orderId,
            status: 'Placed',
            subtotal,
            shipping: shippingCost,
            total,
            declaredTotal: declaredTotal || undefined,
            // The channel should reconcile this rather than assume we agreed.
            totalMismatch: totalMismatch || undefined,
            archivedProducts: archived.length > 0 ? archived : undefined,
        });
    } catch (error) {
        console.error('Channel order ingest failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/* ------------------------------------------------------------------ */
/* Post-create snapshots                                               */
/* ------------------------------------------------------------------ */

/**
 * Stores the channel provenance and structured address inside the `customer`
 * JSON column, which every deployment already has. This is what keeps a channel
 * order traceable even on a database that has not taken the newer columns yet.
 */
async function recordChannelProvenance(
    orderId: string,
    existingCustomer: any,
    extra: Record<string, unknown>
) {
    try {
        let base: any = existingCustomer;
        if (!base || typeof base !== 'object') {
            const row = await prisma.order.findUnique({ where: { id: orderId }, select: { customer: true } });
            base = row?.customer;
        }
        // Never write a partial customer object — that would drop name/phone/email.
        if (!base || typeof base !== 'object') {
            console.warn(`Channel order: skipped provenance for ${orderId} (customer JSON unreadable)`);
            return;
        }
        await prisma.order.update({
            where: { id: orderId },
            data: { customer: { ...base, ...extra } } as any,
            select: { id: true },
        });
    } catch (e) {
        console.warn(`Channel order: could not store provenance for ${orderId}:`, e);
    }
}

/** Channel columns + the GST/delivery snapshot. Best-effort for the same reason. */
async function recordChannelColumns(
    orderId: string,
    channel: string,
    channelOrderId: string,
    gst: GstSummary | null
) {
    try {
        await prisma.order.update({
            where: { id: orderId },
            data: {
                channel,
                channel_order_id: channelOrderId,
                delivery_method: 'Courier',
                invoice_number: invoiceNumber(orderId),
                ...(gst?.enabled
                    ? {
                        taxable_amount: gst.taxable,
                        gst_amount: gst.gstAmount,
                        gst_breakup: {
                            rate: gst.rate,
                            cgst: gst.cgst,
                            sgst: gst.sgst,
                            igst: gst.igst,
                            isIntraState: gst.isIntraState,
                            lines: gst.lines,
                        },
                        place_of_supply: gst.placeOfSupply || SELLER.state,
                    }
                    : {}),
            } as any,
            // Select only the id: a bare update() returns every column, which
            // would itself fail while a new column is missing.
            select: { id: true },
        });
    } catch (e) {
        console.warn(`Channel order: channel/tax snapshot skipped for ${orderId} (columns missing?):`, e);
    }
}
