/**
 * Saree finishing add-ons — and the delivery-date promise they push out.
 *
 * An Indian saree is sold unstitched. Before it can be worn it needs the raw
 * edge finished (fall & pico), a blouse cut to the wearer's measurements and,
 * very often, a matching petticoat. Selling the drape without offering those is
 * the single biggest gap between a website and a real saree shop, so they are
 * modelled here as priced, tax-classified add-on lines.
 *
 * Two rules this file exists to keep:
 *
 *  1. **One source of truth for the price.** The storefront quotes from
 *     getAddOns() and /api/orders/create re-derives from the same function, so
 *     the customer can never be charged something other than what was shown.
 *     That is also why every override is a `NEXT_PUBLIC_*` variable: a
 *     server-only variable is `undefined` in the browser bundle, which would
 *     silently split the quoted price from the charged one.
 *
 *  2. **Stitching is a service, not cloth.** It carries its own HSN (9988 —
 *     job work on textiles) rather than the saree's 5007, so lib/gst.ts
 *     classifies it correctly on the tax invoice. A petticoat is a finished
 *     garment (6208). Both sit at 5%, and — like every price on this site —
 *     the amounts below are GST-INCLUSIVE.
 */

export interface AddOn {
    code: string;
    label: string;
    description: string;
    /** Integer rupees, GST-inclusive, charged per saree (× line quantity). */
    price: number;
    /** Working days this adds to the delivery promise. Negative = saved. */
    addsDays: number;
    hsn?: string;
    gstRate?: number;
}

/* ------------------------------------------------------------------ *
 * Env plumbing
 * ------------------------------------------------------------------ */

/** Integer rupees, never negative — a malformed env var falls back silently. */
function rupees(raw: string | undefined, fallback: number): number {
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
}

function days(raw: string | undefined, fallback: number): number {
    const n = Number(raw);
    return Number.isFinite(n) ? Math.round(n) : fallback;
}

function enabled(raw: string | undefined): boolean {
    return (raw ?? "true").toLowerCase() !== "false";
}

/** Job work on textiles — stitching and finishing services. */
export const SERVICE_HSN = "9988";
export const SERVICE_GST_RATE = 5;
/** Petticoats and similar undergarments (5% below ₹1,000). */
export const GARMENT_HSN = "6208";
export const GARMENT_GST_RATE = 5;

export const FALL_PICO_CODE = "fall_pico";
export const BLOUSE_CODE = "blouse_stitch";
export const PETTICOAT_CODE = "petticoat";
export const EXPRESS_CODE = "express";

/** Add-ons that put the piece on a tailor's table — the ones express can rush. */
export const STITCHING_CODES: readonly string[] = [FALL_PICO_CODE, BLOUSE_CODE];

/** Defensive bound so a crafted payload can't blow up the order items JSON. */
export const MAX_ADDON_CODES = 8;

/* ------------------------------------------------------------------ *
 * The catalogue
 * ------------------------------------------------------------------ */

const CATALOGUE: (AddOn & { enabled: boolean })[] = [
    {
        code: FALL_PICO_CODE,
        label: "Fall & Pico stitching",
        description:
            "The border is edged and a matching fall hand-stitched inside the pleats — so the drape falls the way it was woven to.",
        price: rupees(process.env.NEXT_PUBLIC_ADDON_FALL_PICO_PRICE, 199),
        addsDays: days(process.env.NEXT_PUBLIC_ADDON_FALL_PICO_DAYS, 2),
        hsn: SERVICE_HSN,
        gstRate: SERVICE_GST_RATE,
        enabled: enabled(process.env.NEXT_PUBLIC_ADDON_FALL_PICO_ENABLED),
    },
    {
        code: BLOUSE_CODE,
        label: "Blouse stitching (to your measurements)",
        description:
            "Our tailor cuts the blouse piece to the measurements you give us, lined and finished by hand.",
        price: rupees(process.env.NEXT_PUBLIC_ADDON_BLOUSE_PRICE, 899),
        addsDays: days(process.env.NEXT_PUBLIC_ADDON_BLOUSE_DAYS, 5),
        hsn: SERVICE_HSN,
        gstRate: SERVICE_GST_RATE,
        enabled: enabled(process.env.NEXT_PUBLIC_ADDON_BLOUSE_ENABLED),
    },
    {
        code: PETTICOAT_CODE,
        label: "Matching cotton petticoat",
        description:
            "A soft cotton petticoat dyed to sit with this saree, with a drawstring waist.",
        price: rupees(process.env.NEXT_PUBLIC_ADDON_PETTICOAT_PRICE, 499),
        addsDays: days(process.env.NEXT_PUBLIC_ADDON_PETTICOAT_DAYS, 1),
        hsn: GARMENT_HSN,
        gstRate: GARMENT_GST_RATE,
        enabled: enabled(process.env.NEXT_PUBLIC_ADDON_PETTICOAT_ENABLED),
    },
    {
        code: EXPRESS_CODE,
        label: "Priority stitching",
        description:
            "Your piece moves to the front of the tailor's queue — chosen alongside any stitching above.",
        price: rupees(process.env.NEXT_PUBLIC_ADDON_EXPRESS_PRICE, 299),
        addsDays: days(process.env.NEXT_PUBLIC_ADDON_EXPRESS_DAYS, -2),
        hsn: SERVICE_HSN,
        gstRate: SERVICE_GST_RATE,
        enabled: enabled(process.env.NEXT_PUBLIC_ADDON_EXPRESS_ENABLED),
    },
];

/** Short names for the running "Your piece: saree + fall & pico" summary. */
const SHORT_LABEL: Record<string, string> = {
    [FALL_PICO_CODE]: "fall & pico",
    [BLOUSE_CODE]: "blouse",
    [PETTICOAT_CODE]: "petticoat",
    [EXPRESS_CODE]: "priority",
};

/** Every add-on currently on offer, in the order they should be presented. */
export function getAddOns(): AddOn[] {
    return CATALOGUE.filter(a => a.enabled).map(({ enabled: _enabled, ...addOn }) => addOn);
}

export function findAddOn(code: string): AddOn | undefined {
    if (!code || typeof code !== "string") return undefined;
    return getAddOns().find(a => a.code === code);
}

/** Whether "Priority stitching" may be offered for the given selection. */
export function isExpressEligible(codes: readonly string[]): boolean {
    return codes.some(code => STITCHING_CODES.includes(code));
}

/**
 * Canonical form of a client-supplied selection: known codes only, de-duplicated,
 * in catalogue order, with express dropped unless something is actually being
 * stitched. Both the storefront and the order route run every selection through
 * this, so the two can never disagree about what was bought.
 */
export function normalizeAddOnCodes(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    const wanted = new Set(
        raw.slice(0, MAX_ADDON_CODES).filter((c): c is string => typeof c === "string")
    );
    const picked = getAddOns().filter(a => wanted.has(a.code)).map(a => a.code);
    return isExpressEligible(picked) ? picked : picked.filter(c => c !== EXPRESS_CODE);
}

/** Add-on cost for ONE saree, in integer rupees. */
export function addOnsTotal(codes: readonly string[]): number {
    return codes.reduce((sum, code) => sum + (findAddOn(code)?.price ?? 0), 0);
}

/** Working days the selection adds to the delivery promise (never negative). */
export function addOnsExtraDays(codes: readonly string[]): number {
    const total = codes.reduce((sum, code) => sum + (findAddOn(code)?.addsDays ?? 0), 0);
    return Math.max(0, total);
}

/** "saree + fall & pico + blouse" — the running summary line. */
export function selectionSummary(codes: readonly string[]): string {
    const parts = codes.map(code => SHORT_LABEL[code] || findAddOn(code)?.label || code);
    return ["saree", ...parts].join(" + ");
}

/* ------------------------------------------------------------------ *
 * Blouse measurements
 * ------------------------------------------------------------------ */

export interface MeasurementField {
    key: string;
    label: string;
    /** Inches. Values outside the range are clamped, never rejected. */
    min: number;
    max: number;
    placeholder?: string;
}

export const BLOUSE_MEASUREMENTS: MeasurementField[] = [
    { key: "bust", label: "Bust", min: 26, max: 56, placeholder: "36" },
    { key: "waist", label: "Waist", min: 22, max: 54, placeholder: "32" },
    { key: "shoulder", label: "Shoulder", min: 10, max: 22, placeholder: "14" },
    { key: "sleeve", label: "Sleeve length", min: 2, max: 26, placeholder: "6" },
    { key: "blouseLength", label: "Blouse length", min: 10, max: 30, placeholder: "15" },
];

export const MEASUREMENT_NOTES_KEY = "notes";
export const MEASUREMENT_NOTES_MAX = 200;

/** Half-inch precision is what a tailor actually works to. */
function toHalfInch(value: number): number {
    return Math.round(value * 2) / 2;
}

/**
 * Keeps only the known fields, clamps each to a sane human range and trims the
 * free-text note. Anything unrecognised is dropped — this is the only path by
 * which customer text reaches the order JSON.
 */
export function sanitizeMeasurements(raw: unknown): Record<string, string> {
    if (!raw || typeof raw !== "object") return {};
    const input = raw as Record<string, unknown>;
    const out: Record<string, string> = {};

    for (const field of BLOUSE_MEASUREMENTS) {
        const value = Number(String(input[field.key] ?? "").trim());
        if (!Number.isFinite(value) || value <= 0) continue;
        out[field.key] = String(toHalfInch(Math.min(Math.max(value, field.min), field.max)));
    }

    const note = String(input[MEASUREMENT_NOTES_KEY] ?? "")
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, MEASUREMENT_NOTES_MAX);
    if (note) out[MEASUREMENT_NOTES_KEY] = note;

    return out;
}

/** Fields still to be filled in — drives the storefront's gentle nudge. */
export function missingMeasurements(values: Record<string, string> | undefined): MeasurementField[] {
    const filled = values || {};
    return BLOUSE_MEASUREMENTS.filter(f => !String(filled[f.key] ?? "").trim());
}

/** "Bust 36in · Waist 32in · …" for the invoice, admin and confirmation email. */
export function formatMeasurements(values: Record<string, string> | undefined): string {
    if (!values) return "";
    const parts = BLOUSE_MEASUREMENTS
        .filter(f => values[f.key])
        .map(f => `${f.label} ${values[f.key]}in`);
    if (values[MEASUREMENT_NOTES_KEY]) parts.push(values[MEASUREMENT_NOTES_KEY]);
    return parts.join(" · ");
}

/* ------------------------------------------------------------------ *
 * The delivery promise
 * ------------------------------------------------------------------ *
 *
 * "3-5 Business Days" means nothing to someone buying for a wedding on the
 * 14th. These helpers turn a courier ETA plus any stitching time into an actual
 * date the customer can plan around. Pure functions — no clock of their own
 * beyond the `now` you hand them.
 */

/** IST has no DST, so a fixed shift is exact. Read the result with getUTC*. */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Orders confirmed after this hour (IST) are dispatched the next working day. */
export const DISPATCH_CUTOFF_HOUR = (() => {
    const n = Number(process.env.NEXT_PUBLIC_DISPATCH_CUTOFF_HOUR);
    return Number.isFinite(n) && n >= 0 && n <= 23 ? Math.floor(n) : 15;
})();

/** Working days spent packing before the courier clock starts. */
export const DISPATCH_LEAD_DAYS = days(process.env.NEXT_PUBLIC_DISPATCH_LEAD_DAYS, 0);

/** Used when the courier gives us nothing readable. Flagged as "Estimated". */
export const FALLBACK_ETA_DAYS = { min: 3, max: 5 };

export interface EtaDays {
    min: number;
    max: number;
}

/**
 * Reads a courier ETA string ("3-5 Business Days", "Same or next day",
 * "Ready within 4 hours") into a day range. Returns null when it can't be read,
 * which is what makes the difference between "Delivered by" and "Estimated".
 */
export function parseEtaDays(eta?: string | null): EtaDays | null {
    const text = String(eta ?? "").toLowerCase().trim();
    if (!text) return null;

    const range = text.match(/(\d+)\s*(?:-|–|—|to)\s*(\d+)\s*(?:business\s*|working\s*)?days?/);
    if (range) {
        const a = Number(range[1]);
        const b = Number(range[2]);
        return { min: Math.min(a, b), max: Math.max(a, b) };
    }

    const weeks = text.match(/(\d+)\s*weeks?/);
    if (weeks) {
        const n = Number(weeks[1]) * 7;
        return { min: n, max: n };
    }

    const single = text.match(/(\d+)\s*(?:business\s*|working\s*)?days?/);
    if (single) {
        const n = Number(single[1]);
        return { min: n, max: n };
    }

    // "Same or next day, by our own team" / "Ready within 4 hours"
    if (/same\s*(?:day|or\s*next|and\s*next)/.test(text)) {
        return { min: 0, max: /next\s*day/.test(text) ? 1 : 0 };
    }
    if (/next\s*day|tomorrow/.test(text)) return { min: 1, max: 1 };
    if (/\d+\s*hours?|today/.test(text)) return { min: 0, max: 0 };

    return null;
}

/** A Date shifted into IST — read it with the getUTC* accessors. */
function toIst(date: Date): Date {
    return new Date(date.getTime() + IST_OFFSET_MS);
}

/**
 * Advances by whole working days, skipping Sundays (the one day nothing moves).
 * Also never *lands* on a Sunday, so a 0-day promise made on a Saturday evening
 * reads as Monday rather than a day nobody delivers.
 */
function addWorkingDays(start: Date, count: number): Date {
    const d = new Date(start.getTime());
    let left = Math.max(0, Math.round(count));
    while (left > 0) {
        d.setUTCDate(d.getUTCDate() + 1);
        if (d.getUTCDay() !== 0) left -= 1;
    }
    while (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1);
    return d;
}

/** "Tue, 12 Aug" — built by hand so server and browser always agree. */
function dayLabel(istDate: Date): string {
    return `${WEEKDAY[istDate.getUTCDay()]}, ${istDate.getUTCDate()} ${MONTH[istDate.getUTCMonth()]}`;
}

function sameDay(a: Date, b: Date): boolean {
    return a.getUTCFullYear() === b.getUTCFullYear()
        && a.getUTCMonth() === b.getUTCMonth()
        && a.getUTCDate() === b.getUTCDate();
}

export interface DeliveryPromise {
    /** "Tue, 12 Aug" for a single day, "12–14 Aug" for a range. */
    label: string;
    fromLabel: string;
    toLabel: string;
    /** "Delivered by" when the courier gave a real ETA, else "Estimated delivery". */
    lead: string;
    /** The whole line, ready to render: "Delivered by Tue, 12 Aug". */
    text: string;
    /** True when no usable ETA was given and FALLBACK_ETA_DAYS was assumed. */
    estimated: boolean;
    minDays: number;
    maxDays: number;
}

export interface DeliveryPromiseInput {
    /** The courier's ETA string, exactly as quoted. */
    eta?: string | null;
    /** Working days added by stitching add-ons (see addOnsExtraDays). */
    extraDays?: number;
    /** Injectable clock — pass one in tests. */
    now?: Date;
    cutoffHour?: number;
    /** Overrides the "Delivered by" / "Estimated delivery" prefix. */
    lead?: string;
    /** Treat the ETA as unreliable even if it parsed (e.g. a mocked rate). */
    assumed?: boolean;
}

/**
 * Turns an ETA into a date the customer can hold us to.
 *
 * Honest by construction: if the courier ETA could not be read we fall back to
 * 3–5 days AND say "Estimated", rather than inventing a confident date.
 */
export function deliveryPromise(input: DeliveryPromiseInput = {}): DeliveryPromise {
    const now = input.now ?? new Date();
    const cutoff = input.cutoffHour ?? DISPATCH_CUTOFF_HOUR;
    const parsed = parseEtaDays(input.eta);
    const estimated = !parsed || !!input.assumed;
    const range = parsed ?? FALLBACK_ETA_DAYS;

    const extra = Math.max(0, Math.round(input.extraDays ?? 0));

    // Dispatch day: today if we are still inside the cutoff, else the next
    // working day — then any packing lead time on top.
    const istNow = toIst(now);
    const missedCutoff = istNow.getUTCHours() >= cutoff;
    const dispatch = addWorkingDays(istNow, (missedCutoff ? 1 : 0) + Math.max(0, DISPATCH_LEAD_DAYS));

    const from = addWorkingDays(dispatch, range.min + extra);
    const to = addWorkingDays(dispatch, range.max + extra);

    const fromLabel = dayLabel(from);
    const toLabel = dayLabel(to);

    let label: string;
    if (sameDay(from, to)) {
        label = fromLabel;
    } else if (from.getUTCMonth() === to.getUTCMonth() && from.getUTCFullYear() === to.getUTCFullYear()) {
        label = `${from.getUTCDate()}–${to.getUTCDate()} ${MONTH[to.getUTCMonth()]}`;
    } else {
        label = `${from.getUTCDate()} ${MONTH[from.getUTCMonth()]} – ${to.getUTCDate()} ${MONTH[to.getUTCMonth()]}`;
    }

    const lead = input.lead ?? (estimated ? "Estimated delivery" : "Delivered by");

    return {
        label,
        fromLabel,
        toLabel,
        lead,
        text: `${lead} ${label}`,
        estimated,
        minDays: range.min + extra,
        maxDays: range.max + extra,
    };
}
