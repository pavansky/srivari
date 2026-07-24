
import { NextResponse } from 'next/server';
import { updateOrder } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 1. Authenticate the webhook. Set SHIPROCKET_WEBHOOK_SECRET in the env
        // and configure the same value as the x-api-key header in Shiprocket.
        // No fallback secret: anything committed to a public repo is burned.
        const SECRET = process.env.SHIPROCKET_WEBHOOK_SECRET;
        if (!SECRET) {
            console.warn("Webhook rejected: SHIPROCKET_WEBHOOK_SECRET is not configured");
            return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
        }

        const token = req.headers.get('x-api-key');
        if (token !== SECRET) {
            console.warn("Webhook rejected: x-api-key mismatch or missing");
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log("Shiprocket Webhook Payload:", body);

        // 2. Extract Data
        // Shiprocket sends various events. We care about tracking updates.
        // Payload usually has: { current_status, awb, order_id, ... }

        const { current_status, order_id } = body;

        if (current_status && order_id) {
            // Map Shiprocket Status to Our Status
            let newStatus = 'Pending';

            // This mapping depends on Shiprocket's exact status strings
            const s = current_status.toUpperCase();
            if (s === 'DELIVERED') newStatus = 'Delivered';
            else if (s === 'SHIPPED' || s === 'IN TRANSIT' || s === 'OUT FOR DELIVERY') newStatus = 'Shipped';
            else if (s === 'CANCELLED') newStatus = 'Cancelled';
            else return NextResponse.json({ message: 'Status ignored' });

            // 3. Update Local DB
            // We assume 'order_id' in payload matches our local 'id' (SR-xxxxxx) if we passed it correctly.
            // If Shiprocket uses its own ID, we'd need to lookup by `razorpay_order_id` or store Shiprocket ID.
            // For this demo, let's assume we can try to match by ID.

            // NOTE: In a real app, you'd store the 'shipment_id' or 'awb' in your order to match reliably.
            // Since we haven't implemented "Push Order to Shiprocket" explicitly, we rely on the manual entry 
            // of our Order ID into Shiprocket panel by the user.

            await updateOrder({ id: order_id, status: newStatus as any });
            return NextResponse.json({ success: true, message: `Updated order ${order_id} to ${newStatus}` });
        }

        return NextResponse.json({ message: 'No action taken' });

    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
