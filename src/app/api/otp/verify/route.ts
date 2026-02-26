import { NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/otp';
import { getOrder } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { orderId, otp } = await request.json();

        // 1. Look up Order from DB
        const order = await getOrder(orderId);
        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        // 2. Verify OTP against the email in the order
        const isValid = verifyOTP(order.customerEmail || '', otp);

        if (isValid) {
            return NextResponse.json({
                success: true,
                order: order
            });
        } else {
            return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
    }
}
