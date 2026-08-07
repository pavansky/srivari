import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { updateOrder } from '@/lib/db';
import { classify } from '@/lib/gst';
import { notifyOrderShipped } from '@/lib/notify';
import { DEFAULT_WEIGHT_KG, SELLER } from '@/config/commerce';
import {
    assignAWB,
    createShipment,
    generateLabel,
    requestPickup,
    trackingUrlFor,
    type ShipmentItem,
} from '@/lib/shiprocket';

export const dynamic = 'force-dynamic';

/**
 * One-click fulfilment: push the order to Shiprocket, assign a courier (AWB),
 * request pickup, pull the label, and move the order to 'Shipped'.
 *
 * The order row is written after *every* successful step, so a failure halfway
 * through is never lost: a retry resumes from the shipment that already exists
 * instead of creating a duplicate one in the Shiprocket dashboard.
 *
 * Migration safety: the fulfilment columns (shipment_id, awb_code, …) may not
 * exist in the live DB yet. Every read falls back to the pre-migration column
 * set and every write degrades to the legacy tracking columns, so booking a
 * shipment still works (and the AWB is still recorded) before `prisma db push`.
 */

/** Columns that pre-date the fulfilment/GST migration — always safe to select. */
const LEGACY_ORDER_SELECT = {
    id: true,
    customer: true,
    items: true,
    amount: true,
    shipping_cost: true,
    total: true,
    status: true,
    payment_method: true,
    tracking_number: true,
    tracking_url: true,
    createdAt: true,
} as const;

async function loadOrder(id: string): Promise<any | null> {
    try {
        return await prisma.order.findUnique({ where: { id } });
    } catch (e) {
        console.warn('Ship: order read fell back to legacy columns (fulfilment migration pending?):', e);
        return await prisma.order.findUnique({ where: { id }, select: LEGACY_ORDER_SELECT as any });
    }
}

/**
 * Persists fulfilment progress. `fulfilment` holds post-migration columns and
 * `legacy` the columns that have always existed — when the new columns are
 * missing we still land the legacy ones so the admin keeps the AWB.
 *
 * updateMany (not update) is deliberate: it returns a count rather than the
 * whole row, so Postgres never has to SELECT columns that don't exist yet.
 */
async function persist(
    orderId: string,
    fulfilment: Record<string, unknown>,
    legacy: Record<string, unknown> = {}
): Promise<boolean> {
    try {
        await prisma.order.updateMany({ where: { id: orderId }, data: { ...legacy, ...fulfilment } as any });
        return true;
    } catch (e) {
        console.warn(`Ship: could not write [${Object.keys(fulfilment).join(', ')}] on ${orderId} (column missing?):`, e);
        if (Object.keys(legacy).length) {
            try {
                await prisma.order.updateMany({ where: { id: orderId }, data: legacy as any });
            } catch (e2) {
                console.warn(`Ship: legacy tracking columns also failed on ${orderId}:`, e2);
            }
        }
        return false;
    }
}

type ProductRow = {
    id: string;
    name: string;
    sku: string | null;
    category: string | null;
    weightKg?: number | null;
    hsnCode?: string | null;
    gstRate?: number | null;
};

async function loadProducts(ids: string[]): Promise<Map<string, ProductRow>> {
    if (!ids.length) return new Map();
    const base = { id: true, name: true, sku: true, category: true };
    try {
        const rows = await prisma.product.findMany({
            where: { id: { in: ids } },
            select: { ...base, weightKg: true, hsnCode: true, gstRate: true } as any,
        });
        return new Map(rows.map((p: any) => [p.id, p as ProductRow]));
    } catch (e) {
        console.warn('Ship: product read fell back to legacy columns (weight/HSN missing?):', e);
        try {
            const rows = await prisma.product.findMany({ where: { id: { in: ids } }, select: base });
            return new Map(rows.map((p: any) => [p.id, p as ProductRow]));
        } catch (e2) {
            console.warn('Ship: product read failed — shipping with default weights:', e2);
            return new Map();
        }
    }
}

const PINCODE_RE = /\b([1-9]\d{5})\b/;

/**
 * Structured delivery address from the order's customer JSON. Newer orders
 * carry city/state/pincode explicitly; older ones only have the flat address
 * string ("12 4th Cross, Jayanagar, Bengaluru, Karnataka - 560041"), which is
 * parsed from the tail backwards.
 */
function deriveAddress(customer: any): { line1: string; line2?: string; city: string; state: string; pincode: string } {
    const flat = String(customer?.address || '').trim();

    const pick = (...keys: string[]) => {
        for (const key of keys) {
            const value = customer?.[key];
            if (value != null && String(value).trim()) return String(value).trim();
        }
        return '';
    };

    const pincode = pick('pincode', 'pin', 'zip', 'zipcode', 'postalCode', 'postcode') || flat.match(PINCODE_RE)?.[1] || '';

    const segments = flat
        .split(/[,\n]/)
        .map(s => s.replace(PINCODE_RE, '').replace(/^[\s\-–—]+|[\s\-–—]+$/g, '').trim())
        .filter(Boolean);

    let state = pick('state');
    let city = pick('city', 'town', 'district');
    const rest = [...segments];
    if (!state && rest.length > 1) state = rest.pop() as string;
    if (!city && rest.length > 1) city = rest.pop() as string;

    const line1 = pick('line1', 'addressLine1', 'address1', 'street') || rest.join(', ') || flat || city;
    const line2 = pick('line2', 'addressLine2', 'address2', 'landmark');

    return { line1, line2: line2 || undefined, city, state, pincode };
}

const fail = (message: string, status: number, extra: Record<string, unknown> = {}) =>
    NextResponse.json({ success: false, message, ...extra }, { status });

export async function POST(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const body = await request.json().catch(() => ({}));
        const orderId = String(body?.orderId || '').trim();
        const courierId = Number(body?.courierId) > 0 ? Number(body.courierId) : undefined;
        if (!orderId) return fail('Order id required', 400);

        let order: any | null;
        try {
            order = await loadOrder(orderId);
        } catch (e) {
            console.error('Ship: order read failed:', e);
            return fail('Could not read this order from the database', 500);
        }
        if (!order) return fail(`Order ${orderId} was not found`, 404);

        // --- Guards -------------------------------------------------------
        if (order.status === 'Cancelled') {
            return fail('This order is cancelled — there is nothing to ship.', 400);
        }

        const deliveryMethod = String(order.delivery_method || 'Courier');
        if (deliveryMethod === 'Pickup') {
            return fail('This is a boutique pickup order — there is nothing to hand to a courier.', 400);
        }

        // Idempotent: an order that already carries an AWB is simply reported back.
        const existingAwb = order.awb_code ? String(order.awb_code) : '';
        if (existingAwb) {
            return NextResponse.json({
                success: true,
                alreadyShipped: true,
                awb: existingAwb,
                courier: order.courier_name || 'Courier',
                labelUrl: order.label_url || null,
                shipmentId: order.shipment_id || null,
                pickup: {
                    scheduled: !!order.pickup_scheduled,
                    message: order.pickup_scheduled ? 'Pickup already requested' : 'Pickup not requested yet',
                },
                message: `Already booked with ${order.courier_name || 'a courier'} · AWB ${existingAwb}`,
            });
        }

        // Before the migration lands, a booked AWB is only recorded in the
        // legacy tracking column — so an already-shipped order with tracking is
        // treated as booked rather than sent to Shiprocket a second time. This
        // also protects parcels the boutique shipped manually.
        const legacyTracking = order.tracking_number ? String(order.tracking_number) : '';
        if (legacyTracking && order.status === 'Shipped') {
            return fail(
                `This order already carries tracking ${legacyTracking} and is marked Shipped. Clear the tracking number under Fulfilment if you need to re-book it with Shiprocket.`,
                409,
                { awb: legacyTracking }
            );
        }

        // --- Build the shipment payload -----------------------------------
        const customer = (order.customer as any) || {};
        const address = deriveAddress(customer);
        if (!address.pincode) {
            return fail('No pincode on this order — add a delivery pincode before shipping', 400);
        }
        const phone = String(customer.phone || '').replace(/\D/g, '');
        if (!phone) {
            return fail('No phone number on this order — the courier needs one to deliver', 400);
        }

        const rawItems: any[] = Array.isArray(order.items) ? order.items : [];
        if (!rawItems.length) return fail('This order has no items to ship', 400);

        const productIds = Array.from(
            new Set(rawItems.map(i => String(i?.productId || '')).filter(Boolean))
        );
        const products = await loadProducts(productIds);

        let weightKg = 0;
        const items: ShipmentItem[] = rawItems.map(item => {
            const units = Math.max(1, Math.round(Number(item?.quantity) || 1));
            const product = products.get(String(item?.productId || ''));
            const name = String(item?.productName || product?.name || 'Saree');
            const { hsn } = classify({
                category: product?.category,
                name,
                hsnCode: product?.hsnCode,
                gstRate: product?.gstRate,
            });
            const unitWeight = Number(product?.weightKg) > 0 ? Number(product?.weightKg) : DEFAULT_WEIGHT_KG;
            weightKg += unitWeight * units;
            return {
                name,
                sku: product?.sku || String(item?.productId || name),
                units,
                sellingPrice: Math.max(0, Math.round(Number(item?.price) || 0)),
                hsn,
            };
        });

        const subTotal = Math.max(0, Math.round(Number(order.amount ?? order.total ?? 0)));

        // --- 1. Create the Shiprocket order (reuse one from a failed retry) --
        let shipmentId = order.shipment_id ? String(order.shipment_id) : '';
        if (!shipmentId) {
            try {
                const created = await createShipment({
                    orderId: order.id,
                    orderDate: order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt || Date.now()),
                    customer: {
                        name: String(customer.name || 'Customer'),
                        email: customer.email ? String(customer.email) : undefined,
                        phone,
                        address: address.line1,
                        address2: address.line2,
                        city: address.city,
                        state: address.state,
                        pincode: address.pincode,
                    },
                    items,
                    subTotal,
                    isCod: String(order.payment_method || '') === 'COD',
                    weightKg,
                    pickupLocation: SELLER.pickupLocation,
                });
                shipmentId = created.shipmentId;
            } catch (e: any) {
                // Shiprocket's own wording is the most useful thing the admin can read.
                return fail(e?.message || 'Could not create the shipment', 502);
            }
            await persist(orderId, { shipment_id: shipmentId });
        }

        // --- 2. Assign a courier (AWB) --------------------------------------
        let awb: string;
        let courier: string;
        try {
            const assigned = await assignAWB(shipmentId, courierId);
            awb = assigned.awb;
            courier = assigned.courier;
        } catch (e: any) {
            return fail(e?.message || 'Could not assign a courier', 502, { shipmentId });
        }

        const trackingUrl = trackingUrlFor(awb);
        await persist(
            orderId,
            { awb_code: awb, courier_name: courier },
            { tracking_number: awb, tracking_url: trackingUrl }
        );

        // "Your saree has left the boutique" — sent the moment the AWB exists,
        // because that is the first point at which the customer has something
        // to track. The courier/AWB/URL are passed explicitly since the row we
        // hold in memory predates this write (and `persist` may have degraded
        // to the legacy columns). notify* never throws; the .catch is a net.
        await notifyOrderShipped(order, { courier, awb, trackingUrl }).catch(() => undefined);

        // --- 3. Request pickup (never fatal — the parcel is already booked) --
        let pickup = { scheduled: false, message: 'Pickup was not requested' };
        try {
            pickup = await requestPickup(shipmentId);
        } catch (e: any) {
            pickup = { scheduled: false, message: e?.message || 'Pickup could not be requested' };
        }
        if (pickup.scheduled) await persist(orderId, { pickup_scheduled: new Date() });

        // --- 4. Label (best effort) -----------------------------------------
        let labelUrl: string | null = null;
        try {
            labelUrl = await generateLabel(shipmentId);
        } catch (e) {
            console.warn('Ship: label generation failed:', e);
        }
        if (labelUrl) await persist(orderId, { label_url: labelUrl });

        // --- 5. Move the order to Shipped via the stock-aware helper ---------
        let warning: string | undefined;
        if (order.status !== 'Shipped' && order.status !== 'Delivered') {
            try {
                await updateOrder({ id: orderId, status: 'Shipped' });
            } catch (e) {
                console.error('Ship: status update failed after booking:', e);
                warning = `The parcel is booked (AWB ${awb}) but the order status could not be updated — set it to Shipped manually.`;
            }
        }

        return NextResponse.json({
            success: true,
            awb,
            courier,
            labelUrl,
            shipmentId,
            trackingUrl,
            pickup,
            ...(warning ? { warning } : {}),
        });
    } catch (e: any) {
        console.error('Ship route failed:', e);
        return fail(e?.message || 'Could not book this shipment', 500);
    }
}
