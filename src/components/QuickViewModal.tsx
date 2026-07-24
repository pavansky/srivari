"use client";

import { useState } from "react";
import { X, ShoppingBag, ArrowRight } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import SrivariImage, { isRenderableImageSrc } from "./SrivariImage";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface QuickViewModalProps {
    product: Product;
    onClose: () => void;
}

export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
    const { addToCart } = useCart();
    const [activeImage, setActiveImage] = useState(0);
    const [isAdding, setIsAdding] = useState(false);

    const handleAddToCart = () => {
        setIsAdding(true);
        addToCart(product);
        setTimeout(() => {
            setIsAdding(false);
            onClose(); // Optional: close after adding, or leave open
        }, 800);
    };

    const validImages = product.images.filter(isRenderableImageSrc);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.97, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: 16 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-full max-w-4xl max-h-[90vh] bg-[#FDFBF7] border border-[#D4AF37]/20 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        aria-label="Close quick view"
                        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center border border-[#E5E5E5] bg-[#FDFBF7]/90 backdrop-blur-md text-[#1A1A1A] hover:bg-[#0A0A0A] hover:border-[#0A0A0A] hover:text-[#D4AF37] transition-colors duration-300"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>

                    {/* Image Gallery */}
                    <div className="bg-[#F3EEE5] h-[50vh] md:h-full relative group">
                        <SrivariImage
                            src={validImages[activeImage] || ""}
                            alt={product.name}
                            fallbackLabel={product.category || "The Srivari"}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                        {validImages.length > 1 && (
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-2">
                                {validImages.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(idx)}
                                        aria-label={`View image ${idx + 1} of ${product.name}`}
                                        className="py-2"
                                    >
                                        <span
                                            className={`block h-[2px] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${activeImage === idx ? "w-8 bg-[#D4AF37]" : "w-4 bg-white/60 hover:bg-white"}`}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Stock state — a quiet mark, not a shouting chip */}
                        {product.stock > 0 && product.stock < 5 && (
                            <span className="absolute top-5 left-5 z-10 flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] font-sans text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" aria-hidden="true" />
                                Only {product.stock} left
                            </span>
                        )}
                    </div>

                    {/* Product Details */}
                    <div className="p-8 md:p-10 lg:p-12 overflow-y-auto">
                        <p className="text-[9px] uppercase tracking-[0.35em] text-[#C8AA6E] font-sans mb-3">{product.category}</p>
                        <h2 className="font-serif text-3xl md:text-4xl leading-[1.1] text-[#1A1A1A] mb-3">{product.name}</h2>
                        <p className="font-serif text-2xl text-[#4A0404] mb-6">₹{product.price.toLocaleString('en-IN')}</p>

                        <p className="text-sm text-[#595959] font-sans font-light leading-relaxed mb-8">
                            {product.description || "A breathtaking piece weaving tradition with modern luxury."}
                        </p>

                        {/* Hashtags */}
                        {product.hashtags && product.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-8">
                                {product.hashtags.map(tag => (
                                    <span key={tag} className="border border-[#E5E5E5] text-[#595959] px-3 py-1 text-[10px] uppercase tracking-[0.15em] font-sans">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="space-y-6">
                            <button
                                onClick={handleAddToCart}
                                disabled={product.stock === 0 || isAdding}
                                className="btn-royal btn-royal--oxblood w-full disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {product.stock === 0 ? "Out of Stock" : isAdding ? "Adding..." : (
                                    <>
                                        <ShoppingBag size={15} aria-hidden="true" /> Add to Cart
                                    </>
                                )}
                            </button>

                            <Link href={`/product/${product.id}`} className="btn-thread font-sans text-[#1A1A1A]">
                                View Full Details <ArrowRight size={13} aria-hidden="true" />
                            </Link>
                        </div>

                        {/* Delivery/Returns */}
                        <div className="mt-10 pt-8 border-t border-[#E5E5E5] space-y-3">
                            <p className="flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-[#595959] font-sans">
                                <span className="w-1 h-1 rounded-full bg-[#D4AF37]" aria-hidden="true" /> Free Shipping in India
                            </p>
                            <p className="flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-[#595959] font-sans">
                                <span className="w-1 h-1 rounded-full bg-[#D4AF37]" aria-hidden="true" /> 7-Day Return Policy
                            </p>
                            <p className="flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-[#595959] font-sans">
                                <span className="w-1 h-1 rounded-full bg-[#D4AF37]" aria-hidden="true" /> 100% Authentic Handloom
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
