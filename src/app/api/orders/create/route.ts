import { NextResponse } from 'next/server';
import { createOrder as saveOrderToDb } from '@/lib/db';
import { sendEmail } from '@/lib/emailProvider';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { firstName, lastName, phone, email, address, items, total, userId, paymentMethod } = body;

        if (!email || !firstName || !phone) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        const internalOrderId = `SR-${Date.now().toString().slice(-6)}`;
        const fullName = `${firstName} ${lastName}`;

        // Logic split by Payment Method
        if (paymentMethod === 'COD') {
            const newOrder = {
                id: internalOrderId,
                userId,
                customerName: fullName,
                customerPhone: phone,
                customerEmail: email,
                address: address || 'N/A',
                items: items.map((i: any) => ({
                    productId: i.id,
                    productName: i.name,
                    quantity: i.quantity,
                    price: i.price
                })),
                totalAmount: Number(total),
                status: 'Placed' as const,
                paymentMethod: 'COD',
                paymentStatus: 'Pending'
            };

            await saveOrderToDb(newOrder as any);

            // Send Confirmation Email for COD
            const subject = `Order Confirmation (COD): ${internalOrderId} - Srivari`;
            await sendEmail(email, subject, generateEmailHtml(fullName, internalOrderId, items, total));

            return NextResponse.json({ success: true, orderId: internalOrderId });
        } else {
            // Razorpay Flow
            const options = {
                amount: Math.round(total * 100), // Paise
                currency: "INR",
                receipt: internalOrderId,
            };

            const razorpayOrder = await razorpay.orders.create(options);

            const newOrder = {
                id: internalOrderId,
                userId,
                customerName: fullName,
                customerPhone: phone,
                customerEmail: email,
                address: address || 'N/A',
                items: items.map((i: any) => ({
                    productId: i.id,
                    productName: i.name,
                    quantity: i.quantity,
                    price: i.price
                })),
                totalAmount: Number(total),
                status: 'Pending' as const,
                paymentMethod: 'Razorpay',
                paymentStatus: 'Pending',
                razorpayOrderId: razorpayOrder.id
            };

            await saveOrderToDb(newOrder as any);

            return NextResponse.json({
                success: true,
                orderId: internalOrderId,
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                key: process.env.RAZORPAY_KEY_ID
            });
        }
    } catch (error) {
        console.error('Order creation failed:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}

function generateEmailHtml(name: string, orderId: string, items: any[], total: number) {
    return `
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
            You can track the status of your heirloom at any time by visiting our <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://thesrivari.com'}/order-tracking">Concierge Portal</a> and using Order ID: <strong>${orderId}</strong>.</p>
            
            <p style="font-size: 12px; color: #888; text-align: center; margin-top: 30px;">&copy; The Srivari</p>
        </div>
    `;
}
