import { NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/utils/supabase/server';
import { supabase as tokenClient } from '@/lib/supabaseClient';

/**
 * Server-side admin authorization for API routes.
 *
 * Admin identity = a valid Supabase session whose email is in ADMIN_EMAILS
 * (comma-separated env var; defaults to the store owner's address).
 * Accepts either the session cookie (same-origin fetches from /admin) or an
 * Authorization: Bearer <access_token> header.
 */

const DEFAULT_ADMIN = 'support@thesrivari.com';

function adminEmails(): string[] {
    return (process.env.ADMIN_EMAILS || DEFAULT_ADMIN)
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
    return !!email && adminEmails().includes(email.toLowerCase());
}

export async function getAdminUser(request?: Request) {
    // Local-dev escape hatch only — never active in production builds.
    if (process.env.NODE_ENV !== 'production' && process.env.ADMIN_DEV_BYPASS === '1') {
        return { id: 'dev-bypass', email: DEFAULT_ADMIN };
    }

    // 1. Bearer token (used by clients that pass the Supabase access token)
    const authHeader = request?.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice('Bearer '.length);
        const { data: { user } } = await tokenClient.auth.getUser(token);
        if (isAdminEmail(user?.email)) return user;
    }

    // 2. Cookie-based session (same-origin fetches from the admin console)
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (isAdminEmail(user?.email)) return user;
    } catch {
        // cookies() unavailable (e.g. during static analysis) — treat as unauthenticated
    }

    return null;
}

/**
 * Guard for admin-only route handlers. Returns a 401/403 response to send
 * back immediately, or null when the caller is an authenticated admin.
 */
export async function requireAdmin(request?: Request): Promise<NextResponse | null> {
    const user = await getAdminUser(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized: admin access required' }, { status: 401 });
    }
    return null;
}
