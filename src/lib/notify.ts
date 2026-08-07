/**
 * Provider-agnostic customer messaging — WhatsApp first, SMS as a fallback.
 *
 * WhatsApp is the single highest-signal channel for an Indian store: it is read,
 * it is replied to, and it is where the customer already talks to the boutique.
 *
 * ─── Configuration (all optional; absent credentials = a graceful no-op) ───
 *   WHATSAPP_PHONE_NUMBER_ID   the sender's phone-number id from Meta
 *   WHATSAPP_ACCESS_TOKEN      permanent system-user token (Bearer)
 *   WHATSAPP_API_VERSION       optional, defaults to v21.0
 *   WHATSAPP_TEMPLATE_LANG     optional, defaults to en
 *   WHATSAPP_TEMPLATE_ORDER_CONFIRMED  |  _ORDER_SHIPPED
 *   WHATSAPP_TEMPLATE_ORDER_DELIVERED  |  _REFUND_ISSUED
 *   NOTIFY_DISABLED=1          global mute (staging / bulk backfills)
 *   REFUND_ETA_DAYS            working-day window quoted in refund messages
 *
 * ─── Why templates, and why positional params ───
 * A *business-initiated* WhatsApp message (which every order update is) can only
 * be sent as a template that Meta has pre-approved — free-form text is allowed
 * exclusively inside the 24-hour window opened by a customer's own reply. So:
 *   • template NAMES are env vars, because the owner names them during approval;
 *   • the body variables are passed POSITIONALLY as {{1}}, {{2}}, … in the order
 *     produced by src/lib/templates/messages.ts, whose `templateBody` is the
 *     exact text to register with Meta. Keep the two in step and nothing drifts.
 * Until the WhatsApp Business account is approved, every notify* call returns
 * {sent:false, reason:"…"} and the checkout/shipping flow carries on untouched.
 *
 * ─── Hard guarantee ───
 * NOTHING here throws. A messaging outage must never fail a payment, a shipment
 * or a webhook: every entry point resolves to a NotifyResult.
 */

import { LOCAL_DELIVERY, STORE_PICKUP } from "@/config/commerce";
import { SITE_URL } from "@/lib/feeds";
import { rateLimit } from "@/lib/rate-limit";
import { sendSMS } from "@/lib/smsProvider";
import {
    MESSAGE_KINDS,
    renderMessage,
    SAMPLE_INPUT,
    type MessageInput,
    type MessageKind,
    type RenderedMessage,
} from "@/lib/templates/messages";

export type NotifyChannel = "whatsapp" | "sms" | "none";

export interface NotifyResult {
    sent: boolean;
    channel: NotifyChannel;
    reason?: string;
}

/** Anything order-shaped: a Prisma row, or the app-level Order type. */
export type OrderLike = Record<string, any>;

/** Per-call overrides for facts the DB row may not carry yet (fresh AWB, …). */
export interface NotifyOverrides {
    courier?: string | null;
    awb?: string | null;
    trackingUrl?: string | null;
    refundAmount?: number | null;
    /** Skip the once-per-order guard (used by the admin test send). */
    force?: boolean;
    /**
     * Set when the row handed in is the one this very event just wrote (e.g. the
     * order returned by updateOrderPayment / updateOrder). Its `updatedAt` is
     * then the event's own timestamp, so a stale value proves the call is a
     * replay and the message is suppressed — a guard that survives a cold start,
     * unlike the in-memory dedupe. Leave unset when the row was read *before*
     * the event (the ship route), where `updatedAt` means nothing.
     */
    rowWrittenByThisEvent?: boolean;
}

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

const DEFAULT_API_VERSION = "v21.0";

const DEFAULT_TEMPLATES: Record<MessageKind, string> = {
    order_confirmed: "srivari_order_confirmed",
    order_shipped: "srivari_order_shipped",
    order_delivered: "srivari_order_delivered",
    refund_issued: "srivari_refund_issued",
};

const TEMPLATE_ENV_VARS: Record<MessageKind, string> = {
    order_confirmed: "WHATSAPP_TEMPLATE_ORDER_CONFIRMED",
    order_shipped: "WHATSAPP_TEMPLATE_ORDER_SHIPPED",
    order_delivered: "WHATSAPP_TEMPLATE_ORDER_DELIVERED",
    refund_issued: "WHATSAPP_TEMPLATE_REFUND_ISSUED",
};

const env = (key: string): string => (process.env[key] || "").trim();

/** Meta credentials present? Template names always have a sane default. */
export function isWhatsAppConfigured(): boolean {
    return !!env("WHATSAPP_PHONE_NUMBER_ID") && !!env("WHATSAPP_ACCESS_TOKEN");
}

/** Env vars the owner still has to set before WhatsApp can send. */
export function whatsAppMissingEnv(): string[] {
    return ["WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ACCESS_TOKEN"].filter(key => !env(key));
}

/**
 * src/lib/smsProvider.ts is a stub whose provider calls are commented out and
 * which returns `true` unconditionally — so "SMS configured" is decided by the
 * provider credentials, never by that return value. Without them we would be
 * reporting phantom deliveries to the admin.
 */
export function isSmsConfigured(): boolean {
    return !!env("FAST2SMS_API_KEY") || (!!env("TWILIO_ACCOUNT_SID") && !!env("TWILIO_AUTH_TOKEN"));
}

/** Global mute — set NOTIFY_DISABLED=1 on staging or during a data backfill. */
export function notificationsDisabled(): boolean {
    const value = env("NOTIFY_DISABLED").toLowerCase();
    return value === "1" || value === "true" || value === "yes";
}

export function templateNameFor(kind: MessageKind): string {
    return env(TEMPLATE_ENV_VARS[kind]) || DEFAULT_TEMPLATES[kind];
}

const templateLanguage = (): string => env("WHATSAPP_TEMPLATE_LANG") || "en";
const apiVersion = (): string => env("WHATSAPP_API_VERSION") || DEFAULT_API_VERSION;

/** Serialisable transport report for /admin/settings/notifications. */
export function notificationStatus() {
    const phoneNumberId = env("WHATSAPP_PHONE_NUMBER_ID");
    return {
        enabled: !notificationsDisabled(),
        disabledReason: notificationsDisabled() ? "NOTIFY_DISABLED is set — no messages are being sent." : null,
        whatsapp: {
            configured: isWhatsAppConfigured(),
            missing: whatsAppMissingEnv(),
            // Only the tail is exposed: enough to confirm the right sender,
            // never enough to be a leaked credential in a screenshot.
            phoneNumberIdHint: phoneNumberId ? `…${phoneNumberId.slice(-4)}` : null,
            apiVersion: apiVersion(),
            language: templateLanguage(),
            endpoint: `https://graph.facebook.com/${apiVersion()}/{WHATSAPP_PHONE_NUMBER_ID}/messages`,
        },
        sms: {
            configured: isSmsConfigured(),
            provider: env("FAST2SMS_API_KEY") ? "Fast2SMS" : env("TWILIO_ACCOUNT_SID") ? "Twilio" : null,
            envVars: ["FAST2SMS_API_KEY", "TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_PHONE_NUMBER"],
        },
        templates: MESSAGE_KINDS.map(kind => ({
            kind,
            name: templateNameFor(kind),
            envVar: TEMPLATE_ENV_VARS[kind],
            usingDefault: !env(TEMPLATE_ENV_VARS[kind]),
        })),
        rateLimit: { messages: PHONE_LIMIT, windowMinutes: Math.round(PHONE_WINDOW_MS / 60000) },
    };
}

/* ------------------------------------------------------------------ */
/* Phone normalisation                                                 */
/* ------------------------------------------------------------------ */

/**
 * Normalise a stored phone number to E.164.
 *
 * Real checkout data is messy: "9739988771", "+91 97399 88771", "09739988771",
 * "919739988771", even "+91 091 9739988771". Everything is reduced to the bare
 * subscriber number and re-prefixed with +91.
 *
 * A non-Indian number is only accepted when the customer wrote it in
 * international form (leading +) — we must never guess a country code.
 */
export function toE164(raw?: string | null): string | null {
    const input = String(raw ?? "").trim();
    if (!input) return null;

    const hadPlus = input.startsWith("+");
    let digits = input.replace(/\D/g, "");
    if (!digits) return null;

    if (digits.startsWith("00")) digits = digits.slice(2);

    // Peel repeated country-code / trunk prefixes until a bare 10-digit
    // subscriber number is left. Bounded so a junk value can never spin.
    for (let i = 0; i < 4 && digits.length > 10; i++) {
        if (digits.startsWith("91")) digits = digits.slice(2);
        else if (digits.startsWith("0")) digits = digits.slice(1);
        else break;
    }
    if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);

    // Indian mobile series are 6–9.
    if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;

    if (hadPlus) {
        const intl = input.replace(/\D/g, "");
        if (intl.length >= 8 && intl.length <= 15) return `+${intl}`;
    }
    return null;
}

/** Masked form for logs and admin UI: +91 97399 ••771 stays unusable. */
export function maskPhone(e164: string): string {
    return e164.length > 6 ? `${e164.slice(0, 4)}•••••${e164.slice(-3)}` : "•••";
}

/* ------------------------------------------------------------------ */
/* Guards: rate limit + once-per-order dedupe                          */
/* ------------------------------------------------------------------ */

const PHONE_LIMIT = Math.max(1, Number(process.env.NOTIFY_PHONE_LIMIT) || 6);
const PHONE_WINDOW_MS = Math.max(60_000, Number(process.env.NOTIFY_PHONE_WINDOW_MS) || 15 * 60_000);

const DEDUPE_TTL_MS = 24 * 60 * 60 * 1000;
const DEDUPE_MAX = 5000;

/**
 * Once-per-order-per-event guard, so a replayed payment verification or a
 * Shiprocket webhook that fires the same status three times does not message
 * the customer three times.
 *
 * In-memory and therefore per-runtime: on serverless this is best-effort, not a
 * distributed lock. Callers that pass back the row their own write produced set
 * `rowWrittenByThisEvent`, which adds a freshness check (see `isStale`) that
 * rejects a *late* replay even from a cold instance. A fully persistent guard
 * would need a notification-log table, i.e. a migration.
 */
const recentlySent = new Map<string, number>();

function alreadySent(key: string): boolean {
    const at = recentlySent.get(key);
    if (at === undefined) return false;
    if (Date.now() - at > DEDUPE_TTL_MS) {
        recentlySent.delete(key);
        return false;
    }
    return true;
}

function markSent(key: string): void {
    if (recentlySent.size >= DEDUPE_MAX) {
        const cutoff = Date.now() - DEDUPE_TTL_MS;
        for (const [k, at] of recentlySent) if (at < cutoff) recentlySent.delete(k);
        // Still full (a burst rather than stale entries): drop the oldest insert.
        if (recentlySent.size >= DEDUPE_MAX) {
            const oldest = recentlySent.keys().next();
            if (!oldest.done) recentlySent.delete(oldest.value);
        }
    }
    recentlySent.set(key, Date.now());
}

/** Exposed for tests / admin tooling. */
export function resetNotifyDedupe(): void {
    recentlySent.clear();
}

/**
 * True when the row was last written long enough ago that this call must be a
 * replay rather than the transition that just happened. Rows without an
 * `updatedAt` (plain objects handed in by a caller) are always treated as live.
 */
function isStale(order: OrderLike, windowMs = 15 * 60_000): boolean {
    const raw = order?.updatedAt;
    if (!raw) return false;
    const at = raw instanceof Date ? raw.getTime() : Date.parse(String(raw));
    if (!Number.isFinite(at)) return false;
    return Date.now() - at > windowMs;
}

/* ------------------------------------------------------------------ */
/* Reading an order                                                    */
/* ------------------------------------------------------------------ */

const firstOf = (...values: unknown[]): string => {
    for (const value of values) {
        if (value === null || value === undefined) continue;
        const text = String(value).trim();
        if (text) return text;
    }
    return "";
};

interface OrderFacts {
    id: string;
    name: string;
    phone: string | null;
    total: number;
    deliveryMethod: string;
    deliveryPromise: string;
    trackingLink: string;
    reviewLink: string;
    courier: string;
    awb: string;
    trackingUrl: string;
    refundAmount: number;
}

/**
 * Reads both order shapes the codebase uses: the Prisma row (`customer` JSON,
 * snake_case columns) and the app-level Order type (customerName/…). Callers
 * therefore never have to reshape anything before notifying.
 */
function readOrder(order: OrderLike, overrides: NotifyOverrides = {}): OrderFacts {
    const customer = (order?.customer && typeof order.customer === "object" ? order.customer : {}) as Record<string, any>;

    const id = firstOf(order?.id, order?.orderId) || "your order";
    const name = firstOf(order?.customerName, customer.name, order?.name);
    const phone = toE164(firstOf(order?.customerPhone, customer.phone, order?.phone));

    const total = Math.max(0, Math.round(Number(order?.totalAmount ?? order?.total ?? order?.amount ?? 0)));

    const deliveryMethod = firstOf(order?.delivery_method, order?.deliveryMethod) || "Courier";
    const eta = firstOf(order?.delivery_eta, order?.deliveryEta);
    const deliveryPromise =
        deliveryMethod === "Pickup"
            ? `${STORE_PICKUP.eta} for collection at our boutique`
            : deliveryMethod === "Local"
                ? LOCAL_DELIVERY.eta
                : eta || "Dispatched within 1–2 working days";

    const awb = firstOf(overrides.awb, order?.awb_code, order?.trackingNumber, order?.tracking_number);
    const courier = firstOf(overrides.courier, order?.courier_name, order?.courierName) || "Our courier partner";
    const trackingUrl = firstOf(overrides.trackingUrl, order?.tracking_url, order?.trackingUrl);

    const items: any[] = Array.isArray(order?.items) ? order.items : [];
    const firstProductId = firstOf(items[0]?.productId, items[0]?.id);

    return {
        id,
        name,
        phone,
        total,
        deliveryMethod,
        deliveryPromise,
        trackingLink: `${SITE_URL}/order-tracking?id=${encodeURIComponent(id)}`,
        reviewLink: firstProductId ? `${SITE_URL}/product/${encodeURIComponent(firstProductId)}#reviews` : `${SITE_URL}/shop`,
        courier,
        awb,
        trackingUrl,
        refundAmount: Math.max(
            0,
            Math.round(Number(overrides.refundAmount ?? order?.refund_amount ?? order?.refundAmount ?? 0))
        ),
    };
}

function messageInputFor(facts: OrderFacts): MessageInput {
    return {
        customerName: facts.name,
        orderId: facts.id,
        total: facts.total,
        deliveryPromise: facts.deliveryPromise,
        trackingLink: facts.trackingLink,
        courier: facts.courier,
        awb: facts.awb,
        trackingUrl: facts.trackingUrl || facts.trackingLink,
        reviewLink: facts.reviewLink,
        refundAmount: facts.refundAmount,
        refundDays: env("REFUND_ETA_DAYS") || "5–7",
    };
}

/* ------------------------------------------------------------------ */
/* Transports                                                          */
/* ------------------------------------------------------------------ */

/**
 * POST a pre-approved template to the WhatsApp Cloud API.
 *
 *   POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages
 *   Authorization: Bearer {ACCESS_TOKEN}
 *   { messaging_product, to, type:"template",
 *     template:{ name, language:{code}, components:[{type:"body", parameters:[…]}] } }
 *
 * `to` is the E.164 number without the leading '+', which is what Meta's
 * examples use. Returns the message id on success.
 */
async function sendWhatsAppTemplate(
    e164: string,
    templateName: string,
    params: string[]
): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
    const phoneNumberId = env("WHATSAPP_PHONE_NUMBER_ID");
    const token = env("WHATSAPP_ACCESS_TOKEN");
    if (!phoneNumberId || !token) return { ok: false, error: "WhatsApp is not configured" };

    const body = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: e164.replace(/^\+/, ""),
        type: "template",
        template: {
            name: templateName,
            language: { code: templateLanguage() },
            ...(params.length
                ? {
                    components: [
                        {
                            type: "body",
                            parameters: params.map(text => ({ type: "text", text })),
                        },
                    ],
                }
                : {}),
        },
    };

    const res = await fetch(`https://graph.facebook.com/${apiVersion()}/${phoneNumberId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
    });

    const data = await res.json().catch(() => ({} as any));

    if (!res.ok) {
        // Meta's own wording is the most actionable thing the admin can read
        // ("template name does not exist in en", "recipient not in allowed list").
        const detail = firstOf(data?.error?.error_user_msg, data?.error?.message) || `HTTP ${res.status}`;
        return { ok: false, error: detail };
    }

    return { ok: true, messageId: firstOf(data?.messages?.[0]?.id) || "sent" };
}

/**
 * Send one rendered message over the best available transport.
 * Order: WhatsApp → SMS → give up (never an exception).
 */
async function deliver(e164: string, kind: MessageKind, message: RenderedMessage): Promise<NotifyResult> {
    if (isWhatsAppConfigured()) {
        try {
            const result = await sendWhatsAppTemplate(e164, templateNameFor(kind), message.params);
            if (result.ok) return { sent: true, channel: "whatsapp" };
            console.warn(`notify: WhatsApp ${kind} to ${maskPhone(e164)} failed — ${result.error}`);
            if (!isSmsConfigured()) return { sent: false, channel: "whatsapp", reason: result.error };
        } catch (e: any) {
            console.warn(`notify: WhatsApp ${kind} to ${maskPhone(e164)} threw —`, e?.message || e);
            if (!isSmsConfigured()) {
                return { sent: false, channel: "whatsapp", reason: e?.message || "WhatsApp request failed" };
            }
        }
    }

    if (isSmsConfigured()) {
        try {
            const ok = await sendSMS(e164, message.smsBody);
            if (ok) return { sent: true, channel: "sms" };
            return { sent: false, channel: "sms", reason: "SMS provider rejected the message" };
        } catch (e: any) {
            return { sent: false, channel: "sms", reason: e?.message || "SMS request failed" };
        }
    }

    return {
        sent: false,
        channel: "none",
        reason: "No messaging transport is configured — set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN.",
    };
}

/* ------------------------------------------------------------------ */
/* The one entry point every notify* wraps                             */
/* ------------------------------------------------------------------ */

async function notify(kind: MessageKind, order: OrderLike, overrides: NotifyOverrides = {}): Promise<NotifyResult> {
    try {
        if (notificationsDisabled()) {
            return { sent: false, channel: "none", reason: "Notifications are muted (NOTIFY_DISABLED)" };
        }
        if (!order) return { sent: false, channel: "none", reason: "No order supplied" };

        const facts = readOrder(order, overrides);

        if (!facts.phone) {
            return { sent: false, channel: "none", reason: "No usable phone number on this order" };
        }

        const dedupeKey = `${facts.id}:${kind}`;
        if (!overrides.force) {
            if (alreadySent(dedupeKey)) {
                return { sent: false, channel: "none", reason: "Already notified for this order event" };
            }
            if (overrides.rowWrittenByThisEvent && isStale(order)) {
                return { sent: false, channel: "none", reason: "Order event is not recent — treated as a replay" };
            }
        }

        const limited = rateLimit(`notify:${facts.phone}`, PHONE_LIMIT, PHONE_WINDOW_MS);
        if (!limited.success) {
            return { sent: false, channel: "none", reason: "Rate limit reached for this number" };
        }

        const message = renderMessage(kind, messageInputFor(facts));
        const result = await deliver(facts.phone, kind, message);

        // Only a delivered message closes the door — a failed send may be retried.
        if (result.sent && !overrides.force) markSent(dedupeKey);

        return result;
    } catch (e: any) {
        // Belt and braces: a notification must never surface as a thrown error.
        console.error(`notify: ${kind} failed unexpectedly —`, e?.message || e);
        return { sent: false, channel: "none", reason: "Notification failed" };
    }
}

/* ------------------------------------------------------------------ */
/* Public API — none of these ever throw                               */
/* ------------------------------------------------------------------ */

/** Order confirmed: payment verified, or an offline order placed. */
export function notifyOrderConfirmed(order: OrderLike, overrides: NotifyOverrides = {}): Promise<NotifyResult> {
    return notify("order_confirmed", order, overrides);
}

/** Handed to the courier — pass the freshly assigned AWB via `overrides`. */
export function notifyOrderShipped(order: OrderLike, overrides: NotifyOverrides = {}): Promise<NotifyResult> {
    return notify("order_shipped", order, overrides);
}

/** Delivered — includes the review request. */
export function notifyOrderDelivered(order: OrderLike, overrides: NotifyOverrides = {}): Promise<NotifyResult> {
    return notify("order_delivered", order, overrides);
}

/** Refund issued — pass the refunded amount via `overrides` when it is known. */
export function notifyRefundIssued(order: OrderLike, overrides: NotifyOverrides = {}): Promise<NotifyResult> {
    return notify("refund_issued", order, overrides);
}

/**
 * Admin "send test message". Bypasses the once-per-order guard (a test is meant
 * to be repeatable) but keeps the per-number rate limit, and always renders
 * sample data so no real customer detail can leak into a test.
 */
export async function sendTestMessage(phone: string, kind: MessageKind): Promise<NotifyResult & { to?: string }> {
    try {
        const e164 = toE164(phone);
        if (!e164) {
            return { sent: false, channel: "none", reason: "That does not look like a valid phone number" };
        }
        if (notificationsDisabled()) {
            return { sent: false, channel: "none", reason: "Notifications are muted (NOTIFY_DISABLED)", to: maskPhone(e164) };
        }
        if (!isWhatsAppConfigured() && !isSmsConfigured()) {
            return {
                sent: false,
                channel: "none",
                reason: "No transport configured — set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN first.",
                to: maskPhone(e164),
            };
        }

        const limited = rateLimit(`notify:${e164}`, PHONE_LIMIT, PHONE_WINDOW_MS);
        if (!limited.success) {
            return { sent: false, channel: "none", reason: "Rate limit reached for this number", to: maskPhone(e164) };
        }

        const message = renderMessage(kind, SAMPLE_INPUT);
        const result = await deliver(e164, kind, message);
        return { ...result, to: maskPhone(e164) };
    } catch (e: any) {
        console.error("notify: test send failed —", e?.message || e);
        return { sent: false, channel: "none", reason: "Test message could not be sent" };
    }
}

export { MESSAGE_KINDS, type MessageKind };
