import { NextResponse } from 'next/server';
import { validateCoupon } from '@/lib/coupons';
import { rateLimit } from '@/lib/rate-limit';

/** POST — public coupon validation at checkout. Body: { code, subtotal } */
export async function POST(request: Request) {
    try {
        const ip = request.headers.get('x-forwarded-for') || 'anonymous';
        if (!rateLimit(`coupon:${ip}`, 20).success) {
            return NextResponse.json({ valid: false, error: 'Too many attempts' }, { status: 429 });
        }

        const { code, subtotal } = await request.json();
        const result = await validateCoupon(String(code || ''), Number(subtotal) || 0);
        return NextResponse.json(result, { status: result.valid ? 200 : 400 });
    } catch (e) {
        console.error('Coupon validation failed:', e);
        return NextResponse.json({ valid: false, error: 'Validation failed' }, { status: 500 });
    }
}
