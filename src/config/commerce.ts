/**
 * Indian commerce configuration — seller identity, tax defaults and the
 * delivery channels the boutique offers.
 *
 * Anything that differs per deployment is env-overridable so the same code runs
 * for a different seller/pickup location without edits.
 */

/** The registered seller — appears on GST tax invoices and Shiprocket pickups. */
export const SELLER = {
    legalName: process.env.SELLER_LEGAL_NAME || "The Srivari",
    /** Fill SELLER_GSTIN in when the registration comes through. */
    gstin: process.env.SELLER_GSTIN || "",
    /** Home state — decides CGST+SGST (intra-state) vs IGST (inter-state). */
    state: process.env.SELLER_STATE || "Karnataka",
    address: {
        line1: process.env.PICKUP_ADDRESS_1 || "The Srivari Boutique",
        line2: process.env.PICKUP_ADDRESS_2 || "",
        city: process.env.PICKUP_CITY || "Bengaluru",
        state: process.env.PICKUP_STATE || "Karnataka",
        pincode: process.env.PICKUP_PINCODE || "560061",
        phone: process.env.PICKUP_PHONE || "9739988771",
    },
    /** Nickname of the pickup location registered in the Shiprocket dashboard. */
    pickupLocation: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
} as const;

export function isGstEnabled(): boolean {
    // GST logic ships live; flip GST_ENABLED=false to hide tax lines entirely.
    return (process.env.GST_ENABLED ?? "true").toLowerCase() !== "false";
}

/**
 * HSN + GST rate by fabric/category.
 *
 * Unstitched silk sarees fall under HSN 5007 at 5%. Cotton handloom is 5208.
 * A product-level `hsnCode` / `gstRate` always wins over these defaults.
 */
export const HSN_DEFAULTS: { match: RegExp; hsn: string; rate: number }[] = [
    { match: /silk|kanjivaram|kanchipuram|banarasi|mysore|dharmavaram|pattu|tussar/i, hsn: "5007", rate: 5 },
    { match: /cotton|chettinadu|handloom/i, hsn: "5208", rate: 5 },
    { match: /organza|georgette|viscose|synthetic/i, hsn: "5407", rate: 5 },
];

export const FALLBACK_HSN = "5007";
export const FALLBACK_GST_RATE = 5;

/** Typical parcel weight per category when a product has no explicit weight. */
export const DEFAULT_WEIGHT_KG = Number(process.env.DEFAULT_PARCEL_WEIGHT_KG) || 0.6;

export type DeliveryMethod = "Courier" | "Local" | "Pickup";

/**
 * Local (own-fleet) delivery around the boutique. Pincodes are configurable so
 * the zone can grow without a deploy.
 */
export const LOCAL_DELIVERY = {
    enabled: (process.env.LOCAL_DELIVERY_ENABLED ?? "true").toLowerCase() !== "false",
    /** Bengaluru south/west belt around the 560061 pickup point by default. */
    pincodes: (process.env.LOCAL_DELIVERY_PINCODES ||
        "560061,560062,560070,560078,560085,560098,560028,560026,560050,560040,560060,560082,560076,560068,560069,560111")
        .split(",").map(p => p.trim()).filter(Boolean),
    /** Flat fee in rupees; free above the threshold. */
    fee: Number(process.env.LOCAL_DELIVERY_FEE ?? 99),
    freeAbove: Number(process.env.LOCAL_DELIVERY_FREE_ABOVE ?? 5000),
    eta: process.env.LOCAL_DELIVERY_ETA || "Same or next day, by our own team",
} as const;

/** Collect-from-boutique. */
export const STORE_PICKUP = {
    enabled: (process.env.STORE_PICKUP_ENABLED ?? "true").toLowerCase() !== "false",
    eta: process.env.STORE_PICKUP_ETA || "Ready within 4 hours",
    instructions:
        process.env.STORE_PICKUP_INSTRUCTIONS ||
        "Please carry your order ID. Our boutique is open 10:30 AM – 8:00 PM, all days.",
} as const;

export function isLocalPincode(pincode?: string | null): boolean {
    if (!LOCAL_DELIVERY.enabled || !pincode) return false;
    return LOCAL_DELIVERY.pincodes.includes(String(pincode).trim());
}

/** Local delivery fee for a given cart subtotal (0 when it qualifies as free). */
export function localDeliveryFee(subtotal: number): number {
    return subtotal >= LOCAL_DELIVERY.freeAbove ? 0 : LOCAL_DELIVERY.fee;
}
