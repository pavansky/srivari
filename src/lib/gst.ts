import {
    FALLBACK_GST_RATE,
    FALLBACK_HSN,
    HSN_DEFAULTS,
    SELLER,
    isGstEnabled,
} from "@/config/commerce";

/**
 * GST for Indian retail.
 *
 * Displayed prices are GST-INCLUSIVE (what the customer actually pays), which is
 * the norm for Indian B2C retail. So tax is *extracted* from the price rather
 * than added on top: taxable = gross / (1 + rate/100).
 *
 * Intra-state supply (seller state === customer state) splits into CGST + SGST
 * at half the rate each; inter-state is a single IGST at the full rate.
 */

export interface GstLine {
    hsn: string;
    rate: number;
    taxable: number;
    gst: number;
}

export interface GstSummary {
    enabled: boolean;
    /** GST-inclusive goods total (excludes shipping). */
    gross: number;
    taxable: number;
    gstAmount: number;
    /** Weighted effective rate across the cart. */
    rate: number;
    cgst: number;
    sgst: number;
    igst: number;
    isIntraState: boolean;
    placeOfSupply: string;
    lines: GstLine[];
}

/** Resolve HSN + rate for a product, honouring per-product overrides. */
export function classify(product: { category?: string | null; name?: string | null; hsnCode?: string | null; gstRate?: number | null }): { hsn: string; rate: number } {
    if (product.hsnCode && product.gstRate != null) {
        return { hsn: product.hsnCode, rate: product.gstRate };
    }
    const haystack = `${product.category || ""} ${product.name || ""}`;
    const match = HSN_DEFAULTS.find(d => d.match.test(haystack));
    return {
        hsn: product.hsnCode || match?.hsn || FALLBACK_HSN,
        rate: product.gstRate ?? match?.rate ?? FALLBACK_GST_RATE,
    };
}

function round2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Normalise a state name for comparison ("KA", "karnataka " → "karnataka"). */
function normalizeState(state?: string | null): string {
    const s = (state || "").trim().toLowerCase();
    if (s === "ka" || s === "kar") return "karnataka";
    return s;
}

/**
 * Computes the GST breakup for a set of GST-inclusive line items.
 * `customerState` decides the intra/inter-state split.
 */
export function computeGst(
    items: { price: number; quantity: number; category?: string | null; name?: string | null; hsnCode?: string | null; gstRate?: number | null }[],
    customerState?: string | null,
    /** Discount (e.g. coupon) applied proportionally across lines before tax extraction. */
    discount = 0
): GstSummary {
    const isIntraState = normalizeState(customerState) === normalizeState(SELLER.state);
    const placeOfSupply = (customerState || SELLER.state).trim();

    const gross = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    if (!isGstEnabled() || gross <= 0) {
        return {
            enabled: false, gross, taxable: gross, gstAmount: 0, rate: 0,
            cgst: 0, sgst: 0, igst: 0, isIntraState, placeOfSupply, lines: [],
        };
    }

    // Spread any discount proportionally so each line is taxed on what was paid.
    const discountFactor = discount > 0 && discount < gross ? (gross - discount) / gross : 1;

    const byHsn = new Map<string, GstLine>();
    let taxableTotal = 0;
    let gstTotal = 0;

    for (const item of items) {
        const { hsn, rate } = classify(item);
        const lineGross = item.price * item.quantity * discountFactor;
        const lineTaxable = lineGross / (1 + rate / 100);
        const lineGst = lineGross - lineTaxable;

        taxableTotal += lineTaxable;
        gstTotal += lineGst;

        const key = `${hsn}:${rate}`;
        const existing = byHsn.get(key);
        if (existing) {
            existing.taxable = round2(existing.taxable + lineTaxable);
            existing.gst = round2(existing.gst + lineGst);
        } else {
            byHsn.set(key, { hsn, rate, taxable: round2(lineTaxable), gst: round2(lineGst) });
        }
    }

    taxableTotal = round2(taxableTotal);
    gstTotal = round2(gstTotal);
    const effectiveRate = taxableTotal > 0 ? round2((gstTotal / taxableTotal) * 100) : 0;

    return {
        enabled: true,
        gross: round2(gross),
        taxable: taxableTotal,
        gstAmount: gstTotal,
        rate: effectiveRate,
        cgst: isIntraState ? round2(gstTotal / 2) : 0,
        sgst: isIntraState ? round2(gstTotal / 2) : 0,
        igst: isIntraState ? 0 : gstTotal,
        isIntraState,
        placeOfSupply,
        lines: Array.from(byHsn.values()),
    };
}

/**
 * Sequential-ish invoice number: SRI/<FY>/<short order id>. Derived from the
 * order id so it is stable and never collides.
 */
export function invoiceNumber(orderId: string, date = new Date()): string {
    const year = date.getMonth() + 1 >= 4 ? date.getFullYear() : date.getFullYear() - 1;
    const fy = `${String(year).slice(-2)}${String(year + 1).slice(-2)}`;
    return `SRI/${fy}/${orderId.replace(/^SR-/i, "")}`;
}
