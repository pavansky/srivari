"use client";

import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";
import SrivariImage from "@/components/SrivariImage";
import Link from "next/link";
import { Product } from "@/types";

interface AntiGravityGalleryProps {
    products: Product[];
}

/**
 * AntiGravityGallery Component
 *
 * Displays a curated list of featured products with a parallax scrolling effect.
 * Receives products from the server (homepage) — no client-side fetching.
 */
export default function AntiGravityGallery({ products }: AntiGravityGalleryProps) {
    const containerRef = useRef(null);

    const featuredProducts = products.slice(0, 4);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    });

    const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]); // Moves faster (closer depth)

    if (featuredProducts.length === 0) return null;

    return (
        <section id="featured-collections" ref={containerRef} className="py-32 px-6 bg-obsidian relative">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-8">
                    <div>
                        <span className="text-gold uppercase tracking-widest text-sm">Curated Selection</span>
                        <h2 className="text-4xl md:text-6xl font-serif text-marble mt-4">Featured<br />Masterpieces</h2>
                    </div>
                    <p className="text-marble/60 max-w-sm text-sm leading-relaxed">
                        Handpicked weaves that defy gravity — lightweight silks that float around you,
                        each one a signed work of the loom.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
                    {featuredProducts.map((product, index) => {
                        const displayImage = product.images.find(img => img && img.trim() !== "") || "";

                        return (
                            <motion.div
                                key={product.id}
                                style={{ y: index % 2 === 0 ? y1 : y2 }} // Parallax effect
                                className="group relative"
                            >
                                <Link href={`/product/${product.id}`} className="block">
                                    <div className="aspect-[3/4] overflow-hidden rounded-sm bg-gray-900 relative cursor-pointer">
                                        <SrivariImage
                                            src={displayImage}
                                            alt={product.name}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />

                                        {/* Floating Price Tag */}
                                        <div className="absolute bottom-6 left-6 bg-white/10 backdrop-blur-md px-4 py-2 border border-white/20 text-marble">
                                            <span className="block text-xs uppercase tracking-wider text-gold">Price</span>
                                            <span className="font-serif text-lg">₹{product.price.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                </Link>
                                <div className="mt-6 flex justify-between items-center gap-4 bg-transparent">
                                    <Link href={`/product/${product.id}`}>
                                        <h3 className="text-2xl font-serif text-marble group-hover:text-gold transition-colors">{product.name}</h3>
                                    </Link>
                                    <Link
                                        href={`/product/${product.id}`}
                                        className="text-sm uppercase tracking-widest text-marble/60 hover:text-white transition-colors border-b border-transparent hover:border-white pb-1 shrink-0"
                                    >
                                        View
                                    </Link>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    );
}
