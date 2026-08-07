import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateOrderPayment } from '@/lib/db';
import { notifyOrderConfirmed } from '@/lib/notify';

export async function POST(req: Request) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            const order = await updateOrderPayment(razorpay_order_id, razorpay_payment_id);

            // WhatsApp order confirmation. Deliberately after the payment is
            // recorded and deliberately incapable of failing it: notify* never
            // throws, and the .catch is a second net. Replays (the client
            // callback firing twice) are suppressed inside notify.ts by the
            // once-per-order guard plus the row's own updatedAt freshness.
            await notifyOrderConfirmed(order, { rowWrittenByThisEvent: true }).catch(() => undefined);

            return NextResponse.json({ success: true, message: "Payment verified successfully" });
        } else {
            return NextResponse.json({ success: false, message: "Invalid signature" }, { status: 400 });
        }

    } catch (error) {
        console.error("Verification Error:", error);
        return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
    }
}
