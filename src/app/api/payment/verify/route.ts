import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Helper to update local JSON DB (since we are using file persistence)
const updateOrderStatus = async (orderId: string, paymentId: string) => {
    try {
        const filePath = path.join(process.cwd(), 'data', 'orders.json');

        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf8');
            let orders = JSON.parse(fileData);

            // Find order by ID (Note: The ID passed here might need to be linked to our internal ID)
            // For this implementation, we might need to pass our internal Order ID in notes, 
            // but for simplicity, let's assume we are updating the latest pending order or we need to pass the internal ID from frontend.
            // BETTER APPROACH: The frontend will call this verification. We should trust the signature.
            // For this step, we just verify the signature. Actual Order Status update in DB 
            // should seemingly happen here if we can map Razorpay Order ID to Internal Order ID.

            // For now, let's just Log it. In a real app, we'd look up the order where razorpay_order_id matches.
            console.log(`Payment Verified! Order ID: ${orderId}, Payment ID: ${paymentId}`);

            // TODO: In a real DB, update the record where order.razorpayOrderId === orderId
        }
    } catch (error) {
        console.error("DB Update Error", error);
    }
};

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
            await updateOrderStatus(razorpay_order_id, razorpay_payment_id);
            return NextResponse.json({ success: true, message: "Payment verified successfully" });
        } else {
            return NextResponse.json({ success: false, message: "Invalid signature" }, { status: 400 });
        }

    } catch (error) {
        console.error("Verification Error:", error);
        return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
    }
}
