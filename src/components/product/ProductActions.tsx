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
        <div className="space-y-8">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, x: 80 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 80 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        role="status"
                        className="fixed top-24 right-4 sm:right-6 bg-[#0A0A0A]/95 backdrop-blur-md border border-[#D4AF37]/50 text-marble px-5 py-4 flex items-center gap-4 z-[100] shadow-2xl max-w-[calc(100vw-2rem)]"
                    >
                        {toast.showCartLink && displayImage && (
                            <div className="w-10 h-10 relative overflow-hidden flex-shrink-0 border border-[#D4AF37]/30">
                                <SrivariImage src={displayImage} alt={product.name} fill sizes="40px" className="object-cover" />
                            </div>
                        )}
                        <div className="flex flex-col min-w-0">
                            <span className="text-[9px] text-[#D4AF37] uppercase tracking-[0.3em] font-sans">{toast.title}</span>
                            <span className="text-sm font-serif truncate max-w-[200px]">{toast.message}</span>
                        </div>
                        {toast.showCartLink && (
                            <div className="ml-2 pl-4 border-l border-white/10">
                                <Link
                                    href="/cart"
                                    className="btn-thread text-marble hover:text-[#D4AF37] transition-colors whitespace-nowrap !pb-1"
                                >
                                    View Bag
                                </Link>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col gap-4">
                {/* Quantity — square, hairline, serif numerals */}
                {product.stock > 0 && (
                    <div className="flex items-center gap-6 mb-2">
                        <span className="text-[10px] font-sans uppercase tracking-[0.3em] text-[#1A1A1A]/70">
                            Quantity
                        </span>
                        <div className="flex items-center border border-black/20">
                            <button
                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                className="w-12 h-12 flex items-center justify-center font-serif text-xl font-light text-[#1A1A1A] hover:bg-[#4A0404] hover:text-[#FDFBF7] transition-colors duration-300"
                                aria-label="Decrease quantity"
                            >
                                &minus;
                            </button>
                            <span
                                aria-live="polite"
                                className="w-12 h-12 flex items-center justify-center font-serif text-xl text-[#4A0404] border-l border-r border-black/10"
                            >
                                {quantity}
                            </span>
                            <button
                                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                                className="w-12 h-12 flex items-center justify-center font-serif text-xl font-light text-[#1A1A1A] hover:bg-[#4A0404] hover:text-[#FDFBF7] transition-colors duration-300"
                                aria-label="Increase quantity"
                            >
                                +
                            </button>
                        </div>
                    </div>
                )}

                {product.stock > 0 ? (
                    <>
                        <button onClick={handleAddToCart} className="btn-royal btn-royal--oxblood w-full">
                            Add to Bag
                            <ShoppingBag size={15} aria-hidden="true" />
                        </button>

                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-royal w-full group"
                        >
                            Acquire via WhatsApp
                            <Share2 size={15} className="transition-transform duration-500 group-hover:translate-x-1" aria-hidden="true" />
                        </a>
                    </>
                ) : (
                    <div className="space-y-4">
                        <div className="w-full border border-black/10 text-neutral-400 h-14 flex items-center justify-center gap-4 cursor-not-allowed">
                            <span className="font-sans text-[11px] uppercase tracking-[0.28em]">Currently Unavailable</span>
                            <X size={16} aria-hidden="true" />
                        </div>
                        <p className="text-[10px] text-center text-neutral-400 font-sans tracking-wide">
                            This masterpiece has been acquired.{" "}
                            <Link href="/shop" className="underline underline-offset-4 text-[#4A0404] hover:text-[#D4AF37] transition-colors">
                                Explore similar treasures
                            </Link>
                        </p>
                    </div>
                )}
            </div>

            {/* Wishlist / share — square hairline icon buttons */}
            <div className="flex items-center gap-4 border-t border-b border-black/10 py-5">
                <button
                    type="button"
                    onClick={handleWishlistToggle}
                    aria-pressed={saved}
                    aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
                    className={`w-12 h-12 flex items-center justify-center border transition-colors duration-300 cursor-pointer touch-manipulation select-none
                        ${saved ? "border-[#4A0404] text-[#4A0404]" : "border-black/15 text-neutral-500 hover:border-[#4A0404] hover:text-[#4A0404]"}
                    `}
                    style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
                >
                    <Heart
                        size={16}
                        aria-hidden="true"
                        className={`pointer-events-none transition-transform duration-300 ${saved ? "fill-current" : ""}`}
                    />
                </button>

                <button
                    type="button"
                    onClick={handleShare}
                    aria-label={`Share ${product.name}`}
                    className="w-12 h-12 flex items-center justify-center border border-black/15 text-neutral-500 hover:border-[#4A0404] hover:text-[#4A0404] transition-colors duration-300 cursor-pointer touch-manipulation select-none"
                    style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
                >
                    <Share2 size={16} className="pointer-events-none" aria-hidden="true" />
                </button>

                <span className="ml-2 text-[9px] font-sans uppercase tracking-[0.3em] text-neutral-400">
                    {saved ? "Saved to your wishlist" : "Wishlist · Share"}
                </span>
            </div>

            {/* Assurance strip */}
            <div className="flex items-center gap-8 text-neutral-400 text-[9px] uppercase tracking-[0.3em] font-sans">
                <span className="flex items-center gap-2">
                    <Check size={12} className="text-[#D4AF37]" aria-hidden="true" /> Silk Mark Certified
                </span>
                <span className="flex items-center gap-2">
                    <Truck size={12} className="text-[#D4AF37]" aria-hidden="true" /> Insured Delivery
                </span>
            </div>
        </div>
    );
}
