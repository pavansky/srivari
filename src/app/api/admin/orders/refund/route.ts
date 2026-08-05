import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { refundOrder } from '@/lib/refunds';

export const dynamic = 'force-dynamic';

/**
 * POST { orderId } — refunds a prepaid order to source via Razorpay.
 *
 * refundOrder() is idempotent and returns a human-readable `reason` instead of
 * throwing, so its result is passed straight back to the admin console.
 *
 * Note for callers: it only accepts orders still in a paid state
 * (Paid/Shipped/Delivered), so a cancellation flow must issue the refund
 * *before* writing the Cancelled status.
 */
export async function POST(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const body = await request.json().catch(() => ({}));
        const orderId = String(body?.orderId || '').trim();
        if (!orderId) {
            return NextResponse.json({ refunded: false, reason: 'Order id required' }, { status: 400 });
        }

        const result = await refundOrder(orderId);
        return NextResponse.json(result);
    } catch (e: any) {
        // A missing refund_* column (migration pending) lands here too — report
        // it as a failed refund rather than a 500 in the admin's face.
        console.error('Refund route failed:', e);
        return NextResponse.json(
            { refunded: false, reason: 'The refund could not be issued — check the Razorpay dashboard.' },
            { status: 500 }
        );
    }
}
