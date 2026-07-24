"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { Product } from "@/types";

export default function WishlistPage() {
    const { wishlist, removeFromWishlist, refreshWishlist } = useWishlist();
    const { addToCart } = useCart();
    const [toast, setToast] = useState<string | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Refresh stale entries (price/stock) and drop removed products on mount
    useEffect(() => {
        refreshWishlist();
    }, [refreshWishlist]);

    useEffect(() => {
        return () => {
            if (toastTimer.current) clearTimeout(toastTimer.current);
        };
    }, []);

    const showToast = (message: string) => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast(message);
        toastTimer.current = setTimeout(() => setToast(null), 3000);
    };

    const handleMoveToBag = (product: Product) => {
        addToCart(product);
        removeFromWishlist(product.id);
        showToast(`${product.name} moved to your bag`);
    };

    const handleRemove = (product: Product) => {
        removeFromWishlist(product.id);
        showToast("Removed from wishlist");
    };

    return (
        <main className="bg-[#FDFBF7] min-h-screen flex flex-col font-sans text-[#1A1A1A]">
            {/* Header */}
            <section className="bg-obsidian text-marble pt-32 pb-16 relative overflow-hidden text-center">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
                <h1 className="text-4xl md:text-6xl font-serif text-[#D4AF37] mb-4 relative z-10 tracking-wide">Wishlist</h1>
                <p className="text-white/60 tracking-[0.2em] font-medium text-xs md:text-sm uppercase relative z-10">
                    Treasures you hold dear
                </p>
            </section>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        role="status"
                        className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-black/90 backdrop-blur-md border border-[#D4AF37]/50 text-white px-6 py-3 rounded-sm shadow-2xl text-xs uppercase tracking-widest font-bold"
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16 flex-1">
                {wishlist.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-[#D4AF37]/30 bg-white/50 rounded-3xl p-12 shadow-sm max-w-2xl mx-auto">
                        <div className="w-20 h-20 rounded-full bg-[#FDFBF7] border border-[#D4AF37]/20 flex items-center justify-center mb-6 shadow-inner">
                            <Heart size={32} className="text-[#D4AF37]" strokeWidth={1} aria-hidden="true" />
                        </div>
                        <h2 className="text-3xl font-serif text-[#4A0404] mb-3">Your wishlist awaits</h2>
                        <p className="text-neutral-500 font-sans text-sm max-w-xs mb-8 leading-relaxed">
                            Save the drapes that speak to you and return to them whenever you wish.
                        </p>
                        <Link
                            href="/shop"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-white border border-[#4A0404]/20 text-[#4A0404] rounded-xl hover:bg-[#4A0404] hover:text-white hover:border-[#4A0404] shadow-sm hover:shadow-md transition-all duration-300 uppercase tracking-widest text-xs font-bold"
                        >
                            <span>Explore Collection</span>
                            <ArrowRight size={14} aria-hidden="true" />
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-4 mb-10">
                            <h2 className="text-xl font-serif text-[#4A0404]">Saved Masterpieces</h2>
                            <span className="text-xs text-neutral-400 font-sans tracking-widest uppercase">
                                {wishlist.length} Item{wishlist.length > 1 ? "s" : ""}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
                            <AnimatePresence mode="popLayout">
                                {wishlist.map((product) => (
                                    <motion.div
                                        layout
                                        key={product.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.35 }}
                                        className="flex flex-col"
                                    >
                                        <ProductCard product={product} />
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={() => handleMoveToBag(product)}
                                                disabled={product.stock <= 0}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1A1A1A] text-[#D4AF37] rounded-sm uppercase tracking-widest text-[10px] font-bold hover:bg-[#D4AF37] hover:text-[#1A1A1A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <ShoppingBag size={14} aria-hidden="true" />
                                                {product.stock > 0 ? "Move to Bag" : "Sold Out"}
                                            </button>
                                            <button
                                                onClick={() => handleRemove(product)}
                                                aria-label={`Remove ${product.name} from wishlist`}
                                                className="p-3 border border-neutral-200 rounded-sm text-neutral-400 hover:text-red-500 hover:border-red-200 transition-colors"
                                            >
                                                <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </>
                )}
            </div>

            <Footer />
        </main>
    );
}
