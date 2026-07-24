"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
    Check, ChevronDown, Download, ExternalLink, Mail, MapPin, MessageCircle,
    Phone, Plus, Search, ShoppingBag, Truck, X
} from "lucide-react";
import { Order } from "@/types";
import { useAdminData, formatINR, exportCSV } from "@/components/admin/AdminContext";
import { useToast } from "@/components/admin/Toast";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import {
    GlassCard, GlassInput, GlassSelect, FieldLabel, SectionHeading,
    GoldButton, GhostButton, EmptyState
} from "@/components/admin/ui";

const ORDER_STATUSES: Order["status"][] = ["Pending", "Placed", "Paid", "Shipped", "Delivered", "Cancelled"];
const NEEDS_ACTION: Order["status"][] = ["Pending", "Placed", "Paid"];
const PAGE_SIZE = 15;

type TabKey = "All" | "Needs" | "Shipped" | "Delivered" | "Cancelled";

const PAYMENT_STYLES: Record<string, string> = {
    Razorpay: "text-sky-400 border-sky-500/30 bg-sky-500/10",
    COD: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    WhatsApp: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    Manual: "text-violet-300 border-violet-500/30 bg-violet-500/10",
};

/* GhostButton visual language for elements that must be anchors (WhatsApp, mailto, tracking). */
const GHOST_ANCHOR =
    "px-4 py-2.5 rounded-xl text-xs font-semibold text-white/50 hover:text-white border border-white/10 hover:border-white/25 transition-all inline-flex items-center gap-2 hover:bg-white/[0.04]";

const formatOrderDate = (d: string) =>
    new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const tabFromStatusParam = (s: string | null): TabKey => {
    if (!s) return "All";
    if (NEEDS_ACTION.includes(s as Order["status"])) return "Needs";
    if (s === "Shipped" || s === "Delivered" || s === "Cancelled") return s;
    return "All";
};

/* --- Timeline strip: Confirmed → Shipped → Delivered (red X when cancelled) --- */

function Timeline({ status }: { status: Order["status"] }) {
    if (status === "Cancelled") {
        return (
            <div className="flex items-center gap-3 py-1">
                <div className="w-7 h-7 rounded-full border border-red-500/40 bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                    <X size={13} strokeWidth={3} />
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-red-500/40 to-transparent" />
                <span className="text-[10px] uppercase tracking-widest text-red-400 font-bold">Cancelled · Stock Restored</span>
            </div>
        );
    }
    if (status === "Pending") {
        // Razorpay order awaiting payment — nothing is confirmed yet
        return (
            <div className="flex items-center gap-3 py-1">
                <div className="w-7 h-7 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-amber-500/40 to-transparent" />
                <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">Awaiting Payment · Stock Not Reserved</span>
            </div>
        );
    }
    const steps = ["Confirmed", "Shipped", "Delivered"];
    const doneIndex = status === "Delivered" ? 2 : status === "Shipped" ? 1 : 0;
    return (
        <div className="flex items-center py-1">
            {steps.map((step, i) => (
                <div key={step} className={`flex items-center min-w-0 ${i < steps.length - 1 ? "flex-1" : ""}`}>
                    <div className="flex items-center gap-2 shrink-0">
                        <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                                i <= doneIndex
                                    ? "bg-gradient-to-br from-[#D4AF37] to-[#F2D06B] text-black shadow-[0_0_14px_rgba(212,175,55,0.35)]"
                                    : "border border-white/15"
                            }`}
                        >
                            {i <= doneIndex ? <Check size={13} strokeWidth={3} /> : <span className="w-1.5 h-1.5 rounded-full bg-white/20" />}
                        </div>
                        <span className={`text-[10px] uppercase tracking-widest font-bold hidden sm:inline ${i <= doneIndex ? "text-[#D4AF37]" : "text-white/25"}`}>
                            {step}
                        </span>
                    </div>
                    {i < steps.length - 1 && (
                        <div className={`flex-1 h-px mx-3 transition-colors duration-500 ${i < doneIndex ? "bg-[#D4AF37]/50" : "bg-white/10"}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

/* --- Single order card --- */

function OrderCard({ order, buyer }: { order: Order; buyer?: { count: number; total: number } }) {
    const { refresh } = useAdminData();
    const { toast } = useToast();
    const { confirm } = useConfirm();

    const [status, setStatus] = useState<Order["status"]>(order.status);
    const [showFulfilment, setShowFulfilment] = useState(false);
    const [savingTracking, setSavingTracking] = useState(false);
    const [fulfilment, setFulfilment] = useState({
        trackingNumber: order.trackingNumber || "",
        trackingUrl: order.trackingUrl || "",
        deliveryEta: order.deliveryEta || "",
    });

    useEffect(() => setStatus(order.status), [order.status]);
    useEffect(() => {
        setFulfilment({
            trackingNumber: order.trackingNumber || "",
            trackingUrl: order.trackingUrl || "",
            deliveryEta: order.deliveryEta || "",
        });
    }, [order.trackingNumber, order.trackingUrl, order.deliveryEta]);

    const items = order.items || [];
    const firstName = (order.customerName || "").trim().split(/\s+/)[0] || "there";
    const phoneDigits = (order.customerPhone || "").replace(/\D/g, "");
    const waHref = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(`Namaste ${firstName}, regarding your order ${order.id} at The Srivari — `)}`;

    const handleStatusChange = async (next: Order["status"]) => {
        if (next === status) return;
        if (next === "Cancelled") {
            const ok = await confirm({
                title: "Cancel this order?",
                message: `Order #${order.id} for ${order.customerName} will be marked Cancelled and any reserved stock will be restored to inventory automatically.`,
                confirmText: "Cancel Order",
                cancelText: "Keep Order",
                type: "danger",
            });
            if (!ok) return;
        }
        const prev = status;
        setStatus(next);
        try {
            const res = await fetch("/api/orders", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: order.id, status: next }),
            });
            if (!res.ok) {
                setStatus(prev);
                toast("error", res.status === 401 ? "Session expired — please log in again." : "Could not update order status.");
                await refresh();
                return;
            }
            toast("success", next === "Cancelled" ? `Order ${order.id} cancelled — stock restored.` : `Order ${order.id} marked ${next}.`);
            await refresh();
        } catch {
            setStatus(prev);
            toast("error", "Network error — status was not saved.");
            await refresh();
        }
    };

    const saveTracking = async () => {
        setSavingTracking(true);
        try {
            const res = await fetch("/api/orders", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: order.id,
                    trackingNumber: fulfilment.trackingNumber.trim(),
                    trackingUrl: fulfilment.trackingUrl.trim(),
                    deliveryEta: fulfilment.deliveryEta.trim(),
                }),
            });
            if (!res.ok) {
                toast("error", res.status === 401 ? "Session expired — please log in again." : "Could not save fulfilment details.");
                return;
            }
            toast("success", `Fulfilment details saved for ${order.id}.`);
            await refresh();
        } catch {
            toast("error", "Network error — fulfilment details not saved.");
        } finally {
            setSavingTracking(false);
        }
    };

    return (
        <GlassCard className="p-5 md:p-6">
            <div className="relative space-y-5">
                {/* Top row: identity + money/status */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-[#D4AF37] font-mono text-xs tracking-wider">#{order.id}</p>
                        <h3 className="font-serif text-xl text-white mt-1 truncate">{order.customerName}</h3>
                        <div className="flex items-center gap-2 flex-wrap mt-2">
                            <span className="inline-flex items-center gap-1.5 text-[11px] text-white/50 bg-white/[0.04] border border-white/10 px-2.5 py-1 rounded-full">
                                <Phone size={10} /> {order.customerPhone}
                            </span>
                            {buyer && buyer.count > 1 && (
                                <>
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-300 bg-violet-500/10 border border-violet-500/30 px-2.5 py-1 rounded-full">
                                        Repeat Buyer
                                    </span>
                                    <span className="text-[11px] text-violet-300/70">
                                        {buyer.count} orders · {formatINR(buyer.total)} lifetime
                                    </span>
                                </>
                            )}
                        </div>
                        <p className="text-[11px] text-white/30 mt-2">{formatOrderDate(order.date)}</p>
                    </div>
                    <div className="flex flex-row flex-wrap lg:flex-col items-center lg:items-end gap-3 shrink-0">
                        <p className="text-2xl font-bold text-white tracking-tight">{formatINR(order.totalAmount)}</p>
                        <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider ${PAYMENT_STYLES[order.paymentMethod || "Razorpay"] || "text-white/50 border-white/20 bg-white/5"}`}>
                            {order.paymentMethod || "Razorpay"}
                        </span>
                        <GlassSelect
                            wrapperClassName="w-full sm:w-44"
                            className="!py-2.5 !text-xs"
                            value={status}
                            onChange={e => handleStatusChange(e.target.value as Order["status"])}
                            aria-label={`Status for order ${order.id}`}
                        >
                            {ORDER_STATUSES.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </GlassSelect>
                    </div>
                </div>

                <Timeline status={status} />

                {/* Items + money breakdown */}
                <div className="bg-white/[0.02] rounded-xl p-4">
                    <div className="space-y-2">
                        {items.map((it, i) => (
                            <div key={`${it.productId}-${i}`} className="flex justify-between gap-4 text-sm">
                                <span className="text-white/70 truncate">
                                    {it.productName} <span className="text-white/35">×{it.quantity}</span>
                                </span>
                                <span className="text-white/80 shrink-0">{formatINR(it.price * it.quantity)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-white/[0.06] mt-3 pt-3 space-y-1.5 text-xs">
                        {order.amount != null && (
                            <div className="flex justify-between text-white/40">
                                <span>Subtotal</span>
                                <span>{formatINR(order.amount)}</span>
                            </div>
                        )}
                        {order.coupon && (
                            <div className="flex justify-between text-emerald-400">
                                <span>Coupon · {order.coupon.code}</span>
                                <span>−{formatINR(order.coupon.discount)}</span>
                            </div>
                        )}
                        {order.shippingCost != null && (
                            <div className="flex justify-between text-white/40">
                                <span>Shipping</span>
                                <span>{order.shippingCost > 0 ? formatINR(order.shippingCost) : "Free"}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm font-bold text-white pt-1">
                            <span>Total</span>
                            <span>{formatINR(order.totalAmount)}</span>
                        </div>
                    </div>
                </div>

                {order.customerAddress && (
                    <p className="flex items-center gap-2 text-xs text-white/40 min-w-0">
                        <MapPin size={12} className="text-[#D4AF37] shrink-0" />
                        <span className="truncate">{order.customerAddress}</span>
                    </p>
                )}

                {/* Fulfilment toggle + contact */}
                <div className="flex flex-wrap items-center gap-2">
                    <GhostButton onClick={() => setShowFulfilment(v => !v)} aria-expanded={showFulfilment}>
                        <Truck size={13} /> Fulfilment
                        <ChevronDown size={13} className={`transition-transform ${showFulfilment ? "rotate-180" : ""}`} />
                    </GhostButton>
                    {order.trackingUrl && (
                        <a
                            href={order.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={GHOST_ANCHOR}
                            aria-label={`Open tracking link for order ${order.id}`}
                        >
                            <ExternalLink size={13} className="text-[#D4AF37]" /> Track
                        </a>
                    )}
                    <div className="flex-1" />
                    {phoneDigits && (
                        <a href={waHref} target="_blank" rel="noopener noreferrer" className={GHOST_ANCHOR}>
                            <MessageCircle size={13} className="text-emerald-400" /> WhatsApp
                        </a>
                    )}
                    {order.customerEmail && (
                        <a
                            href={`mailto:${order.customerEmail}`}
                            className={GHOST_ANCHOR}
                            aria-label={`Email ${order.customerName}`}
                        >
                            <Mail size={13} />
                        </a>
                    )}
                </div>

                <AnimatePresence initial={false}>
                    {showFulfilment && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden !mt-2"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
                                <div>
                                    <FieldLabel>Tracking Number</FieldLabel>
                                    <GlassInput
                                        className="!py-2.5 !text-xs"
                                        value={fulfilment.trackingNumber}
                                        onChange={e => setFulfilment(f => ({ ...f, trackingNumber: e.target.value }))}
                                        placeholder="e.g. AWB123456789"
                                    />
                                </div>
                                <div>
                                    <FieldLabel>Tracking URL</FieldLabel>
                                    <GlassInput
                                        className="!py-2.5 !text-xs"
                                        value={fulfilment.trackingUrl}
                                        onChange={e => setFulfilment(f => ({ ...f, trackingUrl: e.target.value }))}
                                        placeholder="https://…"
                                    />
                                </div>
                                <div>
                                    <FieldLabel>Delivery ETA</FieldLabel>
                                    <GlassInput
                                        className="!py-2.5 !text-xs"
                                        value={fulfilment.deliveryEta}
                                        onChange={e => setFulfilment(f => ({ ...f, deliveryEta: e.target.value }))}
                                        placeholder="e.g. 3–5 business days"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end mt-3">
                                <GoldButton onClick={saveTracking} disabled={savingTracking} className="!px-4 !py-2 text-xs">
                                    <Check size={13} /> {savingTracking ? "Saving…" : "Save Fulfilment"}
                                </GoldButton>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </GlassCard>
    );
}

/* --- Manual order modal (offline / in-store / telephone orders) --- */

function ManualOrderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { products, refresh } = useAdminData();
    const { toast } = useToast();

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [productId, setProductId] = useState("");
    const [qtyStr, setQtyStr] = useState("1");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setName("");
            setPhone("");
            setEmail("");
            setProductId("");
            setQtyStr("1");
        }
    }, [open]);

    const available = useMemo(() => products.filter(p => !p.isArchived && p.stock > 0), [products]);
    const selected = available.find(p => p.id === productId);
    const quantity = Math.max(1, Math.min(selected?.stock ?? 1, parseInt(qtyStr, 10) || 1));

    const submit = async () => {
        if (!name.trim()) {
            toast("error", "Customer name is required.");
            return;
        }
        if (!phone.trim()) {
            toast("error", "Phone number is required.");
            return;
        }
        if (!selected) {
            toast("error", "Choose a product for the order.");
            return;
        }
        const parts = name.trim().split(/\s+/);
        setSubmitting(true);
        try {
            const res = await fetch("/api/orders/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: parts[0],
                    lastName: parts.slice(1).join(" "),
                    phone: phone.trim(),
                    email: email.trim() || "manual@thesrivari.com",
                    address: "In-store / Telephone",
                    items: [{ id: selected.id, quantity }],
                    shippingCost: 0,
                    paymentMethod: "Manual",
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
                toast("success", `Order ${data.orderId || ""} recorded.`.replace("  ", " "));
                await refresh();
                onClose();
            } else {
                toast("error", data.message || (res.status === 401 ? "Session expired — please log in again." : "Could not record order."));
            }
        } catch {
            toast("error", "Network error — order not recorded.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 12 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 12 }}
                        onClick={e => e.stopPropagation()}
                        className="max-w-lg w-full max-h-[90vh] overflow-y-auto"
                    >
                        <GlassCard className="p-8">
                            <div className="relative">
                                <div className="flex items-start justify-between gap-4 mb-6">
                                    <div>
                                        <h3 className="text-2xl font-serif bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] bg-clip-text text-transparent">
                                            Record Manual Order
                                        </h3>
                                        <p className="text-xs text-white/40 mt-1">In-store or telephone sale · stock is deducted immediately.</p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-white/40 hover:text-white transition-colors p-1"
                                        aria-label="Close manual order form"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <FieldLabel gold>Customer Name *</FieldLabel>
                                            <GlassInput value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Lakshmi Devi" />
                                        </div>
                                        <div>
                                            <FieldLabel gold>Phone *</FieldLabel>
                                            <GlassInput type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 98765 43210" />
                                        </div>
                                    </div>
                                    <div>
                                        <FieldLabel>Email (optional)</FieldLabel>
                                        <GlassInput type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Order confirmation is emailed if provided" />
                                    </div>
                                    <div>
                                        <FieldLabel gold>Product *</FieldLabel>
                                        <GlassSelect
                                            value={productId}
                                            onChange={e => {
                                                setProductId(e.target.value);
                                                setQtyStr("1");
                                            }}
                                            aria-label="Product"
                                        >
                                            <option value="">Select a saree…</option>
                                            {available.map(p => (
                                                <option key={p.id} value={p.id}>{`${p.name} — ${formatINR(p.price)}`}</option>
                                            ))}
                                        </GlassSelect>
                                        {selected && (
                                            <p className="text-xs text-emerald-400 mt-2">In stock: {selected.stock}</p>
                                        )}
                                    </div>
                                    <div>
                                        <FieldLabel>Quantity</FieldLabel>
                                        <GlassInput
                                            type="number"
                                            min={1}
                                            max={selected?.stock ?? 1}
                                            value={qtyStr}
                                            onChange={e => setQtyStr(e.target.value)}
                                            onBlur={() => setQtyStr(String(quantity))}
                                        />
                                        {selected && (
                                            <p className="text-xs text-white/40 mt-2">
                                                {quantity} × {formatINR(selected.price)} ={" "}
                                                <span className="text-[#D4AF37] font-bold">{formatINR(selected.price * quantity)}</span>
                                            </p>
                                        )}
                                    </div>
                                    <GoldButton onClick={submit} disabled={submitting} className="w-full">
                                        <Plus size={16} /> {submitting ? "Recording…" : "Record Order"}
                                    </GoldButton>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/* --- Page body --- */

function OrdersInner() {
    const searchParams = useSearchParams();
    const { orders, isLoaded } = useAdminData();
    const { toast } = useToast();

    const [tab, setTab] = useState<TabKey>(() => tabFromStatusParam(searchParams.get("status")));
    const [query, setQuery] = useState(() => searchParams.get("q") || "");
    const [visible, setVisible] = useState(PAGE_SIZE);
    const [modalOpen, setModalOpen] = useState(false);

    // Re-sync when navigated with new params (e.g. dashboard deep links)
    useEffect(() => {
        setTab(tabFromStatusParam(searchParams.get("status")));
        setQuery(searchParams.get("q") || "");
    }, [searchParams]);

    useEffect(() => setVisible(PAGE_SIZE), [tab, query]);

    const buyerStats = useMemo(() => {
        const map = new Map<string, { count: number; total: number }>();
        for (const o of orders) {
            if (o.status === "Cancelled") continue;
            const key = (o.customerPhone || "").replace(/\D/g, "");
            if (!key) continue;
            const cur = map.get(key) || { count: 0, total: 0 };
            cur.count += 1;
            cur.total += o.totalAmount || 0;
            map.set(key, cur);
        }
        return map;
    }, [orders]);

    const tabs = useMemo<{ key: TabKey; label: string; count: number }[]>(() => [
        { key: "All", label: "All", count: orders.length },
        { key: "Needs", label: "Needs Action", count: orders.filter(o => NEEDS_ACTION.includes(o.status)).length },
        { key: "Shipped", label: "Shipped", count: orders.filter(o => o.status === "Shipped").length },
        { key: "Delivered", label: "Delivered", count: orders.filter(o => o.status === "Delivered").length },
        { key: "Cancelled", label: "Cancelled", count: orders.filter(o => o.status === "Cancelled").length },
    ], [orders]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return orders.filter(o => {
            if (tab === "Needs" && !NEEDS_ACTION.includes(o.status)) return false;
            if ((tab === "Shipped" || tab === "Delivered" || tab === "Cancelled") && o.status !== tab) return false;
            if (!q) return true;
            return (
                o.id.toLowerCase().includes(q) ||
                (o.customerName || "").toLowerCase().includes(q) ||
                (o.customerPhone || "").toLowerCase().includes(q)
            );
        });
    }, [orders, tab, query]);

    const handleExport = () => {
        if (!filtered.length) {
            toast("info", "No orders in the current view to export.");
            return;
        }
        exportCSV(
            "srivari-orders",
            ["OrderID", "Customer", "Phone", "Amount", "Status", "Date"],
            filtered.map(o => [o.id, o.customerName, o.customerPhone, o.totalAmount, o.status, formatOrderDate(o.date)])
        );
        toast("success", `Exported ${filtered.length} orders.`);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <SectionHeading
                title="Order Ledger"
                subtitle={isLoaded ? `${orders.length} order${orders.length !== 1 ? "s" : ""} across the boutique` : "Loading the ledger…"}
                actions={
                    <>
                        <GhostButton onClick={handleExport}>
                            <Download size={13} /> Export CSV
                        </GhostButton>
                        <GoldButton onClick={() => setModalOpen(true)} className="!px-5 !py-2.5 text-sm">
                            <Plus size={15} /> Record Manual Order
                        </GoldButton>
                    </>
                }
            />

            {/* Filters */}
            <div className="flex flex-col xl:flex-row xl:items-center gap-4">
                <div className="flex flex-wrap gap-2">
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all flex items-center gap-2 ${
                                tab === t.key
                                    ? "bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] text-black border-transparent shadow-[0_0_18px_rgba(212,175,55,0.25)]"
                                    : "text-white/50 border-white/10 hover:border-white/25 hover:text-white"
                            }`}
                        >
                            {t.label}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === t.key ? "bg-black/15" : "bg-white/[0.06]"}`}>
                                {t.count}
                            </span>
                        </button>
                    ))}
                </div>
                <div className="relative xl:ml-auto xl:w-80">
                    <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                    <GlassInput
                        className="!py-3 !pl-11"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search order ID, name, phone…"
                        aria-label="Search orders"
                    />
                </div>
            </div>

            {/* Ledger */}
            {!isLoaded ? (
                <div className="space-y-4">
                    {[0, 1, 2].map(i => (
                        <GlassCard key={i} className="p-6 h-44 animate-pulse">
                            <div className="h-3 w-24 bg-white/5 rounded" />
                        </GlassCard>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <GlassCard className="p-6">
                    <EmptyState
                        icon={<ShoppingBag size={22} />}
                        title="No orders match"
                        subtitle="Try a different status tab or search term."
                    />
                </GlassCard>
            ) : (
                <div className="space-y-4">
                    {filtered.slice(0, visible).map(o => (
                        <OrderCard
                            key={o.id}
                            order={o}
                            buyer={buyerStats.get((o.customerPhone || "").replace(/\D/g, ""))}
                        />
                    ))}
                    {filtered.length > visible && (
                        <div className="flex justify-center pt-2">
                            <GhostButton onClick={() => setVisible(v => v + PAGE_SIZE)}>
                                <ChevronDown size={13} />
                                Load more · {filtered.length - visible} remaining
                            </GhostButton>
                        </div>
                    )}
                </div>
            )}

            <ManualOrderModal open={modalOpen} onClose={() => setModalOpen(false)} />
        </motion.div>
    );
}

export default function OrdersPage() {
    return (
        <Suspense fallback={null}>
            <OrdersInner />
        </Suspense>
    );
}
