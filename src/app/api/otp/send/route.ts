import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { orderId } = await request.json();

        // Simulate database lookup
        // In a real app, you would check if order exists
        if (!orderId || orderId.length < 5) {
            return NextResponse.json({ success: false, message: 'Invalid Order ID' }, { status: 400 });
        }

        // Simulate network delay for "sending SMS"
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock phone number logic: deterministic based on order ID
        // e.g. ORD-1234 -> +91 ***** *1234
        const last4 = orderId.replace(/\D/g, '').slice(-4).padEnd(4, '0');
        const maskedPhone = `+91 ***** *${last4}`;

        return NextResponse.json({
            success: true,
            maskedPhone,
            // For demo purposes, we usually send the OTP in response in dev mode, 
            // but here we will just say "Sent". Client will accept '1234'.
            debugOtp: '1234'
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
