/**
 * Sales-channel adapter contract.
 *
 * The point of this module is that listing The Srivari on a new marketplace is
 * CONFIG, not code: a channel is one file exporting one `ChannelAdapter`, plus
 * one line in `registry.ts`. Nothing else in the app knows the names "amazon" or
 * "ondc" — the admin API, the sync route and the /admin/channels page all
 * iterate `getAdapters()`.
 *
 * Two honesty rules every adapter must obey:
 *
 *  1. `isConfigured()` is the single source of truth for "do we have credentials
 *     for this channel". It must be false when the env vars are missing, and
 *     `configHint` must name exactly which vars to set. The owner has not signed
 *     up for these services yet — nothing may hardcode or invent a credential.
 *
 *  2. `apiBacked` says whether the channel actually has a public seller API we
 *     can push to. It is false for channels whose real onboarding is commercial
 *     (Blinkit, Swiggy Instamart) or network-mediated (ONDC via a Seller Network
 *     Participant). The UI reads this flag so we never imply an integration that
 *     does not exist.
 */

import type { FeedProduct } from "@/lib/feeds";

/** Mirrors ChannelListing.status in the Prisma schema. */
export type ChannelListingStatus = "draft" | "listed" | "paused" | "error";

export interface ChannelCapabilities {
    /** Can push a product catalogue (or build the payload a partner needs). */
    listings: boolean;
    /** Can pull orders placed on the channel. */
    orders: boolean;
    /** Can push stock counts back to the channel. */
    inventory: boolean;
}

/** What `listProduct` gives back — always a payload, even on a dry run. */
export interface ChannelListingResult {
    /** Channel-side identifier (ASIN, channel SKU, ONDC item id). Absent on a dry run. */
    externalId?: string;
    /** Exactly what we sent (or would send). Stored on ChannelListing.payload for debugging. */
    payload: unknown;
}

export interface ChannelOrderItem {
    /** Seller SKU as the channel knows it. */
    sku: string;
    /** Our product id, when the channel echoes it back. */
    productId?: string;
    quantity: number;
    /** Channel-declared unit price in rupees. Never trusted — prices are re-derived from our DB. */
    price: number;
    name?: string;
}

export interface ChannelOrderCustomer {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
}

/** A normalised order pulled from (or pushed by) a channel. */
export interface ChannelOrder {
    channel: string;
    /** The channel's own order id — the idempotency key for ingestion. */
    channelOrderId: string;
    /** ISO timestamp the channel says the order was placed. */
    placedAt: string;
    customer: ChannelOrderCustomer;
    items: ChannelOrderItem[];
    /** Channel-declared order total in rupees (recorded for reconciliation only). */
    total: number;
    /** Channel's own wording, e.g. "COD" / "Prepaid" / "Other". */
    paymentMethod?: string;
    /** Channel's own status wording, e.g. "Unshipped". */
    status?: string;
    /** Untouched channel response, kept for support tickets. */
    raw?: unknown;
}

/** A downloadable artefact for channels the owner has to hand a file to. */
export interface ChannelExport {
    filename: string;
    contentType: string;
    body: string;
    /** Rows / items actually written, for the admin toast. */
    count: number;
}

export interface ChannelAdapter {
    /** Stable key. Persisted in ChannelListing.channel and Order.channel — never rename one in place. */
    key: string;
    /** Human name shown in the admin console. */
    label: string;
    /** One line explaining what this channel actually is. */
    blurb: string;
    /** True only when the channel has a public seller API we can call. */
    apiBacked: boolean;
    /** Credentials present? Must be false when any required env var is missing. */
    isConfigured(): boolean;
    /** Exactly which env vars to set, shown verbatim in the admin console. */
    configHint: string;
    /** The honest operational note shown next to the channel (how it really onboards). */
    note: string;
    capabilities: ChannelCapabilities;
    /** Where the owner goes to sign up / read the spec. */
    docsUrl?: string;

    /**
     * Builds (and, when configured, submits) the channel listing for one product.
     * Must return the payload even when unconfigured — that dry run is what the
     * owner hands to a partner or inspects before going live.
     */
    listProduct?(product: FeedProduct): Promise<ChannelListingResult>;

    /** Pulls orders created after `since`. Only defined when capabilities.orders. */
    fetchOrders?(since: Date): Promise<ChannelOrder[]>;

    /** Pushes stock counts. Only defined when capabilities.inventory. */
    pushInventory?(updates: { sku: string; qty: number }[]): Promise<void>;

    /** Builds the downloadable catalogue file for this channel (CSV or JSON). */
    buildExport?(products: FeedProduct[]): ChannelExport;
}

/**
 * Thrown by an adapter call that genuinely needs credentials (order pull, stock
 * push). Routes turn this into a friendly 503 rather than a stack trace —
 * mirroring how `lib/llm.ts` behaves when no endpoint is configured.
 */
export class ChannelNotConfiguredError extends Error {
    readonly channel: string;
    readonly configHint: string;

    constructor(channel: string, configHint: string) {
        super(`${channel} is not configured. ${configHint}`);
        this.name = "ChannelNotConfiguredError";
        this.channel = channel;
        this.configHint = configHint;
    }
}

export function isNotConfiguredError(e: unknown): e is ChannelNotConfiguredError {
    return e instanceof ChannelNotConfiguredError || (e as any)?.name === "ChannelNotConfiguredError";
}

/* ------------------------------------------------------------------ */
/* Shared helpers for adapter authors                                  */
/* ------------------------------------------------------------------ */

/** Reads an env var, treating blank/whitespace as unset. Never returns a default credential. */
export function envValue(name: string): string {
    return (process.env[name] || "").trim();
}

/** True only when every named env var carries a non-empty value. */
export function hasEnv(...names: string[]): boolean {
    return names.every(n => envValue(n).length > 0);
}

/** YYYY-MM-DD in IST — the store's own calendar day, used in export filenames. */
export function exportDate(date = new Date()): string {
    try {
        return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    } catch {
        return date.toISOString().slice(0, 10);
    }
}
