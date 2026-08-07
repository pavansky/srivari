import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { findAddOn, normalizeAddOnCodes } from '@/config/customization';
import { getShippingRate } from '@/lib/shiprocket';
import {
    DEFAULT_WEIGHT_KG,
    DeliveryMethod,
    LOCAL_DELIVERY,
    SELLER,
    STORE_PICKUP,
    isGstEnabled,
    isLocalPincode,
    localDeliveryFee,
} from '@/config/commerce';
import { computeGst } from '@/lib/gst';

/**
 * One quote endpoint for every delivery channel the boutique offers.
 *
 * POST { pincode, subtotal, weightKg?, discount?, state?, items? }
 *  -> { pincode, options: [Pickup?, Local?, Courier], gst }
 *
 * Public and rate-limited. It never fails because of an upstream courier: the
 * Shiprocket lookup already falls back to a mock rate, and anything unexpected
 * degrades that single option to `available: false` instead of 500-ing the
 * customer's checkout.
 */

const MAX_WEIGHT_KG = 50;
const MAX_ITEM_LINES = 50;

interface QuoteOption {
    method: DeliveryMethod;
    label: string;
    /** Rupees. 0 renders as "Complimentary" on the storefront. */
    fee: number;
    eta: string;
    available: boolean;
    /** Instructions when available, or the reason when it isn't. */
    note?: string;
    /** Boutique address, on the Pickup option only. */
    address?: string;
}

/** Item shape computeGst() needs, resolved from the DB — never from the client. */
interface TaxLine {
    price: number;
    quantity: number;
    category?: string | null;
    name?: string | null;
    hsnCode?: string | null;
    gstRate?: number | null;
}

const boutiqueAddress = [
    SELLER.address.line1,
    SELLER.address.line2,
    SELLER.address.city,
    `${SELLER.address.state} ${SELLER.address.pincode}`,
].filter(Boolean).join(', ');

/**
 * Loads the fields GST classification needs. `hsnCode`/`gstRate` are new columns
 * that may not exist in the database yet — fall back to the pre-migration set
 * (the category/name heuristics in classify() still produce the right HSN).
 */
async function loadTaxProducts(ids: string[]) {
    try {
        return await prisma.product.findMany({
            where: { id: { in: ids } },
            select: { id: true, name: true, price: true, category: true, hsnCode: true, gstRate: true } as any,
        }) as any[];
    } catch (e) {
        console.warn('Shipping quote: tax columns unavailable, using category defaults:', e);
        return await prisma.product.findMany({
            where: { id: { in: ids } },
            select: { id: true, name: true, price: true, category: true },
        }) as any[];
    }
}

/**
 * Turns the client's cart reference into DB-priced tax lines. Falls back to a
 * single synthetic line so the tax summary still renders when the cart can't be
 * resolved — the authoritative GST is always recomputed at order creation.
 */
async function resolveTaxLines(rawItems: unknown, subtotal: number): Promise<TaxLine[]> {
    const wanted = new Map<string, number>();
    // Finishing services (fall & pico, blouse stitching, petticoat) are taxed at
    // their own HSN, so the preview must include them or the quoted GST would
    // cover only the sarees. Prices come from config, never from the client.
    const addOnLines: TaxLine[] = [];
    if (Array.isArray(rawItems)) {
        for (const raw of rawItems.slice(0, MAX_ITEM_LINES)) {
            const item = raw as any;
            const id = item?.id || item?.productId;
            if (!id || typeof id !== 'string') continue;
            const quantity = Math.max(1, Math.min(Number(item?.quantity) || 1, 100));
            wanted.set(id, (wanted.get(id) || 0) + quantity);

            for (const code of normalizeAddOnCodes(item?.options)) {
                const addOn = findAddOn(code);
                if (!addOn) continue;
                addOnLines.push({
                    price: addOn.price,
                    quantity,
                    category: null,
                    name: addOn.label,
                    hsnCode: addOn.hsn ?? null,
                    gstRate: addOn.gstRate ?? null,
                });
            }
        }
    }

    if (wanted.size > 0) {
        try {
            const products = await loadTaxProducts(Array.from(wanted.keys()));
            const lines = products.map(p => ({
                price: Number(p.price) || 0,
                quantity: wanted.get(p.id) || 1,
                category: p.category,
                name: p.name,
                hsnCode: p.hsnCode ?? null,
                gstRate: p.gstRate ?? null,
            }));
            if (lines.length > 0) return [...lines, ...addOnLines];
        } catch (e) {
            console.warn('Shipping quote: product lookup for GST failed:', e);
        }
    }

    return [{ price: subtotal, quantity: 1, category: null, name: null, hsnCode: null, gstRate: null }];
    // (addOnLines are intentionally not appended to the flat fallback: without a
    // product lookup the subtotal already includes them.)
}

export async function POST(request: Request) {
    try {
        const ip = request.headers.get('x-forwarded-for') || 'anonymous';
        if (!rateLimit(`shipping-quote:${ip}`, 60).success) {
            return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
        }

        const body = await request.json().catch(() => ({} as any));

        const pincode = String(body?.pincode ?? '').trim();
        if (!/^\d{6}$/.test(pincode)) {
            return NextResponse.json(
                { success: false, message: 'A valid 6-digit pincode is required' },
                { status: 400 }
            );
        }

        const subtotal = Math.max(0, Math.min(Number(body?.subtotal) || 0, 100_000_000));
        const discount = Math.max(0, Math.min(Number(body?.discount) || 0, subtotal));
        const weightKg = Math.max(0.1, Math.min(Number(body?.weightKg) || DEFAULT_WEIGHT_KG, MAX_WEIGHT_KG));
        const customerState = typeof body?.state === 'string' ? body.state.trim().slice(0, 60) : '';

        const options: QuoteOption[] = [];

        // --- Collect from the boutique ---
        if (STORE_PICKUP.enabled) {
            options.push({
                method: 'Pickup',
                label: 'Collect from the boutique',
                fee: 0,
                eta: STORE_PICKUP.eta,
                available: true,
                note: STORE_PICKUP.instructions,
                address: boutiqueAddress,
            });
        }

        // --- Our own delivery team, around the boutique ---
        if (LOCAL_DELIVERY.enabled) {
            const available = isLocalPincode(pincode);
            const fee = localDeliveryFee(subtotal);
            options.push({
                method: 'Local',
                label: 'Local delivery by our team',
                fee,
                eta: LOCAL_DELIVERY.eta,
                available,
                note: available
                    ? (fee === 0
                        ? 'Complimentary on this order'
                        : `Complimentary above ₹${LOCAL_DELIVERY.freeAbove.toLocaleString('en-IN')}`)
                    : `Our own team delivers only around ${SELLER.address.city}`,
            });
        }

        // --- Courier (Shiprocket) ---
        let courierOption: QuoteOption = {
            method: 'Courier',
            label: 'Courier delivery',
            fee: 0,
            eta: '3-5 Business Days',
            available: false,
            note: 'Courier rates are unavailable right now',
        };
        try {
            const rate = await getShippingRate(SELLER.address.pincode, pincode, weightKg);
            if (rate) {
                const destination = [rate.city, rate.state]
                    .filter(v => v && !/^(unknown|local|regional)$/i.test(String(v)))
                    .join(', ');
                courierOption = {
                    method: 'Courier',
                    label: rate.courier_name || 'Courier delivery',
                    fee: Math.max(0, Math.ceil(Number(rate.rate) || 0)),
                    eta: rate.etd || '3-5 Business Days',
                    available: true,
                    note: destination ? `Insured and tracked to ${destination}` : 'Insured and tracked to your door',
                };
            }
        } catch (e) {
            // getShippingRate already falls back internally; this is belt-and-braces
            // so a courier outage can never block pickup / local delivery.
            console.warn('Shipping quote: courier rate lookup failed:', e);
        }
        options.push(courierOption);

        // --- GST (prices are GST-inclusive; tax is extracted, never added) ---
        let gst = {
            enabled: false,
            gross: subtotal,
            taxable: subtotal,
            gstAmount: 0,
            rate: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            isIntraState: false,
            placeOfSupply: customerState || SELLER.state,
        };
        if (isGstEnabled() && subtotal > 0) {
            try {
                const lines = await resolveTaxLines(body?.items, subtotal);
                const summary = computeGst(lines, customerState, discount);
                gst = {
                    enabled: summary.enabled,
                    gross: summary.gross,
                    taxable: summary.taxable,
                    gstAmount: summary.gstAmount,
                    rate: summary.rate,
                    cgst: summary.cgst,
                    sgst: summary.sgst,
                    igst: summary.igst,
                    isIntraState: summary.isIntraState,
                    placeOfSupply: summary.placeOfSupply,
                };
            } catch (e) {
                console.warn('Shipping quote: GST computation failed:', e);
            }
        }

        return NextResponse.json({ success: true, pincode, weightKg, options, gst });
    } catch (error) {
        console.error('Shipping quote failed:', error);
        return NextResponse.json(
            { success: false, message: 'Could not fetch delivery options' },
            { status: 500 }
        );
    }
}
