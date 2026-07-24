"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart, Share2, ShoppingBag, Truck, X } from "lucide-react";
import { Product } from "@/types";
import { SITE_CONFIG } from "@/config/site";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import SrivariImage from "@/components/SrivariImage";

interface ToastState {
    title: string;
    message: string;
    showCartLink?: boolean;
}

export default function ProductActions({ product }: { product: Product }) {
    const [quantity, setQuantity] = useState(1);
    const [toast, setToast] = useState<ToastState | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { addToCart } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

    const saved = isInWishlist(product.id);
    const displayImage = product.images?.find((img) => img && img.trim() !== "") || "";

    useEffect(() => {
        return () => {
            if (toastTimer.current) clearTimeout(toastTimer.current);
        };
    }, []);

    const showToast = (next: ToastState) => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast(next);
        toastTimer.current = setTimeout(() => setToast(null), 4000);
    };

    // Rings the temple bell via CartContext -> useAudio
    const handleAddToCart = () => {
        addToCart(product, quantity);
        showToast({
            title: "Added to Bag",
            message: `${product.name} (x${quantity})`,
            showCartLink: true,
        });
    };

    const handleWishlistToggle = () => {
        if (saved) {
            removeFromWishlist(product.id);
            showToast({ title: "Wishlist", message: "Removed from your wishlist" });
        } else {
            addToWishlist(product);
            showToast({ title: "Wishlist", message: "Saved to your wishlist" });
        }
    };

    const copyFallback = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            showToast({ title: "Share", message: "Link copied to clipboard" });
        } catch {
            try {
                const el = document.createElement("textarea");
                el.value = text;
                el.style.position = "fixed";
                el.style.opacity = "0";
                document.body.appendChild(el);
                el.focus();
                el.select();
                document.execCommand("copy");
                document.body.removeChild(el);
                showToast({ title: "Share", message: "Link copied to clipboard" });
            } catch {
                showToast({ title: "Share", message: "Please copy the URL manually" });
            }
        }
    };

    const handleShare = () => {
        const shareUrl = window.location.href;
        const shareData = {
            title: `Srivari - ${product.name}`,
            text: `Check out this beautiful ${product.name} on Srivari!`,
            url: shareUrl,
        };

        if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
            navigator.share(shareData).catch((err) => {
                if (err?.name !== "AbortError") copyFallback(shareUrl);
            });
        } else {
            copyFallback(shareUrl);
        }
    };

    const whatsappMessage = `Hi, I'd like to order *${product.name}* (Price: ₹${product.price.toLocaleString("en-IN")}). Qty: ${quantity}. Please confirm availability.`;
    const whatsappUrl = SITE_CONFIG.links.whatsapp(whatsappMessage);

    return (
        <div className="space-y-6">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, x: 80 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 80 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        role="status"
                        className="fixed top-24 right-4 sm:right-6 bg-black/90 backdrop-blur-md border border-[#D4AF37]/50 text-white px-5 py-4 flex items-center gap-4 z-[100] shadow-2xl rounded-sm max-w-[calc(100vw-2rem)]"
                    >
                        {toast.showCartLink && displayImage && (
                            <div className="w-10 h-10 relative rounded overflow-hidden flex-shrink-0 border border-[#D4AF37]/30">
                                <SrivariImage src={displayImage} alt={product.name} fill sizes="40px" className="object-cover" />
                            </div>
                        )}
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] text-[#D4AF37] uppercase tracking-widest font-bold">{toast.title}</span>
                            <span className="text-sm font-sans truncate max-w-[200px]">{toast.message}</span>
                        </div>
                        {toast.showCartLink && (
                            <div className="ml-2 pl-4 border-l border-white/10">
                                <Link
                                    href="/cart"
                                    className="text-xs text-white hover:text-[#D4AF37] uppercase tracking-widest transition-colors font-bold whitespace-nowrap"
                                >
                                    View Bag
                                </Link>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col gap-3">
                {/* Quantity Selector */}
                {product.stock > 0 && (
                    <div className="flex items-center gap-6 mb-4">
                        <span className="text-xs font-sans uppercase tracking-widest font-bold text-[#1A1A1A]">
                            Quantity
                        </span>
                        <div className="flex items-center border border-[#1A1A1A] bg-white">
                            <button
                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                className="w-12 h-12 flex items-center justify-center text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors text-xl font-light"
                                aria-label="Decrease quantity"
                            >
                                -
                            </button>
                            <span
                                aria-live="polite"
                                className="w-12 h-12 flex items-center justify-center font-serif text-xl text-[#4A0404] font-medium border-l border-r border-[#1A1A1A]/20"
                            >
                                {quantity}
                            </span>
                            <button
                                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                                className="w-12 h-12 flex items-center justify-center text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors text-xl font-light"
                                aria-label="Increase quantity"
                            >
                                +
                            </button>
                        </div>
                    </div>
                )}

                {product.stock > 0 ? (
                    <>
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-[#1A1A1A] text-white h-14 flex items-center justify-center gap-4 hover:bg-[#D4AF37] hover:text-[#1A1A1A] transition-all duration-500 shadow-xl shadow-black/5 group"
                        >
                            <span className="font-sans text-xs font-bold uppercase tracking-[0.2em]">Acquire via WhatsApp</span>
                            <Share2 size={18} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                        </a>

                        <button
                            onClick={handleAddToCart}
                            className="w-full bg-transparent border border-[#1A1A1A] text-[#1A1A1A] h-14 flex items-center justify-center gap-4 hover:bg-[#1A1A1A] hover:text-white transition-all duration-500"
                        >
                            <span className="font-sans text-xs font-bold uppercase tracking-[0.2em]">Add to Bag</span>
                            <ShoppingBag size={18} aria-hidden="true" />
                        </button>
                    </>
                ) : (
                    <div className="space-y-4">
                        <div className="w-full bg-neutral-100 text-neutral-400 h-14 flex items-center justify-center gap-4 cursor-not-allowed border border-neutral-200">
                            <span className="font-sans text-xs font-bold uppercase tracking-[0.2em]">Currently Unavailable</span>
                            <X size={18} aria-hidden="true" />
                        </div>
                        <p className="text-[10px] text-center text-neutral-400 font-medium tracking-wide">
                            This masterpiece has been acquired.{" "}
                            <Link href="/shop" className="underline hover:text-[#D4AF37]">
                                Explore similar treasures
                            </Link>
                        </p>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-center gap-8 border-t border-b border-black/5 py-4">
                <button
                    type="button"
                    onClick={handleWishlistToggle}
                    aria-pressed={saved}
                    className={`group flex items-center gap-2 transition-colors font-sans text-xs uppercase tracking-widest font-medium cursor-pointer touch-manipulation select-none p-4 -m-4
                        ${saved ? "text-red-600" : "text-neutral-500 hover:text-black"}
                    `}
                    style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
                >
                    <Heart
                        size={16}
                        aria-hidden="true"
                        className={`transition-transform duration-300 pointer-events-none ${saved ? "fill-current scale-110" : "group-hover:scale-110"}`}
                    />
                    <span className="pointer-events-none">{saved ? "Saved" : "Wishlist"}</span>
                </button>

                <div className="w-[1px] h-4 bg-neutral-300" aria-hidden="true"></div>

                <button
                    type="button"
                    onClick={handleShare}
                    className="group flex items-center gap-2 text-neutral-500 hover:text-black transition-colors font-sans text-xs uppercase tracking-widest font-medium cursor-pointer touch-manipulation select-none p-4 -m-4"
                    style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
                >
                    <Share2 size={16} className="group-hover:-translate-y-0.5 transition-transform pointer-events-none" aria-hidden="true" />
                    <span className="pointer-events-none">Share</span>
                </button>
            </div>

            {/* Assurance strip */}
            <div className="flex items-center justify-center gap-6 text-neutral-400 text-[10px] uppercase tracking-widest font-sans">
                <span className="flex items-center gap-1.5">
                    <Check size={12} className="text-[#D4AF37]" aria-hidden="true" /> Silk Mark Certified
                </span>
                <span className="flex items-center gap-1.5">
                    <Truck size={12} className="text-[#D4AF37]" aria-hidden="true" /> Insured Delivery
                </span>
            </div>
        </div>
    );
}
