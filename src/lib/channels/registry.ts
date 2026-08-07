/**
 * The channel registry.
 *
 * ===========================================================================
 *  ADDING A NEW MARKETPLACE = ONE FILE + ONE LINE HERE.
 *
 *  1. Create `src/lib/channels/<name>.ts` that default-exports a
 *     `ChannelAdapter` (see `./types.ts` for the contract).
 *  2. Import it below and add it to `ADAPTERS`.
 *
 *  Nothing else changes. `/api/admin/channels`, `/api/admin/channels/sync` and
 *  the /admin/channels page all iterate `getAdapters()`, so the new channel
 *  appears with its capabilities, config hint, listing counts, a Sync button
 *  and a download — no UI or route edits.
 * ===========================================================================
 *
 * Keys are persisted (ChannelListing.channel, Order.channel), so treat a key as
 * permanent: renaming one orphans every row that already carries it.
 */

import type { ChannelAdapter } from "./types";
import amazon from "./amazon";
import ondc from "./ondc";
import manual from "./manual";

/** Registration order is display order in the admin console. */
const ADAPTERS: ChannelAdapter[] = [amazon, ondc, manual];

const BY_KEY = new Map(ADAPTERS.map(a => [a.key, a]));

export function getAdapters(): ChannelAdapter[] {
    return ADAPTERS;
}

export function getAdapter(key: string): ChannelAdapter | undefined {
    return BY_KEY.get(String(key || "").trim().toLowerCase());
}

/** Every registered key — used to validate request bodies. */
export const CHANNEL_KEYS: string[] = ADAPTERS.map(a => a.key);

export function isChannelKey(value: string): boolean {
    return BY_KEY.has(String(value || "").trim().toLowerCase());
}

/**
 * "Web" is the storefront itself: it is the default for Order.channel and is
 * deliberately NOT an adapter — there is nothing to sync to ourselves.
 */
export const WEB_CHANNEL = "Web";
