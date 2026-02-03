"use client";

import Footer from '@/components/Footer';
import Link from 'next/link';
import { ShoppingBag, Trash2, ArrowRight, X, Phone, User, MapPin, Mail, ShieldCheck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';
import SrivariImage from '@/components/SrivariImage';

export default function CartPage() {
    const { cart, removeFromCart } = useCart();

    const calculateTotal = () => {
        return cart.reduce((total, item) => total + item.price, 0);
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

    const handleWhatsAppCheckout = () => {
        // Validate required fields
        if (!userDetails.name || !userDetails.phone) {
            alert("Please enter at least your Name and Phone Number.");
            return;
        }

        const phoneNumber = "919739988771";

        // Using Unicode escape sequences to ensure emojis render correctly everywhere
        let message = "Namaste Srivari! \uD83C\uDF38\n"; // 🌸
        message += "I would like to place an order.\n\n";

        message += "*Customer Details:*\n";
        message += "\uD83D\uDC64 Name: " + userDetails.name + "\n"; // 👤
        message += "\uD83D\uDCF1 Phone: " + userDetails.phone + "\n"; // 📱
        if (userDetails.email) message += "\uD83D\uDCE7 Email: " + userDetails.email + "\n"; // 📧
        if (userDetails.address) message += "\uD83D\uDCCD Address: " + userDetails.address + "\n"; // 📍

        message += "\n*Order Summary:*\n";
        cart.forEach((item, index) => {
            message += `${index + 1}. ${item.name} - \u20B9${item.price.toLocaleString('en-IN')}\n`; // ₹ symbol
        });

        message += `\n*\uD83D\uDCB0 Total Amount: \u20B9${calculateTotal().toLocaleString('en-IN')}*`; // 💰
        message += "\n\nPlease confirm availability/shipping involved.";

        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        setIsCheckoutModalOpen(false);
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
                                            <Mail size={14} /> Email
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
                                className="w-full mt-8 py-4 bg-[#1A1A1A] text-white font-bold tracking-[0.15em] uppercase text-xs hover:bg-[#D4AF37] hover:text-[#4A0404] transition-all duration-500 shadow-xl flex items-center justify-center gap-3 group"
                            >
                                <span>Proceed to WhatsApp</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
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
                                                onClick={() => removeFromCart(item.uniqueId)}
                                                className="text-neutral-300 hover:text-red-500 transition-colors p-2 -mr-2"
                                                title="Remove item"
                                            >
                                                <Trash2 size={18} strokeWidth={1.5} />
                                            </button>
                                        </div>

                                        <div className="flex items-end justify-between mt-4 sm:mt-0">
                                            <div className="text-xs text-neutral-400 font-sans">
                                                Silk Mark Certified
                                            </div>
                                            <div className="text-lg font-serif text-[#4A0404]">
                                                ₹{item.price.toLocaleString('en-IN')}
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
                                    <div className="flex justify-between items-center text-sm font-sans text-neutral-600">
                                        <span>Shipping</span>
                                        <span className="text-green-600 text-xs font-bold uppercase tracking-wider bg-green-50 px-2 py-1">Complimentary</span>
                                    </div>
                                    <div className="h-px bg-black/5 my-2"></div>
                                    <div className="flex justify-between items-center font-serif text-xl text-[#4A0404]">
                                        <span>Total</span>
                                        <span>₹{calculateTotal().toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsCheckoutModalOpen(true)}
                                    className="w-full py-4 bg-[#4A0404] text-[#D4AF37] font-bold tracking-[0.2em] uppercase text-xs hover:bg-[#1A1A1A] transition-all duration-300 shadow-lg flex items-center justify-center gap-3 group"
                                >
                                    <span>Request Purchase</span>
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
