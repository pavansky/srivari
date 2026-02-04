import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createOrder } from '@/lib/orders';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { items, customer, amount, shipping_cost } = body;
        // amount = subtotal here usually, or let frontend pass total. 
        // Let's rely on frontend 'total' for Razorpay, but calculate properly for DB.

        // Calculate Total
        const totalAmount = Math.round((amount + shipping_cost) * 100); // Paise

        if (!totalAmount) {
            return NextResponse.json({ error: "Amount is required" }, { status: 400 });
        }

        // 1. Create Razorpay Order
        const options = {
            amount: totalAmount,
            currency: "INR",
            receipt: "receipt_" + Math.random().toString(36).substring(7),
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // 2. Create Local Order linked to Razorpay ID
        await createOrder({
            customer: customer,
            items: items,
            amount: amount, // Subtotal
            shipping_cost: shipping_cost,
            razorpay_order_id: razorpayOrder.id,
            payment_method: 'Razorpay'
        });

        return NextResponse.json(razorpayOrder);
    } catch (error) {
        console.error("Razorpay Error:", error);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}
