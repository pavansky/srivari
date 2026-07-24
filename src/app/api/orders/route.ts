import { NextResponse } from 'next/server';
import { getOrders, updateOrder } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

/** GET — admin only. Returns the full order ledger (contains customer PII). */
export async function GET(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const orders = await getOrders();
        return NextResponse.json(orders);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

/** PUT — admin only. Updates order status and/or tracking details. */
export async function PUT(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const body = await request.json();
        if (!body?.id) return NextResponse.json({ error: 'Order id required' }, { status: 400 });
        const updated = await updateOrder(body);
        return NextResponse.json({ success: true, order: updated });
    } catch (e) {
        console.error('PUT /api/orders ERROR:', e);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
