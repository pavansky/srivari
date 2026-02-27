"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { CreditCard, Truck, ShieldCheck, ArrowLeft, ShoppingBag, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function CheckoutPage() {
    const { cart, clearCart } = useCart();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);

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

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shipping = 0; // VIP Free Shipping for Srivari
    const total = subtotal + shipping;

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
        setFormData({
            email: user?.email || "",
            firstName: addr.firstName,
            lastName: addr.lastName,
            address: `${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}${addr.landmark ? ' (Landmark: ' + addr.landmark + ')' : ''}`,
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode,
            phone: addr.phone
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (selectedAddressId) setSelectedAddressId(""); // Unselect if modified
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        try {
            const orderPayload = {
                ...formData,
                items: cart,
                total: total,
                userId: user?.id,
                paymentMethod: "Razorpay"
            };

            const response = await fetch("/api/orders/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderPayload)
            });

            if (response.ok) {
                const { orderId } = await response.json();
                clearCart();
                router.push(`/order-tracking?id=${orderId}`);
            } else {
                throw new Error("Failed to create order");
            }
        } catch (error) {
            alert("Checkout failed. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (cart.length === 0 && !isProcessing) {
        return (
            <main className="bg-[#FDFBF7] min-h-screen">
                <Navbar />
                <div className="container mx-auto px-6 py-32 text-center">
                    <ShoppingBag className="mx-auto w-16 h-16 text-[#D4AF37]/20 mb-6" />
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
            <Navbar />

            <div className="container mx-auto px-6 py-24 md:py-32">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400 mb-8 border-b border-black/5 pb-4">
                    <Link href="/cart" className="hover:text-[#D4AF37] transition-colors">Bag</Link>
                    <span>/</span>
                    <span className="text-[#1A1A1A] font-bold">Checkout</span>
                    <span>/</span>
                    <span>Payment</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Checkout Form Form */}
                    <div className="lg:col-span-7">
                        <form onSubmit={handleCheckout} className="space-y-10">

                            {user && savedAddresses.length > 0 && (
                                <section className="bg-white border border-gold/10 p-6 rounded-sm shadow-sm">
                                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gold mb-4 flex items-center gap-2">
                                        <MapPin size={14} /> Select Registered Residence
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
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">First Name</label>
                                        <input
                                            required
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            className="w-full bg-white border border-neutral-200 px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-all rounded-sm placeholder:text-neutral-300"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">Last Name</label>
                                        <input
                                            required
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            className="w-full bg-white border border-neutral-200 px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-all rounded-sm placeholder:text-neutral-300"
                                        />
                                    </div>
                                </div>
                                <div className="mt-6 space-y-2">
                                    <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">Address</label>
                                    <input
                                        required
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        className="w-full bg-white border border-neutral-200 px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-all rounded-sm placeholder:text-neutral-300"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">City</label>
                                        <input
                                            required
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            className="w-full bg-white border border-neutral-200 px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-all rounded-sm placeholder:text-neutral-300"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">Pincode</label>
                                        <input
                                            required
                                            pattern="[0-9]{6}"
                                            name="pincode"
                                            value={formData.pincode}
                                            onChange={handleInputChange}
                                            className="w-full bg-white border border-neutral-200 px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-all rounded-sm placeholder:text-neutral-300"
                                            placeholder="6-digit PIN"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">Phone</label>
                                        <input
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

                            <section>
                                <h2 className="text-2xl font-serif text-[#4A0404] mb-6 border-l-2 border-[#D4AF37] pl-4">Contact</h2>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">Email Address</label>
                                    <input
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
                                    ) : "Complete Secure Order"}
                                </button>
                                <div className="mt-6 flex items-center justify-center gap-6 opacity-30">
                                    <ShieldCheck size={20} />
                                    <span className="text-[10px] uppercase tracking-widest font-bold font-sans">Secure RSA 2048-bit Encrypted</span>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Order Summary Summary */}
                    <div className="lg:col-span-5">
                        <div className="bg-white border border-black/[0.03] p-8 md:p-10 sticky top-32 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                            <h3 className="text-xl font-serif mb-8 border-b pb-4">Order Summary</h3>

                            <div className="space-y-6 max-h-[300px] overflow-y-auto pr-4 mb-8 custom-scrollbar">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="relative w-16 h-20 bg-neutral-100 shrink-0">
                                            <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                                            <span className="absolute -top-2 -right-2 h-5 w-5 bg-black text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                                                {item.quantity}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-medium line-clamp-1">{item.name}</h4>
                                            <p className="text-[10px] uppercase text-neutral-400 mt-1">{item.category}</p>
                                        </div>
                                        <div className="text-sm font-medium">
                                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4 pt-4 border-t border-dashed">
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Subtotal</span>
                                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Shipping (Royal Complimentary)</span>
                                    <span className="text-green-600 font-bold tracking-tight">FREE</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t pt-4 mt-6">
                                    <span className="font-serif">Total</span>
                                    <span className="text-[#4A0404]">₹{total.toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            <div className="mt-10 space-y-4">
                                <div className="flex items-center gap-3 text-[10px] text-neutral-400 p-4 bg-neutral-50/50 rounded-sm italic">
                                    <Truck size={14} className="shrink-0" />
                                    <span>Estimated delivery: 3-5 business days across India.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
