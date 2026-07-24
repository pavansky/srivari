"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, Grid2X2, Grid3X3, List as ListIcon, Check, Eye, ShoppingBag, PackageCheck } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProductCard from '@/components/ProductCard';
import QuickViewModal from '@/components/QuickViewModal';
import SrivariImage from '@/components/SrivariImage';
import { useCart } from '@/context/CartContext';

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest';
type ViewMode = 'grid-large' | 'grid-standard' | 'list';

interface ShopClientProps {
    initialProducts: Product[];
    initialCategory?: string;
    initialQuery?: string;
}

/**
 * Fuzzy category equivalence, matching how homepage tiles and the collections
 * page group products ("Kanjivaram" tile ↔ product category "Kanjivaram Silk").
 * Either side containing the other counts as a match.
 */
const categoryMatches = (a: string, b: string) => {
    const x = a.trim().toLowerCase();
    const y = b.trim().toLowerCase();
    return x === y || x.includes(y) || y.includes(x);
};

export default function ShopClient({ initialProducts, initialCategory, initialQuery }: ShopClientProps) {
    // Highest catalogue price, rounded up to the nearest ₹1,000 — the price control's ceiling
    const priceCap = useMemo(() => {
        if (initialProducts.length === 0) return 100000;
        return Math.max(1000, Math.ceil(Math.max(...initialProducts.map(p => p.price)) / 1000) * 1000);
    }, [initialProducts]);

    const resolveCategoryParam = (param?: string) => {
        if (!param) return [];
        const match = Array.from(new Set(initialProducts.map(p => p.category)))
            .find(c => categoryMatches(c, param));
        return match ? [match] : [param];
    };

    // 1. Core Filter States
    const [searchQuery, setSearchQuery] = useState(initialQuery || "");
    const [activeCategories, setActiveCategories] = useState<string[]>(() => resolveCategoryParam(initialCategory));
    const [activeHashtags, setActiveHashtags] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, priceCap]);
    const [inStockOnly, setInStockOnly] = useState(false);

    // 2. UI States
    const [sortBy, setSortBy] = useState<SortOption>('featured');
    const [viewMode, setViewMode] = useState<ViewMode>('grid-standard');
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

    // Re-sync when the URL params change while already on /shop (e.g. the
    // navbar search or a footer category link) — initializers only run once.
    useEffect(() => {
        setSearchQuery(initialQuery || "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialQuery]);
    useEffect(() => {
        setActiveCategories(resolveCategoryParam(initialCategory));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialCategory]);

    // Lock body scroll when drawer is open
    useEffect(() => {
        if (isFilterDrawerOpen || quickViewProduct) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isFilterDrawerOpen, quickViewProduct]);

    // Extract dynamic metadata from products
    const categories = useMemo(() => Array.from(new Set(initialProducts.map(p => p.category))), [initialProducts]);
    const hashtags = useMemo(() => {
        const tags = new Set<string>();
        initialProducts.forEach(p => p.hashtags?.forEach(t => tags.add(t)));
        return Array.from(tags);
    }, [initialProducts]);

    const isPriceFiltered = priceRange[0] > 0 || priceRange[1] < priceCap;

    // Filter & Sort Engine
    const filteredAndSortedProducts = useMemo(() => {
        const result = initialProducts.filter(product => {
            // Search
            const matchesSearch = !searchQuery ||
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.hashtags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

            // Categories (OR logic within categories, fuzzy — see categoryMatches)
            const matchesCategory = activeCategories.length === 0 ||
                activeCategories.some(c => categoryMatches(product.category || "", c));

            // Hashtags (OR logic within hashtags)
            const matchesHashtags = activeHashtags.length === 0 || product.hashtags?.some(t => activeHashtags.includes(t));

            // Price Range
            const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];

            // Availability
            const matchesStock = !inStockOnly || product.stock > 0;

            return matchesSearch && matchesCategory && matchesHashtags && matchesPrice && matchesStock;
        });

        // Sorting
        switch (sortBy) {
            case 'price-asc':
                result.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                result.sort((a, b) => b.price - a.price);
                break;
            case 'newest':
                result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
                break;
            case 'featured':
            default:
                // Assuming initial order is featured
                break;
        }

        return result;
    }, [initialProducts, searchQuery, activeCategories, activeHashtags, priceRange, inStockOnly, sortBy]);

    // Handlers
    const toggleCategory = (cat: string) => {
        setActiveCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
    };

    const toggleHashtag = (tag: string) => {
        setActiveHashtags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const setPriceBound = (bound: 'min' | 'max', rawValue: string) => {
        const value = Math.max(0, Math.min(priceCap, Number(rawValue.replace(/\D/g, '')) || 0));
        setPriceRange(prev => bound === 'min' ? [Math.min(value, prev[1]), prev[1]] : [prev[0], Math.max(value, prev[0])]);
    };

    const clearAllFilters = () => {
        setSearchQuery("");
        setActiveCategories([]);
        setActiveHashtags([]);
        setPriceRange([0, priceCap]);
        setInStockOnly(false);
    };

    const activeFilterCount =
        activeCategories.length +
        activeHashtags.length +
        (isPriceFiltered ? 1 : 0) +
        (inStockOnly ? 1 : 0);

    const pricePresets: { label: string; range: [number, number] }[] = [
        { label: "Under ₹5,000", range: [0, 5000] },
        { label: "₹5,000 – ₹15,000", range: [5000, 15000] },
        { label: "₹15,000 – ₹30,000", range: [15000, 30000] },
        { label: "₹30,000+", range: [30000, priceCap] },
    ];

    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            {/* Header */}
            <div className="pt-32 pb-16 px-6 bg-obsidian text-marble text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
                <h1 className="text-4xl md:text-6xl font-serif text-[#D4AF37] mb-6 relative z-10 tracking-wide">The Collection</h1>
                <p className="text-white/60 tracking-[0.2em] font-medium text-xs md:text-sm uppercase relative z-10">Artistry woven into eternity</p>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 py-8">
                <Breadcrumbs />

                {/* Sticky Command Bar */}
                <div className="sticky top-20 z-30 mt-8 mb-8 flex flex-col items-end gap-4 md:flex-row md:justify-between md:items-center bg-[#FDFBF7]/90 backdrop-blur-md py-4 border-b border-[#E5E5E5]/50">

                    {/* Left: Filter Toggle & Active Count */}
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button
                            onClick={() => setIsFilterDrawerOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-white border border-[#E5E5E5] hover:border-[#D4AF37] rounded-full text-sm font-bold tracking-widest uppercase transition-all shadow-sm hover:shadow-md"
                        >
                            <SlidersHorizontal size={16} className="text-[#D4AF37]" aria-hidden="true" />
                            Filter & Sort
                            {activeFilterCount > 0 && (
                                <span className="bg-[#1A1A1A] text-[#D4AF37] w-5 h-5 rounded-full flex items-center justify-center text-[10px] ml-1">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Right: View Modes & Count */}
                    <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                        <div className="flex items-center bg-white border border-[#E5E5E5] rounded-full p-1 shadow-sm">
                            <button
                                onClick={() => setViewMode('grid-large')}
                                className={`hidden sm:block p-2 rounded-full transition-colors ${viewMode === 'grid-large' ? 'bg-[#1A1A1A] text-[#D4AF37]' : 'text-gray-400 hover:text-[#1A1A1A]'}`}
                                title="Large Grid"
                                aria-label="Large grid view"
                                aria-pressed={viewMode === 'grid-large'}
                            >
                                <Grid2X2 size={18} aria-hidden="true" />
                            </button>
                            <button
                                onClick={() => setViewMode('grid-standard')}
                                className={`p-2 rounded-full transition-colors ${viewMode === 'grid-standard' ? 'bg-[#1A1A1A] text-[#D4AF37]' : 'text-gray-400 hover:text-[#1A1A1A]'}`}
                                title="Standard Grid"
                                aria-label="Standard grid view"
                                aria-pressed={viewMode === 'grid-standard'}
                            >
                                <Grid3X3 size={18} aria-hidden="true" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-full transition-colors ${viewMode === 'list' ? 'bg-[#1A1A1A] text-[#D4AF37]' : 'text-gray-400 hover:text-[#1A1A1A]'}`}
                                title="List View"
                                aria-label="List view"
                                aria-pressed={viewMode === 'list'}
                            >
                                <ListIcon size={18} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="text-sm font-sans text-gray-400 hidden lg:block mr-2">
                            Showing {filteredAndSortedProducts.length} items
                        </div>
                    </div>
                </div>

                {/* Active Filter Chips Container */}
                <AnimatePresence>
                    {activeFilterCount > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="flex flex-wrap items-center gap-2 mb-8 overflow-hidden"
                        >
                            <span className="text-xs text-gray-400 mr-2 uppercase tracking-wider font-bold">Active:</span>
                            {activeCategories.map(cat => (
                                <span key={cat} className="flex items-center gap-1 bg-[#F5F2EB] border border-[#D4AF37]/20 text-[#4A0404] px-3 py-1 rounded-full text-xs font-medium">
                                    {cat}
                                    <button onClick={() => toggleCategory(cat)} aria-label={`Remove ${cat} filter`}>
                                        <X size={12} className="cursor-pointer hover:text-red-500" aria-hidden="true" />
                                    </button>
                                </span>
                            ))}
                            {activeHashtags.map(tag => (
                                <span key={tag} className="flex items-center gap-1 bg-[#F5F2EB] border border-[#D4AF37]/20 text-[#4A0404] px-3 py-1 rounded-full text-xs font-medium">
                                    #{tag}
                                    <button onClick={() => toggleHashtag(tag)} aria-label={`Remove ${tag} filter`}>
                                        <X size={12} className="cursor-pointer hover:text-red-500" aria-hidden="true" />
                                    </button>
                                </span>
                            ))}
                            {isPriceFiltered && (
                                <span className="flex items-center gap-1 bg-[#F5F2EB] border border-[#D4AF37]/20 text-[#4A0404] px-3 py-1 rounded-full text-xs font-medium">
                                    ₹{priceRange[0].toLocaleString('en-IN')} – ₹{priceRange[1].toLocaleString('en-IN')}
                                    <button onClick={() => setPriceRange([0, priceCap])} aria-label="Remove price filter">
                                        <X size={12} className="cursor-pointer hover:text-red-500" aria-hidden="true" />
                                    </button>
                                </span>
                            )}
                            {inStockOnly && (
                                <span className="flex items-center gap-1 bg-[#F5F2EB] border border-[#D4AF37]/20 text-[#4A0404] px-3 py-1 rounded-full text-xs font-medium">
                                    In Stock
                                    <button onClick={() => setInStockOnly(false)} aria-label="Remove in-stock filter">
                                        <X size={12} className="cursor-pointer hover:text-red-500" aria-hidden="true" />
                                    </button>
                                </span>
                            )}
                            <button onClick={clearAllFilters} className="text-xs text-[#D4AF37] hover:underline ml-2 font-medium">
                                Clear All
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Product Grid / List */}
                <div className={
                    viewMode === 'list'
                        ? 'flex flex-col gap-6'
                        : `grid gap-x-6 gap-y-12 ${viewMode === 'grid-large'
                            ? 'grid-cols-1 md:grid-cols-2'
                            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                        }`
                }>
                    <AnimatePresence mode="popLayout">
                        {filteredAndSortedProducts.map((product) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                                key={product.id}
                            >
                                {viewMode === 'list' ? (
                                    <ProductListCard product={product} onQuickView={setQuickViewProduct} />
                                ) : (
                                    <ProductCard
                                        product={product}
                                        onQuickView={setQuickViewProduct}
                                    />
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredAndSortedProducts.length === 0 && (
                    <div className="text-center py-32 border border-dashed border-[#E5E5E5] rounded-2xl bg-white mt-12">
                        <Search className="w-12 h-12 text-[#D4AF37]/30 mx-auto mb-6" aria-hidden="true" />
                        <h3 className="text-2xl font-serif text-[#1A1A1A] mb-2">No masterpieces found</h3>
                        <p className="text-gray-500 font-sans mb-6">Try adjusting your filters or search terms.</p>
                        <button onClick={clearAllFilters} className="px-8 py-3 bg-[#1A1A1A] text-[#D4AF37] rounded-full uppercase tracking-widest text-xs font-bold hover:bg-[#D4AF37] hover:text-[#1A1A1A] transition-colors">
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>

            {/* Slide-out Filter Drawer */}
            <AnimatePresence>
                {isFilterDrawerOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsFilterDrawerOpen(false)}
                            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-full sm:w-[450px] bg-white z-50 shadow-2xl flex flex-col"
                        >
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between px-8 py-6 border-b border-[#E5E5E5]">
                                <h2 className="text-xl font-serif text-[#1A1A1A]">Filter & Sort</h2>
                                <button onClick={() => setIsFilterDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Close filters">
                                    <X size={20} className="text-gray-500" aria-hidden="true" />
                                </button>
                            </div>

                            {/* Drawer Scrollable Content */}
                            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-10 custom-scrollbar">

                                {/* Search */}
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Search</h3>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search collection..."
                                            aria-label="Search collection"
                                            className="w-full pl-10 pr-4 py-3 bg-[#F9F5F0] border border-transparent focus:border-[#D4AF37] rounded-lg outline-none transition-all font-sans"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" />
                                    </div>
                                </div>

                                {/* Sort */}
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Sort By</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'featured', label: 'Featured' },
                                            { id: 'newest', label: 'Newest Arrivals' },
                                            { id: 'price-asc', label: 'Price: Low to High' },
                                            { id: 'price-desc', label: 'Price: High to Low' }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setSortBy(opt.id as SortOption)}
                                                className={`py-3 px-4 text-sm font-medium rounded-lg border transition-all ${sortBy === opt.id
                                                    ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-[#4A0404]'
                                                    : 'border-[#E5E5E5] bg-white text-gray-600 hover:border-gray-300'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Price Range */}
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Price Range</h3>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="flex-1">
                                            <label htmlFor="price-min" className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Min</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" aria-hidden="true">₹</span>
                                                <input
                                                    id="price-min"
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={priceRange[0]}
                                                    onChange={(e) => setPriceBound('min', e.target.value)}
                                                    className="w-full pl-7 pr-3 py-2.5 bg-[#F9F5F0] border border-transparent focus:border-[#D4AF37] rounded-lg outline-none transition-all font-sans text-sm"
                                                />
                                            </div>
                                        </div>
                                        <span className="text-gray-300 mt-5" aria-hidden="true">—</span>
                                        <div className="flex-1">
                                            <label htmlFor="price-max" className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Max</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" aria-hidden="true">₹</span>
                                                <input
                                                    id="price-max"
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={priceRange[1]}
                                                    onChange={(e) => setPriceBound('max', e.target.value)}
                                                    className="w-full pl-7 pr-3 py-2.5 bg-[#F9F5F0] border border-transparent focus:border-[#D4AF37] rounded-lg outline-none transition-all font-sans text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min={0}
                                        max={priceCap}
                                        step={500}
                                        value={priceRange[1]}
                                        onChange={(e) => setPriceRange(prev => [Math.min(prev[0], Number(e.target.value)), Number(e.target.value)])}
                                        aria-label="Maximum price"
                                        className="w-full accent-[#D4AF37] mb-4"
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        {pricePresets.map(preset => {
                                            const isActive = priceRange[0] === preset.range[0] && priceRange[1] === preset.range[1];
                                            return (
                                                <button
                                                    key={preset.label}
                                                    onClick={() => setPriceRange(preset.range)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isActive
                                                        ? 'bg-[#1A1A1A] text-[#D4AF37]'
                                                        : 'bg-[#F9F5F0] text-gray-600 hover:bg-[#E5E5E5]'
                                                        }`}
                                                >
                                                    {preset.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Availability */}
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Availability</h3>
                                    <button
                                        role="switch"
                                        aria-checked={inStockOnly}
                                        onClick={() => setInStockOnly(v => !v)}
                                        className="flex items-center justify-between w-full group"
                                    >
                                        <span className="flex items-center gap-3 text-sm text-gray-600 group-hover:text-[#1A1A1A] transition-colors">
                                            <PackageCheck size={16} className="text-[#D4AF37]" aria-hidden="true" />
                                            In stock only
                                        </span>
                                        <span
                                            aria-hidden="true"
                                            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${inStockOnly ? 'bg-[#1A1A1A]' : 'bg-neutral-200'}`}
                                        >
                                            <span
                                                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${inStockOnly ? 'translate-x-[22px] bg-[#D4AF37]' : 'translate-x-0.5'}`}
                                            ></span>
                                        </span>
                                    </button>
                                </div>

                                {/* Categories */}
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Categories</h3>
                                    <div className="space-y-3">
                                        {categories.map(cat => {
                                            const isActive = activeCategories.includes(cat);
                                            return (
                                                <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={isActive}
                                                        onChange={() => toggleCategory(cat)}
                                                        className="sr-only"
                                                    />
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isActive ? 'bg-[#1A1A1A] border-[#1A1A1A]' : 'border-gray-300 group-hover:border-[#D4AF37]'
                                                        }`}>
                                                        {isActive && <Check size={14} className="text-white" aria-hidden="true" />}
                                                    </div>
                                                    <span className={`text-sm ${isActive ? 'text-[#1A1A1A] font-bold' : 'text-gray-600 group-hover:text-[#1A1A1A]'}`}>
                                                        {cat}
                                                    </span>
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Style / Hashtags */}
                                {hashtags.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Style & Occasion</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {hashtags.slice(0, 15).map(tag => {
                                                const isActive = activeHashtags.includes(tag);
                                                return (
                                                    <button
                                                        key={tag}
                                                        onClick={() => toggleHashtag(tag)}
                                                        className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all ${isActive
                                                            ? 'bg-[#1A1A1A] text-[#D4AF37]'
                                                            : 'bg-[#F9F5F0] text-gray-600 hover:bg-[#E5E5E5]'
                                                            }`}
                                                    >
                                                        #{tag}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                            </div>

                            {/* Drawer Footer Actions */}
                            <div className="p-6 border-t border-[#E5E5E5] bg-gray-50 flex gap-4">
                                <button
                                    onClick={clearAllFilters}
                                    className="flex-1 py-4 uppercase text-xs font-bold tracking-widest text-gray-500 hover:text-[#1A1A1A] transition-colors"
                                >
                                    Clear All
                                </button>
                                <button
                                    onClick={() => setIsFilterDrawerOpen(false)}
                                    className="flex-1 py-4 bg-[#1A1A1A] text-[#D4AF37] uppercase text-xs font-bold tracking-widest rounded-full shadow-lg hover:shadow-xl hover:bg-[#D4AF37] hover:text-[#1A1A1A] transition-all"
                                >
                                    View Results ({filteredAndSortedProducts.length})
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Quick View Modal Overlay */}
            {quickViewProduct && (
                <QuickViewModal
                    product={quickViewProduct}
                    onClose={() => setQuickViewProduct(null)}
                />
            )}
        </div>
    );
}

/** Horizontal card used by the "list" view mode. */
function ProductListCard({ product, onQuickView }: { product: Product; onQuickView: (p: Product) => void }) {
    const { addToCart } = useCart();
    const displayImage = product.images.find(img => img && img.trim() !== "") || "";

    return (
        <div className="group flex flex-col sm:flex-row bg-white border border-[#E5E5E5]/60 hover:border-[#D4AF37] transition-all duration-500 overflow-hidden shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] rounded-sm">
            {/* Image */}
            <Link
                href={`/product/${product.id}`}
                prefetch={true}
                className="relative w-full sm:w-52 md:w-60 aspect-[4/3] sm:aspect-[3/4] shrink-0 overflow-hidden bg-[#F9F5F0]"
                aria-label={`View details of ${product.name}`}
            >
                <SrivariImage
                    src={displayImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 240px"
                    className={`object-cover transition-transform duration-1000 group-hover:scale-110 ${product.stock <= 0 ? 'grayscale opacity-70' : ''}`}
                />
                {product.stock <= 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
                        <div className="px-4 py-2 bg-white/90 backdrop-blur-sm border border-[#D4AF37]/30 shadow-xl">
                            <span className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-[0.3em]">Sold Out</span>
                        </div>
                    </div>
                )}
            </Link>

            {/* Details */}
            <div className="flex-1 flex flex-col justify-between p-6 md:p-8 gap-4">
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-sans">{product.category}</p>
                    <Link href={`/product/${product.id}`} prefetch={true}>
                        <h3 className="text-xl md:text-2xl font-serif text-[#1A1A1A] group-hover:text-[#4A0404] transition-colors mb-2">
                            {product.name}
                        </h3>
                    </Link>
                    <p className="text-sm text-gray-500 font-sans font-light leading-relaxed line-clamp-2">
                        {product.description?.split('--- \n**Wash & Care Instructions:**\n')[0]}
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                    <span className="text-lg font-medium text-[#4A0404] font-sans">
                        ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onQuickView(product)}
                            aria-label={`Quick view of ${product.name}`}
                            className="p-3 rounded-full border border-[#E5E5E5] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#D4AF37] hover:border-[#1A1A1A] transition-colors"
                        >
                            <Eye size={16} aria-hidden="true" />
                        </button>
                        <button
                            onClick={() => addToCart(product)}
                            disabled={product.stock <= 0}
                            aria-label={`Add ${product.name} to bag`}
                            className="flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] text-[#D4AF37] rounded-full uppercase tracking-widest text-[10px] font-bold hover:bg-[#D4AF37] hover:text-[#1A1A1A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ShoppingBag size={14} aria-hidden="true" />
                            Add to Bag
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
