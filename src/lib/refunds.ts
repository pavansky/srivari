import 'server-only';
import Razorpay from 'razorpay';
import prisma from './prisma';

/**
 * Razorpay refunds for prepaid cancellations.
 *
 * Indian consumer expectation (and RBI norms for card/UPI) is that a cancelled
 * prepaid order is refunded to source. This is called when an admin cancels a
 * Paid order; COD/offline orders have nothing to refund.
 */

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

export interface RefundResult {
    refunded: boolean;
    refundId?: string;
    amount?: number;
    reason?: string;
}

/**
 * Refunds a paid order in full. Idempotent: an order already carrying a
 * refund_id is left alone, so a double-cancel can't double-refund.
 */
export async function refundOrder(orderId: string): Promise<RefundResult> {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return { refunded: false, reason: 'Order not found' };

    if ((order as any).refund_id) {
        return { refunded: false, reason: 'This order has already been refunded' };
    }
    if (order.payment_method !== 'Razorpay') {
        return { refunded: false, reason: 'Not a prepaid order — nothing to refund' };
    }
    if (order.status !== 'Paid' && order.status !== 'Shipped' && order.status !== 'Delivered') {
        return { refunded: false, reason: 'Order was never paid' };
    }

    const paymentId = (order as any).razorpay_payment_id;
    if (!paymentId) {
        return { refunded: false, reason: 'No payment reference stored — refund manually in the Razorpay dashboard' };
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
        return { refunded: false, reason: 'Razorpay is not configured on this deployment' };
    }

    try {
        const amountPaise = Math.round(order.total * 100);
        const refund = await razorpay.payments.refund(paymentId, {
            amount: amountPaise,
            speed: 'normal',
            notes: { orderId: order.id, reason: 'Order cancelled by boutique' },
        } as any);

        await prisma.order.update({
            where: { id: orderId },
            data: {
                refund_id: String(refund.id),
                refund_amount: order.total,
                refunded_at: new Date(),
            } as any,
        });

        return { refunded: true, refundId: String(refund.id), amount: order.total };
    } catch (e: any) {
        console.error('Refund failed:', e?.error?.description || e?.message);
        return {
            refunded: false,
            reason: e?.error?.description || 'Razorpay rejected the refund — check the dashboard',
        };
    }
}
