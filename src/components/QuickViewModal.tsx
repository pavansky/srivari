"use client";

import { useState } from "react";
import { X, ShoppingBag, ArrowRight } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import SrivariImage from "./SrivariImage";
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

    const validImages = product.images.filter(img => img && img.trim() !== "");

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
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-4xl max-h-[90vh] bg-[#FDFBF7] rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-[#1A1A1A] hover:text-[#D4AF37] text-gray-800 rounded-full backdrop-blur-md transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {/* Image Gallery */}
                    <div className="bg-gray-100 h-[50vh] md:h-full relative group">
                        <SrivariImage
                            src={validImages[activeImage] || ""}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                        {validImages.length > 1 && (
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                {validImages.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(idx)}
                                        className={`w-2 h-2 rounded-full transition-all ${activeImage === idx ? "bg-[#D4AF37] w-6" : "bg-white/60 hover:bg-white"
                                            }`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                            <span className="bg-white/90 backdrop-blur-sm text-[#4A0404] text-[10px] uppercase font-bold px-3 py-1.5 tracking-wider rounded-sm shadow-sm inline-block">
                                {product.category}
                            </span>
                            {product.stock > 0 && product.stock < 5 && (
                                <span className="bg-[#D4AF37] text-white text-[10px] uppercase font-bold px-3 py-1.5 tracking-wider rounded-sm shadow-sm inline-block">
                                    Only {product.stock} Left
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Product Details */}
                    <div className="p-8 md:p-10 lg:p-12 overflow-y-auto">
                        <h2 className="text-3xl font-serif text-[#1A1A1A] mb-2">{product.name}</h2>
                        <p className="text-2xl text-[#4A0404] font-medium mb-6">₹{product.price.toLocaleString('en-IN')}</p>

                        <p className="text-gray-600 font-light leading-relaxed mb-8">
                            {product.description || "A breathtaking piece weaving tradition with modern luxury."}
                        </p>

                        {/* Hashtags */}
                        {product.hashtags && product.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-8">
                                {product.hashtags.map(tag => (
                                    <span key={tag} className="text-xs border border-[#E5E5E5] text-gray-500 px-3 py-1 rounded-full">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="space-y-4">
                            <button
                                onClick={handleAddToCart}
                                disabled={product.stock === 0 || isAdding}
                                className={`w-full flex items-center justify-center gap-2 py-4 rounded-full font-bold uppercase tracking-widest transition-all ${product.stock === 0
                                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                        : "bg-[#1A1A1A] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#1A1A1A]"
                                    }`}
                            >
                                {product.stock === 0 ? "Out of Stock" : isAdding ? "Adding..." : (
                                    <>
                                        <ShoppingBag size={18} /> Add to Cart
                                    </>
                                )}
                            </button>

                            <Link href={`/product/${product.id}`} className="block">
                                <button className="w-full flex items-center justify-center gap-2 py-4 rounded-full border border-[#1A1A1A] text-[#1A1A1A] hover:bg-gray-50 transition-colors font-bold uppercase tracking-widest">
                                    View Full Details <ArrowRight size={18} />
                                </button>
                            </Link>
                        </div>

                        {/* Delivery/Returns */}
                        <div className="mt-8 pt-8 border-t border-gray-100 text-xs text-gray-500 space-y-2">
                            <p className="flex items-center gap-2">✓ Free Shipping in India</p>
                            <p className="flex items-center gap-2">✓ 7-Day Return Policy</p>
                            <p className="flex items-center gap-2">✓ 100% Authentic Handloom</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
