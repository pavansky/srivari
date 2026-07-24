/**
 * Admin email list — shared by the server guard (adminAuth) and client chrome
 * (the navbar user menu). Kept free of server-only imports so both can use it.
 *
 * The server reads ADMIN_EMAILS; the browser can only see NEXT_PUBLIC_* vars, so
 * client code passes NEXT_PUBLIC_ADMIN_EMAILS when set. The client check is a
 * NAVIGATION HINT ONLY — every admin API and page is gated server-side by
 * requireAdmin(), never by this.
 */

export const DEFAULT_ADMIN = 'support@thesrivari.com';

export function parseAdminEmails(raw?: string | null): string[] {
    return (raw || DEFAULT_ADMIN)
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);
}

export function emailIsAdmin(email: string | null | undefined, raw?: string | null): boolean {
    return !!email && parseAdminEmails(raw).includes(email.toLowerCase());
}
