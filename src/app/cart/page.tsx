"use client";

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';
import Image from 'next/image';

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

        let message = "नमस्ते Srivari! 🌸\n";
        message += "I would like to place an order.\n\n";

        message += "*Customer Details:*\n";
        message += `👤 Name: ${userDetails.name}\n`;
        message += `📱 Phone: ${userDetails.phone}\n`;
        if (userDetails.email) message += `📧 Email: ${userDetails.email}\n`;
        if (userDetails.address) message += `📍 Address: ${userDetails.address}\n`;

        message += "\n*Order Summary:*\n";
        cart.forEach((item, index) => {
            message += `${index + 1}. ${item.name} - ₹${item.price.toLocaleString('en-IN')}\n`;
        });

        message += `\n*💰 Total Amount: ₹${calculateTotal().toLocaleString('en-IN')}*`;
        message += "\n\nPlease confirm availability/shipping involved.";

        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        setIsCheckoutModalOpen(false);
    };

    return (
        <main className="bg-[#FDFBF7] min-h-screen flex flex-col font-serif text-obsidian relative">
            <Header />

            {/* Checkout Modal */}
            {isCheckoutModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/60 backdrop-blur-sm">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-heading text-maroon">Checkout Details</h2>
                            <button onClick={() => setIsCheckoutModalOpen(false)} className="text-gray-400 hover:text-obsidian">
                                <span className="text-2xl">×</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    value={userDetails.name}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-gold outline-none"
                                    placeholder="Enter your full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={userDetails.phone}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-gold outline-none"
                                    placeholder="Enter your phone number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400">(Optional)</span></label>
                                <input
                                    type="email"
                                    name="email"
                                    value={userDetails.email}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-gold outline-none"
                                    placeholder="Enter your email"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address <span className="text-gray-400">(Optional)</span></label>
                                <textarea
                                    name="address"
                                    value={userDetails.address}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-gold outline-none resize-none"
                                    placeholder="Enter full shipping address"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleWhatsAppCheckout}
                            className="w-full mt-8 py-3 bg-[#25D366] text-white font-bold tracking-wider uppercase hover:bg-[#1DA851] transition-colors rounded shadow-lg flex items-center justify-center gap-2"
                        >
                            <span>Confirm & Send on WhatsApp</span>
                        </button>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-6 py-32 flex-1">
                <h1 className="text-4xl font-heading text-maroon mb-12 border-b border-gold/30 pb-4">Shopping Cart</h1>

                {cart.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="bg-white/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag size={48} className="text-gray-300" />
                        </div>
                        <h3 className="text-2xl mb-4 text-obsidian/80">Your cart is empty</h3>
                        <p className="text-gray-500 mb-8">Looks like you haven't added any royal drapes to your collection yet.</p>
                        <Link href="/shop" className="inline-block px-8 py-4 bg-maroon text-white font-bold tracking-widest uppercase hover:bg-obsidian transition-colors">
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-6">
                            {cart.map((item) => (
                                <div key={item.uniqueId} className="flex gap-6 p-4 bg-white border border-gray-100 rounded-sm hover:shadow-md transition-shadow">
                                    <div className="relative w-24 h-32 flex-shrink-0 bg-gray-100">
                                        {item.images && item.images[0] && (
                                            <Image
                                                src={item.images[0]}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-xl font-heading text-obsidian">{item.name}</h3>
                                                <button
                                                    onClick={() => removeFromCart(item.uniqueId)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-500 uppercase tracking-wider mt-1">{item.category}</p>
                                        </div>
                                        <div className="text-lg font-bold text-maroon">
                                            ₹{item.price.toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white p-8 border border-gold/20 sticky top-24">
                                <h3 className="text-2xl font-heading mb-6">Order Summary</h3>
                                <div className="space-y-4 mb-6 border-b border-dashed border-gray-200 pb-6">
                                    <div className="flex justify-between text-obsidian/80">
                                        <span>Subtotal ({cart.length} items)</span>
                                        <span>₹{calculateTotal().toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between text-obsidian/80">
                                        <span>Shipping</span>
                                        <span className="text-green-600 font-bold">Free</span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xl font-bold text-maroon mb-8">
                                    <span>Total</span>
                                    <span>₹{calculateTotal().toLocaleString('en-IN')}</span>
                                </div>

                                <button
                                    onClick={() => setIsCheckoutModalOpen(true)}
                                    className="w-full py-4 bg-[#25D366] text-white font-bold tracking-widest uppercase hover:bg-[#1DA851] transition-colors shadow-lg flex items-center justify-center gap-2"
                                >
                                    <span>Checkout via WhatsApp</span>
                                </button>
                                <p className="text-xs text-center text-gray-400 mt-4">
                                    Secure checkout powered by WhatsApp
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </main>
    );
}
