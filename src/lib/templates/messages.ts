/**
 * Customer message bodies for order lifecycle updates.
 *
 * One place for the words, three consumers:
 *   1. WhatsApp Cloud API — sends a pre-approved *template* and can only pass
 *      positional body params ({{1}}, {{2}}, …). `params` is that ordered list.
 *   2. SMS fallback (src/lib/smsProvider.ts) — plain text, so `smsBody` is kept
 *      inside two GSM-7 segments (~300 chars) and free of emoji, because a
 *      single emoji flips the whole SMS to UCS-2 and halves the segment length.
 *   3. The admin console — `body` is the human preview, and `templateBody` is
 *      the exact text the owner pastes into Meta's template editor so the
 *      approved template and our params can never drift apart.
 *
 * Pure functions only: no env reads beyond the site config, no I/O. Money is
 * integer rupees formatted with toLocaleString('en-IN').
 */

import { SITE_CONFIG } from "@/config/site";

export const MESSAGE_KINDS = [
    "order_confirmed",
    "order_shipped",
    "order_delivered",
    "refund_issued",
] as const;

export type MessageKind = (typeof MESSAGE_KINDS)[number];

export function isMessageKind(value: string): value is MessageKind {
    return (MESSAGE_KINDS as readonly string[]).includes(value);
}

/** Everything a message may need. Missing fields fall back to safe wording. */
export interface MessageInput {
    /** Customer's first name — messages address a person, never "customer". */
    customerName?: string | null;
    orderId: string;
    /** Order grand total in integer rupees. */
    total?: number | null;
    /** e.g. "Dispatched within 1–2 working days" — from the delivery method. */
    deliveryPromise?: string | null;
    /** Absolute link to /order-tracking?id=… */
    trackingLink?: string | null;
    /** Courier name assigned by Shiprocket. */
    courier?: string | null;
    /** Air waybill number. */
    awb?: string | null;
    /** Courier's own tracking page for the AWB. */
    trackingUrl?: string | null;
    /** Absolute link to the product page (delivered → review request). */
    reviewLink?: string | null;
    /** Refund amount in integer rupees. */
    refundAmount?: number | null;
    /** Working-day window quoted for the refund, e.g. "5–7". */
    refundDays?: string | null;
}

export interface RenderedMessage {
    kind: MessageKind;
    /** Short human label for the admin console. */
    title: string;
    /** Full message as the customer reads it (WhatsApp + admin preview). */
    body: string;
    /** Trimmed variant for the SMS fallback. */
    smsBody: string;
    /** Positional WhatsApp template body params, in {{1}}…{{n}} order. */
    params: string[];
    /** What each param means — shown next to the preview in the admin. */
    paramLabels: string[];
    /** The exact body text to register with Meta for this template. */
    templateBody: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export const SUPPORT_LINK = SITE_CONFIG.links.whatsapp("Hello Srivari, I have a question about my order");

const BRAND = SITE_CONFIG.name;

/** ₹12,500 — integer rupees, Indian digit grouping. */
export function rupees(amount?: number | null): string {
    const n = Math.max(0, Math.round(Number(amount) || 0));
    return `₹${n.toLocaleString("en-IN")}`;
}

/** First name only: warmer, and keeps template params short. */
export function firstName(name?: string | null): string {
    const clean = String(name || "").trim().replace(/\s+/g, " ");
    if (!clean) return "there";
    return clean.split(" ")[0];
}

/**
 * WhatsApp rejects template params containing newlines, tabs or runs of 4+
 * spaces, so every param is flattened before it is sent or previewed.
 */
export function safeParam(value: unknown, fallback = "-"): string {
    const text = String(value ?? "").replace(/[\r\n\t]+/g, " ").replace(/ {4,}/g, "   ").trim();
    return text || fallback;
}

const joinLines = (lines: (string | false | null | undefined)[]) =>
    lines.filter(Boolean).join("\n").replace(/\n{3,}/g, "\n\n").trim();

/* ------------------------------------------------------------------ */
/* The four messages                                                   */
/* ------------------------------------------------------------------ */

function orderConfirmed(input: MessageInput): RenderedMessage {
    const name = safeParam(firstName(input.customerName), "there");
    const orderId = safeParam(input.orderId);
    const total = safeParam(rupees(input.total));
    const promise = safeParam(input.deliveryPromise, "We will share dispatch details shortly");
    const track = safeParam(input.trackingLink, SITE_CONFIG.links.instagram);

    const body = joinLines([
        `Namaskaram ${name},`,
        "",
        `Your ${BRAND} order ${orderId} is confirmed. Thank you for letting us drape you.`,
        `Order total: ${total}`,
        `${promise}.`,
        "",
        `Follow your order here: ${track}`,
        `Anything at all, just reply here or message us: ${SUPPORT_LINK}`,
    ]);

    return {
        kind: "order_confirmed",
        title: "Order confirmed",
        body,
        smsBody: `Namaskaram ${name}, your ${BRAND} order ${orderId} is confirmed. Total ${total}. ${promise}. Track: ${track}`,
        params: [name, orderId, total, promise, track],
        paramLabels: ["Customer first name", "Order ID", "Order total", "Delivery promise", "Tracking link"],
        templateBody: joinLines([
            "Namaskaram {{1}},",
            "",
            `Your ${BRAND} order {{2}} is confirmed. Thank you for letting us drape you.`,
            "Order total: {{3}}",
            "{{4}}.",
            "",
            "Follow your order here: {{5}}",
        ]),
    };
}

function orderShipped(input: MessageInput): RenderedMessage {
    const name = safeParam(firstName(input.customerName), "there");
    const orderId = safeParam(input.orderId);
    const courier = safeParam(input.courier, "Our courier partner");
    const awb = safeParam(input.awb, "—");
    const track = safeParam(input.trackingUrl || input.trackingLink, SITE_CONFIG.links.instagram);

    const body = joinLines([
        `${name}, your ${BRAND} order ${orderId} has left our boutique.`,
        "",
        `Courier: ${courier}`,
        `Tracking number: ${awb}`,
        `Live tracking: ${track}`,
        "",
        `Please keep your phone reachable for the delivery call. We are here if you need us: ${SUPPORT_LINK}`,
    ]);

    return {
        kind: "order_shipped",
        title: "Order shipped",
        body,
        smsBody: `${name}, ${BRAND} order ${orderId} is on its way via ${courier}. AWB ${awb}. Track: ${track}`,
        params: [name, orderId, courier, awb, track],
        paramLabels: ["Customer first name", "Order ID", "Courier name", "AWB / tracking number", "Tracking URL"],
        templateBody: joinLines([
            `{{1}}, your ${BRAND} order {{2}} has left our boutique.`,
            "",
            "Courier: {{3}}",
            "Tracking number: {{4}}",
            "Live tracking: {{5}}",
        ]),
    };
}

function orderDelivered(input: MessageInput): RenderedMessage {
    const name = safeParam(firstName(input.customerName), "there");
    const orderId = safeParam(input.orderId);
    const review = safeParam(input.reviewLink || input.trackingLink, SITE_CONFIG.links.instagram);

    const body = joinLines([
        `${name}, your ${BRAND} order ${orderId} has been delivered.`,
        "",
        "We hope it is everything you imagined, and that it finds a beautiful occasion soon.",
        `If you have a moment, a few words about it would mean a great deal to us: ${review}`,
        "",
        `Anything not right? Tell us straight away: ${SUPPORT_LINK}`,
    ]);

    return {
        kind: "order_delivered",
        title: "Order delivered",
        body,
        smsBody: `${name}, your ${BRAND} order ${orderId} has been delivered. We would love your review: ${review}`,
        params: [name, orderId, review],
        paramLabels: ["Customer first name", "Order ID", "Review / product link"],
        templateBody: joinLines([
            `{{1}}, your ${BRAND} order {{2}} has been delivered.`,
            "",
            "We hope it is everything you imagined, and that it finds a beautiful occasion soon.",
            "If you have a moment, a few words about it would mean a great deal to us: {{3}}",
        ]),
    };
}

function refundIssued(input: MessageInput): RenderedMessage {
    const name = safeParam(firstName(input.customerName), "there");
    const orderId = safeParam(input.orderId);
    const amount = safeParam(rupees(input.refundAmount));
    const days = safeParam(input.refundDays, "5–7");

    const body = joinLines([
        `${name}, a refund of ${amount} for your ${BRAND} order ${orderId} has been issued.`,
        "",
        `It usually reflects in the account you paid from within ${days} working days, depending on your bank.`,
        "",
        `We are sorry this one did not work out — we would love another chance: ${SUPPORT_LINK}`,
    ]);

    return {
        kind: "refund_issued",
        title: "Refund issued",
        body,
        smsBody: `${name}, a refund of ${amount} for ${BRAND} order ${orderId} has been issued. It reflects in ${days} working days.`,
        params: [name, orderId, amount, days],
        paramLabels: ["Customer first name", "Order ID", "Refund amount", "Working days"],
        templateBody: joinLines([
            `{{1}}, a refund of {{3}} for your ${BRAND} order {{2}} has been issued.`,
            "",
            "It usually reflects in the account you paid from within {{4}} working days, depending on your bank.",
        ]),
    };
}

const RENDERERS: Record<MessageKind, (input: MessageInput) => RenderedMessage> = {
    order_confirmed: orderConfirmed,
    order_shipped: orderShipped,
    order_delivered: orderDelivered,
    refund_issued: refundIssued,
};

/** Render one message kind. Never throws — missing fields degrade to wording. */
export function renderMessage(kind: MessageKind, input: MessageInput): RenderedMessage {
    return RENDERERS[kind](input);
}

/* ------------------------------------------------------------------ */
/* Sample data — admin previews and test sends                         */
/* ------------------------------------------------------------------ */

export const SAMPLE_INPUT: MessageInput = {
    customerName: "Lakshmi Narayanan",
    orderId: "SR-482913",
    total: 24500,
    deliveryPromise: "Dispatched within 1–2 working days",
    trackingLink: "https://thesrivari.com/order-tracking?id=SR-482913",
    courier: "Delhivery Surface",
    awb: "1491230098765",
    trackingUrl: "https://shiprocket.co/tracking/1491230098765",
    reviewLink: "https://thesrivari.com/product/sample-kanjivaram#reviews",
    refundAmount: 24500,
    refundDays: "5–7",
};

/** All four messages rendered with sample data, for the settings preview. */
export function previewAll(input: MessageInput = SAMPLE_INPUT): RenderedMessage[] {
    return MESSAGE_KINDS.map(kind => renderMessage(kind, input));
}
