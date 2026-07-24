import { redirect } from 'next/navigation';

/**
 * Order history now lives inside the authenticated account dashboard,
 * which fetches only the signed-in user's orders via /api/user/orders.
 */
export default function OrdersPage() {
    redirect('/account');
}
