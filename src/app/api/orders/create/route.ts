import { NextResponse } from 'next/server';
import { createOrder as saveOrderToDb } from '@/lib/db';
import { sendEmail } from '@/lib/emailProvider';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, phone, email, address, items, total } = body;

        if (!email || !name || !phone) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

        const date = new Date();
        date.setDate(date.getDate() + 7);
        const estimatedDelivery = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        // Construct Order Object
        const newOrder = {
            id: orderId,
            customerName: name,
            phone,
            email,
            address: address || 'N/A',
            items,
            totalAmount: Number(total),
            status: 'Placed' as const,
            estimatedDelivery,
            currentLocation: 'Order Received - Processing',
            createdAt: new Date().toISOString(),
            images: []
        };

        // Save to JSON DB
        await saveOrderToDb(newOrder as any);

        // Send Email
        const subject = `Order Confirmation: ${orderId} - Srivari`;
        const html = `
            <div style="font-family: serif; color: #4A0404; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #D4AF37;">
                <h1 style="text-align: center; border-bottom: 1px solid #D4AF37; padding-bottom: 10px;">SRIVARI</h1>
                <p>Namaste ${name},</p>
                <p>We are honored to receive your request. Your order <strong>${orderId}</strong> has been successfully recorded.</p>
                
                <div style="background: #FAF8F5; padding: 15px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Order Summary</h3>
                    <ul style="padding-left: 20px;">
                        ${items.map((item: any) => `<li>${item.name} - ₹${item.price.toLocaleString('en-IN')}</li>`).join('')}
                    </ul>
                    <p style="font-weight: bold; text-align: right;">Total: ₹${total.toLocaleString('en-IN')}</p>
                </div>

                <p><strong>Tracking Your Order:</strong><br>
                You can track the status of your heirloom at any time by visiting our <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/order-tracking">Concierge Portal</a> and using Order ID: <strong>${orderId}</strong>.</p>
                
                <p style="font-size: 12px; color: #888; text-align: center; margin-top: 30px;">&copy; The Srivari</p>
            </div>
        `;

        await sendEmail(email, subject, html);

        return NextResponse.json({ success: true, orderId });

    } catch (error) {
        console.error('Order creation failed:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
