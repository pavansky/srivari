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

/**
 * Atomically consumes one redemption, respecting usageLimit. The conditional
 * updateMany (increment only while usedCount < usageLimit, or unlimited) closes
 * the check-then-act race between validateCoupon and redeem: two concurrent
 * (or Razorpay-deferred) redemptions of a single-use code can't both succeed.
 * Returns true if a slot was consumed. Never throws (a missing Coupon table
 * must not roll back a completed payment).
 */
export async function redeemCoupon(code: string): Promise<boolean> {
    try {
        const normalized = code.trim().toUpperCase();
        const res = await prisma.coupon.updateMany({
            where: {
                code: normalized,
                OR: [{ usageLimit: null }, { usedCount: { lt: prisma.coupon.fields.usageLimit } }],
            },
            data: { usedCount: { increment: 1 } },
        });
        return res.count > 0;
    } catch (e) {
        console.warn('Coupon redemption count failed:', e);
        return false;
    }
}
