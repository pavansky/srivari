import { NextResponse } from 'next/server';
import { createOrder as saveOrderToDb } from '@/lib/db';
import { sendEmail } from '@/lib/emailProvider';
import { validateCoupon, redeemCoupon } from '@/lib/coupons';
import { rateLimit } from '@/lib/rate-limit';
import prisma from '@/lib/prisma';
import Razorpay from 'razorpay';
import {
    DeliveryMethod,
    LOCAL_DELIVERY,
    SELLER,
    STORE_PICKUP,
    isLocalPincode,
    localDeliveryFee,
} from '@/config/commerce';
import { GstSummary, computeGst, invoiceNumber } from '@/lib/gst';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// Payment methods that are settled offline: order is confirmed immediately and
// stock is decremented at creation. Razorpay orders reserve stock only after
// payment verification.
const OFFLINE_METHODS = ['COD', 'WhatsApp', 'Manual'];

const MAX_SHIPPING = 5000;

const DELIVERY_METHODS: DeliveryMethod[] = ['Courier', 'Local', 'Pickup'];

/** Products, selected explicitly so a not-yet-migrated column can't 500 checkout. */
const PRODUCT_BASE_SELECT = {
    id: true, name: true, price: true, stock: true, category: true, deletedAt: true,
};

async function loadOrderProducts(ids: string[]) {
    try {
        // Preferred: includes the GST classification overrides.
        return await prisma.product.findMany({
            where: { id: { in: ids } },
            select: { ...PRODUCT_BASE_SELECT, hsnCode: true, gstRate: true } as any,
        }) as any[];
    } catch (e) {
        console.warn('Order create: GST columns unavailable, using category defaults:', e);
        return await prisma.product.findMany({
            where: { id: { in: ids } },
            select: PRODUCT_BASE_SELECT,
        }) as any[];
    }
}

/**
 * The Order table gained columns the live database may not have yet (`prisma db
 * push` pending). A write against the stale schema fails with P2022 — surface a
 * human next step instead of a bare 500 in the middle of checkout.
 */
function schemaOutOfDate(e: any): NextResponse | null {
    const stale = String(e?.code) === 'P2022'
        || /does not exist in the current database/i.test(String(e?.message));
    if (!stale) return null;
    console.error('Order create: database schema is behind the Prisma client —', e?.message);
    return NextResponse.json({
        success: false,
        message: 'We could not confirm your order automatically. Nothing has been charged — please message us on WhatsApp and we will complete it for you.',
    }, { status: 503 });
}

/**
 * Persists the structured address alongside the flat string in the `customer`
 * JSON column. That column already exists, so this survives the pending
 * migration — shipping, GST and invoices all need city/state/pincode.
 */
async function saveStructuredCustomer(
    orderId: string,
    existingCustomer: any,
    extra: { city: string; state: string; pincode: string; deliveryMethod: DeliveryMethod }
) {
    try {
        let base: any = existingCustomer;
        if (!base || typeof base !== 'object') {
            const row = await prisma.order.findUnique({ where: { id: orderId }, select: { customer: true } });
            base = row?.customer;
        }
        // Never write a partial customer object — that would drop the name,
        // phone and email the order was placed with.
        if (!base || typeof base !== 'object') {
            console.warn(`Order create: skipped structured address for ${orderId} (customer JSON unreadable)`);
            return;
        }
        await prisma.order.update({
            where: { id: orderId },
            data: { customer: { ...base, ...extra } } as any,
            // Select only the id: a bare update() returns every column, which
            // would itself fail while the new columns are missing.
            select: { id: true },
        });
    } catch (e) {
        console.warn(`Order create: could not store structured address for ${orderId}:`, e);
    }
}

/**
 * Snapshots the delivery channel + GST breakup onto the order. Every field here
 * is a new column, so a failure is expected until `prisma db push` runs and must
 * never affect the customer — the order itself is already saved.
 */
async function saveCommerceSnapshot(
    orderId: string,
    deliveryMethod: DeliveryMethod,
    gst: GstSummary | null
) {
    try {
        await prisma.order.update({
            where: { id: orderId },
            data: {
                delivery_method: deliveryMethod,
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
                        place_of_supply: gst.placeOfSupply,
                    }
                    : {}),
            } as any,
            select: { id: true },
        });
    } catch (e) {
        console.warn(`Order create: tax/delivery snapshot skipped for ${orderId} (columns missing?):`, e);
    }
}

export async function POST(request: Request) {
    try {
        const ip = request.headers.get('x-forwarded-for') || 'anonymous';
        if (!rateLimit(`order:${ip}`, 10).success) {
            return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
        }

        const body = await request.json();
        const { firstName, lastName, phone, email, address, items, paymentMethod, couponCode } = body;

        // Never trust a client-supplied userId — derive it from the Supabase
        // token when one is presented, otherwise store the order as guest.
        let userId: string | undefined;
        const authHeader = request.headers.get('Authorization');
        if (authHeader?.startsWith('Bearer ')) {
            const { supabase } = await import('@/lib/supabaseClient');
            const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
            userId = user?.id;
        }

        if (!email || !firstName || !phone) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }
        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ success: false, message: 'Cart is empty' }, { status: 400 });
        }

        // --- Structured address (kept in the customer JSON, which already exists) ---
        const city = String(body.city ?? '').trim().slice(0, 80);
        const stateInput = String(body.state ?? '').trim().slice(0, 60);
        const rawPincode = String(body.pincode ?? '').trim();
        const pincode = /^\d{6}$/.test(rawPincode) ? rawPincode : '';

        // --- Delivery channel: validated against config, never taken on trust ---
        const requestedMethod = String(body.deliveryMethod ?? 'Courier');
        const deliveryMethod: DeliveryMethod = DELIVERY_METHODS.includes(requestedMethod as DeliveryMethod)
            ? requestedMethod as DeliveryMethod
            : 'Courier';

        if (deliveryMethod === 'Pickup' && !STORE_PICKUP.enabled) {
            return NextResponse.json(
                { success: false, message: 'Boutique collection is not available at the moment' },
                { status: 400 }
            );
        }
        if (deliveryMethod === 'Local') {
            if (!LOCAL_DELIVERY.enabled) {
                return NextResponse.json(
                    { success: false, message: 'Local delivery is not available at the moment' },
                    { status: 400 }
                );
            }
            if (!isLocalPincode(pincode)) {
                return NextResponse.json(
                    { success: false, message: `Local delivery is only available around our ${SELLER.address.city} boutique` },
                    { status: 400 }
                );
            }
        }

        // --- Server-side price derivation: never trust client prices/totals ---
        // Aggregate duplicate lines first so the same product repeated in the
        // payload can't sneak past a per-line stock comparison.
        const requestedQty = new Map<string, number>();
        for (const i of items) {
            const pid = i.id || i.productId;
            if (!pid) continue;
            const quantity = Math.max(1, Math.min(Number(i.quantity) || 1, 100));
            requestedQty.set(pid, (requestedQty.get(pid) || 0) + quantity);
        }

        const productIds = Array.from(requestedQty.keys());
        const dbProducts = await loadOrderProducts(productIds);
        const productMap = new Map(dbProducts.map(p => [p.id, p]));

        const verifiedItems: { productId: string; productName: string; quantity: number; price: number }[] = [];
        // Same lines, carrying the DB's tax classification — used for GST only.
        const taxItems: { price: number; quantity: number; category?: string | null; name?: string | null; hsnCode?: string | null; gstRate?: number | null }[] = [];
        for (const [pid, quantity] of requestedQty) {
            const product = productMap.get(pid);
            if (!product || product.deletedAt) {
                return NextResponse.json({ success: false, message: `Product unavailable: ${pid}` }, { status: 400 });
            }
            if (product.stock < quantity) {
                return NextResponse.json({ success: false, message: `Insufficient stock for ${product.name}` }, { status: 409 });
            }
            verifiedItems.push({ productId: product.id, productName: product.name, quantity, price: product.price });
            taxItems.push({
                price: product.price,
                quantity,
                category: product.category,
                name: product.name,
                hsnCode: product.hsnCode ?? null,
                gstRate: product.gstRate ?? null,
            });
        }
        if (verifiedItems.length === 0) {
            return NextResponse.json({ success: false, message: 'Cart is empty' }, { status: 400 });
        }

        const subtotal = verifiedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

        // Shipping is derived from the delivery channel, not from the client:
        // Pickup is free by definition and Local is priced by config, so a
        // client can't award itself a free channel it isn't entitled to. Only a
        // courier order keeps the (bounded) Shiprocket quote sent from checkout.
        const quotedShipping = Math.min(Math.max(Number(body.shippingCost ?? body.shipping_cost ?? 0) || 0, 0), MAX_SHIPPING);
        const shippingCost =
            deliveryMethod === 'Pickup' ? 0
                : deliveryMethod === 'Local' ? localDeliveryFee(subtotal)
                    : quotedShipping;

        // Coupon (validated server-side against the DB)
        let coupon: { code: string; discount: number } | undefined;
        if (couponCode) {
            const result = await validateCoupon(couponCode, subtotal);
            if (!result.valid) {
                return NextResponse.json({ success: false, message: result.error || 'Invalid coupon' }, { status: 400 });
            }
            coupon = { code: result.code!, discount: result.discount! };
        }

        const total = Math.max(0, subtotal - (coupon?.discount || 0)) + shippingCost;

        // --- GST snapshot (prices are GST-inclusive; tax is extracted from them) ---
        // Pickup and local delivery are physically supplied in the seller's own
        // state, so the place of supply is known even when the form left it blank.
        const customerState = stateInput
            || (deliveryMethod !== 'Courier' || isLocalPincode(pincode) ? SELLER.state : '');
        let gst: GstSummary | null = null;
        try {
            gst = computeGst(taxItems, customerState, coupon?.discount || 0);
        } catch (e) {
            console.warn('Order create: GST computation failed, continuing without a tax snapshot:', e);
        }

        // Time component + random suffix: readable, non-sequential, collision-safe
        const internalOrderId = `SR-${Date.now().toString(36).slice(-5)}${Math.floor(Math.random() * 1296).toString(36).padStart(2, '0')}`.toUpperCase();
        const fullName = `${firstName} ${lastName || ''}`.trim();
        const method = OFFLINE_METHODS.includes(paymentMethod) ? paymentMethod : 'Razorpay';

        const baseOrder: any = {
            id: internalOrderId,
            userId,
            customerName: fullName,
            customerPhone: phone,
            customerEmail: email,
            address: address || 'N/A',
            items: verifiedItems,
            amount: subtotal,
            shippingCost,
            coupon,
            totalAmount: total,
            paymentMethod: method,
        };

        // A fully-discounted order (e.g. 100%-off promo + free shipping) has no
        // amount to charge — Razorpay rejects amount < ₹1, so settle it offline.
        const isFreeOrder = total < 1;

        // Structured address + tax snapshot, written after the order exists.
        // Both are best-effort: the order is already safe in the DB.
        const persistOrderExtras = async (orderId: string, created: any) => {
            await saveStructuredCustomer(orderId, created?.customer, {
                city, state: customerState, pincode, deliveryMethod,
            });
            await saveCommerceSnapshot(orderId, deliveryMethod, gst);
        };

        if (method !== 'Razorpay' || isFreeOrder) {
            // Offline / free order: confirmed now, stock decremented atomically
            let created: any = null;
            try {
                created = await saveOrderToDb(
                    { ...baseOrder, paymentMethod: isFreeOrder ? method : method, status: 'Placed' },
                    { skipStockDecrement: false }
                );
            } catch (e: any) {
                if (String(e?.message).startsWith('INSUFFICIENT_STOCK:')) {
                    const name = String(e.message).split(':')[1] || 'an item';
                    return NextResponse.json({ success: false, message: `Just sold out: not enough stock for ${name}` }, { status: 409 });
                }
                const schemaFailure = schemaOutOfDate(e);
                if (schemaFailure) return schemaFailure;
                throw e;
            }
            await persistOrderExtras(internalOrderId, created);
            if (coupon) await redeemCoupon(coupon.code);

            const subject = `Order Confirmation (${method}): ${internalOrderId} - The Srivari`;
            await sendEmail(email, subject, generateEmailHtml(fullName, internalOrderId, verifiedItems, total, shippingCost, coupon, gst, deliveryMethod)).catch(e =>
                console.error('Order email failed:', e)
            );

            return NextResponse.json({ success: true, orderId: internalOrderId, total, free: isFreeOrder, deliveryMethod });
        }

        // Razorpay flow: order stays 'Pending' and stock is reserved on payment verify
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(total * 100), // Paise
            currency: 'INR',
            receipt: internalOrderId,
        });

        let createdOrder: any = null;
        try {
            createdOrder = await saveOrderToDb(
                { ...baseOrder, status: 'Pending', razorpayOrderId: razorpayOrder.id },
                { skipStockDecrement: true }
            );
        } catch (e: any) {
            // Extremely rare order-id collision (P2002): the Razorpay order is
            // already created, so retry the local save once with a fresh id
            // rather than 500 and orphan the payment intent.
            if (String(e?.code) === 'P2002' || /Unique constraint/i.test(String(e?.message))) {
                const retryId = `SR-${Date.now().toString(36).slice(-5)}${Math.floor(Math.random() * 1296).toString(36).padStart(2, '0')}X`.toUpperCase();
                const retryOrder = await saveOrderToDb(
                    { ...baseOrder, id: retryId, status: 'Pending', razorpayOrderId: razorpayOrder.id },
                    { skipStockDecrement: true }
                );
                await persistOrderExtras(retryId, retryOrder);
                return NextResponse.json({
                    success: true, orderId: retryId, razorpayOrderId: razorpayOrder.id,
                    amount: razorpayOrder.amount, total, key: process.env.RAZORPAY_KEY_ID,
                    deliveryMethod
                });
            }
            const schemaFailure = schemaOutOfDate(e);
            if (schemaFailure) return schemaFailure;
            throw e;
        }
        await persistOrderExtras(internalOrderId, createdOrder);
        // NOTE: the coupon is redeemed at payment verification (updateOrderPayment),
        // not here — abandoned checkouts must not consume limited coupon slots.

        return NextResponse.json({
            success: true,
            orderId: internalOrderId,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            total,
            key: process.env.RAZORPAY_KEY_ID,
            deliveryMethod
        });
    } catch (error) {
        console.error('Order creation failed:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}

function generateEmailHtml(
    name: string,
    orderId: string,
    items: { productName: string; price: number; quantity: number }[],
    total: number,
    shipping: number,
    coupon?: { code: string; discount: number },
    gst?: GstSummary | null,
    deliveryMethod: DeliveryMethod = 'Courier'
) {
    const deliveryLine =
        deliveryMethod === 'Pickup'
            ? `Collection: ${SELLER.address.line1}, ${SELLER.address.city} ${SELLER.address.pincode}. ${STORE_PICKUP.instructions}`
            : deliveryMethod === 'Local'
                ? `Delivery: by our own team — ${LOCAL_DELIVERY.eta}.`
                : '';

    const gstLine = gst?.enabled
        ? `<p style="text-align: right; font-size: 11px; color: #888; margin-top: 4px;">${gst.isIntraState
            ? `Inclusive of CGST ₹${gst.cgst.toLocaleString('en-IN')} + SGST ₹${gst.sgst.toLocaleString('en-IN')}`
            : `Inclusive of IGST ₹${gst.igst.toLocaleString('en-IN')}`
        } (${gst.rate}%)</p>`
        : '';

    return `
        <div style="font-family: serif; color: #4A0404; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #D4AF37;">
            <h1 style="text-align: center; border-bottom: 1px solid #D4AF37; padding-bottom: 10px;">THE SRIVARI</h1>
            <p>Namaste ${name},</p>
            <p>We are honored to receive your request. Your order <strong>${orderId}</strong> has been successfully recorded.</p>

            <div style="background: #FAF8F5; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Order Summary</h3>
                <ul style="padding-left: 20px;">
                    ${items.map(item => `<li>${item.productName} × ${item.quantity} — ₹${(item.price * item.quantity).toLocaleString('en-IN')}</li>`).join('')}
                </ul>
                ${coupon ? `<p style="text-align: right; color: #1a7a3a;">Coupon ${coupon.code}: −₹${coupon.discount.toLocaleString('en-IN')}</p>` : ''}
                ${shipping > 0 ? `<p style="text-align: right;">Shipping: ₹${shipping.toLocaleString('en-IN')}</p>` : ''}
                <p style="font-weight: bold; text-align: right;">Total: ₹${total.toLocaleString('en-IN')}</p>
                ${gstLine}
            </div>

            ${deliveryLine ? `<p style="font-size: 13px;">${deliveryLine}</p>` : ''}

            <p><strong>Tracking Your Order:</strong><br>
            You can track the status of your heirloom at any time by visiting our <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://thesrivari.com'}/order-tracking">Concierge Portal</a> and using Order ID: <strong>${orderId}</strong> with the phone number on the order.</p>

            <p style="font-size: 12px; color: #888; text-align: center; margin-top: 30px;">&copy; The Srivari</p>
        </div>
    `;
}
