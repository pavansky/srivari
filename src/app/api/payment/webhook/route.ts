import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateOrderPayment } from '@/lib/db';

/**
 * Razorpay server-side webhook (configure in the Razorpay dashboard →
 * Webhooks → event `payment.captured`, secret = RAZORPAY_WEBHOOK_SECRET).
 *
 * Without this, a captured payment whose customer closed the browser before
 * the client-side /api/payment/verify callback would leave the order stuck in
 * 'Pending' forever. updateOrderPayment is idempotent and race-safe, so this
 * can fire alongside the client verification without double-decrementing.
 */
export async function POST(req: Request) {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
            return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
        }

        const rawBody = await req.text();
        const signature = req.headers.get('x-razorpay-signature') || '';
        const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

        const valid = signature.length === expected.length &&
            crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
        if (!valid) {
            console.warn('Razorpay webhook rejected: bad signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const payload = JSON.parse(rawBody);
        if (payload.event === 'payment.captured') {
            const payment = payload.payload?.payment?.entity;
            if (payment?.order_id) {
                await updateOrderPayment(payment.order_id, payment.id);
                return NextResponse.json({ success: true });
            }
        }

        return NextResponse.json({ received: true });
    } catch (e) {
        console.error('Razorpay webhook error:', e);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
