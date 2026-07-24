import { NextResponse } from 'next/server';
import { getOrder } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

/**
 * Public order tracking. Identity is proven by knowing BOTH the order ID and
 * the phone number the order was placed with — no OTP delivery dependency.
 * Returns a sanitized status payload (no full address, no email).
 */
export async function POST(request: Request) {
    try {
        const ip = request.headers.get('x-forwarded-for') || 'anonymous';
        if (!rateLimit(`track:${ip}`, 15).success) {
            return NextResponse.json({ error: 'Too many attempts. Please try again in a minute.' }, { status: 429 });
        }

        const { orderId, phone } = await request.json();
        if (!orderId || !phone) {
            return NextResponse.json({ error: 'Order ID and phone number are required' }, { status: 400 });
        }

        const order = await getOrder(String(orderId).trim().toUpperCase());
        const digits = String(phone).replace(/\D/g, '');
        const orderDigits = (order?.customerPhone || '').replace(/\D/g, '');

        // Compare the trailing 10 digits so "+91 97399..." matches "97399..."
        const match = order && digits.length >= 10 && orderDigits.length >= 10 &&
            digits.slice(-10) === orderDigits.slice(-10);

        if (!match) {
            return NextResponse.json({ error: 'No order found for that ID and phone combination' }, { status: 404 });
        }

        return NextResponse.json({
            id: order.id,
            status: order.status,
            date: order.date,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            items: (order.items || []).map((i: any) => ({
                productName: i.productName,
                quantity: i.quantity,
                price: i.price,
            })),
            trackingNumber: (order as any).trackingNumber,
            trackingUrl: (order as any).trackingUrl,
            deliveryEta: (order as any).deliveryEta,
        });
    } catch (e) {
        console.error('Order tracking failed:', e);
        return NextResponse.json({ error: 'Tracking lookup failed' }, { status: 500 });
    }
}
