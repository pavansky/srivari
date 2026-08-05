import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { trackByAWB } from '@/lib/shiprocket';

export const dynamic = 'force-dynamic';

/** GET ?awb=… — live courier tracking for a booked shipment. Admin only. */
export async function GET(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const awb = (searchParams.get('awb') || '').trim();
    if (!awb) {
        return NextResponse.json({ error: 'An AWB number is required' }, { status: 400 });
    }

    let tracking: Awaited<ReturnType<typeof trackByAWB>> = null;
    try {
        tracking = await trackByAWB(awb);
    } catch (e: any) {
        // trackByAWB swallows API errors but its auth call can still throw.
        console.error('Track route failed:', e);
        return NextResponse.json(
            { error: e?.message || 'Tracking is unavailable right now — try again in a moment.' },
            { status: 502 }
        );
    }

    if (!tracking) {
        return NextResponse.json(
            { error: `No tracking updates yet for AWB ${awb} — couriers usually scan a parcel within a few hours of pickup.` },
            { status: 404 }
        );
    }

    return NextResponse.json({
        status: tracking.status,
        activities: tracking.activities || [],
        etd: tracking.etd,
    });
}
