/**
 * Amazon India — Selling Partner API (SP-API).
 *
 * The one Indian marketplace in this registry with a real, public, self-serve
 * seller API. Implemented against the documented REST surface with plain
 * `fetch` (no SDK, no new npm deps).
 *
 * AUTH — read this before touching the request code:
 *   SP-API authenticates with a Login with Amazon (LWA) *bearer* token. You
 *   exchange a long-lived refresh token for a short-lived access token at
 *   `https://api.amazon.com/auth/o2/token`, then send it as
 *   `x-amz-access-token` on every call. AWS SigV4 request signing is NOT
 *   required for these calls — Amazon dropped that requirement for the
 *   standard (non-Restricted-Data) operations we use here. So this file
 *   deliberately implements LWA only: no SigV4 signer is fabricated, because a
 *   signer we cannot test against a live seller account would be worse than
 *   none. If a future call returns 403 with a signature complaint, that call
 *   needs a Restricted Data Token — not a hand-rolled signer.
 *
 * REGION — India sits on the EU endpoint:
 *   host          https://sellingpartnerapi-eu.amazon.com   (AMAZON_SP_ENDPOINT)
 *   marketplaceId A21TJRUUN4KGV  (amazon.in)                (AMAZON_MARKETPLACE_ID)
 *
 * NOTHING here invents a credential. With the env vars absent `isConfigured()`
 * is false, `listProduct` returns the payload it *would* have sent (a real dry
 * run the owner can inspect), and the order/stock calls raise a
 * ChannelNotConfiguredError that routes turn into a friendly 503.
 *
 * Docs: https://developer-docs.amazon.com/sp-api/
 */

import {
    BRAND,
    feedImages,
    feedWeight,
    plainText,
    productUrl,
    type FeedProduct,
} from "@/lib/feeds";
import { classify } from "@/lib/gst";
import {
    ChannelNotConfiguredError,
    envValue,
    exportDate,
    hasEnv,
    type ChannelAdapter,
    type ChannelExport,
    type ChannelListingResult,
    type ChannelOrder,
} from "./types";

const KEY = "amazon";
const LABEL = "Amazon India";

const DEFAULT_ENDPOINT = "https://sellingpartnerapi-eu.amazon.com";
/** amazon.in. Overridable so the same code can run against a sandbox/another region. */
const DEFAULT_MARKETPLACE_ID = "A21TJRUUN4KGV";
const LWA_TOKEN_URL = "https://api.amazon.com/auth/o2/token";

/** Listings Items API version pinned by the docs. */
const LISTINGS_API = "/listings/2021-08-01/items";
const ORDERS_API = "/orders/v0/orders";

/**
 * Amazon product type for the listing. Sarees have their own product type in the
 * India marketplace; the definitive attribute list for it comes from the Product
 * Type Definitions API (`/definitions/2020-09-01/productTypes/SAREE`). Keep this
 * overridable so the owner can switch to whatever their category approval grants.
 */
const DEFAULT_PRODUCT_TYPE = "SAREE";

const REQUIRED_ENV = [
    "AMAZON_LWA_CLIENT_ID",
    "AMAZON_LWA_CLIENT_SECRET",
    "AMAZON_SP_REFRESH_TOKEN",
    "AMAZON_SELLER_ID",
] as const;

const CONFIG_HINT =
    "Set AMAZON_LWA_CLIENT_ID, AMAZON_LWA_CLIENT_SECRET, AMAZON_SP_REFRESH_TOKEN and AMAZON_SELLER_ID " +
    "(your Merchant Token from Seller Central → Settings → Account Info). " +
    "Optional: AMAZON_SP_ENDPOINT (defaults to the EU host that serves India), " +
    "AMAZON_MARKETPLACE_ID (defaults to A21TJRUUN4KGV = amazon.in), " +
    "AMAZON_PRODUCT_TYPE (defaults to SAREE).";

const NOTE =
    "Live API. Register at sellercentral.amazon.in, create an SP-API application in Seller Central → " +
    "Apps & Services → Develop Apps, then self-authorise it to get a refresh token. " +
    "Listings still need category approval and Amazon's own attribute validation before they go live.";

function endpoint(): string {
    return (envValue("AMAZON_SP_ENDPOINT") || DEFAULT_ENDPOINT).replace(/\/+$/, "");
}

function marketplaceId(): string {
    return envValue("AMAZON_MARKETPLACE_ID") || DEFAULT_MARKETPLACE_ID;
}

function sellerId(): string {
    return envValue("AMAZON_SELLER_ID");
}

function productType(): string {
    return envValue("AMAZON_PRODUCT_TYPE") || DEFAULT_PRODUCT_TYPE;
}

function isConfigured(): boolean {
    return hasEnv(...REQUIRED_ENV);
}

function assertConfigured(): void {
    if (!isConfigured()) throw new ChannelNotConfiguredError(LABEL, CONFIG_HINT);
}

/* ------------------------------------------------------------------ */
/* LWA access token (cached in module memory until it expires)         */
/* ------------------------------------------------------------------ */

let cachedToken: string | null = null;
let cachedTokenExpiry = 0;
/** Refresh a minute early so a token can't expire mid-flight. */
const TOKEN_SKEW_MS = 60_000;

async function accessToken(): Promise<string> {
    assertConfigured();

    const now = Date.now();
    if (cachedToken && cachedTokenExpiry > now + TOKEN_SKEW_MS) return cachedToken;

    const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: envValue("AMAZON_SP_REFRESH_TOKEN"),
        client_id: envValue("AMAZON_LWA_CLIENT_ID"),
        client_secret: envValue("AMAZON_LWA_CLIENT_SECRET"),
    });

    const res = await fetch(LWA_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
        // Never log the response body verbatim — it can echo client credentials.
        console.error(`Amazon LWA token exchange failed (${res.status})`);
        throw new Error(`Amazon sign-in failed (${res.status}). Check the LWA credentials and refresh token.`);
    }

    const data = await res.json().catch(() => ({} as any));
    const token = typeof data?.access_token === "string" ? data.access_token : "";
    if (!token) throw new Error("Amazon returned no access token.");

    cachedToken = token;
    cachedTokenExpiry = now + (Number(data?.expires_in) || 3600) * 1000;
    return token;
}

/** Clears the cached token — called when Amazon rejects it, so the next call re-authenticates. */
function invalidateToken(): void {
    cachedToken = null;
    cachedTokenExpiry = 0;
}

/* ------------------------------------------------------------------ */
/* Signed-ish request helper                                           */
/* ------------------------------------------------------------------ */

interface SpRequest {
    method: "GET" | "PUT" | "PATCH" | "POST";
    path: string;
    query?: Record<string, string | undefined>;
    body?: unknown;
}

function buildUrl(req: SpRequest): string {
    const url = new URL(`${endpoint()}${req.path}`);
    for (const [k, v] of Object.entries(req.query || {})) {
        if (v !== undefined && v !== "") url.searchParams.set(k, v);
    }
    return url.toString();
}

async function spRequest<T = any>(req: SpRequest, attempt = 0): Promise<T> {
    const token = await accessToken();
    const url = buildUrl(req);

    const res = await fetch(url, {
        method: req.method,
        headers: {
            "x-amz-access-token": token,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: req.body === undefined ? undefined : JSON.stringify(req.body),
        signal: AbortSignal.timeout(30_000),
    });

    if (res.status === 401 || res.status === 403) {
        // A stale cached token is the common cause; retry once with a fresh one.
        invalidateToken();
        if (attempt === 0) return spRequest<T>(req, attempt + 1);
    }

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(`Amazon SP-API ${req.method} ${req.path} failed (${res.status}):`, text.slice(0, 500));
        throw new Error(`Amazon rejected the request (${res.status}). ${amazonErrorMessage(text)}`.trim());
    }

    if (res.status === 204) return undefined as T;
    return (await res.json().catch(() => ({}))) as T;
}

/** Pulls the first human-readable message out of an SP-API error envelope. */
function amazonErrorMessage(text: string): string {
    try {
        const parsed = JSON.parse(text);
        const first = parsed?.errors?.[0];
        const msg = [first?.message, first?.details].filter(Boolean).join(" — ");
        return plainText(msg, 240);
    } catch {
        return "";
    }
}

/* ------------------------------------------------------------------ */
/* Listing payload                                                     */
/* ------------------------------------------------------------------ */

function skuFor(product: FeedProduct): string {
    return (product.sku || "").trim() || product.id;
}

function titleFor(product: FeedProduct): string {
    return plainText(product.name, 180) || "Handwoven Saree";
}

function descriptionFor(product: FeedProduct): string {
    const written = plainText(product.description, 2000);
    if (written) return written;
    const category = plainText(product.category, 60);
    return `${titleFor(product)} — a handwoven ${category ? `${category} ` : ""}saree from ${BRAND}.`;
}

/**
 * Short selling points. Amazon shows up to five; we derive them from the fields
 * we actually hold rather than padding with marketing filler.
 */
function bulletPoints(product: FeedProduct): string[] {
    const { hsn, rate } = classify(product);
    const category = plainText(product.category, 60);
    return [
        category ? `${category} weave, selected by ${BRAND}` : `Handwoven saree, selected by ${BRAND}`,
        "Handloom craftsmanship from India — no two pieces are identical",
        `Approx. ${feedWeight(product)} kg — includes saree and blouse piece where offered`,
        "Dry clean recommended; store folded in muslin away from direct sunlight",
        `HSN ${hsn} · GST ${rate}% included in the listed price`,
    ].filter(Boolean).slice(0, 5);
}

/** `[{ value, marketplace_id }]` — the shape every SP-API listing attribute takes. */
function attr(value: unknown, extra: Record<string, unknown> = {}) {
    return [{ value, marketplace_id: marketplaceId(), ...extra }];
}

/**
 * Builds the JSON_LISTINGS_FEED-shaped body for the Listings Items API.
 *
 * IMPORTANT: the authoritative attribute list for a product type comes from the
 * Product Type Definitions API — Amazon will reject unknown or missing
 * attributes with a per-field message. Run one product through and read the
 * `issues[]` in the response before bulk-listing.
 */
export function buildAmazonListing(product: FeedProduct): Record<string, unknown> {
    const mp = marketplaceId();
    const images = feedImages(product);
    const { hsn } = classify(product);
    const price = Math.max(0, Math.round(Number(product.price) || 0));
    const quantity = Math.max(0, Math.trunc(Number(product.stock) || 0));

    const attributes: Record<string, unknown> = {
        brand: attr(BRAND),
        item_name: attr(titleFor(product), { language_tag: "en_IN" }),
        product_description: attr(descriptionFor(product), { language_tag: "en_IN" }),
        bullet_point: bulletPoints(product).map(value => ({
            value,
            language_tag: "en_IN",
            marketplace_id: mp,
        })),
        condition_type: attr("new_new"),
        country_of_origin: attr("IN"),
        // Handwoven sarees carry no manufacturer barcode — declare the exemption
        // rather than shipping an empty GTIN, which Amazon hard-rejects.
        supplier_declared_has_product_identifier_exemption: attr(true),
        fulfillment_availability: [{
            fulfillment_channel_code: "DEFAULT",
            quantity,
        }],
        purchasable_offer: [{
            marketplace_id: mp,
            currency: "INR",
            our_price: [{ schedule: [{ value_with_tax: price }] }],
        }],
        item_package_weight: [{ unit: "kilograms", value: feedWeight(product), marketplace_id: mp }],
        // GST classification. India-specific attribute keys vary by product type
        // definition — if Amazon flags `hsn_code` as unrecognised, move the value
        // to whatever the definitions response names it.
        hsn_code: attr(hsn),
    };

    if (images[0]) {
        attributes.main_product_image_locator = [{ media_location: images[0], marketplace_id: mp }];
        images.slice(1, 9).forEach((src, i) => {
            attributes[`other_product_image_locator_${i + 1}`] = [{ media_location: src, marketplace_id: mp }];
        });
    }

    if (product.category) {
        attributes.item_type_keyword = attr(plainText(product.category, 60).toLowerCase());
    }

    return {
        productType: productType(),
        requirements: "LISTING",
        attributes,
    };
}

/**
 * Creates/updates one listing.
 *
 * Unconfigured: returns the exact request we would have sent, with no
 * `externalId` — the sync route stores that as a `draft` ChannelListing so the
 * owner can review the payload before signing up.
 */
async function listProduct(product: FeedProduct): Promise<ChannelListingResult> {
    const sku = skuFor(product);
    const body = buildAmazonListing(product);
    const path = `${LISTINGS_API}/${encodeURIComponent(sellerId() || "{sellerId}")}/${encodeURIComponent(sku)}`;
    const query = { marketplaceIds: marketplaceId(), issueLocale: "en_IN" };

    const payload = {
        dryRun: !isConfigured(),
        method: "PUT",
        url: `${endpoint()}${path}?marketplaceIds=${marketplaceId()}&issueLocale=en_IN`,
        sku,
        marketplaceId: marketplaceId(),
        productUrl: productUrl(product.id),
        body,
    };

    if (!isConfigured()) return { payload };

    const response = await spRequest<any>({ method: "PUT", path, query, body });

    // Amazon accepts the submission and reports per-attribute problems in
    // `issues[]`. An ERROR-severity issue means nothing went live, so surface it.
    const errors = (response?.issues || []).filter((i: any) => i?.severity === "ERROR");
    if (errors.length > 0) {
        const first = plainText(errors[0]?.message, 200) || "Amazon rejected one or more attributes.";
        throw new Error(`${first}${errors.length > 1 ? ` (+${errors.length - 1} more)` : ""}`);
    }

    return {
        externalId: response?.sku || sku,
        payload: { ...payload, dryRun: false, response },
    };
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

function mapAmazonOrder(order: any): ChannelOrder {
    const shipping = order?.ShippingAddress || {};
    const addressLine = [shipping.AddressLine1, shipping.AddressLine2, shipping.AddressLine3]
        .filter(Boolean).join(", ");

    return {
        channel: KEY,
        channelOrderId: String(order?.AmazonOrderId || ""),
        placedAt: String(order?.PurchaseDate || new Date().toISOString()),
        customer: {
            name: plainText(shipping.Name || order?.BuyerInfo?.BuyerName, 120) || "Amazon customer",
            phone: shipping.Phone || undefined,
            email: order?.BuyerInfo?.BuyerEmail || undefined,
            address: addressLine || undefined,
            city: shipping.City || undefined,
            state: shipping.StateOrRegion || undefined,
            pincode: shipping.PostalCode || undefined,
        },
        // The Orders list endpoint does not include line items — /orderItems is a
        // separate call. Ingestion re-derives everything from our own DB anyway,
        // so an empty array here is honest rather than fabricated.
        items: [],
        total: Math.round(Number(order?.OrderTotal?.Amount) || 0),
        paymentMethod: order?.PaymentMethod || undefined,
        status: order?.OrderStatus || undefined,
        raw: order,
    };
}

/** Max pages walked in one pull — keeps a serverless invocation bounded. */
const MAX_ORDER_PAGES = 5;

async function fetchOrders(since: Date): Promise<ChannelOrder[]> {
    assertConfigured();

    const createdAfter = (since instanceof Date && !Number.isNaN(since.getTime()) ? since : new Date(Date.now() - 86_400_000))
        .toISOString();

    const out: ChannelOrder[] = [];
    let nextToken: string | undefined;

    for (let page = 0; page < MAX_ORDER_PAGES; page++) {
        const response = await spRequest<any>({
            method: "GET",
            path: ORDERS_API,
            query: nextToken
                ? { MarketplaceIds: marketplaceId(), NextToken: nextToken }
                : { MarketplaceIds: marketplaceId(), CreatedAfter: createdAfter },
        });

        const payload = response?.payload || response;
        for (const order of payload?.Orders || []) {
            const mapped = mapAmazonOrder(order);
            if (mapped.channelOrderId) out.push(mapped);
        }

        nextToken = payload?.NextToken || undefined;
        if (!nextToken) break;
    }

    return out;
}

/* ------------------------------------------------------------------ */
/* Inventory                                                           */
/* ------------------------------------------------------------------ */

/**
 * Patches the sellable quantity on each SKU via the same Listings Items API.
 * One request per SKU — SP-API has no batch quantity patch on this endpoint.
 */
async function pushInventory(updates: { sku: string; qty: number }[]): Promise<void> {
    assertConfigured();

    for (const update of updates) {
        const sku = String(update?.sku || "").trim();
        if (!sku) continue;
        const quantity = Math.max(0, Math.trunc(Number(update?.qty) || 0));

        await spRequest({
            method: "PATCH",
            path: `${LISTINGS_API}/${encodeURIComponent(sellerId())}/${encodeURIComponent(sku)}`,
            query: { marketplaceIds: marketplaceId(), issueLocale: "en_IN" },
            body: {
                productType: productType(),
                patches: [{
                    op: "replace",
                    path: "/attributes/fulfillment_availability",
                    value: [{ fulfillment_channel_code: "DEFAULT", quantity }],
                }],
            },
        });
    }
}

/* ------------------------------------------------------------------ */
/* Download                                                            */
/* ------------------------------------------------------------------ */

/**
 * The whole catalogue as one JSON_LISTINGS_FEED-shaped document. Useful for
 * reviewing before the API is switched on, and it is exactly what a bulk feed
 * submission would carry.
 */
function buildExport(products: FeedProduct[]): ChannelExport {
    const eligible = (products || []).filter(p => p && !p.isArchived && Number(p.price) > 0);
    const document = {
        header: {
            sellerId: sellerId() || "<AMAZON_SELLER_ID>",
            version: "2.0",
            issueLocale: "en_IN",
        },
        messages: eligible.map((product, index) => ({
            messageId: index + 1,
            sku: skuFor(product),
            operationType: "UPDATE",
            ...buildAmazonListing(product),
        })),
    };

    return {
        filename: `srivari-amazon-listings-${exportDate()}.json`,
        contentType: "application/json; charset=utf-8",
        body: JSON.stringify(document, null, 2),
        count: eligible.length,
    };
}

const amazon: ChannelAdapter = {
    key: KEY,
    label: LABEL,
    blurb: "Amazon.in seller listings, orders and stock over the Selling Partner API.",
    apiBacked: true,
    isConfigured,
    configHint: CONFIG_HINT,
    note: NOTE,
    capabilities: { listings: true, orders: true, inventory: true },
    docsUrl: "https://developer-docs.amazon.com/sp-api/",
    listProduct,
    fetchOrders,
    pushInventory,
    buildExport,
};

export default amazon;
