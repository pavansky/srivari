import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { rateLimit } from '@/lib/rate-limit';
import {
    maskPhone,
    notificationStatus,
    sendTestMessage,
    toE164,
} from '@/lib/notify';
import { isMessageKind, previewAll, SAMPLE_INPUT } from '@/lib/templates/messages';

export const dynamic = 'force-dynamic';

/**
 * Admin messaging console API.
 *
 *   GET  → transport status, template names in use, and a live preview of every
 *          message rendered with sample data (no customer data is ever read).
 *   POST → { phone, kind } sends one real test message.
 *
 * Both are admin-only. The POST is rate-limited per admin session on top of the
 * per-number limit inside notify.ts, because a test send costs real money once
 * the WhatsApp Business account is live.
 */

const clientKey = (request: Request) =>
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'admin';

export async function GET(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    return NextResponse.json({
        status: notificationStatus(),
        sample: SAMPLE_INPUT,
        previews: previewAll(),
    });
}

export async function POST(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    const limited = rateLimit(`notify-test:${clientKey(request)}`, 5, 60_000);
    if (!limited.success) {
        return NextResponse.json(
            { sent: false, reason: 'Too many test messages — wait a minute and try again.' },
            { status: 429 }
        );
    }

    const body = await request.json().catch(() => ({} as any));
    const phone = String(body?.phone || '').trim();
    const kind = String(body?.kind || 'order_confirmed').trim();

    if (!phone) {
        return NextResponse.json({ sent: false, reason: 'Enter a phone number to test with.' }, { status: 400 });
    }
    if (!isMessageKind(kind)) {
        return NextResponse.json({ sent: false, reason: `Unknown message type "${kind}".` }, { status: 400 });
    }

    const e164 = toE164(phone);
    if (!e164) {
        return NextResponse.json(
            { sent: false, reason: 'That does not look like a valid phone number. Use a 10-digit Indian mobile, or +country code.' },
            { status: 400 }
        );
    }

    const result = await sendTestMessage(e164, kind);

    if (!result.sent) {
        // 503 when the transport simply is not set up yet (the expected state
        // until Meta approves the WhatsApp Business account); 502 when a
        // configured transport actually refused the message.
        const notConfigured = !notificationStatus().whatsapp.configured && !notificationStatus().sms.configured;
        return NextResponse.json(
            { sent: false, to: maskPhone(e164), reason: result.reason || 'The test message was not sent.' },
            { status: notConfigured ? 503 : 502 }
        );
    }

    return NextResponse.json({ sent: true, channel: result.channel, to: maskPhone(e164) });
}
