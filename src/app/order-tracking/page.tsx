"use client";

import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import { Package, Phone, Truck, CheckCircle, XCircle, ExternalLink, CalendarClock, Wallet } from "lucide-react";
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

const TIMELINE_STEPS = [
    { label: "Order Placed", icon: Package },
    { label: "Shipped", icon: Truck },
    { label: "Delivered", icon: CheckCircle },
];

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
            <div className="flex-grow pt-32 pb-20 px-4 sm:px-6 max-w-2xl mx-auto w-full">
                <span className="block text-center text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.4em] mb-4">
                    The Srivari Concierge
                </span>
                <h1 className="text-3xl md:text-4xl font-serif text-[#4A0404] text-center mb-2">Concierge Tracking</h1>
                <p className="text-center text-[#595959] mb-12 text-xs md:text-sm uppercase tracking-widest">
                    Trace the journey of your heirloom
                </p>

                <AnimatePresence mode="wait">
                    {!order ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white p-8 border border-neutral-200 shadow-sm rounded-lg"
                        >
                            <form onSubmit={handleTrack} className="space-y-6">
                                <div>
                                    <label htmlFor="track-order-id" className="block text-xs font-bold text-[#4A0404] uppercase tracking-wider mb-2">
                                        Order ID
                                    </label>
                                    <div className="relative">
                                        <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} aria-hidden="true" />
                                        <input
                                            id="track-order-id"
                                            type="text"
                                            value={orderId}
                                            onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                                            placeholder="e.g. SR-882134"
                                            className="w-full pl-12 pr-4 py-4 bg-white border border-neutral-300 text-[#4A0404] placeholder:text-neutral-400 focus:border-[#D4AF37] outline-none transition-colors uppercase font-bold text-lg rounded-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="track-phone" className="block text-xs font-bold text-[#4A0404] uppercase tracking-wider mb-2">
                                        Phone Number on the Order
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} aria-hidden="true" />
                                        <input
                                            id="track-phone"
                                            type="tel"
                                            inputMode="numeric"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/[^\d+ ]/g, ""))}
                                            placeholder="e.g. 98765 43210"
                                            className="w-full pl-12 pr-4 py-4 bg-white border border-neutral-300 text-[#4A0404] placeholder:text-neutral-400 focus:border-[#D4AF37] outline-none transition-colors font-bold text-lg rounded-sm"
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] text-neutral-400 mt-2">
                                        For your privacy, we verify the phone number used when placing the order.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#4A0404] text-[#D4AF37] font-bold py-4 uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-70 rounded-sm"
                                >
                                    {loading ? "Locating your heirloom..." : "Track Order"}
                                </button>
                                {error && (
                                    <p className="text-red-600 text-xs text-center" role="alert">
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
                            className="space-y-6"
                        >
                            {/* Status Card */}
                            <div
                                className={`bg-white p-8 border shadow-lg rounded-lg relative overflow-hidden ${isCancelled ? "border-red-300" : "border-[#D4AF37]"
                                    }`}
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10" aria-hidden="true">
                                    {isCancelled ? <XCircle size={100} /> : <Truck size={100} />}
                                </div>
                                <div className="relative z-10">
                                    <div className="flex flex-wrap items-center gap-3 mb-4">
                                        <span className="bg-[#4A0404] text-white text-[10px] uppercase font-bold px-2 py-1 tracking-widest rounded-sm">
                                            Order {order.id}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
                                            {new Date(order.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                                        </span>
                                    </div>
                                    <h2 className={`text-3xl font-serif mb-2 ${isCancelled ? "text-red-700" : "text-[#4A0404]"}`}>
                                        {isPaymentPending ? "Awaiting Payment" : isCancelled ? "Cancelled" : order.status}
                                    </h2>
                                    {isPaymentPending && (
                                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-sm px-3 py-2 inline-block">
                                            Your payment has not been completed yet. Please contact us if you believe this is an error.
                                        </p>
                                    )}
                                    {isCancelled && (
                                        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-sm px-3 py-2 inline-block">
                                            This order has been cancelled. If you have questions, our concierge is a message away.
                                        </p>
                                    )}
                                    {order.deliveryEta && !isCancelled && (
                                        <p className="text-[#595959] text-sm mt-2 flex items-center gap-2">
                                            <CalendarClock size={14} className="text-[#D4AF37]" aria-hidden="true" />
                                            Expected delivery: <span className="font-bold">{order.deliveryEta}</span>
                                        </p>
                                    )}

                                    {/* Timeline */}
                                    {!isCancelled && (
                                        <div className="mt-8">
                                            <div className="flex items-center">
                                                {TIMELINE_STEPS.map((step, i) => {
                                                    const reached = i <= currentStep && !isPaymentPending;
                                                    const isCurrent = i === currentStep && !isPaymentPending;
                                                    const Icon = step.icon;
                                                    return (
                                                        <div key={step.label} className="flex items-center flex-1 last:flex-none">
                                                            <div className="flex flex-col items-center">
                                                                <div
                                                                    className={`w-11 h-11 rounded-full border flex items-center justify-center transition-colors ${reached
                                                                        ? "bg-[#4A0404] border-[#4A0404] text-[#D4AF37]"
                                                                        : "bg-white border-neutral-200 text-neutral-300"
                                                                        } ${isCurrent && order.status !== "Delivered" ? "ring-4 ring-[#D4AF37]/20" : ""}`}
                                                                >
                                                                    <Icon size={18} aria-hidden="true" />
                                                                </div>
                                                                <span
                                                                    className={`mt-2 text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-center ${reached ? "text-[#4A0404]" : "text-neutral-300"
                                                                        }`}
                                                                >
                                                                    {step.label}
                                                                </span>
                                                            </div>
                                                            {i < TIMELINE_STEPS.length - 1 && (
                                                                <div
                                                                    className={`flex-1 h-[2px] mx-2 mb-6 ${i < currentStep && !isPaymentPending ? "bg-[#D4AF37]" : "bg-neutral-200"
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
                                        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 bg-[#FAF8F5] border border-[#D4AF37]/20 rounded-sm px-4 py-3">
                                            <div>
                                                <span className="block text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-0.5">
                                                    Tracking Number
                                                </span>
                                                <span className="font-bold text-sm text-[#1A1A1A]">{order.trackingNumber}</span>
                                            </div>
                                            {order.trackingUrl && (
                                                <a
                                                    href={order.trackingUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4A0404] hover:text-[#D4AF37] transition-colors underline underline-offset-4"
                                                >
                                                    Track Shipment <ExternalLink size={12} aria-hidden="true" />
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="bg-white p-6 border border-neutral-200 rounded-lg">
                                <h3 className="text-sm font-bold text-[#4A0404] uppercase tracking-wider mb-4 border-b pb-2">
                                    Package Contents
                                </h3>
                                <ul className="space-y-4">
                                    {order.items.map((item, i) => (
                                        <li key={i} className="flex justify-between items-center gap-4 text-sm">
                                            <span className="text-[#595959]">
                                                {item.productName}
                                                {item.quantity > 1 && <span className="text-neutral-400"> × {item.quantity}</span>}
                                            </span>
                                            <span className="font-medium whitespace-nowrap">
                                                ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex justify-between items-center mt-6 pt-4 border-t border-dashed border-neutral-200">
                                    <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400 font-bold">
                                        <Wallet size={14} className="text-[#D4AF37]" aria-hidden="true" />
                                        {order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod || "—"}
                                    </span>
                                    <span className="font-serif text-xl text-[#4A0404]">
                                        ₹{order.totalAmount.toLocaleString("en-IN")}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setOrder(null);
                                    setError("");
                                }}
                                className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 py-3 uppercase text-xs font-bold tracking-widest transition-colors rounded-sm"
                            >
                                Track Another Order
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Footer />
        </main>
    );
}
