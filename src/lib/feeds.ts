/**
 * Sales-channel catalogue feeds.
 *
 * Three honest deliverables, one per kind of channel:
 *
 *  - `meta`        Meta/Instagram Commerce Manager catalogue (real self-serve
 *                  upload: Commerce Manager -> Catalogue -> Data sources).
 *  - `google`      Google Merchant Center primary feed (real self-serve upload).
 *  - `marketplace` A generic onboarding sheet for Blinkit / Swiggy Instamart /
 *                  ONDC-style partners. Those marketplaces have NO public
 *                  self-serve seller API — onboarding is a commercial process
 *                  and their category team asks for a catalogue spreadsheet.
 *                  This is that spreadsheet, not a pretend integration.
 *
 * Everything here is a pure function over plain product objects. Only
 * PUBLIC fields are ever read — cost price (`priceCps`), supplier and
 * `locationBin` are deliberately absent from `FeedProduct` so they can never
 * leak into a file that gets emailed to a third party.
 */

import { DEFAULT_WEIGHT_KG } from "@/config/commerce";
import { classify } from "@/lib/gst";
import { isRenderableImageSrc } from "@/lib/image-src";

/** Public site origin — feed links and image links must be absolute. */
export const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://thesrivari.com").replace(/\/+$/, "");

export const BRAND = "The Srivari";
export const COUNTRY_OF_ORIGIN = "India";

/** Google's taxonomy node for sarees — shared by the Meta and Google feeds. */
export const GOOGLE_PRODUCT_CATEGORY =
    "Apparel & Accessories > Clothing > Traditional & Ceremonial Clothing > Saris";

/** Parcel dimensions declared to marketplaces for a folded saree box (cm). */
export const PARCEL_DIMS_CM = { length: 30, breadth: 25, height: 8 } as const;

export const FEED_FORMATS = ["meta", "google", "marketplace"] as const;
export type FeedFormat = (typeof FEED_FORMATS)[number];

export function isFeedFormat(value: string): value is FeedFormat {
    return (FEED_FORMATS as readonly string[]).includes(value);
}

/**
 * The public shape a feed row is built from. Intentionally narrow: anything not
 * listed here cannot end up in an exported file.
 *
 * `weightKg` / `hsnCode` / `gstRate` are optional because the live DB has not
 * been migrated yet and `getProducts()` does not select them — the builders fall
 * back to category-derived defaults, exactly as checkout does.
 */
export interface FeedProduct {
    id: string;
    name: string;
    price: number;
    sku?: string | null;
    description?: string | null;
    category?: string | null;
    stock?: number | null;
    images?: string[] | null;
    weightKg?: number | null;
    weight?: number | null;
    hsnCode?: string | null;
    gstRate?: number | null;
    isArchived?: boolean | null;
}

export interface FeedResult {
    csv: string;
    filename: string;
    contentType: string;
    /** Product rows actually written. */
    rows: number;
    /** Products left out because the channel would reject them (see `skippedReason`). */
    skipped: number;
    skippedReason?: string;
}

/* ------------------------------------------------------------------ */
/* CSV                                                                 */
/* ------------------------------------------------------------------ */

/**
 * RFC-4180 cell: always quoted, embedded quotes doubled. Newlines are flattened
 * to spaces so a product can never spill across two rows — feed parsers at Meta
 * and Google are far happier with one line per item.
 */
function csvCell(value: string | number | null | undefined): string {
    const raw = value === null || value === undefined ? "" : String(value);
    const flat = raw.replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim();
    return `"${flat.replace(/"/g, '""')}"`;
}

/**
 * Joins a header + rows into a CSV document. CRLF line endings per RFC 4180.
 * `bom` prefixes a UTF-8 byte-order mark so Excel renders ₹ and accented names
 * correctly — used only for the human-facing marketplace sheet, never for the
 * machine-parsed Meta/Google feeds.
 */
export function toCsv(
    header: readonly string[],
    rows: (string | number | null | undefined)[][],
    opts: { bom?: boolean } = {}
): string {
    const lines = [
        header.map(csvCell).join(","),
        ...rows.map(row => row.map(csvCell).join(",")),
    ];
    return `${opts.bom ? "\uFEFF" : ""}${lines.join("\r\n")}\r\n`;
}

/* ------------------------------------------------------------------ */
/* Field helpers                                                       */
/* ------------------------------------------------------------------ */

const ENTITIES: Record<string, string> = {
    "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"',
    "&apos;": "'", "&#39;": "'", "&nbsp;": " ",
};

function truncate(text: string, max: number): string {
    if (text.length <= max) return text;
    const cut = text.slice(0, max - 1);
    const lastSpace = cut.lastIndexOf(" ");
    return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Strips HTML, decodes the handful of entities our copy actually uses and
 * collapses all whitespace to single spaces. Feed descriptions must be plain
 * text — markup is rejected by Merchant Center and renders literally on Meta.
 */
export function plainText(input?: string | null, maxLen = 4000): string {
    if (!input) return "";
    const stripped = String(input)
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<\/(?:p|div|li|ul|ol|h[1-6]|tr)>/gi, " ")
        .replace(/<[^>]*>/g, " ")
        .replace(/&(?:amp|lt|gt|quot|apos|#39|nbsp);/gi, m => ENTITIES[m.toLowerCase()] ?? " ")
        .replace(/\s+/g, " ")
        .trim();
    return truncate(stripped, maxLen);
}

function absoluteUrl(src: string): string {
    if (/^https?:\/\//i.test(src)) return src;
    return `${SITE_URL}${src.startsWith("/") ? "" : "/"}${src}`;
}

/**
 * Absolute, fetchable image URLs for a product.
 *
 * `isRenderableImageSrc` drops Instagram *post page* links (an HTML page, not an
 * image) that live in some catalogue rows. Inline `data:` URIs are dropped too:
 * they render fine in the storefront but no feed crawler can fetch them.
 */
export function feedImages(product: FeedProduct): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of product.images || []) {
        const src = typeof raw === "string" ? raw.trim() : "";
        if (!isRenderableImageSrc(src)) continue;
        if (src.toLowerCase().startsWith("data:")) continue;
        const url = absoluteUrl(src);
        if (seen.has(url)) continue;
        seen.add(url);
        out.push(url);
    }
    return out;
}

export function productUrl(id: string): string {
    return `${SITE_URL}/product/${id}`;
}

/** Feed money format used by both Meta and Google: "1299.00 INR". */
export function feedPrice(rupees: number): string {
    return `${Number(rupees || 0).toFixed(2)} INR`;
}

function availability(stock?: number | null): string {
    return (stock ?? 0) > 0 ? "in stock" : "out of stock";
}

/** Weight in kg, product override first, then the shared parcel default. */
export function feedWeight(product: FeedProduct): number {
    const w = product.weightKg ?? product.weight ?? DEFAULT_WEIGHT_KG;
    const n = Number(w);
    return Number.isFinite(n) && n > 0 ? Number(n.toFixed(2)) : DEFAULT_WEIGHT_KG;
}

/**
 * Catalogue `id`. Deliberately the product id and not the SKU: a catalogue id is
 * the permanent key Meta and Google hang an item's history off, and an admin
 * editing a SKU would otherwise orphan the old entry and re-create the product
 * as a brand new item. Product ids never change.
 */
function feedId(product: FeedProduct): string {
    return product.id;
}

/** Human-facing stock keeping unit for partner sheets and Google's `mpn`. */
function skuFor(product: FeedProduct): string {
    return product.sku?.trim() || product.id;
}

function titleFor(product: FeedProduct): string {
    return truncate(plainText(product.name, 150) || "Handwoven Saree", 150);
}

/** Never ship an empty description — both channels reject the row. */
function descriptionFor(product: FeedProduct, maxLen: number): string {
    const written = plainText(product.description, maxLen);
    if (written) return written;
    const category = plainText(product.category, 60);
    return truncate(
        `${titleFor(product)} — a handwoven ${category ? `${category} ` : ""}saree from ${BRAND}.`,
        maxLen
    );
}

/**
 * Rows a commerce catalogue will accept: live products with a real price and at
 * least one fetchable image. Meta and Google both hard-reject an item with no
 * `image_link`, so publishing those rows would just produce a disapproval list.
 */
function catalogEligible(products: FeedProduct[]): { eligible: FeedProduct[]; skipped: number } {
    const live = products.filter(p => p && !p.isArchived);
    const eligible = live.filter(p => Number(p.price) > 0 && feedImages(p).length > 0);
    return { eligible, skipped: live.length - eligible.length };
}

/* ------------------------------------------------------------------ */
/* Feed builders                                                       */
/* ------------------------------------------------------------------ */

const META_HEADER = [
    "id", "title", "description", "availability", "condition", "price", "link",
    "image_link", "brand", "google_product_category", "product_type",
    "quantity_to_sell_on_facebook",
] as const;

/** Meta / Instagram Shopping commerce catalogue feed. */
export function buildMetaFeed(products: FeedProduct[]): Omit<FeedResult, "filename" | "contentType"> {
    const { eligible, skipped } = catalogEligible(products);

    const rows = eligible.map(p => [
        feedId(p),
        titleFor(p),
        descriptionFor(p, 4000),
        availability(p.stock),
        "new",
        feedPrice(p.price),
        productUrl(p.id),
        feedImages(p)[0],
        BRAND,
        GOOGLE_PRODUCT_CATEGORY,
        plainText(p.category, 100),
        Math.max(0, Math.trunc(Number(p.stock) || 0)),
    ]);

    return {
        csv: toCsv(META_HEADER, rows),
        rows: rows.length,
        skipped,
        skippedReason: skipped ? "no usable image or no price" : undefined,
    };
}

const GOOGLE_HEADER = [
    "id", "title", "description", "link", "image_link", "additional_image_link",
    "availability", "price", "brand", "condition", "gtin", "mpn",
    "google_product_category", "product_type", "shipping_weight", "identifier_exists",
] as const;

/** Google Merchant Center primary feed. */
export function buildGoogleFeed(products: FeedProduct[]): Omit<FeedResult, "filename" | "contentType"> {
    const { eligible, skipped } = catalogEligible(products);

    const rows = eligible.map(p => {
        const images = feedImages(p);
        return [
            feedId(p),
            titleFor(p),
            descriptionFor(p, 5000),
            productUrl(p.id),
            images[0],
            // Merchant Center takes up to 10 extra images, comma-separated.
            images.slice(1, 11).join(","),
            availability(p.stock),
            feedPrice(p.price),
            BRAND,
            "new",
            // Handwoven sarees carry no manufacturer barcode, so gtin stays blank
            // and identifier_exists says so explicitly.
            "",
            skuFor(p),
            GOOGLE_PRODUCT_CATEGORY,
            plainText(p.category, 100),
            `${feedWeight(p)} kg`,
            "no",
        ];
    });

    return {
        csv: toCsv(GOOGLE_HEADER, rows),
        rows: rows.length,
        skipped,
        skippedReason: skipped ? "no usable image or no price" : undefined,
    };
}

const MARKETPLACE_HEADER = [
    "sku", "product_name", "category", "hsn_code", "gst_rate", "mrp",
    "selling_price", "stock_qty", "weight_kg", "length_cm", "breadth_cm",
    "height_cm", "image_url_1", "image_url_2", "image_url_3", "description",
    "brand", "country_of_origin",
] as const;

/**
 * Generic onboarding sheet for Blinkit / Swiggy Instamart / ONDC-style partners.
 *
 * Unlike the commerce feeds this keeps image-less products (the category team
 * wants the whole catalogue and collects photography separately) and leaves the
 * image columns blank instead. `mrp` and `selling_price` are identical because
 * the store lists one GST-inclusive price — no inflated MRP.
 */
export function buildMarketplaceFeed(products: FeedProduct[]): Omit<FeedResult, "filename" | "contentType"> {
    const live = products.filter(p => p && !p.isArchived && Number(p.price) > 0);
    const skipped = products.filter(p => p && !p.isArchived).length - live.length;

    const rows = live.map(p => {
        const images = feedImages(p);
        const { hsn, rate } = classify(p);
        const price = Math.round(Number(p.price) || 0);
        return [
            skuFor(p),
            titleFor(p),
            plainText(p.category, 100),
            hsn,
            rate,
            price,
            price,
            Math.max(0, Math.trunc(Number(p.stock) || 0)),
            feedWeight(p),
            PARCEL_DIMS_CM.length,
            PARCEL_DIMS_CM.breadth,
            PARCEL_DIMS_CM.height,
            images[0] || "",
            images[1] || "",
            images[2] || "",
            descriptionFor(p, 2000),
            BRAND,
            COUNTRY_OF_ORIGIN,
        ];
    });

    return {
        csv: toCsv(MARKETPLACE_HEADER, rows, { bom: true }),
        rows: rows.length,
        skipped,
        skippedReason: skipped ? "no price set" : undefined,
    };
}

/* ------------------------------------------------------------------ */
/* Dispatcher                                                          */
/* ------------------------------------------------------------------ */

/** YYYY-MM-DD in IST — the store's own calendar day. */
function feedDate(date: Date): string {
    try {
        return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    } catch {
        return date.toISOString().slice(0, 10);
    }
}

const BUILDERS: Record<FeedFormat, (p: FeedProduct[]) => Omit<FeedResult, "filename" | "contentType">> = {
    meta: buildMetaFeed,
    google: buildGoogleFeed,
    marketplace: buildMarketplaceFeed,
};

/** Builds a feed plus the download filename and content type for it. */
export function buildFeed(format: FeedFormat, products: FeedProduct[], date = new Date()): FeedResult {
    const built = BUILDERS[format](Array.isArray(products) ? products : []);
    return {
        ...built,
        filename: `srivari-${format}-feed-${feedDate(date)}.csv`,
        contentType: "text/csv; charset=utf-8",
    };
}
