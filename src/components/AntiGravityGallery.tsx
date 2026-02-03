"use client";

import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

// Placeholder data - In real app, this comes from Supabase
const products = [
    { id: 1, name: "Ether Silk Saree", price: "₹25,000", image: "/placeholder-1.jpg" },
    { id: 2, name: "Obsidian Drape", price: "₹32,000", image: "/placeholder-2.jpg" },
    { id: 3, name: "Gold Dust Weave", price: "₹28,000", image: "/placeholder-3.jpg" },
    { id: 4, name: "Nebula Six Yards", price: "₹45,000", image: "/placeholder-4.jpg" },
];

export default function AntiGravityGallery() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    });

    const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]); // Moves faster (closer depth)

    return (
        <section ref={containerRef} className="py-32 px-6 min-h-screen bg-obsidian relative">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
                    <div>
                        <span className="text-gold uppercase tracking-widest text-sm">Curated Selection</span>
                        <h2 className="text-4xl md:text-6xl font-serif text-marble mt-4">Anti-Gravity<br />Series</h2>
                    </div>
                    <p className="text-marble/60 max-w-sm text-sm leading-relaxed">
                        Our latest collection defies gravity, featuring lightweight silks that float around you.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-12 md:gap-24">
                    {products.map((product, index) => (
                        <motion.div
                            key={product.id}
                            style={{ y: index % 2 === 0 ? y1 : y2 }} // Parallax effect
                            className="group relative"
                        >
                            <div className="aspect-[3/4] overflow-hidden rounded-sm bg-gray-900 relative">
                                {/* Placeholder for images since we don't have them yet */}
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-marble/20 text-4xl font-serif">
                                    {product.id}
                                </div>
                                {/* If we had images: 
                 <Image src={product.image} alt={product.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                 */}

                                {/* Floating Price Tag */}
                                <div className="absolute bottom-6 left-6 bg-white/10 backdrop-blur-md px-4 py-2 border border-white/20 text-marble">
                                    <span className="block text-xs uppercase tracking-wider text-gold">Price</span>
                                    <span className="font-serif text-lg">{product.price}</span>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-between items-center bg-transparent">
                                <h3 className="text-2xl font-serif text-marble group-hover:text-gold transition-colors">{product.name}</h3>
                                <button className="text-sm uppercase tracking-widest text-marble/60 hover:text-white transition-colors border-b border-transparent hover:border-white pb-1">View</button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
