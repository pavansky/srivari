import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

/** GET — all coupons. */
export async function GET(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
        return NextResponse.json(coupons);
    } catch (e) {
        console.warn('Coupons unavailable (table missing?):', e);
        return NextResponse.json([]);
    }
}

/** POST — create or update a coupon. Body: Coupon fields (id present = update). */
export async function POST(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const body = await request.json();
        const code = String(body.code || '').trim().toUpperCase();
        if (!code) return NextResponse.json({ error: 'Coupon code required' }, { status: 400 });
        if (!['PERCENT', 'FLAT'].includes(body.type)) {
            return NextResponse.json({ error: 'Type must be PERCENT or FLAT' }, { status: 400 });
        }
        const value = Number(body.value);
        if (!value || value <= 0 || (body.type === 'PERCENT' && value > 100)) {
            return NextResponse.json({ error: 'Invalid coupon value' }, { status: 400 });
        }

        const data = {
            code,
            description: body.description ? String(body.description).slice(0, 200) : null,
            type: body.type,
            value,
            minOrder: Math.max(0, Number(body.minOrder) || 0),
            maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null,
            usageLimit: body.usageLimit ? Math.max(1, Math.round(Number(body.usageLimit))) : null,
            isActive: body.isActive !== false,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        };

        const saved = body.id
            ? await prisma.coupon.update({ where: { id: body.id }, data })
            : await prisma.coupon.create({ data });

        return NextResponse.json({ success: true, coupon: saved });
    } catch (e: any) {
        if (e?.code === 'P2002') {
            return NextResponse.json({ error: 'A coupon with that code already exists' }, { status: 409 });
        }
        console.error('Coupon save failed:', e);
        return NextResponse.json({ error: 'Failed to save coupon' }, { status: 500 });
    }
}

/** DELETE — remove a coupon. Query: ?id=... */
export async function DELETE(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
        await prisma.coupon.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Coupon delete failed:', e);
        return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
    }
}
