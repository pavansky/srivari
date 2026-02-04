"use client";

import Footer from '@/components/Footer';
import Link from 'next/link';
import { ShoppingBag, Trash2, ArrowRight, X, Phone, User, MapPin, Mail, ShieldCheck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';
import SrivariImage from '@/components/SrivariImage';

export default function CartPage() {
    const { cart, removeFromCart, updateQuantity } = useCart();

    const calculateTotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [userDetails, setUserDetails] = useState({
        name: '',
        phone: '',
        email: '',
        address: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setUserDetails(prev => ({ ...prev, [name]: value }));
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [shippingCost, setShippingCost] = useState(0); // 0 = Complimentary or Not Calculated
    const [pincode, setPincode] = useState('');
    const [isCheckingPincode, setIsCheckingPincode] = useState(false);
    const [courierName, setCourierName] = useState('');

    // Load Razorpay Script
    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const checkShipping = async () => {
        if (!pincode || pincode.length < 6) {
            alert("Please enter a valid 6-digit pincode.");
            return;
        }

        setIsCheckingPincode(true);
        try {
            // Estimate weight: 0.8kg per saree approx (safe buffer for box)
            const totalWeight = cart.reduce((w, item) => w + (item.quantity * 0.8), 0);

            const res = await fetch('/api/shiprocket/rates', {
                method: 'POST',
                body: JSON.stringify({ pincode, weight: totalWeight })
            });

            const data = await res.json();

            if (data.success) {
                setShippingCost(data.shipping);
                setCourierName(data.courier);
                setUserDetails(prev => ({ ...prev, address: `${prev.address ? prev.address + ', ' : ''}Pincode: ${pincode}` }));
                // Auto-append pincode to address if not there, or just useful for context
            } else {
                alert("Shipping not serviceable to this pincode.");
                setShippingCost(0);
            }
        } catch (err) {
            console.error(err);
            alert("Unable to fetch shipping rates.");
        } finally {
            setIsCheckingPincode(false);
        }
    };

    const handlePayment = async () => {
        const res = await loadRazorpay();

        if (!res) {
            alert('Razorpay SDK failed to load. Are you online?');
            return;
        }

        if (!userDetails.name || !userDetails.phone || !userDetails.email) {
            alert("Please fill in all your details first.");
            return;
        }

        const subtotal = calculateTotal();
        const total = subtotal + shippingCost;

        // 1. Create Order
        const response = await fetch('/api/payment/create-order', {
            method: 'POST',
            body: JSON.stringify({
                amount: subtotal, // Sending subtotal
                shipping_cost: shippingCost,
                items: cart.map(i => ({
                    productId: i.id,
                    name: i.name,
                    price: i.price,
                    quantity: i.quantity
                })),
                customer: {
                    name: userDetails.name,
                    phone: userDetails.phone,
                    email: userDetails.email,
                    address: userDetails.address + (pincode ? ` - ${pincode}` : '')
                }
            }),
        });

        const data = await response.json();

        if (!data) {
            alert("Server error. Are you online?");
            return;
        }

        // 2. Initialize Razorpay
        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Enter the Key ID generated from the Dashboard
            amount: data.amount,
            currency: data.currency,
            name: "The Srivari",
            description: "Luxury Saree Purchase",
            image: "/logo.png", // Use local logo if available or fallback
            order_id: data.id,
            handler: async function (response: any) {
                // 3. Verify Payment
                const verifyRes = await fetch("/api/payment/verify", {
                    method: "POST",
                    body: JSON.stringify({
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature,
                    }),
                });

                const verifyData = await verifyRes.json();

                if (verifyData.success) {
                    alert("Payment Successful!");
                    // Ideally we should empty the cart here
                    // clearCart(); -> Need to destructure this from useCart if available, or just reload for now
                    window.location.reload();
                } else {
                    alert("Payment Verification Failed");
                }
            },
            prefill: {
                name: userDetails.name || "",
                email: userDetails.email || "",
                contact: userDetails.phone || "",
            },
            theme: {
                color: "#D4AF37", // Matching our Gold theme
            },
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.open();
    };

    const handleWhatsAppCheckout = async () => {
        // Validate required fields
        if (!userDetails.name || !userDetails.phone || !userDetails.email) {
            alert("To ensure we can send you tracking updates, Email is now required.");
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Create Order on Server
            const res = await fetch('/api/orders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: userDetails.name,
                    phone: userDetails.phone,
                    email: userDetails.email,
                    address: userDetails.address,
                    items: cart.map(i => ({
                        name: i.name,
                        price: i.price,
                        quantity: i.quantity,
                        productId: i.id
                    })),
                    total: calculateTotal()
                })
            });

            const data = await res.json();

            if (!data.success) {
                alert("Failed to create order. Please try again.");
                setIsSubmitting(false);
                return;
            }

            const orderId = data.orderId;

            // 2. Redirect to WhatsApp with Order ID
            const phoneNumber = "919739988771";
            let message = "Namaste Srivari! \uD83C\uDF38\n";
            message += `I have placed Order #${orderId} via the website.\n`;
            message += "I am writing to confirm availability and finalize the payment.\n\n";

            message += "*Customer Details:*\n";
            message += "\uD83D\uDC64 Name: " + userDetails.name + "\n";
            message += "\uD83D\uDCE7 Email: " + userDetails.email + "\n"; // Included in msg too

            message += "\n*Order Selection:*\n";
            cart.forEach(item => {
                message += `- ${item.name} (Qty: ${item.quantity})\n`;
            });

            message += `\n*\uD83D\uDCB0 Total Amount: \u20B9${calculateTotal().toLocaleString('en-IN')}*`;

            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');

            // Close modal / Clear cart if needed (optional, keeping cart for now in case user comes back)
            setIsCheckoutModalOpen(false);

        } catch (error) {
            alert("Something went wrong. Please check your connection.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="bg-[#FDFBF7] min-h-screen flex flex-col font-serif text-obsidian relative">

            {/* Header / Page Title - Premium Style */}
            <div className="pt-32 pb-12 bg-black/90 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[#4A0404]/20" />
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>

                <h1 className="text-4xl md:text-5xl font-heading relative z-10 text-white drop-shadow-md">
                    Your Selection
                </h1>
                <p className="mt-4 text-[#D4AF37] tracking-[0.2em] uppercase text-xs md:text-sm relative z-10 font-[family-name:var(--font-montserrat)] font-bold">
                    Curated Excellence
                </p>
            </div>

            {/* Checkout Modal - Premium Style */}
            {isCheckoutModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#FDFBF7] p-1 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-300 relative border border-[#D4AF37]/30">
                        {/* Decorative Inner Border */}
                        <div className="bg-white p-6 md:p-8 border border-[#D4AF37]/10 h-full relative overflow-hidden">
                            {/* Watermark */}
                            <div className="absolute -top-10 -right-10 opacity-[0.03] text-9xl font-heading text-[#4A0404] select-none pointer-events-none">S</div>

                            <button
                                onClick={() => setIsCheckoutModalOpen(false)}
                                className="absolute top-4 right-4 text-neutral-400 hover:text-[#4A0404] transition-colors"
                                aria-label="Close modal"
                            >
                                <X size={24} strokeWidth={1.5} />
                            </button>

                            <div className="text-center mb-8">
                                <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-bold block mb-2">Concierge Service</span>
                                <h2 className="text-3xl font-heading text-[#4A0404]">Request Purchase</h2>
                                <p className="text-neutral-500 text-xs mt-2 font-sans max-w-xs mx-auto">
                                    Our artisans will personally review your selection and verify availability via WhatsApp.
                                </p>
                            </div>

                            <div className="space-y-5 font-[family-name:var(--font-montserrat)] text-sm">
                                <div className="group">
                                    <label className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 transition-colors group-focus-within:text-[#D4AF37]">
                                        <User size={14} /> Full Name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={userDetails.name}
                                        onChange={handleInputChange}
                                        className="w-full bg-[#FDFBF7] border border-neutral-200 p-3 text-obsidian focus:border-[#D4AF37] focus:ring-0 outline-none transition-all placeholder:text-neutral-300"
                                        placeholder="E.g. Priya Sharma"
                                    />
                                </div>

                                <div className="group">
                                    <label className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 transition-colors group-focus-within:text-[#D4AF37]">
                                        <Phone size={14} /> Phone Number <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={userDetails.phone}
                                        onChange={handleInputChange}
                                        className="w-full bg-[#FDFBF7] border border-neutral-200 p-3 text-obsidian focus:border-[#D4AF37] focus:ring-0 outline-none transition-all placeholder:text-neutral-300"
                                        placeholder="+91 98765 43210"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="group">
                                        <label className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 transition-colors group-focus-within:text-[#D4AF37]">
                                            <Mail size={14} /> Email <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={userDetails.email}
                                            onChange={handleInputChange}
                                            className="w-full bg-[#FDFBF7] border border-neutral-200 p-3 text-obsidian focus:border-[#D4AF37] focus:ring-0 outline-none transition-all placeholder:text-neutral-300"
                                            placeholder="Optional"
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 transition-colors group-focus-within:text-[#D4AF37]">
                                            <MapPin size={14} /> Location
                                        </label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={userDetails.address}
                                            onChange={handleInputChange}
                                            className="w-full bg-[#FDFBF7] border border-neutral-200 p-3 text-obsidian focus:border-[#D4AF37] focus:ring-0 outline-none transition-all placeholder:text-neutral-300"
                                            placeholder="City / Region"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleWhatsAppCheckout}
                                disabled={isSubmitting}
                                className="w-full mt-8 py-4 bg-[#1A1A1A] text-white font-bold tracking-[0.15em] uppercase text-xs hover:bg-[#D4AF37] hover:text-[#4A0404] transition-all duration-500 shadow-xl flex items-center justify-center gap-3 group disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span>Processing Request...</span>
                                ) : (
                                    <>
                                        <span>Proceed to WhatsApp</span>
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-neutral-400">
                                <ShieldCheck size={12} />
                                <span>Privacy Guaranteed. Direct Artisan Contact.</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-20 flex-1">

                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-[#D4AF37]/30 bg-white/50 p-12">
                        <div className="w-20 h-20 rounded-full bg-[#FDFBF7] border border-[#D4AF37]/20 flex items-center justify-center mb-6">
                            <ShoppingBag size={32} className="text-[#D4AF37]" strokeWidth={1} />
                        </div>
                        <h3 className="text-3xl font-heading text-[#4A0404] mb-3">Your collection awaits</h3>
                        <p className="text-neutral-500 font-sans text-sm max-w-xs mb-8 leading-relaxed">
                            Discover our handwoven masterpieces and begin your journey into royal elegance.
                        </p>
                        <Link href="/shop" className="inline-flex items-center gap-2 px-8 py-3 bg-white border border-[#4A0404]/20 text-[#4A0404] hover:bg-[#4A0404] hover:text-white hover:border-[#4A0404] transition-all duration-300 uppercase tracking-widest text-xs font-bold">
                            <span>Explore Collection</span>
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">

                        {/* Cart Items List */}
                        <div className="w-full lg:w-2/3 space-y-8">
                            <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-4 mb-8">
                                <h2 className="text-xl font-heading text-[#4A0404]">Selected Masterpieces</h2>
                                <span className="text-xs text-neutral-400 font-sans tracking-widest uppercase">{cart.length} Items</span>
                            </div>

                            {cart.map((item) => (
                                <div key={item.uniqueId} className="group relative flex flex-col sm:flex-row gap-6 bg-white p-4 border border-transparent hover:border-[#D4AF37]/20 transition-all duration-500 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)]">
                                    {/* Image */}
                                    <div className="relative w-full sm:w-32 h-40 flex-shrink-0 bg-[#f0eee6] overflow-hidden">
                                        {item.images && item.images[0] && (
                                            <SrivariImage
                                                src={item.images[0]}
                                                alt={item.name}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        )}
                                        <div className="absolute inset-0 border border-black/5 pointer-events-none"></div>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-[10px] text-[#D4AF37] uppercase tracking-widest font-bold mb-1 block">
                                                    {item.category}
                                                </span>
                                                <h3 className="text-xl font-heading text-[#1A1A1A] group-hover:text-[#4A0404] transition-colors">
                                                    {item.name}
                                                </h3>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-neutral-300 hover:text-red-500 transition-colors p-2 -mr-2"
                                                title="Remove item"
                                                aria-label="Remove item"
                                            >
                                                <Trash2 size={18} strokeWidth={1.5} />
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap items-end justify-between mt-4 sm:mt-0 gap-4">
                                            {/* Quantity Control */}
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-[#1A1A1A] font-sans uppercase tracking-wider font-bold">Qty</span>
                                                <div className="flex items-center border border-[#1A1A1A] bg-white">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="w-8 h-8 flex items-center justify-center text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors"
                                                        aria-label="Decrease quantity"
                                                    >-</button>
                                                    <span className="w-8 h-8 flex items-center justify-center font-serif text-[#4A0404] font-medium border-l border-r border-[#1A1A1A]/20">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="w-8 h-8 flex items-center justify-center text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors"
                                                        aria-label="Increase quantity"
                                                    >+</button>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-xs text-neutral-400 font-sans mb-1">
                                                    Silk Mark Certified
                                                </div>
                                                <div className="text-lg font-serif text-[#4A0404]">
                                                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary Stick */}
                        <div className="w-full lg:w-1/3 lg:sticky lg:top-32">
                            <div className="bg-white p-8 border border-[#D4AF37]/20 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>

                                <h3 className="text-2xl font-heading text-[#4A0404] mb-8 text-center">Summary</h3>

                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-center text-sm font-sans text-neutral-600">
                                        <span>Subtotal</span>
                                        <span className="text-obsidian">₹{calculateTotal().toLocaleString('en-IN')}</span>
                                    </div>

                                    {/* Shipping Calculator */}
                                    <div className="py-2">
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                placeholder="Pincode"
                                                className="w-full bg-[#FDFBF7] border border-neutral-300 p-2 text-xs outline-none focus:border-[#D4AF37]"
                                                maxLength={6}
                                                value={pincode}
                                                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                                            />
                                            <button
                                                onClick={checkShipping}
                                                disabled={isCheckingPincode}
                                                className="bg-[#1A1A1A] text-white text-[10px] uppercase font-bold px-3 hover:bg-[#D4AF37] hover:text-[#1A1A1A] transition-colors whitespace-nowrap"
                                            >
                                                {isCheckingPincode ? '...' : 'Check'}
                                            </button>
                                        </div>
                                        {courierName && <p className="text-[10px] text-green-600">via {courierName}</p>}
                                    </div>

                                    <div className="flex justify-between items-center text-sm font-sans text-neutral-600">
                                        <span>Shipping</span>
                                        {shippingCost > 0 ? (
                                            <span className="text-obsidian">₹{shippingCost.toLocaleString('en-IN')}</span>
                                        ) : (
                                            <span className="text-green-600 text-xs font-bold uppercase tracking-wider bg-green-50 px-2 py-1">Complimentary / Check Pincode</span>
                                        )}
                                    </div>
                                    <div className="h-px bg-black/5 my-2"></div>
                                    <div className="flex justify-between items-center font-serif text-xl text-[#4A0404]">
                                        <span>Total</span>
                                        <span>₹{(calculateTotal() + shippingCost).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePayment}
                                    className="w-full py-4 bg-[#4A0404] text-[#D4AF37] font-bold tracking-[0.2em] uppercase text-xs hover:bg-[#1A1A1A] transition-all duration-300 shadow-lg flex items-center justify-center gap-3 group"
                                >
                                    <span>Pay Now</span>
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </button>

                                <p className="text-[10px] text-center text-neutral-400 mt-6 leading-relaxed font-sans px-4">
                                    Proceed to connect with us on WhatsApp to finalize your royal acquisition securely.
                                </p>
                            </div>

                            {/* Assurance Badge */}
                            <div className="mt-6 flex justify-center gap-6 text-neutral-400 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                                <div className="relative h-8 w-24">
                                    <SrivariImage
                                        src="/silk-mark.png"
                                        alt="Silk Mark"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </main>
    );
}
