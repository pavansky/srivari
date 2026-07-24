import { NextResponse } from 'next/server';
import { createOrder as saveOrderToDb } from '@/lib/db';
import { sendEmail } from '@/lib/emailProvider';
import { validateCoupon, redeemCoupon } from '@/lib/coupons';
import { rateLimit } from '@/lib/rate-limit';
import prisma from '@/lib/prisma';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// Payment methods that are settled offline: order is confirmed immediately and
// stock is decremented at creation. Razorpay orders reserve stock only after
// payment verification.
const OFFLINE_METHODS = ['COD', 'WhatsApp', 'Manual'];

const MAX_SHIPPING = 5000;

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
        const dbProducts = await prisma.product.findMany({ where: { id: { in: productIds } } });
        const productMap = new Map(dbProducts.map(p => [p.id, p]));

        const verifiedItems: { productId: string; productName: string; quantity: number; price: number }[] = [];
        for (const [pid, quantity] of requestedQty) {
            const product = productMap.get(pid);
            if (!product || product.deletedAt) {
                return NextResponse.json({ success: false, message: `Product unavailable: ${pid}` }, { status: 400 });
            }
            if (product.stock < quantity) {
                return NextResponse.json({ success: false, message: `Insufficient stock for ${product.name}` }, { status: 409 });
            }
            verifiedItems.push({ productId: product.id, productName: product.name, quantity, price: product.price });
        }
        if (verifiedItems.length === 0) {
            return NextResponse.json({ success: false, message: 'Cart is empty' }, { status: 400 });
        }

        const subtotal = verifiedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

        // Shipping: bounded client value (Shiprocket-quoted at checkout)
        const shippingCost = Math.min(Math.max(Number(body.shippingCost ?? body.shipping_cost ?? 0) || 0, 0), MAX_SHIPPING);

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

        if (method !== 'Razorpay') {
            // Offline order: confirmed now, stock decremented atomically
            try {
                await saveOrderToDb({ ...baseOrder, status: 'Placed' }, { skipStockDecrement: false });
            } catch (e: any) {
                if (String(e?.message).startsWith('INSUFFICIENT_STOCK:')) {
                    const name = String(e.message).split(':')[1] || 'an item';
                    return NextResponse.json({ success: false, message: `Just sold out: not enough stock for ${name}` }, { status: 409 });
                }
                throw e;
            }
            if (coupon) await redeemCoupon(coupon.code);

            const subject = `Order Confirmation (${method}): ${internalOrderId} - The Srivari`;
            await sendEmail(email, subject, generateEmailHtml(fullName, internalOrderId, verifiedItems, total, shippingCost, coupon)).catch(e =>
                console.error('Order email failed:', e)
            );

            return NextResponse.json({ success: true, orderId: internalOrderId, total });
        }

        // Razorpay flow: order stays 'Pending' and stock is reserved on payment verify
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(total * 100), // Paise
            currency: 'INR',
            receipt: internalOrderId,
        });

        await saveOrderToDb(
            { ...baseOrder, status: 'Pending', razorpayOrderId: razorpayOrder.id },
            { skipStockDecrement: true }
        );
        // NOTE: the coupon is redeemed at payment verification (updateOrderPayment),
        // not here — abandoned checkouts must not consume limited coupon slots.

        return NextResponse.json({
            success: true,
            orderId: internalOrderId,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            total,
            key: process.env.RAZORPAY_KEY_ID
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
    coupon?: { code: string; discount: number }
) {
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
            </div>

            <p><strong>Tracking Your Order:</strong><br>
            You can track the status of your heirloom at any time by visiting our <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://thesrivari.com'}/order-tracking">Concierge Portal</a> and using Order ID: <strong>${orderId}</strong> with the phone number on the order.</p>

            <p style="font-size: 12px; color: #888; text-align: center; margin-top: 30px;">&copy; The Srivari</p>
        </div>
    `;
}
