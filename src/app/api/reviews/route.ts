import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reviews?productId=...
 * Public: approved reviews for a product plus aggregate rating.
 * Degrades gracefully (empty list) if the Review table doesn't exist yet.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });

    try {
        const reviews = await prisma.review.findMany({
            where: { productId, isApproved: true },
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: { id: true, name: true, rating: true, title: true, comment: true, createdAt: true }
        });
        const count = reviews.length;
        const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
        return NextResponse.json({ reviews, count, average: Math.round(average * 10) / 10 });
    } catch (e) {
        console.warn('Reviews unavailable (table missing?):', e);
        return NextResponse.json({ reviews: [], count: 0, average: 0 });
    }
}

/**
 * POST /api/reviews
 * Public review submission — held for admin approval before it appears.
 */
export async function POST(request: Request) {
    try {
        const ip = request.headers.get('x-forwarded-for') || 'anonymous';
        if (!rateLimit(`review:${ip}`, 5).success) {
            return NextResponse.json({ error: 'Too many reviews submitted. Please try later.' }, { status: 429 });
        }

        const body = await request.json();
        const { productId, name, email, rating, title, comment } = body;

        if (!productId || !name || !comment) {
            return NextResponse.json({ error: 'Name, rating and review text are required' }, { status: 400 });
        }
        const numRating = Math.round(Number(rating));
        if (!numRating || numRating < 1 || numRating > 5) {
            return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
        }

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        await prisma.review.create({
            data: {
                productId,
                name: String(name).slice(0, 80),
                email: email ? String(email).slice(0, 120) : null,
                rating: numRating,
                title: title ? String(title).slice(0, 120) : null,
                comment: String(comment).slice(0, 2000),
                isApproved: false,
            }
        });

        return NextResponse.json({ success: true, message: 'Thank you! Your review will appear after moderation.' });
    } catch (e) {
        console.error('Review submission failed:', e);
        return NextResponse.json({ error: 'Could not submit review right now' }, { status: 500 });
    }
}
