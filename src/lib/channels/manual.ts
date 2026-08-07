/**
 * Partner catalogue sheet — Blinkit, Swiggy Instamart, and any other partner
 * that onboards commercially.
 *
 * BE CLEAR ABOUT WHAT THIS IS. Blinkit and Swiggy Instamart have **no public
 * seller API**. There is no key to request, no sandbox, no listings endpoint.
 * A brand gets on those platforms by talking to their category team, signing a
 * commercial agreement, and sending a catalogue spreadsheet that their ops team
 * loads. That is the entire integration, and it is a human one.
 *
 * So this adapter does not pretend. It produces the marketplace onboarding sheet
 * that `lib/feeds.ts` already builds — SKU, name, category, HSN, GST rate, MRP,
 * selling price, stock, weight, parcel dimensions, three image URLs, description,
 * brand and country of origin — which is exactly the column set those category
 * teams ask for. The owner downloads it and emails it.
 *
 * `apiBacked` is false and `capabilities.orders` / `.inventory` are false for
 * precisely this reason: nothing in the admin console should suggest stock or
 * orders flow automatically here. If one of these partners ever ships a real
 * seller API, it gets its own adapter file — this one stays honest.
 */

import { buildFeed, type FeedProduct } from "@/lib/feeds";
import {
    type ChannelAdapter,
    type ChannelExport,
    type ChannelListingResult,
} from "./types";

const KEY = "manual";
const LABEL = "Partner catalogue sheet";

const CONFIG_HINT =
    "Nothing to configure — and nothing to connect to. Blinkit and Swiggy Instamart onboard sellers " +
    "commercially through their category teams; neither publishes a seller API. Download the sheet and send it to them.";

const NOTE =
    "Commercial onboarding, no public API. Download the catalogue sheet, email it to the partner's " +
    "category team, and they load it. Orders and stock stay manual until they give you a portal login.";

/**
 * The single-product view of the same sheet. Reuses `buildFeed` rather than
 * re-deriving the columns, so the stored payload is byte-identical to the row
 * the partner will receive.
 */
async function listProduct(product: FeedProduct): Promise<ChannelListingResult> {
    const feed = buildFeed("marketplace", [product]);
    return {
        // No external system assigns an id here — the sheet is the deliverable.
        payload: {
            deliveredBy: "Manual — download the sheet and send it to the partner's category team.",
            sheet: "marketplace",
            csv: feed.csv,
        },
    };
}

function buildExport(products: FeedProduct[]): ChannelExport {
    const feed = buildFeed("marketplace", products || []);
    return {
        filename: feed.filename,
        contentType: feed.contentType,
        body: feed.csv,
        count: feed.rows,
    };
}

const manual: ChannelAdapter = {
    key: KEY,
    label: LABEL,
    blurb: "One spreadsheet for Blinkit, Swiggy Instamart and any partner that onboards over email.",
    // No API exists for these partners. Never flip this to true without one.
    apiBacked: false,
    // Nothing to configure, so the sheet is always available.
    isConfigured: () => true,
    configHint: CONFIG_HINT,
    note: NOTE,
    capabilities: { listings: true, orders: false, inventory: false },
    listProduct,
    buildExport,
};

export default manual;
