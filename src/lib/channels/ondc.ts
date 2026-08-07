/**
 * ONDC — Open Network for Digital Commerce.
 *
 * WHAT ONDC ACTUALLY IS (and why this adapter looks different to Amazon's):
 *
 *   ONDC is a government-backed open network, not a marketplace with a signup
 *   page and an API key. Buyers arrive through many buyer apps (Paytm, Pincode,
 *   Magicpin, Mystore, …). A seller does not call ONDC directly — a seller joins
 *   through a **Seller Network Participant (SNP)**: a seller app that is already
 *   registered on the network registry, holds the signing keys, and answers the
 *   protocol callbacks (`on_search`, `on_select`, `on_confirm`, …) on the
 *   seller's behalf.
 *
 *   So there is no single "ONDC API key" to put in an env var, and this file
 *   deliberately does NOT pretend to publish anything. What it does is the part
 *   that is genuinely ours to do: build a spec-shaped `on_search` catalogue from
 *   the live product table — provider descriptor from the SELLER config, a
 *   fulfilment, and one item per saree carrying price, quantity, category and
 *   the `@ondc/org` statutory attributes (HSN via `classify()`, country of
 *   origin IND, time to ship, returnable/cancellable, GST rate).
 *
 *   That JSON is downloadable from /admin/channels. Hand it to an SNP and they
 *   have everything they need to onboard the catalogue.
 *
 * CONFIGURED means: ONDC_SUBSCRIBER_ID and ONDC_SNP_ENDPOINT are set, i.e. an
 * SNP has been signed up with and told us the subscriber id it registered us
 * under. Even then, publishing is the SNP's job — we only stamp the catalogue
 * with the real identifiers instead of placeholders.
 *
 * Field names track the ONDC Retail (RET) specification. Confirm them with your
 * SNP before go-live: the network versions its schema, and the exact tag codes
 * for statutory requirements move between releases.
 *
 * Spec: https://github.com/ONDC-Official/ONDC-Protocol-Specs
 */

import { SELLER } from "@/config/commerce";
import {
    BRAND,
    COUNTRY_OF_ORIGIN,
    SITE_URL,
    feedImages,
    plainText,
    productUrl,
    type FeedProduct,
} from "@/lib/feeds";
import { classify } from "@/lib/gst";
import {
    envValue,
    exportDate,
    hasEnv,
    type ChannelAdapter,
    type ChannelExport,
    type ChannelListingResult,
} from "./types";

const KEY = "ondc";
const LABEL = "ONDC";

/** RET12 is the Fashion domain in the ONDC retail spec. */
const DEFAULT_DOMAIN = "ONDC:RET12";
const DEFAULT_CORE_VERSION = "1.2.0";
/** std:080 = Bengaluru. Matches the default pickup city in the SELLER config. */
const DEFAULT_CITY_CODE = "std:080";

const PROVIDER_ID = "srivari";
const LOCATION_ID = "L1";
const FULFILLMENT_ID = "F1";

/** ISO-8601 durations, the units the ONDC spec uses. */
const TIME_TO_SHIP = envValue("ONDC_TIME_TO_SHIP") || "P2D";
const RETURN_WINDOW = envValue("ONDC_RETURN_WINDOW") || "P7D";

const CONFIG_HINT =
    "Set ONDC_SUBSCRIBER_ID and ONDC_SNP_ENDPOINT — both come from the Seller Network Participant " +
    "(seller app) you onboard with; there is no self-serve ONDC key. " +
    "Optional: ONDC_DOMAIN (defaults to ONDC:RET12 = Fashion), ONDC_CITY_CODE (defaults to std:080 = Bengaluru), " +
    "ONDC_TIME_TO_SHIP and ONDC_RETURN_WINDOW (ISO-8601 durations, default P2D / P7D).";

const NOTE =
    "Catalogue ready — publishing needs a Seller Network Participant. ONDC has no direct seller API: " +
    "pick an SNP (seller app), and give them this on_search catalogue JSON. They hold the network keys " +
    "and answer the protocol callbacks for you.";

function domain(): string {
    return envValue("ONDC_DOMAIN") || DEFAULT_DOMAIN;
}

function cityCode(): string {
    return envValue("ONDC_CITY_CODE") || DEFAULT_CITY_CODE;
}

function subscriberId(): string {
    return envValue("ONDC_SUBSCRIBER_ID");
}

function snpEndpoint(): string {
    return envValue("ONDC_SNP_ENDPOINT").replace(/\/+$/, "");
}

function isConfigured(): boolean {
    return hasEnv("ONDC_SUBSCRIBER_ID", "ONDC_SNP_ENDPOINT");
}

/* ------------------------------------------------------------------ */
/* Catalogue construction                                              */
/* ------------------------------------------------------------------ */

/** ONDC money is a decimal string, not a number. */
function ondcPrice(rupees: number): string {
    return (Math.max(0, Math.round(Number(rupees) || 0))).toFixed(2);
}

function itemId(product: FeedProduct): string {
    return (product.sku || "").trim() || product.id;
}

function titleFor(product: FeedProduct): string {
    return plainText(product.name, 150) || "Handwoven Saree";
}

function descriptionFor(product: FeedProduct): string {
    const written = plainText(product.description, 1500);
    if (written) return written;
    const category = plainText(product.category, 60);
    return `${titleFor(product)} — a handwoven ${category ? `${category} ` : ""}saree from ${BRAND}.`;
}

/**
 * One catalogue item. The `@ondc/org/*` keys are the statutory/operational
 * attributes the retail spec requires of every seller; the `tags` carry the
 * origin and tax declarations.
 */
export function buildOndcItem(product: FeedProduct): Record<string, unknown> {
    const { hsn, rate } = classify(product);
    const images = feedImages(product);
    const stock = Math.max(0, Math.trunc(Number(product.stock) || 0));
    const category = plainText(product.category, 60) || "Sarees";

    return {
        id: itemId(product),
        descriptor: {
            name: titleFor(product),
            code: `${hsn}:${itemId(product)}`,
            short_desc: plainText(product.description, 160) || titleFor(product),
            long_desc: descriptionFor(product),
            images,
            symbol: images[0],
        },
        price: {
            currency: "INR",
            // Prices are GST-inclusive across the whole store, so listed price,
            // maximum and the "MRP" are one and the same — no inflated strike-through.
            value: ondcPrice(product.price),
            maximum_value: ondcPrice(product.price),
        },
        quantity: {
            unitized: { measure: { unit: "unit", value: "1" } },
            available: { count: String(stock) },
            maximum: { count: String(Math.min(stock, 5)) },
        },
        category_id: "Sarees",
        // Category tree the fashion domain expects; kept alongside our own label.
        category_ids: [category],
        fulfillment_id: FULFILLMENT_ID,
        location_id: LOCATION_ID,
        "@ondc/org/returnable": true,
        "@ondc/org/cancellable": true,
        "@ondc/org/return_window": RETURN_WINDOW,
        "@ondc/org/seller_pickup_return": true,
        "@ondc/org/time_to_ship": TIME_TO_SHIP,
        "@ondc/org/available_on_cod": false,
        "@ondc/org/contact_details_consumer_care":
            `${SELLER.legalName}, ${SELLER.address.phone}, ${SITE_URL}/contact`,
        "@ondc/org/statutory_reqs_packaged_commodities": {
            manufacturer_or_packer_name: SELLER.legalName,
            manufacturer_or_packer_address:
                [SELLER.address.line1, SELLER.address.line2, SELLER.address.city, SELLER.address.pincode]
                    .filter(Boolean).join(", "),
            common_or_generic_name_of_commodity: "Saree",
            net_quantity_or_measure_of_commodity_in_pkg: "1 unit",
            month_year_of_manufacture_packing_import: exportDate().slice(0, 7),
        },
        tags: [
            { code: "origin", list: [{ code: "country", value: "IND" }] },
            {
                code: "tax",
                list: [
                    { code: "hsn", value: hsn },
                    { code: "rate", value: String(rate) },
                    // Every listed price already contains the GST above.
                    { code: "price_inclusive_of_tax", value: "true" },
                ],
            },
            {
                code: "mandatory_fields",
                list: [
                    { code: "name", value: titleFor(product) },
                    { code: "brand", value: BRAND },
                    { code: "hsn_code", value: hsn },
                    { code: "country_of_origin", value: "IND" },
                    { code: "product_url", value: productUrl(product.id) },
                ],
            },
        ],
    };
}

function providerDescriptor() {
    return {
        name: SELLER.legalName,
        short_desc: `${BRAND} — handwoven sarees from ${COUNTRY_OF_ORIGIN}`,
        long_desc: `${BRAND} curates handwoven silk and cotton sarees. Every piece is sourced directly from weaving clusters and shipped from our ${SELLER.address.city} boutique.`,
        symbol: `${SITE_URL}/logo.png`,
        images: [`${SITE_URL}/logo.png`],
    };
}

/**
 * The full `on_search` catalogue.
 *
 * `transactionId` / `messageId` are pass-through: on the live network the SNP
 * echoes the ids from the buyer app's `search`. For a downloadable catalogue we
 * emit placeholders and say so.
 */
export function buildOndcCatalog(
    products: FeedProduct[],
    opts: { transactionId?: string; messageId?: string; at?: Date } = {}
): Record<string, unknown> {
    const eligible = (products || []).filter(p => p && !p.isArchived && Number(p.price) > 0);
    const now = opts.at || new Date();

    return {
        context: {
            domain: domain(),
            country: "IND",
            city: cityCode(),
            action: "on_search",
            core_version: envValue("ONDC_CORE_VERSION") || DEFAULT_CORE_VERSION,
            // Absent an SNP these are placeholders — deliberately obvious ones.
            bpp_id: subscriberId() || "<ONDC_SUBSCRIBER_ID>",
            bpp_uri: snpEndpoint() || "<ONDC_SNP_ENDPOINT>",
            transaction_id: opts.transactionId || "<transaction_id from the buyer app search>",
            message_id: opts.messageId || "<message_id from the buyer app search>",
            timestamp: now.toISOString(),
            ttl: "PT30S",
        },
        message: {
            catalog: {
                "bpp/descriptor": providerDescriptor(),
                "bpp/fulfillments": [{ id: FULFILLMENT_ID, type: "Delivery" }],
                "bpp/providers": [{
                    id: PROVIDER_ID,
                    time: { label: "enable", timestamp: now.toISOString() },
                    descriptor: providerDescriptor(),
                    "@ondc/org/fssai_license_no": undefined,
                    locations: [{
                        id: LOCATION_ID,
                        gps: envValue("ONDC_LOCATION_GPS") || undefined,
                        address: {
                            locality: SELLER.address.line1,
                            street: SELLER.address.line2 || SELLER.address.line1,
                            city: SELLER.address.city,
                            area_code: SELLER.address.pincode,
                            state: SELLER.address.state,
                        },
                    }],
                    fulfillments: [{
                        id: FULFILLMENT_ID,
                        type: "Delivery",
                        contact: { phone: SELLER.address.phone },
                    }],
                    items: eligible.map(buildOndcItem),
                    tags: [
                        {
                            code: "serviceability",
                            list: [
                                { code: "location", value: LOCATION_ID },
                                { code: "category", value: "Sarees" },
                                // 12 = pan-India serviceability in the retail spec.
                                { code: "type", value: "12" },
                                { code: "unit", value: "country" },
                                { code: "val", value: "IND" },
                            ],
                        },
                        {
                            code: "seller_terms",
                            list: [
                                { code: "gst_credit_invoice", value: SELLER.gstin ? "Y" : "N" },
                                { code: "gstin", value: SELLER.gstin || "<SELLER_GSTIN not set>" },
                            ],
                        },
                    ],
                }],
            },
        },
    };
}

/* ------------------------------------------------------------------ */
/* Adapter                                                             */
/* ------------------------------------------------------------------ */

/**
 * There is nothing to POST — an SNP serves the catalogue, we do not. So this
 * always returns the item block as a payload, which the sync route stores as a
 * `draft` ChannelListing. `externalId` is the ONDC item id, which is stable and
 * ours to choose, so it is worth recording even before an SNP is signed.
 */
async function listProduct(product: FeedProduct): Promise<ChannelListingResult> {
    return {
        externalId: itemId(product),
        payload: {
            publishedBy: isConfigured()
                ? `Seller Network Participant at ${snpEndpoint()} (subscriber ${subscriberId()})`
                : "Not published — no Seller Network Participant configured. Hand this catalogue to an SNP.",
            domain: domain(),
            item: buildOndcItem(product),
        },
    };
}

function buildExport(products: FeedProduct[]): ChannelExport {
    const catalog = buildOndcCatalog(products);
    const items = (catalog as any)?.message?.catalog?.["bpp/providers"]?.[0]?.items || [];
    return {
        filename: `srivari-ondc-catalog-${exportDate()}.json`,
        contentType: "application/json; charset=utf-8",
        // JSON.stringify drops the `undefined` placeholders (fssai, gps) — an
        // absent key is correct here, an explicit null would fail validation.
        body: JSON.stringify(catalog, null, 2),
        count: items.length,
    };
}

const ondc: ChannelAdapter = {
    key: KEY,
    label: LABEL,
    blurb: "India's open buyer network — one catalogue, many buyer apps, reached through a seller app.",
    // No direct seller API exists: onboarding runs through an SNP.
    apiBacked: false,
    isConfigured,
    configHint: CONFIG_HINT,
    note: NOTE,
    capabilities: { listings: true, orders: false, inventory: false },
    docsUrl: "https://ondc.org/",
    listProduct,
    buildExport,
};

export default ondc;
