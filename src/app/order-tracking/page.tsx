"use client";

import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import SectionHeader from "@/components/ui/SectionHeader";
import { Package, Phone, ExternalLink, CalendarClock, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TrackedItem {
    productName: string;
    quantity: number;
    price: number;
}

interface TrackedOrder {
    id: string;
    status: string;
    date: string;
    totalAmount: number;
    paymentMethod?: string;
    items: TrackedItem[];
    trackingNumber?: string;
    trackingUrl?: string;
    deliveryEta?: string;
}

const TIMELINE_STEPS = ["Order Placed", "Shipped", "Delivered"];

function statusIndex(status: string): number {
    switch (status) {
        case "Delivered":
            return 2;
        case "Shipped":
            return 1;
        default:
            // Pending / Placed / Paid
            return 0;
    }
}

const underlineField =
    "w-full pl-9 pr-2 py-3 bg-transparent border-0 border-b border-black/20 text-[#4A0404] placeholder:text-neutral-400 placeholder:font-sans placeholder:text-sm placeholder:tracking-normal focus:border-[#4A0404] outline-none transition-colors duration-500 font-serif text-xl tracking-wide";

export default function OrderTrackingPage() {
    const [orderId, setOrderId] = useState("");
    const [phone, setPhone] = useState("");
    const [order, setOrder] = useState<TrackedOrder | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Prefill the order id when arriving from checkout (/order-tracking?id=SR-123456)
    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const id = params.get("id");
            if (id) setOrderId(id.toUpperCase());
        } catch {
            // Ignore malformed URLs
        }
    }, []);

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/orders/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: orderId.trim(), phone: phone.trim() }),
            });
            const data = await res.json();

            if (!res.ok || data.error) {
                setError(data.error || "No order found for that ID and phone combination.");
                setOrder(null);
            } else {
                setOrder(data);
            }
        } catch {
            setError("Unable to reach the concierge desk. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const isCancelled = order?.status === "Cancelled";
    const isPaymentPending = order?.status === "Pending" && order?.paymentMethod === "Razorpay";
    const currentStep = order ? statusIndex(order.status) : 0;

    return (
        <main className="bg-[#FDFBF7] min-h-screen flex flex-col font-sans">
            <h1 className="sr-only">Concierge Tracking</h1>
            <div className="flex-grow pt-36 pb-28 px-4 sm:px-6 max-w-2xl mx-auto w-full">
                <SectionHeader
                    tone="light"
                    kicker="The Srivari Concierge"
                    title="Concierge Tracking"
                    accent="Tracking"
                    note="Trace the journey of your heirloom."
                    className="mb-14"
                />

                <AnimatePresence mode="wait">
                    {!order ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="bg-[#F9F5F0] p-8 md:p-10 border border-black/10"
                        >
                            <form onSubmit={handleTrack} className="space-y-8">
                                <div>
                                    <label htmlFor="track-order-id" className="block text-[9px] text-[#4A0404] uppercase tracking-[0.3em] mb-1">
                                        Order ID
                                    </label>
                                    <div className="relative">
                                        <Package className="absolute left-0 top-1/2 -translate-y-1/2 text-[#D4AF37]" size={18} aria-hidden="true" />
                                        <input
                                            id="track-order-id"
                                            type="text"
                                            value={orderId}
                                            onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                                            placeholder="e.g. SR-882134"
                                            className={`${underlineField} uppercase`}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="track-phone" className="block text-[9px] text-[#4A0404] uppercase tracking-[0.3em] mb-1">
                                        Phone Number on the Order
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-0 top-1/2 -translate-y-1/2 text-[#D4AF37]" size={18} aria-hidden="true" />
                                        <input
                                            id="track-phone"
                                            type="tel"
                                            inputMode="numeric"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/[^\d+ ]/g, ""))}
                                            placeholder="e.g. 98765 43210"
                                            className={underlineField}
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] text-neutral-400 mt-3 tracking-wide">
                                        For your privacy, we verify the phone number used when placing the order.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-royal btn-royal--oxblood w-full disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Locating your heirloom..." : "Track Order"}
                                </button>
                                {error && (
                                    <p className="text-[#4A0404] text-xs text-center tracking-wide" role="alert">
                                        {error}
                                    </p>
                                )}
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="space-y-8"
                        >
                            {/* Status Card */}
                            <div className={`bg-[#F9F5F0] p-8 md:p-10 border ${isCancelled ? "border-[#4A0404]/40" : "border-[#D4AF37]/40"}`}>
                                <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2 mb-5">
                                    <span className="text-[10px] uppercase tracking-[0.3em] text-[#4A0404]">
                                        Order {order.id}
                                    </span>
                                    <span className="text-[9px] uppercase tracking-[0.3em] text-neutral-400">
                                        {new Date(order.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                                    </span>
                                </div>
                                <h2 className="text-4xl font-serif mb-4 leading-[1.05] text-[#4A0404]">
                                    {isPaymentPending ? "Awaiting Payment" : isCancelled ? "Cancelled" : order.status}
                                </h2>
                                {isPaymentPending && (
                                    <p className="flex items-center gap-2 text-[9px] uppercase tracking-[0.25em] text-[#4A0404]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" aria-hidden="true"></span>
                                        Payment not yet completed — contact us if this seems in error
                                    </p>
                                )}
                                {isCancelled && (
                                    <p className="flex items-center gap-2 text-[9px] uppercase tracking-[0.25em] text-[#4A0404]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#4A0404]/60" aria-hidden="true"></span>
                                        This order has been cancelled — our concierge is a message away
                                    </p>
                                )}
                                {order.deliveryEta && !isCancelled && (
                                    <p className="text-[#595959] text-sm mt-3 flex items-center gap-2">
                                        <CalendarClock size={14} className="text-[#D4AF37]" aria-hidden="true" />
                                        Expected delivery: <span className="font-serif text-[#4A0404]">{order.deliveryEta}</span>
                                    </p>
                                )}

                                {/* Timeline — gold diamonds joined by hairlines */}
                                {!isCancelled && (
                                    <div className="mt-12">
                                        <div className="flex items-center">
                                            {TIMELINE_STEPS.map((step, i) => {
                                                const reached = i <= currentStep && !isPaymentPending;
                                                const isCurrent = i === currentStep && !isPaymentPending;
                                                return (
                                                    <div key={step} className="flex items-center flex-1 last:flex-none">
                                                        <div className="flex flex-col items-center gap-4">
                                                            <span
                                                                className={`block w-2.5 h-2.5 rotate-45 border transition-colors duration-700 ${reached
                                                                    ? "bg-[#D4AF37] border-[#D4AF37]"
                                                                    : "bg-transparent border-black/25"
                                                                    } ${isCurrent && order.status !== "Delivered" ? "animate-pulse" : ""}`}
                                                                aria-hidden="true"
                                                            ></span>
                                                            <span
                                                                className={`text-[8px] sm:text-[9px] uppercase tracking-[0.25em] text-center ${reached ? "text-[#4A0404]" : "text-neutral-300"
                                                                    }`}
                                                            >
                                                                {step}
                                                            </span>
                                                        </div>
                                                        {i < TIMELINE_STEPS.length - 1 && (
                                                            <div
                                                                className={`flex-1 h-px mx-3 mb-7 ${i < currentStep && !isPaymentPending ? "bg-[#D4AF37]/70" : "bg-black/10"
                                                                    }`}
                                                                aria-hidden="true"
                                                            ></div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Tracking number / link */}
                                {order.trackingNumber && (
                                    <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-black/10 pt-6">
                                        <div>
                                            <span className="block text-[9px] uppercase tracking-[0.3em] text-neutral-400 mb-1.5">
                                                Tracking Number
                                            </span>
                                            <span className="font-serif text-lg text-[#1A1A1A]">{order.trackingNumber}</span>
                                        </div>
                                        {order.trackingUrl && (
                                            <a
                                                href={order.trackingUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-thread text-[#4A0404]"
                                            >
                                                Track Shipment <ExternalLink size={11} aria-hidden="true" />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Items List */}
                            <div className="bg-[#F9F5F0] p-8 border border-black/10">
                                <h3 className="text-[10px] text-[#4A0404] uppercase tracking-[0.3em] mb-6 border-b border-black/10 pb-3">
                                    Package Contents
                                </h3>
                                <ul className="space-y-4">
                                    {order.items.map((item, i) => (
                                        <li key={i} className="flex justify-between items-baseline gap-4 text-sm">
                                            <span className="text-[#595959]">
                                                {item.productName}
                                                {item.quantity > 1 && <span className="text-neutral-400"> × {item.quantity}</span>}
                                            </span>
                                            <span className="font-serif whitespace-nowrap text-[#1A1A1A]">
                                                ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex justify-between items-baseline mt-8 pt-5 border-t border-black/10">
                                    <span className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-neutral-400">
                                        <Wallet size={13} className="text-[#D4AF37]" aria-hidden="true" />
                                        {order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod || "—"}
                                    </span>
                                    <span className="font-serif text-2xl text-[#4A0404]">
                                        ₹{order.totalAmount.toLocaleString("en-IN")}
                                    </span>
                                </div>
                            </div>

                            <div className="text-center pt-2">
                                <button
                                    onClick={() => {
                                        setOrder(null);
                                        setError("");
                                    }}
                                    className="btn-thread text-neutral-500 hover:text-[#4A0404] transition-colors"
                                >
                                    Track Another Order
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Footer />
        </main>
    );
}
