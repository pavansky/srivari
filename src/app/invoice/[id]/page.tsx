import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { classify, computeGst, invoiceNumber, type GstSummary } from "@/lib/gst";
import { SELLER, isGstEnabled } from "@/config/commerce";
import ZariDivider from "@/components/ui/ZariDivider";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

/**
 * Printable GST tax invoice for a single order.
 *
 * Reachable by order id alone (ids are unguessable and the page is noindex) so
 * a customer can be sent their own invoice link — which is exactly why nothing
 * internal (cost price, supplier, warehouse bin) is ever read here.
 *
 * The GST snapshot stored on the order wins when present; older orders are
 * recomputed on the fly with the same function that produced those snapshots,
 * so every invoice ever issued still renders.
 */

/* ------------------------------------------------------------------ data -- */

/** Columns that pre-date the GST/fulfilment migration — always safe to select. */
const LEGACY_ORDER_SELECT = {
    id: true,
    customer: true,
    items: true,
    amount: true,
    shipping_cost: true,
    total: true,
    status: true,
    payment_method: true,
    createdAt: true,
} as const;

async function loadOrder(id: string): Promise<any | null> {
    try {
        return await prisma.order.findUnique({ where: { id } });
    } catch (e) {
        console.warn("Invoice: order read fell back to legacy columns (GST migration pending?):", e);
        try {
            return await prisma.order.findUnique({ where: { id }, select: LEGACY_ORDER_SELECT as any });
        } catch (e2) {
            console.error("Invoice: order read failed:", e2);
            return null;
        }
    }
}

type ProductRow = { id: string; name: string; category: string | null; hsnCode?: string | null; gstRate?: number | null };

/** Only the fields the invoice needs — never cost, supplier or bin. */
async function loadProducts(ids: string[]): Promise<Map<string, ProductRow>> {
    if (!ids.length) return new Map();
    const base = { id: true, name: true, category: true };
    try {
        const rows = await prisma.product.findMany({
            where: { id: { in: ids } },
            select: { ...base, hsnCode: true, gstRate: true } as any,
        });
        return new Map(rows.map((p: any) => [p.id, p as ProductRow]));
    } catch (e) {
        console.warn("Invoice: product read fell back to legacy columns (HSN missing?):", e);
        try {
            const rows = await prisma.product.findMany({ where: { id: { in: ids } }, select: base });
            return new Map(rows.map((p: any) => [p.id, p as ProductRow]));
        } catch (e2) {
            console.warn("Invoice: product read failed — classifying by item name:", e2);
            return new Map();
        }
    }
}

/* --------------------------------------------------------------- helpers -- */

const ONES = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function underHundred(n: number): string {
    if (n < 20) return ONES[n];
    return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`;
}

function underThousand(n: number): string {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    return [hundreds ? `${ONES[hundreds]} Hundred` : "", rest ? underHundred(rest) : ""].filter(Boolean).join(" ");
}

/** Indian numbering: crore / lakh / thousand. */
function inWords(value: number): string {
    let n = Math.floor(Math.abs(value));
    if (n === 0) return "Zero";
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;

    const parts: string[] = [];
    if (crore) parts.push(`${inWords(crore)} Crore`);
    if (lakh) parts.push(`${underHundred(lakh)} Lakh`);
    if (thousand) parts.push(`${underHundred(thousand)} Thousand`);
    if (n) parts.push(underThousand(n));
    return parts.join(" ");
}

function amountInWords(total: number): string {
    const rupees = Math.floor(total);
    const paise = Math.round((total - rupees) * 100);
    const head = `Rupees ${inWords(rupees)}`;
    return paise > 0 ? `${head} and ${underHundred(paise)} Paise Only` : `${head} Only`;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Whole rupees stay clean (₹24,400); anything with paise shows both (₹23,238.10). */
const money = (n: number) => {
    const value = round2(n);
    const fractional = Math.abs(value % 1) > 0;
    return `₹${value.toLocaleString("en-IN", {
        minimumFractionDigits: fractional ? 2 : 0,
        maximumFractionDigits: 2,
    })}`;
};
const decimal = (n: number) =>
    round2(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * The invoice lives inside the storefront layout (navbar, floating widgets), so
 * printing isolates the sheet by hiding everything and re-showing only this
 * subtree — depth-independent, unlike a `body > *` selector.
 */
const PRINT_CSS = `
@page { size: A4; margin: 14mm; }
@media print {
  html, body { background: #fff !important; }
  body { visibility: hidden !important; }
  .invoice-root, .invoice-root * { visibility: visible !important; }
  .invoice-root {
    position: absolute !important;
    inset: 0 auto auto 0 !important;
    width: 100% !important;
    background: #fff !important;
  }
  .no-print { display: none !important; }
  .invoice-sheet {
    margin: 0 !important;
    max-width: none !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    background: #fff !important;
  }
  a { color: inherit !important; text-decoration: none !important; }
  thead { display: table-header-group; }
  tr, td, th, .avoid-break { page-break-inside: avoid; break-inside: avoid; }
}
`;

/* ------------------------------------------------------------------ page -- */

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    return {
        title: `Invoice ${decodeURIComponent(id)} · ${SELLER.legalName}`,
        // Order ids are unguessable, but the invoice must never be crawlable.
        robots: { index: false, follow: false },
    };
}

const Micro = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <span className={`block font-sans text-[9px] uppercase tracking-[0.3em] text-neutral-400 ${className}`}>{children}</span>
);

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const order = await loadOrder(decodeURIComponent(id).trim());
    if (!order) notFound();

    const customer = (order.customer as any) || {};
    const items: any[] = Array.isArray(order.items) ? order.items : [];
    const issuedOn: Date = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt || Date.now());

    const products = await loadProducts(
        Array.from(new Set(items.map(i => String(i?.productId || "")).filter(Boolean)))
    );

    const shipping = Number(order.shipping_cost) || 0;
    const grandTotal = Number(order.total) || 0;
    const coupon = customer?.coupon as { code?: string; discount?: number } | undefined;
    const discount = Math.max(0, Number(coupon?.discount) || 0);

    const placeOfSupply =
        String(order.place_of_supply || customer?.state || "").trim() || SELLER.state;

    const gstItems = items.map(item => {
        const product = products.get(String(item?.productId || ""));
        return {
            price: Number(item?.price) || 0,
            quantity: Math.max(1, Math.round(Number(item?.quantity) || 1)),
            category: product?.category,
            name: String(item?.productName || product?.name || "Saree"),
            // A finishing service line (fall & pico, blouse stitching) has no
            // product row — its HSN was snapshotted onto the line at order time.
            hsnCode: (item as any)?.hsnCode ?? product?.hsnCode,
            gstRate: (item as any)?.gstRate ?? product?.gstRate,
        };
    });

    const computed = computeGst(gstItems, placeOfSupply, discount);

    // The stored snapshot is authoritative for an invoice already issued (rates
    // change; a reprint must not). Line detail is always derived — it uses the
    // identical extraction maths, so the column still foots to these totals.
    const breakup = (order.gst_breakup as any) || null;
    const hasSnapshot = order.gst_amount != null && Number.isFinite(Number(order.gst_amount));
    const gst: GstSummary = hasSnapshot
        ? {
              ...computed,
              taxable: Number(order.taxable_amount ?? computed.taxable),
              gstAmount: Number(order.gst_amount),
              rate: Number(breakup?.rate ?? computed.rate),
              cgst: Number(breakup?.cgst ?? computed.cgst),
              sgst: Number(breakup?.sgst ?? computed.sgst),
              igst: Number(breakup?.igst ?? computed.igst),
              placeOfSupply,
          }
        : computed;

    const taxed = gst.enabled && gst.gstAmount > 0;
    const isTaxInvoice = taxed && !!SELLER.gstin && isGstEnabled();

    // Discount is spread proportionally across lines, exactly as computeGst does.
    const gross = gstItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const factor = discount > 0 && discount < gross ? (gross - discount) / gross : 1;

    const rows = gstItems.map(item => {
        const { hsn, rate } = classify(item);
        const lineGross = item.price * item.quantity * factor;
        const taxable = taxed ? lineGross / (1 + rate / 100) : lineGross;
        return {
            name: item.name,
            hsn,
            rate: taxed ? rate : 0,
            quantity: item.quantity,
            unitTaxable: taxable / item.quantity,
            taxable,
            gst: lineGross - taxable,
            lineTotal: lineGross,
        };
    });

    const invoiceNo = String(order.invoice_number || invoiceNumber(String(order.id), issuedOn));
    const deliveryMethod = String(order.delivery_method || "Courier");
    // Older orders keep the whole address in one string; newer ones add
    // city/state/pincode alongside it. Only append what isn't already there.
    const flatAddress = String(customer?.address || "").trim();
    const addressLines = [
        flatAddress,
        ...[customer?.city, customer?.state, customer?.pincode]
            .map(v => (v == null ? "" : String(v).trim()))
            .filter(v => v && !flatAddress.toLowerCase().includes(v.toLowerCase())),
    ].filter(Boolean);

    return (
        <main className="invoice-root min-h-screen bg-[#F9F5F0] text-[#1A1A1A] font-sans print:bg-white">
            <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

            {/* Toolbar — screen only */}
            <div className="no-print border-b border-black/10 bg-[#FDFBF7]">
                {/* Top padding clears the storefront's fixed navbar, which slides
                    back in on scroll-up over every page. */}
                <div className="max-w-[880px] mx-auto px-6 pt-28 pb-6 flex flex-wrap items-center justify-between gap-4">
                    <Link
                        href="/"
                        className="font-serif text-lg tracking-[0.2em] text-[#4A0404] uppercase"
                    >
                        {SELLER.legalName}
                    </Link>
                    <PrintButton />
                </div>
            </div>

            <article className="invoice-sheet max-w-[880px] mx-auto my-10 px-7 sm:px-12 py-12 bg-[#FDFBF7] border border-black/10 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.4)]">
                {/* Masthead */}
                <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
                    <div className="max-w-sm">
                        <Micro>{isTaxInvoice ? "Tax Invoice" : "Receipt"}</Micro>
                        <h1 className="font-serif text-3xl md:text-4xl leading-tight mt-3 text-[#1A1A1A]">
                            {SELLER.legalName}
                        </h1>
                        <address className="not-italic text-xs leading-relaxed text-neutral-500 mt-3">
                            {SELLER.address.line1}
                            {SELLER.address.line2 ? <><br />{SELLER.address.line2}</> : null}
                            <br />
                            {SELLER.address.city}, {SELLER.address.state} {SELLER.address.pincode}
                            <br />
                            {SELLER.address.phone}
                        </address>
                        <p className="text-[11px] tracking-[0.15em] uppercase text-neutral-500 mt-3">
                            GSTIN: <span className="text-[#4A0404] font-medium">{SELLER.gstin || "—"}</span>
                        </p>
                    </div>

                    <dl className="md:text-right space-y-3 shrink-0">
                        <div>
                            <Micro className="md:text-right">Invoice No.</Micro>
                            <dd className="font-serif text-lg text-[#4A0404] mt-1">{invoiceNo}</dd>
                        </div>
                        <div>
                            <Micro className="md:text-right">Invoice Date</Micro>
                            <dd className="text-sm text-neutral-700 mt-1">
                                {issuedOn.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
                            </dd>
                        </div>
                        <div>
                            <Micro className="md:text-right">Order</Micro>
                            <dd className="text-sm text-neutral-700 mt-1 font-mono">{order.id}</dd>
                        </div>
                    </dl>
                </header>

                <ZariDivider tone="light" className="my-10" />

                {/* Parties */}
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-8 avoid-break">
                    <div className="sm:col-span-2">
                        <Micro>Bill To</Micro>
                        <p className="font-serif text-xl mt-2 text-[#1A1A1A]">{customer?.name || "Customer"}</p>
                        {addressLines.length > 0 && (
                            <p className="text-xs leading-relaxed text-neutral-500 mt-2 max-w-sm">
                                {addressLines.join(", ")}
                            </p>
                        )}
                        <p className="text-xs text-neutral-500 mt-2">
                            {[customer?.phone, customer?.email].filter(Boolean).join(" · ")}
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <Micro>Place of Supply</Micro>
                            <p className="text-sm text-neutral-700 mt-1">{gst.placeOfSupply || placeOfSupply}</p>
                        </div>
                        <div>
                            <Micro>Payment</Micro>
                            <p className="text-sm text-neutral-700 mt-1">
                                {String(order.payment_method || "Razorpay")}
                                {deliveryMethod !== "Courier" ? ` · ${deliveryMethod === "Pickup" ? "Boutique Pickup" : "Local Delivery"}` : ""}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Lines */}
                <section className="mt-10 overflow-x-auto">
                    <table className="w-full min-w-[620px] border-collapse text-sm">
                        <thead>
                            <tr className="border-y border-black/15">
                                <th className="py-3 pr-3 text-left font-sans text-[9px] uppercase tracking-[0.25em] text-neutral-400 font-normal">Description</th>
                                <th className="py-3 px-3 text-left font-sans text-[9px] uppercase tracking-[0.25em] text-neutral-400 font-normal">HSN</th>
                                <th className="py-3 px-3 text-right font-sans text-[9px] uppercase tracking-[0.25em] text-neutral-400 font-normal">Qty</th>
                                <th className="py-3 px-3 text-right font-sans text-[9px] uppercase tracking-[0.25em] text-neutral-400 font-normal">Rate</th>
                                <th className="py-3 px-3 text-right font-sans text-[9px] uppercase tracking-[0.25em] text-neutral-400 font-normal">Taxable</th>
                                <th className="py-3 px-3 text-right font-sans text-[9px] uppercase tracking-[0.25em] text-neutral-400 font-normal">GST</th>
                                <th className="py-3 pl-3 text-right font-sans text-[9px] uppercase tracking-[0.25em] text-neutral-400 font-normal">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, i) => (
                                <tr key={`${row.name}-${i}`} className="border-b border-black/[0.07] align-top">
                                    <td className="py-4 pr-3 font-serif text-[15px] text-[#1A1A1A]">{row.name}</td>
                                    <td className="py-4 px-3 text-xs text-neutral-500 font-mono">{row.hsn}</td>
                                    <td className="py-4 px-3 text-right text-neutral-600">{row.quantity}</td>
                                    <td className="py-4 px-3 text-right font-serif text-neutral-700">{decimal(row.unitTaxable)}</td>
                                    <td className="py-4 px-3 text-right font-serif text-neutral-700">{decimal(row.taxable)}</td>
                                    <td className="py-4 px-3 text-right font-serif text-neutral-700">
                                        {taxed ? (
                                            <>
                                                {decimal(row.gst)}
                                                <span className="block font-sans text-[9px] tracking-[0.2em] text-neutral-400 mt-0.5">
                                                    @{row.rate}%
                                                </span>
                                            </>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                    <td className="py-4 pl-3 text-right font-serif text-[15px] text-[#1A1A1A]">{money(row.lineTotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* Totals */}
                <section className="mt-8 flex justify-end avoid-break">
                    <dl className="w-full sm:w-80 space-y-2.5 text-sm">
                        {discount > 0 && (
                            <div className="flex justify-between text-neutral-500">
                                <dt>Discount{coupon?.code ? ` · ${coupon.code}` : ""}</dt>
                                <dd className="font-serif">−{money(discount)}</dd>
                            </div>
                        )}
                        <div className="flex justify-between text-neutral-500">
                            <dt>Taxable Value</dt>
                            <dd className="font-serif">{money(gst.taxable)}</dd>
                        </div>
                        {taxed && gst.isIntraState && (
                            <>
                                <div className="flex justify-between text-neutral-500">
                                    <dt>CGST @ {decimal(gst.rate / 2)}%</dt>
                                    <dd className="font-serif">{money(gst.cgst)}</dd>
                                </div>
                                <div className="flex justify-between text-neutral-500">
                                    <dt>SGST @ {decimal(gst.rate / 2)}%</dt>
                                    <dd className="font-serif">{money(gst.sgst)}</dd>
                                </div>
                            </>
                        )}
                        {taxed && !gst.isIntraState && (
                            <div className="flex justify-between text-neutral-500">
                                <dt>IGST @ {decimal(gst.rate)}%</dt>
                                <dd className="font-serif">{money(gst.igst)}</dd>
                            </div>
                        )}
                        <div className="flex justify-between text-neutral-500">
                            <dt>Shipping</dt>
                            <dd className="font-serif">{shipping > 0 ? money(shipping) : "Complimentary"}</dd>
                        </div>
                        <div className="flex justify-between items-baseline border-t border-black/15 pt-3 mt-1">
                            <dt className="font-sans text-[9px] uppercase tracking-[0.3em] text-neutral-400">Grand Total</dt>
                            <dd className="font-serif text-2xl text-[#4A0404]">{money(grandTotal)}</dd>
                        </div>
                    </dl>
                </section>

                <p className="mt-6 text-xs text-neutral-500 leading-relaxed avoid-break">
                    <span className="font-sans text-[9px] uppercase tracking-[0.3em] text-neutral-400 mr-2">In Words</span>
                    <span className="font-serif text-[13px] text-[#1A1A1A]">{amountInWords(grandTotal)}</span>
                </p>

                <ZariDivider tone="light" className="my-10" />

                {/* Footer */}
                <footer className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 avoid-break">
                    <div className="max-w-md space-y-2">
                        {!isTaxInvoice && (
                            <p className="text-[11px] leading-relaxed text-neutral-500">
                                {SELLER.gstin
                                    ? "GST is not applied to this order — this document is issued as a receipt of payment, not a tax invoice."
                                    : "GST registration is pending, so this document is issued as a receipt of payment rather than a tax invoice."}
                            </p>
                        )}
                        {taxed && (
                            <p className="text-[11px] leading-relaxed text-neutral-500">
                                All prices are inclusive of GST. Tax shown above is contained within the amount charged.
                            </p>
                        )}
                        <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-400 pt-1">
                            This is a computer-generated invoice.
                        </p>
                    </div>
                    <p className="font-serif italic text-sm text-[#4A0404] sm:text-right shrink-0">
                        For {SELLER.legalName}
                        <span className="block font-sans not-italic text-[9px] uppercase tracking-[0.3em] text-neutral-400 mt-6">
                            Authorised Signatory
                        </span>
                    </p>
                </footer>
            </article>
        </main>
    );
}
