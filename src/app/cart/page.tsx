"use client";

import Footer from '@/components/Footer';
import Link from 'next/link';
import { ShoppingBag, Trash2, ArrowRight, X, Phone, User, MapPin, Mail, ShieldCheck, MessageCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAudio } from '@/context/AudioContext';
import { useState, useEffect } from 'react';
import SrivariImage from '@/components/SrivariImage';

export default function CartPage() {
    const { cart, removeFromCart, updateQuantity } = useCart();
    const { playBell } = useAudio();

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
    const [shippingDetails, setShippingDetails] = useState({
        city: '',
        state: '',
        eta: ''
    });

    // Auto-recalculate shipping on cart change
    useEffect(() => {
        console.log("Cart/Pincode changed. Cart:", cart.length, "Pincode:", pincode);
        if (pincode && pincode.length === 6 && cart.length > 0) {
            checkShipping(true); // Silent update
        }
    }, [cart, pincode]); // Dependencies: cart contents or pincode changes

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

    const checkShipping = async (silent = false) => {
        if (!pincode || pincode.length < 6) {
            if (!silent) alert("Please enter a valid 6-digit pincode.");
            return;
        }

        setIsCheckingPincode(true);
        try {
            // Calculate total weight dynamically
            const totalWeight = cart.reduce((w, item) => w + ((item.weight || 0.5) * item.quantity), 0);

            const res = await fetch('/api/shiprocket/serviceability', {
                method: 'POST',
                body: JSON.stringify({ pincode, weight: totalWeight })
            });

            const data = await res.json();

            if (data.success) {
                setShippingCost(data.shipping);
                setCourierName(data.courier);
                setShippingDetails({
                    city: data.city,
                    state: data.state,
                    eta: data.eta
                });
                setUserDetails(prev => ({ ...prev, address: `${prev.address ? prev.address + ', ' : ''}Pincode: ${pincode}` }));
                // Auto-append pincode to address if not there, or just useful for context
            } else {
                if (!silent) alert("Shipping not serviceable to this pincode.");
                setShippingCost(0);
                setShippingDetails({ city: '', state: '', eta: '' });
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

            // Ring the temple bell on successful order placement!
            playBell();

            // 2. Redirect to WhatsApp with Order ID
            const phoneNumber = "919739988771";
            let message = "Namaste Srivari! \uD83C\uDF38\n";
            message += `I have placed Order #${orderId} via the website.\n`;
            message += "I am writing to confirm availability and finalize the payment.\n\n";

            message += "*Customer Details:*\n";
            message += "\uD83D\uDC64 Name: " + userDetails.name + "\n";
            message += "\uD83D\uDCE7 Email: " + userDetails.email + "\n";
            if (userDetails.address) {
                message += "\uD83D\uDCCD Location: " + userDetails.address + "\n";
            }

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
        <main className="bg-[#FDFBF7] min-h-screen flex flex-col font-sans text-obsidian relative">

            {/* Header / Page Title - Premium Style */}
            <div className="pt-32 pb-12 bg-black/90 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[#4A0404]/20" />
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>

                <h1 className="text-4xl md:text-5xl font-serif relative z-10 text-white drop-shadow-md">
                    Your Selection
                </h1>
                <p className="mt-4 text-[#D4AF37] tracking-[0.2em] uppercase text-xs md:text-sm relative z-10 font-sans font-bold">
                    Curated Excellence
                </p>
            </div>

            {/* Checkout Modal - Premium Style */}
            {isCheckoutModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300 relative border border-[#D4AF37]/20 overflow-hidden">
                        {/* Watermark */}
                        <div className="absolute -top-10 -right-10 opacity-[0.03] text-9xl font-serif text-[#4A0404] select-none pointer-events-none">S</div>

                        <button
                            onClick={() => setIsCheckoutModalOpen(false)}
                            className="absolute top-4 right-4 text-neutral-400 hover:text-[#4A0404] transition-colors"
                            aria-label="Close modal"
                        >
                            <X size={24} strokeWidth={1.5} />
                        </button>

                        <div className="text-center mb-8">
                            <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-bold block mb-2">Concierge Service</span>
                            <h2 className="text-3xl font-serif text-[#4A0404]">Request Purchase</h2>
                            <p className="text-neutral-500 text-xs mt-2 font-sans max-w-xs mx-auto">
                                Our artisans will personally review your selection and verify availability via WhatsApp.
                            </p>
                        </div>

                        <div className="space-y-5 font-sans text-sm">
                            <div className="group">
                                <label className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 transition-colors group-focus-within:text-[#D4AF37]">
                                    <User size={14} /> Full Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={userDetails.name}
                                    onChange={handleInputChange}
                                    className="w-full bg-[#fcfcfa] border border-neutral-200 rounded-xl p-3 text-obsidian focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 outline-none transition-all placeholder:text-neutral-300"
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
                                    className="w-full bg-[#fcfcfa] border border-neutral-200 rounded-xl p-3 text-obsidian focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 outline-none transition-all placeholder:text-neutral-300"
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
                                        className="w-full bg-[#fcfcfa] border border-neutral-200 rounded-xl p-3 text-obsidian focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 outline-none transition-all placeholder:text-neutral-300"
                                        placeholder="Required string"
                                    />
                                </div>
                                <div className="group md:col-span-2">
                                    <label className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 transition-colors group-focus-within:text-[#D4AF37]">
                                        <MapPin size={14} /> Location / Delivery Address
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            name="address"
                                            value={userDetails.address}
                                            onChange={handleInputChange}
                                            className="w-full bg-[#fcfcfa] border border-neutral-200 rounded-xl p-3 text-obsidian focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 outline-none transition-all placeholder:text-neutral-300"
                                            placeholder="City / Region"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if ("geolocation" in navigator) {
                                                    navigator.geolocation.getCurrentPosition(async (position) => {
                                                        const { latitude, longitude } = position.coords;
                                                        try {
                                                            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                                                            const data = await res.json();
                                                            if (data.city || data.principalSubdivision) {
                                                                const locString = [data.city, data.principalSubdivision, data.postcode].filter(Boolean).join(", ");
                                                                setUserDetails(prev => ({ ...prev, address: locString }));
                                                            } else {
                                                                alert("Could not detect precise location. Please enter manually.");
                                                            }
                                                        } catch (e) {
                                                            alert("Failed to get location details.");
                                                        }
                                                    }, () => {
                                                        alert("Location permission denied. Please enter manually.");
                                                    });
                                                } else {
                                                    alert("Geolocation is not supported by your browser.");
                                                }
                                            }}
                                            className="bg-[#fcfcfa] border border-neutral-200 rounded-xl text-neutral-500 px-4 hover:text-[#D4AF37] hover:border-[#D4AF37] hover:bg-white transition-all shadow-sm shrink-0 flex items-center justify-center gap-2 text-xs font-bold uppercase"
                                            title="Use Device Location"
                                        >
                                            <MapPin size={14} /> <span>Detect</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleWhatsAppCheckout}
                            disabled={isSubmitting}
                            className="w-full mt-8 py-4 bg-[#1A1A1A] text-white rounded-xl font-bold tracking-[0.15em] uppercase text-xs hover:bg-[#D4AF37] hover:text-[#1A1A1A] transition-all duration-300 shadow-xl hover:-translate-y-1 flex items-center justify-center gap-3 group disabled:opacity-70 disabled:cursor-not-allowed border border-[#1A1A1A]/10"
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
            )}

            <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-20 flex-1">

                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-[#D4AF37]/30 bg-white/50 rounded-3xl p-12 shadow-sm">
                        <div className="w-20 h-20 rounded-full bg-[#FDFBF7] border border-[#D4AF37]/20 flex items-center justify-center mb-6 shadow-inner">
                            <ShoppingBag size={32} className="text-[#D4AF37]" strokeWidth={1} />
                        </div>
                        <h3 className="text-3xl font-serif text-[#4A0404] mb-3">Your collection awaits</h3>
                        <p className="text-neutral-500 font-sans text-sm max-w-xs mb-8 leading-relaxed">
                            Discover our handwoven masterpieces and begin your journey into royal elegance.
                        </p>
                        <Link href="/shop" className="inline-flex items-center gap-2 px-8 py-4 bg-white border border-[#4A0404]/20 text-[#4A0404] rounded-xl hover:bg-[#4A0404] hover:text-white hover:border-[#4A0404] shadow-sm hover:shadow-md transition-all duration-300 uppercase tracking-widest text-xs font-bold">
                            <span>Explore Collection</span>
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">

                        {/* Cart Items List */}
                        <div className="w-full lg:w-2/3 space-y-8">
                            <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-4 mb-8">
                                <h2 className="text-xl font-serif text-[#4A0404]">Selected Masterpieces</h2>
                                <span className="text-xs text-neutral-400 font-sans tracking-widest uppercase">{cart.length} Items</span>
                            </div>

                            {cart.map((item) => (
                                <div key={item.uniqueId} className="group relative flex flex-col sm:flex-row gap-6 bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#D4AF37]/10 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#D4AF37]/30 transition-all duration-500">
                                    {/* Image */}
                                    <div className="relative w-full sm:w-32 h-40 flex-shrink-0 bg-[#f0eee6] overflow-hidden rounded-xl">
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
                                                <h3 className="text-xl font-sans text-[#1A1A1A] group-hover:text-[#4A0404] transition-colors">
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
                                                <span className="text-xs text-neutral-400 font-sans uppercase tracking-wider font-bold">Qty</span>
                                                <div className="flex items-center border border-neutral-200 bg-[#FDFBF7] rounded-full overflow-hidden shadow-sm">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="w-10 h-10 flex items-center justify-center text-neutral-600 hover:bg-white hover:text-[#4A0404] transition-colors"
                                                        aria-label="Decrease quantity"
                                                    >-</button>
                                                    <span className="w-8 h-10 flex items-center justify-center font-sans text-obsidian font-bold">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="w-10 h-10 flex items-center justify-center text-neutral-600 hover:bg-white hover:text-[#4A0404] transition-colors"
                                                        aria-label="Increase quantity"
                                                    >+</button>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-xs text-neutral-400 font-sans mb-1">
                                                    Silk Mark Certified
                                                </div>
                                                <div className="text-lg font-sans font-medium text-[#4A0404]">
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
                            <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#D4AF37]/10 relative overflow-hidden flex flex-col">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>

                                <h3 className="text-2xl font-serif text-[#4A0404] mb-8 text-center">Summary</h3>

                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-center text-sm font-sans text-neutral-600">
                                        <span>Subtotal</span>
                                        <span className="text-obsidian font-medium">₹{calculateTotal().toLocaleString('en-IN')}</span>
                                    </div>

                                    {/* Shipping Calculator */}
                                    <div className="py-2">
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                placeholder="Pincode"
                                                className="w-full bg-[#fcfcfa] border border-neutral-200 rounded-xl p-3 text-sm outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition-all font-sans"
                                                maxLength={6}
                                                value={pincode}
                                                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                                            />
                                            <button
                                                onClick={() => checkShipping(false)}
                                                disabled={isCheckingPincode}
                                                className="bg-[#1A1A1A] rounded-xl text-white text-[10px] uppercase font-bold px-4 hover:bg-[#D4AF37] hover:text-[#1A1A1A] hover:shadow-md transition-all whitespace-nowrap"
                                            >
                                                {isCheckingPincode ? '...' : 'Verify'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if ("geolocation" in navigator) {
                                                        navigator.geolocation.getCurrentPosition(async (position) => {
                                                            const { latitude, longitude } = position.coords;
                                                            try {
                                                                const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                                                                const data = await res.json();
                                                                if (data.postcode) {
                                                                    setPincode(data.postcode);
                                                                    // Optional: Auto-check
                                                                    // checkShipping(); 
                                                                } else {
                                                                    alert("Could not detect pincode from location.");
                                                                }
                                                            } catch (e) {
                                                                alert("Failed to get location details.");
                                                            }
                                                        }, () => {
                                                            alert("Location permission denied.");
                                                        });
                                                    } else {
                                                        alert("Geolocation is not supported by your browser.");
                                                    }
                                                }}
                                                className="bg-[#fcfcfa] border border-neutral-200 rounded-xl text-neutral-500 p-3 hover:text-[#D4AF37] hover:border-[#D4AF37] hover:bg-white transition-all shadow-sm shadow-[#D4AF37]/5 shrink-0"
                                                title="Use Current Location"
                                            >
                                                <MapPin size={16} />
                                            </button>

                                        </div>
                                        {shippingCost > 0 && (
                                            <div className="mt-3 space-y-1 bg-neutral-50 p-2 border border-neutral-100 rounded">
                                                {courierName && (
                                                    <p className="text-[10px] text-neutral-500 flex justify-between">
                                                        <span>Courier:</span>
                                                        <span className="font-bold text-obsidian">{courierName}</span>
                                                    </p>
                                                )}
                                                {shippingDetails.city && (
                                                    <p className="text-[10px] text-neutral-500 flex justify-between">
                                                        <span>Location:</span>
                                                        <span className="font-bold text-obsidian">{shippingDetails.city}, {shippingDetails.state}</span>
                                                    </p>
                                                )}
                                                {shippingDetails.eta && (
                                                    <p className="text-[10px] text-neutral-500 flex justify-between">
                                                        <span>Est. Delivery:</span>
                                                        <span className="font-bold text-[#D4AF37]">{shippingDetails.eta}</span>
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center text-sm font-sans text-neutral-600">
                                        <span>Shipping</span>
                                        {shippingCost > 0 ? (
                                            <span className="text-obsidian font-medium">₹{shippingCost.toLocaleString('en-IN')}</span>
                                        ) : (
                                            <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 rounded-full px-3 py-1">Complimentary</span>
                                        )}
                                    </div>
                                    <div className="h-px w-full bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent my-4"></div>
                                    <div className="flex justify-between items-center font-sans font-bold text-xl text-[#4A0404]">
                                        <span>Total</span>
                                        <span>₹{(calculateTotal() + shippingCost).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                <Link
                                    href="/checkout"
                                    className="w-full py-4 bg-[#1A1A1A] text-white rounded-xl font-bold tracking-[0.2em] uppercase text-xs hover:bg-[#D4AF37] hover:text-[#1A1A1A] transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-lg hover:-translate-y-1 flex items-center justify-center gap-3 group ring-1 ring-[#1A1A1A]/5 mb-3"
                                >
                                    <span>Standard Checkout</span>
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </Link>

                                <button
                                    onClick={() => setIsCheckoutModalOpen(true)}
                                    className="w-full py-4 bg-white border border-[#1A1A1A]/10 text-[#1A1A1A] rounded-xl font-bold tracking-[0.2em] uppercase text-xs hover:bg-neutral-50 transition-all duration-300 flex items-center justify-center gap-3 group"
                                >
                                    <span>WhatsApp Concierge</span>
                                    <MessageCircle size={16} className="text-[#D4AF37]" />
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
        </main >
    );
}
