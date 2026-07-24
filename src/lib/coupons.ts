import prisma from './prisma';

export interface CouponResult {
    valid: boolean;
    error?: string;
    code?: string;
    discount?: number;
    description?: string;
}

/**
 * Validates a coupon code against the DB and computes the discount for a given
 * items subtotal. Returns { valid: false } with a human-readable error when the
 * code can't be applied. Degrades gracefully if the Coupon table doesn't exist
 * yet (schema not pushed): coupons simply report as invalid.
 */
export async function validateCoupon(code: string, subtotal: number): Promise<CouponResult> {
    if (!code || typeof code !== 'string') return { valid: false, error: 'Enter a coupon code' };

    let coupon;
    try {
        coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
    } catch (e) {
        console.warn('Coupon lookup failed (table missing?):', e);
        return { valid: false, error: 'Coupons are not available right now' };
    }

    if (!coupon || !coupon.isActive) return { valid: false, error: 'Invalid coupon code' };
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return { valid: false, error: 'This coupon has expired' };
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
        return { valid: false, error: 'This coupon has been fully redeemed' };
    }
    if (subtotal < coupon.minOrder) {
        return { valid: false, error: `Minimum order of ₹${coupon.minOrder.toLocaleString('en-IN')} required` };
    }

    let discount = coupon.type === 'PERCENT'
        ? (subtotal * coupon.value) / 100
        : coupon.value;
    if (coupon.type === 'PERCENT' && coupon.maxDiscount != null) {
        discount = Math.min(discount, coupon.maxDiscount);
    }
    discount = Math.min(Math.round(discount), subtotal);

    return { valid: true, code: coupon.code, discount, description: coupon.description || undefined };
}

/** Increments a coupon's redemption count (fire-and-forget safe). */
export async function redeemCoupon(code: string) {
    try {
        await prisma.coupon.update({
            where: { code: code.trim().toUpperCase() },
            data: { usedCount: { increment: 1 } }
        });
    } catch (e) {
        console.warn('Coupon redemption count failed:', e);
    }
}
