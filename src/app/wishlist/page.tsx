"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import SectionHeader from "@/components/ui/SectionHeader";
import ZariDivider from "@/components/ui/ZariDivider";
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
            <h1 className="sr-only">The Wishlist</h1>

            {/* Header band */}
            <section className="pt-36 pb-14">
                <div className="container mx-auto px-4 lg:px-8">
                    <SectionHeader
                        tone="light"
                        kicker="Your Private Collection"
                        title="The Wishlist"
                        accent="Wishlist"
                        note="Treasures you hold dear, kept close until you are ready."
                    />
                </div>
                <ZariDivider tone="light" className="container mx-auto px-4 mt-12" />
            </section>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        role="status"
                        className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-[#0A0A0A]/95 backdrop-blur-md border border-[#D4AF37]/50 text-marble px-6 py-3 shadow-2xl text-[10px] uppercase tracking-[0.3em] font-sans"
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="container mx-auto px-4 lg:px-8 pb-28 flex-1">
                {wishlist.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-24 max-w-xl mx-auto">
                        <Heart size={28} className="text-[#D4AF37] mb-8" strokeWidth={1} aria-hidden="true" />
                        <h2 className="font-serif text-4xl md:text-5xl text-[#1A1A1A] leading-[1.05] mb-5">
                            Your wishlist <em className="italic text-[#4A0404]">awaits</em>
                        </h2>
                        <p className="text-neutral-500 font-sans text-sm max-w-xs mb-10 leading-relaxed">
                            Save the drapes that speak to you and return to them whenever you wish.
                        </p>
                        <Link href="/shop" className="btn-royal btn-royal--oxblood">
                            <span>Explore Collection</span>
                            <ArrowRight size={14} aria-hidden="true" />
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="flex items-baseline justify-between border-b border-black/10 pb-4 mb-12">
                            <h2 className="text-xl font-serif text-[#4A0404]">Saved Masterpieces</h2>
                            <span className="text-[9px] text-neutral-400 font-sans tracking-[0.3em] uppercase">
                                {wishlist.length} Item{wishlist.length > 1 ? "s" : ""}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-14">
                            <AnimatePresence mode="popLayout">
                                {wishlist.map((product) => (
                                    <motion.div
                                        layout
                                        key={product.id}
                                        initial={{ opacity: 0, scale: 0.97 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.97 }}
                                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                        className="flex flex-col"
                                    >
                                        <ProductCard product={product} tone="light" />
                                        <div className="flex gap-3 mt-4">
                                            <button
                                                onClick={() => handleMoveToBag(product)}
                                                disabled={product.stock <= 0}
                                                className="btn-royal btn-royal--oxblood flex-1 !px-4 !py-3 disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <ShoppingBag size={13} aria-hidden="true" />
                                                {product.stock > 0 ? "Move to Bag" : "Sold Out"}
                                            </button>
                                            <button
                                                onClick={() => handleRemove(product)}
                                                aria-label={`Remove ${product.name} from wishlist`}
                                                className="w-11 flex items-center justify-center border border-black/15 text-neutral-400 hover:text-[#4A0404] hover:border-[#4A0404] transition-colors duration-300"
                                            >
                                                <Trash2 size={15} strokeWidth={1.5} aria-hidden="true" />
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
