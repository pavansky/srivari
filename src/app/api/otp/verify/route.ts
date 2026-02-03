import { NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/otp';

export async function POST(request: Request) {
    try {
        const { orderId, otp } = await request.json();

        // Reconstruct the phone number based on Order ID (Same logic as 'send')
        const last4 = orderId.replace(/\D/g, '').slice(-4).padEnd(4, '0');
        const phone = `99999${last4}`;

        // Verify Real OTP
        const isValid = verifyOTP(phone, otp);

        if (isValid) {
            // Mock Order Details - Success
            return NextResponse.json({
                success: true,
                order: {
                    id: orderId,
                    status: 'In Transit',
                    items: [
                        { name: 'Royal Kanjivaram Silk - Maroon', price: 25000 },
                        { name: 'Mysore Sandal Soap (Gift)', price: 0 }
                    ],
                    estimatedDelivery: 'Oct 24, 2025',
                    currentLocation: 'Bangalore Hub'
                }
            });
        } else {
            return NextResponse.json({ success: false, message: 'Invalid or Expired OTP' }, { status: 400 });
        }

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
