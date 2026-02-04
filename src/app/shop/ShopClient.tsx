"use client";

import { useState } from 'react';
import { Product } from '@/types';
import Link from 'next/link';
import SrivariImage from '@/components/SrivariImage';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, ArrowRight } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function ShopClient({ initialProducts }: { initialProducts: Product[] }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");

    const categories = ["All", ...Array.from(new Set(initialProducts.map(p => p.category)))];

    const filteredProducts = initialProducts.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.hashtags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = activeFilter === "All" || product.category === activeFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-[#F9F5F0]">

            {/* Header */}
            <div className="pt-28 pb-12 px-6 bg-[#050505] text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
                <h1 className="text-4xl md:text-5xl font-serif text-[#D4AF37] mb-4 relative z-10">The Collection</h1>
                <p className="text-white/60 tracking-widest text-sm relative z-10">EXQUISITE SILKS & HANDLOOMS</p>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <Breadcrumbs />

                {/* Search & Filter Bar */}
                <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-12 sticky top-24 z-30 bg-[#F9F5F0]/80 backdrop-blur-md p-4 rounded-xl border border-[#D4AF37]/10 shadow-sm">
                    {/* Search */}
                    <div className="relative w-full md:w-96 group">
                        <input
                            type="text"
                            placeholder="Search for 'Kanjivaram'..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-[#E5E5E5] rounded-full focus:border-[#D4AF37] outline-none transition-all group-hover:shadow-md"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-[#D4AF37] transition-colors" size={20} />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveFilter(cat)}
                                className={`px-6 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${activeFilter === cat
                                        ? 'bg-[#4A0404] text-white shadow-lg scale-105'
                                        : 'bg-white text-gray-600 hover:bg-[#D4AF37]/10 hover:text-[#4A0404]'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence>
                        {filteredProducts.map((product) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                                key={product.id}
                                className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2"
                            >
                                <Link href={`/product/${product.id}`}>
                                    <div className="relative h-[400px] overflow-hidden">
                                        <SrivariImage
                                            src={product.images[0]}
                                            alt={product.name}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                            <span className="bg-white/90 text-[#4A0404] px-6 py-3 rounded-full text-sm font-bold tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-2">
                                                VIEW DRAPE <ArrowRight size={14} />
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-6 text-center">
                                        <p className="text-xs text-[#D4AF37] font-semibold tracking-widest uppercase mb-2">{product.category}</p>
                                        <h3 className="text-lg font-serif text-[#1A1A1A] group-hover:text-[#4A0404] transition-colors mb-2">{product.name}</h3>
                                        <p className="text-gray-900 font-bold">₹{product.price.toLocaleString()}</p>

                                        {/* Hashtags */}
                                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                                            {product.hashtags?.slice(0, 2).map(tag => (
                                                <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-sm">#{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-20">
                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-serif text-xl">No masterpieces found.</p>
                        <button onClick={() => { setSearchQuery(''); setActiveFilter('All') }} className="mt-4 text-[#D4AF37] hover:underline">Clear Filters</button>
                    </div>
                )}

            </div>
        </div>
    );
}
