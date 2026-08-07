"use client";

import { useState, useEffect, useRef } from "react";
import { useCart, lineTotal } from "@/context/CartContext";
import Footer from "@/components/Footer";
import { Truck, ShieldCheck, ShoppingBag, MapPin, WalletCards, TicketPercent, X, AlertCircle, Store, Bike, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Script from "next/script";
import SrivariImage from "@/components/SrivariImage";
import {
    addOnsExtraDays,
    deliveryPromise,
    findAddOn,
    formatMeasurements,
} from "@/config/customization";

interface AppliedCoupon {
    code: string;
    discount: number;
    description?: string;
}

type DeliveryMethod = "Courier" | "Local" | "Pickup";

interface DeliveryOption {
    method: DeliveryMethod;
    label: string;
    fee: number;
    eta: string;
    available: boolean;
    /** Instructions when available, the reason when it isn't. */
    note?: string;
    /** Boutique address — Pickup only. */
    address?: string;
}

/** GST is computed server-side; prices are inclusive, so it is only displayed. */
interface GstView {
    enabled: boolean;
    gstAmount: number;
    rate: number;
    cgst: number;
    sgst: number;
    igst: number;
    isIntraState: boolean;
    placeOfSupply: string;
}

const METHOD_ICON: Record<DeliveryMethod, typeof Truck> = {
    Pickup: Store,
    Local: Bike,
    Courier: Truck,
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/**
 * How the customer chooses to pay. UPI and Cards both settle through the same
 * Razorpay order — the only difference is which instrument Razorpay opens on.
 * UPI leads because it is how most of India actually pays.
 */
type PayChoice = 'UPI' | 'Card' | 'COD';

const PAY_CHOICES: { choice: PayChoice; title: string; blurb: string; icon: typeof Truck }[] = [
    { choice: 'UPI', title: 'UPI', blurb: 'Google Pay, PhonePe, Paytm, BHIM', icon: Smartphone },
    { choice: 'Card', title: 'Cards & NetBanking', blurb: 'Credit, debit, all major banks', icon: WalletCards },
    { choice: 'COD', title: 'Cash on Delivery', blurb: 'Pay at your doorstep', icon: Truck },
];

export default function CheckoutPage() {
    const { cart, clearCart } = useCart();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [payChoice, setPayChoice] = useState<PayChoice>('UPI');
    // UPI and Cards are the same Razorpay order — only the opening screen differs.
    const paymentMethod: 'Razorpay' | 'COD' = payChoice === 'COD' ? 'COD' : 'Razorpay';
    const [checkoutError, setCheckoutError] = useState("");

    // Form State
    const [formData, setFormData] = useState({
        email: "",
        firstName: "",
        lastName: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        phone: ""
    });

    // Finishing add-ons are part of the goods total — /api/orders/create derives
    // the identical figure from config, so the two can never drift apart.
    const subtotal = cart.reduce((acc, item) => acc + lineTotal(item), 0);

    // The whole order ships together, so the atelier time is the slowest line's.
    const stitchingDays = cart.reduce(
        (most, item) => Math.max(most, addOnsExtraDays(item.options || [])),
        0
    );
    const hasAddOns = cart.some(item => (item.options || []).length > 0);

    // A delivery date needs a real clock; take it after mount so the server-
    // rendered markup and the browser can never disagree across a cutoff.
    const [now, setNow] = useState<Date | null>(null);
    useEffect(() => setNow(new Date()), []);

    // Coupon state
    const [couponInput, setCouponInput] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
    const [couponError, setCouponError] = useState("");
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

    const discount = appliedCoupon?.discount || 0;

    // Delivery channels — quoted server-side from the pincode (courier rate,
    // local-zone eligibility and boutique collection all come back together).
    const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("Courier");
    const [methodChosenByUser, setMethodChosenByUser] = useState(false);
    const [quoteStatus, setQuoteStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
    const [gst, setGst] = useState<GstView | null>(null);
    const quoteSeq = useRef(0);

    const selectedOption = deliveryOptions.find(o => o.method === deliveryMethod) || null;
    const isPickup = deliveryMethod === "Pickup";
    const shipping = selectedOption && selectedOption.available ? selectedOption.fee : 0;
    const total = Math.max(0, subtotal - discount) + shipping;

    /**
     * Turns a channel's ETA into a date — "Delivered by Tue, 12 Aug". Stays
     * honest: when the courier's ETA can't be read the helper falls back to a
     * range AND says "Estimated" rather than inventing a confident promise.
     */
    const promiseFor = (option: DeliveryOption | null) => {
        if (!now || !option || !option.available) return null;
        const base = deliveryPromise({ eta: option.eta, extraDays: stitchingDays, now });
        if (option.method !== "Pickup") return base;
        const lead = base.estimated ? "Ready around" : "Ready by";
        return { ...base, lead, text: `${lead} ${base.label}` };
    };

    const selectedPromise = promiseFor(selectedOption);

    const [user, setUser] = useState<any>(null);
    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string>("");

    useEffect(() => {
        const loadUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser(session.user);
                fetchAddresses(session.access_token);
                setFormData(prev => ({ ...prev, email: session.user.email || "" }));
            }
        };
        loadUser();
    }, []);

    // Re-validate the applied coupon whenever the subtotal changes (cart edits)
    useEffect(() => {
        if (!appliedCoupon || subtotal <= 0) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/coupons/validate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code: appliedCoupon.code, subtotal })
                });
                const data = await res.json();
                if (cancelled) return;
                if (data.valid) {
                    setAppliedCoupon({ code: data.code, discount: data.discount, description: data.description });
                } else {
                    setAppliedCoupon(null);
                    setCouponError(data.error || "Coupon is no longer valid for this order.");
                }
            } catch {
                // Keep the coupon; the server re-validates at order creation anyway
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subtotal]);

    // Quote every delivery channel once the pincode is complete. Debounced, and
    // guarded by a sequence number so a slow reply can't overwrite a newer one.
    useEffect(() => {
        if (!/^\d{6}$/.test(formData.pincode) || cart.length === 0) {
            quoteSeq.current += 1;
            setDeliveryOptions([]);
            setGst(null);
            setQuoteStatus("idle");
            return;
        }

        const seq = ++quoteSeq.current;
        setQuoteStatus("loading");

        const timer = setTimeout(async () => {
            try {
                const weightKg = cart.reduce((w, item) => w + ((item.weight || 0.6) * item.quantity), 0);
                const res = await fetch("/api/shipping/quote", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        pincode: formData.pincode,
                        subtotal,
                        discount,
                        weightKg,
                        state: formData.state,
                        // options included so the GST preview covers finishing services too
                        items: cart.map(item => ({ id: item.id, quantity: item.quantity, options: item.options })),
                    }),
                });
                const data = await res.json();
                if (seq !== quoteSeq.current) return;
                if (!res.ok || !data.success || !Array.isArray(data.options)) {
                    setDeliveryOptions([]);
                    setGst(null);
                    setQuoteStatus("error");
                    return;
                }
                setDeliveryOptions(data.options);
                setGst(data.gst || null);
                setQuoteStatus("ready");
            } catch {
                if (seq !== quoteSeq.current) return;
                setDeliveryOptions([]);
                setGst(null);
                setQuoteStatus("error");
            }
        }, 450);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.pincode, formData.state, subtotal, discount, cart]);

    // Default to the cheapest option that actually delivers to the customer;
    // boutique collection stays an explicit choice (it is always ₹0, so it would
    // otherwise silently win). Any selection that becomes unavailable is reset.
    useEffect(() => {
        const available = deliveryOptions.filter(o => o.available);
        if (available.length === 0) return;

        const stillValid = available.some(o => o.method === deliveryMethod);
        if (stillValid && methodChosenByUser) return;

        const shipped = available.filter(o => o.method !== "Pickup");
        const pool = shipped.length > 0 ? shipped : available;
        const cheapest = pool.reduce((best, o) => (o.fee < best.fee ? o : best), pool[0]);
        if (!stillValid) setMethodChosenByUser(false);
        if (cheapest.method !== deliveryMethod) setDeliveryMethod(cheapest.method);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deliveryOptions]);

    const fetchAddresses = async (token: string) => {
        try {
            const res = await fetch("/api/user/addresses", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSavedAddresses(data);
                // Auto-select default
                const def = data.find((a: any) => a.isDefault);
                if (def) applyAddress(def);
            }
        } catch (e) {
            console.error("Failed to load addresses");
        }
    };

    const applyAddress = (addr: any) => {
        setSelectedAddressId(addr.id);
        setFormData(prev => ({
            email: prev.email,
            firstName: addr.firstName,
            lastName: addr.lastName,
            address: `${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}${addr.landmark ? ' (Landmark: ' + addr.landmark + ')' : ''}`,
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode,
            phone: addr.phone
        }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (selectedAddressId) setSelectedAddressId(""); // Unselect if modified
    };

    const handleApplyCoupon = async () => {
        const code = couponInput.trim().toUpperCase();
        if (!code) {
            setCouponError("Please enter a coupon code.");
            return;
        }
        setIsApplyingCoupon(true);
        setCouponError("");
        try {
            const res = await fetch("/api/coupons/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, subtotal })
            });
            const data = await res.json();
            if (data.valid) {
                setAppliedCoupon({ code: data.code, discount: data.discount, description: data.description });
                setCouponInput("");
            } else {
                setCouponError(data.error || "This coupon cannot be applied.");
            }
        } catch {
            setCouponError("Could not verify the coupon. Please try again.");
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponError("");
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setCheckoutError("");

        try {
            // Flat address string (kept for backwards compatibility) — for a
            // boutique collection it records the counter, not a doorstep.
            const postalAddress = [
                formData.address,
                formData.city,
                [formData.state, formData.pincode].filter(Boolean).join(" - "),
            ].filter(part => part && String(part).trim()).join(", ");
            const composedAddress = isPickup
                ? `Boutique collection — ${selectedOption?.address || "The Srivari Boutique"}`
                : postalAddress;

            const orderPayload = {
                ...formData,
                address: composedAddress,
                // Only the add-on CODES travel — the server prices them from
                // config, exactly as this page did, and never trusts a number
                // sent from here.
                items: cart.map(item => ({
                    id: item.id,
                    quantity: item.quantity,
                    options: item.options,
                    measurements: item.measurements,
                })),
                // The server re-derives this for Pickup/Local; it is only
                // authoritative for a courier (Shiprocket-quoted) shipment.
                shippingCost: shipping,
                deliveryMethod,
                couponCode: appliedCoupon?.code,
                paymentMethod: paymentMethod
            };

            // The server links the order to the account via this token — it
            // ignores any client-claimed userId.
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

            const response = await fetch("/api/orders/create", {
                method: "POST",
                headers,
                body: JSON.stringify(orderPayload)
            });

            const data = await response.json();

            if (!response.ok || !data.success) throw new Error(data.message || "Checkout failed");

            // COD, or a fully-discounted "free" order the server settled offline:
            // both come back without a Razorpay order to open.
            if (paymentMethod === 'COD' || data.free || !data.razorpayOrderId) {
                clearCart();
                router.push(`/order-tracking?id=${data.orderId}`);
                return;
            }

            // Razorpay must have finished loading (lazyOnload Script) before we
            // can construct the checkout — otherwise the customer sees a raw
            // TypeError and each retry orphans another Pending order.
            if (typeof (window as any).Razorpay !== "function") {
                setCheckoutError("The secure payment window is still loading — please wait a moment and try again.");
                setIsProcessing(false);
                return;
            }

            // Initialize Razorpay — amount and total are server-derived
            const options = {
                key: data.key,
                amount: data.amount,
                currency: "INR",
                name: "The Srivari",
                description: `Luxury Heirloom Purchase — ₹${Number(data.total).toLocaleString('en-IN')}`,
                order_id: data.razorpayOrderId,
                handler: async function (response: any) {
                    // The payment already succeeded at the gateway; a failure here
                    // is only our confirmation step, never lost money.
                    try {
                        const verifyRes = await fetch("/api/payment/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            }),
                        });

                        if (verifyRes.ok) {
                            clearCart();
                            router.push(`/order-tracking?id=${data.orderId}`);
                        } else {
                            setCheckoutError("Payment received — we're confirming it. If your order isn't visible shortly, contact support with order ID: " + data.orderId);
                            setIsProcessing(false);
                        }
                    } catch {
                        setCheckoutError("Payment received, but confirmation didn't complete. Please contact support with order ID: " + data.orderId + " (do not pay again).");
                        setIsProcessing(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        // Customer closed the payment popup without paying.
                        setCheckoutError("Payment was not completed. Your bag is saved — you can try again.");
                        setIsProcessing(false);
                    },
                },
                prefill: {
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    contact: formData.phone,
                    // Presentation hint only — Razorpay opens on UPI instead of
                    // cards. Every instrument stays available either way, so an
                    // unrecognised value can never block the payment.
                    ...(payChoice === 'UPI' ? { method: 'upi' } : {}),
                },
                theme: { color: "#4A0404" },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on("payment.failed", function () {
                setCheckoutError("The payment could not be processed. No charge was made — please try again.");
                setIsProcessing(false);
            });
            rzp.open();
            // Leave isProcessing true while the modal is open; ondismiss/handler reset it.
        } catch (error: any) {
            setCheckoutError(error.message || "Checkout failed. Please try again.");
            setIsProcessing(false);
        }
    };

    if (cart.length === 0 && !isProcessing) {
        return (
            <main className="bg-[#FDFBF7] min-h-screen">
                <div className="container mx-auto px-6 py-32 text-center">
                    <ShoppingBag className="mx-auto w-16 h-16 text-[#D4AF37]/20 mb-6" aria-hidden="true" />
                    <h1 className="text-3xl font-serif text-[#1A1A1A] mb-4">Your bag is empty</h1>
                    <p className="text-neutral-500 mb-8 max-w-md mx-auto">Explore our collections and discover the masterpiece waiting for you.</p>
                    <Link href="/shop" className="inline-block bg-[#1A1A1A] text-marble px-8 py-3 rounded-sm hover:bg-[#D4AF37] hover:text-white transition-all uppercase tracking-widest text-sm font-bold">
                        Continue Shopping
                    </Link>
                </div>
                <Footer />
            </main>
        );
    }

    return (
        <main className="bg-[#FDFBF7] min-h-screen text-[#1A1A1A] font-sans">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

            <div className="container mx-auto px-6 py-24 md:py-32">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400 mb-8 border-b border-black/5 pb-4">
                    <Link href="/cart" className="hover:text-[#D4AF37] transition-colors">Bag</Link>
                    <span>/</span>
                    <span className="text-[#1A1A1A] font-bold">Checkout</span>
                    <span>/</span>
                    <span>Payment</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Checkout Form */}
                    <div className="lg:col-span-7">
                        <form onSubmit={handleCheckout} className="space-y-10">

                            {user && savedAddresses.length > 0 && (
                                <section className="bg-white border border-gold/10 p-6 rounded-sm shadow-sm">
                                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gold mb-4 flex items-center gap-2">
                                        <MapPin size={14} aria-hidden="true" /> Select Registered Residence
                                    </h3>
                                    <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                                        {savedAddresses.map((addr) => (
                                            <button
                                                key={addr.id}
                                                type="button"
                                                onClick={() => applyAddress(addr)}
                                                className={`shrink-0 text-left p-4 border rounded-sm transition-all w-48 ${selectedAddressId === addr.id
                                                    ? "border-gold bg-gold/5 shadow-inner"
                                                    : "border-neutral-100 hover:border-gold/30"
                                                    }`}
                                            >
                                                <p className="text-[10px] uppercase font-bold text-neutral-400 mb-1">{addr.type}</p>
                                                <p className="text-xs font-bold truncate">{addr.addressLine1}</p>
                                                <p className="text-[10px] text-neutral-500">{addr.city}</p>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            )}

                            <section>
                                <h2 className="text-2xl font-serif text-[#4A0404] mb-6 border-l-2 border-[#D4AF37] pl-4">Delivery Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="co-firstName" className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">First Name</label>
                                        <input
                                            id="co-firstName"
                                            required
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            className="w-full bg-white border border-neutral-200 px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-all rounded-sm placeholder:text-neutral-300"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="co-lastName" className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">Last Name</label>
                                        <input
                                            id="co-lastName"
                                            required
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            className="w-full bg-white border border-neutral-200 px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-all rounded-sm placeholder:text-neutral-300"
                                        />
                                    </div>
                                </div>
                                {/* Street address is irrelevant to a boutique collection — kept
                                    visible (and still editable) but no longer required. */}
                                <div className={`mt-6 space-y-2 transition-opacity duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${isPickup ? "opacity-45" : "opacity-100"}`}>
                                    <label htmlFor="co-address" className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">Address</label>
                                    <input
                                        id="co-address"
                                        required={!isPickup}
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        aria-describedby={isPickup ? "co-pickup-note" : undefined}
                                        className="w-full bg-white border border-neutral-200 px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-all rounded-sm placeholder:text-neutral-300"
                                    />
                                    {isPickup && (
                                        <p id="co-pickup-note" className="text-[9px] uppercase tracking-[0.3em] text-neutral-400 font-sans pt-1">
                                            Not required — you are collecting in person
                                        </p>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    <div className={`space-y-2 transition-opacity duration-700 ${isPickup ? "opacity-45" : "opacity-100"}`}>
                                        <label htmlFor="co-city" className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">City</label>
                                        <input
                                            id="co-city"
                                            required={!isPickup}
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            className="w-full bg-white border border-neutral-200 px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-all rounded-sm placeholder:text-neutral-300"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        {/* State drives the GST place of supply (CGST+SGST vs IGST). */}
                                        <label htmlFor="co-state" className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">State</label>
                                        <input
                                            id="co-state"
                                            required
                                            name="state"
                                            value={formData.state}
                                            onChange={handleInputChange}
                                            className="w-full bg-white border border-neutral-200 px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-all rounded-sm placeholder:text-neutral-300"
                                            placeholder="E.g. Karnataka"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="co-pincode" className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">Pincode</label>
                                        <input
                                            id="co-pincode"
                                            required
                                            pattern="[0-9]{6}"
                                            inputMode="numeric"
                                            maxLength={6}
                                            name="pincode"
                                            value={formData.pincode}
                                            onChange={handleInputChange}
                                            className="w-full bg-white border border-neutral-200 px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-all rounded-sm placeholder:text-neutral-300"
                                            placeholder="6-digit PIN"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="co-phone" className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">Phone</label>
                                        <input
                                            id="co-phone"
                                            required
                                            type="tel"
                                            pattern="[0-9]{10,12}"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full bg-white border border-neutral-200 px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-all rounded-sm placeholder:text-neutral-300"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* --- Delivery channel --------------------------------------- */}
                            <section aria-labelledby="co-delivery-method">
                                <h2 id="co-delivery-method" className="text-2xl font-serif text-[#4A0404] mb-6 border-l-2 border-[#D4AF37] pl-4">
                                    Delivery Method
                                </h2>

                                {quoteStatus === "idle" && (
                                    <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-400 font-sans">
                                        Enter your pincode to see delivery options
                                    </p>
                                )}

                                {quoteStatus === "loading" && (
                                    <p className="flex items-center gap-3 text-[9px] uppercase tracking-[0.3em] text-neutral-400 font-sans" role="status">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" aria-hidden="true" />
                                        Finding the finest way to reach you
                                    </p>
                                )}

                                {quoteStatus === "error" && (
                                    <p className="text-[9px] uppercase tracking-[0.3em] text-[#4A0404] font-sans" role="alert">
                                        Delivery options are unavailable — courier shipping will be arranged
                                    </p>
                                )}

                                {deliveryOptions.length > 0 && (
                                    <div className="space-y-3" role="radiogroup" aria-label="Delivery method">
                                        {deliveryOptions.map((option) => {
                                            const Icon = METHOD_ICON[option.method];
                                            const isSelected = option.method === deliveryMethod;
                                            const optionPromise = promiseFor(option);
                                            return (
                                                <label
                                                    key={option.method}
                                                    className={`block ${option.available ? "cursor-pointer" : "cursor-not-allowed"}`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="deliveryMethod"
                                                        value={option.method}
                                                        checked={isSelected}
                                                        disabled={!option.available}
                                                        onChange={() => {
                                                            setDeliveryMethod(option.method);
                                                            setMethodChosenByUser(true);
                                                        }}
                                                        className="peer sr-only"
                                                    />
                                                    <span
                                                        className={`flex items-start justify-between gap-5 border px-5 py-4 bg-white transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] peer-focus-visible:ring-1 peer-focus-visible:ring-[#D4AF37] ${!option.available
                                                            ? "border-black/5 opacity-45"
                                                            : isSelected
                                                                ? "border-[#4A0404] shadow-[0_10px_40px_rgba(74,4,4,0.06)]"
                                                                : "border-black/10 hover:border-[#D4AF37]/50"
                                                            }`}
                                                    >
                                                        <span className="flex items-start gap-4">
                                                            <Icon
                                                                size={18}
                                                                strokeWidth={1.25}
                                                                className={isSelected && option.available ? "text-[#4A0404] mt-0.5" : "text-neutral-400 mt-0.5"}
                                                                aria-hidden="true"
                                                            />
                                                            <span className="block">
                                                                <span className="flex items-center gap-2">
                                                                    {isSelected && option.available && (
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" aria-hidden="true" />
                                                                    )}
                                                                    <span className="block font-serif text-base text-[#1A1A1A]">{option.label}</span>
                                                                </span>
                                                                {/* A date beats "3-5 business days" — and it
                                                                    already carries any atelier time. */}
                                                                <span className="block text-[9px] uppercase tracking-[0.3em] text-neutral-400 font-sans mt-2">
                                                                    {optionPromise ? optionPromise.text : option.available ? option.eta : "Unavailable"}
                                                                </span>
                                                                {optionPromise && (
                                                                    <span className="block text-[9px] uppercase tracking-[0.3em] text-neutral-300 font-sans mt-1">
                                                                        {option.eta}
                                                                        {stitchingDays > 0 ? ` · incl. ${stitchingDays} day${stitchingDays > 1 ? "s" : ""} in the atelier` : ""}
                                                                    </span>
                                                                )}
                                                                {option.note && (
                                                                    <span className="block text-xs text-neutral-500 mt-2 leading-relaxed max-w-sm">
                                                                        {option.note}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </span>
                                                        <span className="shrink-0 text-right">
                                                            <span className="block font-serif text-lg text-[#4A0404]">
                                                                {option.fee > 0 ? inr(option.fee) : "—"}
                                                            </span>
                                                            {option.fee === 0 && (
                                                                <span className="block text-[9px] uppercase tracking-[0.3em] text-neutral-400 font-sans mt-1">
                                                                    Complimentary
                                                                </span>
                                                            )}
                                                        </span>
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}

                                {isPickup && selectedOption?.address && (
                                    <div className="mt-6 border border-[#D4AF37]/30 bg-[#F9F5F0] px-6 py-5">
                                        <p className="text-[9px] uppercase tracking-[0.3em] text-[#D4AF37] font-sans mb-3">Collect from</p>
                                        <p className="font-serif text-lg text-[#1A1A1A] leading-relaxed">{selectedOption.address}</p>
                                        {selectedOption.note && (
                                            <p className="text-xs text-neutral-500 mt-3 leading-relaxed">{selectedOption.note}</p>
                                        )}
                                    </div>
                                )}
                            </section>

                            {/* --- Payment: UPI first, the way India pays ------------------ */}
                            <section aria-labelledby="co-payment-method">
                                <h2 id="co-payment-method" className="text-2xl font-serif text-[#4A0404] mb-6 border-l-2 border-[#D4AF37] pl-4">
                                    Payment Method
                                </h2>
                                <div className="space-y-3" role="radiogroup" aria-label="Payment method">
                                    {PAY_CHOICES.map(({ choice, title, blurb, icon: Icon }) => {
                                        const isSelected = payChoice === choice;
                                        return (
                                            <label key={choice} className="block cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="payChoice"
                                                    value={choice}
                                                    checked={isSelected}
                                                    onChange={() => setPayChoice(choice)}
                                                    className="peer sr-only"
                                                />
                                                <span
                                                    className={`flex items-start justify-between gap-5 border px-5 py-4 bg-white transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] peer-focus-visible:ring-1 peer-focus-visible:ring-[#D4AF37] ${isSelected
                                                        ? "border-[#4A0404] shadow-[0_10px_40px_rgba(74,4,4,0.06)]"
                                                        : "border-black/10 hover:border-[#D4AF37]/50"
                                                        }`}
                                                >
                                                    <span className="flex items-start gap-4">
                                                        <Icon
                                                            size={18}
                                                            strokeWidth={1.25}
                                                            className={isSelected ? "text-[#4A0404] mt-0.5" : "text-neutral-400 mt-0.5"}
                                                            aria-hidden="true"
                                                        />
                                                        <span className="block">
                                                            <span className="flex items-center gap-2">
                                                                {isSelected && (
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" aria-hidden="true" />
                                                                )}
                                                                <span className="block font-serif text-base text-[#1A1A1A]">{title}</span>
                                                            </span>
                                                            <span className="block text-[9px] uppercase tracking-[0.3em] text-neutral-400 font-sans mt-2">
                                                                {blurb}
                                                            </span>
                                                        </span>
                                                    </span>
                                                    {choice === 'UPI' && (
                                                        <span className="shrink-0 text-[9px] uppercase tracking-[0.3em] text-[#D4AF37] font-sans pt-1">
                                                            Fastest
                                                        </span>
                                                    )}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                                {payChoice !== 'COD' && (
                                    <p className="mt-4 flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-neutral-400 font-sans">
                                        <ShieldCheck size={12} aria-hidden="true" />
                                        Settled securely by Razorpay — every method stays available
                                    </p>
                                )}
                            </section>

                            <section>
                                <h2 className="text-2xl font-serif text-[#4A0404] mb-6 border-l-2 border-[#D4AF37] pl-4">Contact</h2>
                                <div className="space-y-2">
                                    <label htmlFor="co-email" className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">Email Address</label>
                                    <input
                                        id="co-email"
                                        required
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full bg-white border border-neutral-200 px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-all rounded-sm"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </section>

                            <div className="pt-6">
                                {checkoutError && (
                                    <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm text-sm" role="alert">
                                        <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
                                        <span>{checkoutError}</span>
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className="w-full bg-gradient-to-r from-[#1A1A1A] to-[#0A0A0A] text-[#D4AF37] py-5 rounded-sm font-bold uppercase tracking-[0.3em] shadow-xl hover:shadow-[#D4AF37]/10 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0"
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center justify-center gap-3">
                                            <span className="w-4 h-4 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></span>
                                            Processing...
                                        </span>
                                    ) : payChoice === 'COD'
                                        ? "Place COD Order"
                                        : payChoice === 'UPI'
                                            ? "Pay by UPI"
                                            : "Proceed to Secure Payment"}
                                </button>
                                <div className="mt-6 flex items-center justify-center gap-6 opacity-30">
                                    <ShieldCheck size={20} aria-hidden="true" />
                                    <span className="text-[10px] uppercase tracking-widest font-bold font-sans">Secure RSA 2048-bit Encrypted</span>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-5">
                        <div className="bg-white border border-black/[0.03] p-8 md:p-10 sticky top-32 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                            <h3 className="text-xl font-serif mb-8 border-b pb-4">Order Summary</h3>

                            <div className="space-y-6 max-h-[300px] overflow-y-auto pr-4 mb-8 custom-scrollbar">
                                {cart.map((item) => (
                                    <div key={item.uniqueId} className="flex gap-4">
                                        <div className="relative w-16 h-20 bg-neutral-100 shrink-0">
                                            <SrivariImage
                                                src={item.images[0]}
                                                alt={item.name}
                                                fill
                                                sizes="64px"
                                                className="object-cover"
                                            />
                                            <span className="absolute -top-2 -right-2 h-5 w-5 bg-black text-white text-[10px] flex items-center justify-center rounded-full font-bold z-10">
                                                {item.quantity}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between gap-3">
                                                <h4 className="text-sm font-medium line-clamp-1">{item.name}</h4>
                                                <span className="text-sm font-medium shrink-0">
                                                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                            <p className="text-[10px] uppercase text-neutral-400 mt-1">{item.category}</p>

                                            {/* Finishing add-ons, priced under the saree they belong to */}
                                            {(item.options || []).length > 0 && (
                                                <ul className="mt-3 space-y-1.5 border-l border-[#D4AF37]/40 pl-3">
                                                    {(item.options || []).map((code) => {
                                                        const addOn = findAddOn(code);
                                                        if (!addOn) return null;
                                                        return (
                                                            <li key={code} className="flex justify-between gap-3 text-[11px]">
                                                                <span className="text-neutral-500 line-clamp-1">{addOn.label}</span>
                                                                <span className="shrink-0 text-neutral-600">
                                                                    ₹{(addOn.price * item.quantity).toLocaleString('en-IN')}
                                                                </span>
                                                            </li>
                                                        );
                                                    })}
                                                    {item.measurements && Object.keys(item.measurements).length > 0 && (
                                                        <li className="text-[10px] leading-relaxed text-neutral-400">
                                                            {formatMeasurements(item.measurements)}
                                                        </li>
                                                    )}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Coupon */}
                            <div className="mb-8">
                                {appliedCoupon ? (
                                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-sm">
                                        <div className="flex items-center gap-3">
                                            <TicketPercent size={16} className="text-emerald-600 shrink-0" aria-hidden="true" />
                                            <div>
                                                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">{appliedCoupon.code} applied</p>
                                                <p className="text-[10px] text-emerald-600">
                                                    {appliedCoupon.description || `You save ₹${appliedCoupon.discount.toLocaleString('en-IN')}`}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removeCoupon}
                                            aria-label="Remove coupon"
                                            className="p-1.5 text-emerald-500 hover:text-red-500 transition-colors"
                                        >
                                            <X size={14} aria-hidden="true" />
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <label htmlFor="coupon-code" className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 mb-2 block">
                                            Coupon Code
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                id="coupon-code"
                                                type="text"
                                                value={couponInput}
                                                onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); } }}
                                                placeholder="E.g. ROYALWELCOME"
                                                className="flex-1 min-w-0 bg-[#FDFBF7] border border-neutral-200 px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-all rounded-sm text-sm uppercase placeholder:normal-case placeholder:text-neutral-300"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleApplyCoupon}
                                                disabled={isApplyingCoupon}
                                                className="px-5 py-3 bg-[#1A1A1A] text-[#D4AF37] rounded-sm uppercase tracking-widest text-[10px] font-bold hover:bg-[#D4AF37] hover:text-[#1A1A1A] transition-colors disabled:opacity-60 shrink-0"
                                            >
                                                {isApplyingCoupon ? "..." : "Apply"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {couponError && (
                                    <p className="text-red-600 text-xs mt-2" role="alert">{couponError}</p>
                                )}
                            </div>

                            <div className="space-y-4 pt-4 border-t border-dashed">
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Subtotal</span>
                                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                                </div>
                                {appliedCoupon && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-emerald-600">Discount ({appliedCoupon.code})</span>
                                        <span className="text-emerald-600 font-medium">−₹{discount.toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">
                                        {isPickup ? "Collection" : "Delivery"}
                                        {!isPickup && selectedOption?.available && (
                                            <span className="text-neutral-400"> ({selectedOption.label})</span>
                                        )}
                                    </span>
                                    <span className={shipping > 0 ? "" : "text-[9px] uppercase tracking-[0.3em] text-neutral-500 font-sans"}>
                                        {isPickup ? "Boutique pickup" : shipping > 0 ? inr(shipping) : "Complimentary"}
                                    </span>
                                </div>
                                <div className="border-t pt-4 mt-6">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span className="font-serif">Total</span>
                                        <span className="font-serif text-[#4A0404]">₹{total.toLocaleString('en-IN')}</span>
                                    </div>
                                    {/* Prices are GST-inclusive, so tax is disclosed beneath the
                                        total rather than added to it. */}
                                    {gst?.enabled && gst.gstAmount > 0 && (
                                        <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-400 font-sans mt-2 text-right leading-relaxed">
                                            {gst.isIntraState
                                                ? `Inclusive of CGST ${inr(gst.cgst)} + SGST ${inr(gst.sgst)} (${gst.rate}%)`
                                                : `Inclusive of ${inr(gst.gstAmount)} GST (${gst.rate}%)`}
                                            {hasAddOns && " · on the sarees"}
                                        </p>
                                    )}
                                    {/* Stitching is a service under its own HSN, so it is taxed as its
                                        own line — the invoice shows the full, authoritative breakup. */}
                                    {gst?.enabled && hasAddOns && (
                                        <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-400 font-sans mt-1 text-right leading-relaxed">
                                            Finishing services taxed separately on your invoice
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* The promise, restated where the money is confirmed. */}
                            <div className="mt-10 space-y-4">
                                {selectedPromise ? (
                                    <div className="border border-[#D4AF37]/30 bg-[#F9F5F0] px-5 py-4">
                                        <p className="text-[9px] uppercase tracking-[0.3em] text-[#D4AF37] font-sans">
                                            {selectedPromise.lead}
                                        </p>
                                        <p className="font-serif text-lg text-[#1A1A1A] mt-2">{selectedPromise.label}</p>
                                        <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-400 font-sans mt-2 leading-relaxed">
                                            {selectedOption?.eta}
                                            {stitchingDays > 0
                                                ? ` · ${stitchingDays} day${stitchingDays > 1 ? "s" : ""} in the atelier`
                                                : ""}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 text-[10px] text-neutral-400 p-4 bg-neutral-50/50 rounded-sm italic">
                                        {isPickup
                                            ? <Store size={14} className="shrink-0" aria-hidden="true" />
                                            : <Truck size={14} className="shrink-0" aria-hidden="true" />}
                                        <span>
                                            {selectedOption?.available
                                                ? `${isPickup ? "Ready for collection" : "Estimated delivery"}: ${selectedOption.eta}.`
                                                : "Estimated delivery: 3-5 business days across India."}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
