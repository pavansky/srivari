import { NextResponse } from 'next/server';
import { getOrders, updateOrder } from '@/lib/db';

export async function GET() {
    try {
        const orders = await getOrders();
        return NextResponse.json(orders);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const updated = await updateOrder(body);
        return NextResponse.json({ success: true, order: updated });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
