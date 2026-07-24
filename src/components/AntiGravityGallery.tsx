"use client";

import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";
import SrivariImage, { isRenderableImageSrc } from "@/components/SrivariImage";
import SectionHeader from "@/components/ui/SectionHeader";
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
        <section id="featured-collections" ref={containerRef} className="texture-silk py-28 md:py-32 px-6 bg-obsidian relative">
            <div className="max-w-7xl mx-auto">
                <SectionHeader
                    kicker="CURATED SELECTION"
                    title="Featured Masterpieces"
                    accent="Masterpieces"
                    tone="dark"
                    note="Handpicked weaves that defy gravity — lightweight silks that float around you, each one a signed work of the loom."
                    className="mb-20"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
                    {featuredProducts.map((product, index) => {
                        const displayImage = product.images.find(isRenderableImageSrc) || "";

                        return (
                            <motion.div
                                key={product.id}
                                style={{ y: index % 2 === 0 ? y1 : y2 }} // Parallax effect
                                className="group relative"
                            >
                                <Link href={`/product/${product.id}`} className="block">
                                    <div className="zari-frame aspect-[3/4] overflow-hidden bg-[#0d0c0a] relative cursor-pointer">
                                        <SrivariImage
                                            src={displayImage}
                                            alt={product.name}
                                            fallbackLabel={product.category || "The Srivari"}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                            className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                                        />
                                        {/* Soft vignette so the frame reads on bright imagery */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                    </div>
                                </Link>

                                {/* Editorial name + price block */}
                                <div className="mt-6 flex items-end justify-between gap-4">
                                    <Link href={`/product/${product.id}`} className="min-w-0">
                                        <h3 className="text-2xl md:text-3xl font-serif leading-snug text-marble group-hover:text-gold transition-colors duration-500">
                                            {product.name}
                                        </h3>
                                        <p className="mt-1.5 font-serif text-lg text-marble/80">
                                            ₹{product.price.toLocaleString('en-IN')}
                                        </p>
                                    </Link>
                                    <Link
                                        href={`/product/${product.id}`}
                                        className="btn-thread font-sans text-marble/60 hover:text-gold transition-colors duration-500 shrink-0 mb-1"
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
