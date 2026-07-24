import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

/** GET — all reviews (pending + approved) with product names, for moderation. */
export async function GET(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const reviews = await prisma.review.findMany({
            orderBy: { createdAt: 'desc' },
            take: 200,
            include: { product: { select: { name: true, images: true } } }
        });
        return NextResponse.json(reviews.map(r => ({
            id: r.id,
            productId: r.productId,
            productName: r.product?.name || 'Deleted product',
            productImage: (r.product?.images as string[] | undefined)?.[0],
            name: r.name,
            email: r.email || undefined,
            rating: r.rating,
            title: r.title || undefined,
            comment: r.comment,
            isApproved: r.isApproved,
            createdAt: r.createdAt,
        })));
    } catch (e) {
        console.warn('Admin reviews unavailable (table missing?):', e);
        return NextResponse.json([]);
    }
}

/** PATCH — approve / unapprove a review. Body: { id, isApproved } */
export async function PATCH(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const { id, isApproved } = await request.json();
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
        const updated = await prisma.review.update({ where: { id }, data: { isApproved: !!isApproved } });
        return NextResponse.json({ success: true, review: updated });
    } catch (e) {
        console.error('Review moderation failed:', e);
        return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }
}

/** DELETE — remove a review. Query: ?id=... */
export async function DELETE(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
        await prisma.review.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Review delete failed:', e);
        return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
    }
}
