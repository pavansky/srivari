"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, Grid2X2, Grid3X3, List as ListIcon, Check, Eye, ShoppingBag, PackageCheck } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProductCard from '@/components/ProductCard';
import QuickViewModal from '@/components/QuickViewModal';
import SectionHeader from '@/components/ui/SectionHeader';
import SrivariImage, { isRenderableImageSrc } from '@/components/SrivariImage';
import { useCart } from '@/context/CartContext';

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest';
type ViewMode = 'grid-large' | 'grid-standard' | 'list';

interface ShopClientProps {
    initialProducts: Product[];
    initialCategory?: string;
    initialQuery?: string;
}

/** Micro-label used for drawer section headings. */
const MICRO_LABEL = "text-[10px] font-sans uppercase tracking-[0.3em] text-[#595959] mb-4";

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
            {/* Editorial hero band */}
            <div className="texture-silk relative bg-obsidian text-marble pt-36 pb-20 px-6">
                <div className="max-w-[1400px] mx-auto">
                    <h1 className="sr-only">The Collection</h1>
                    <SectionHeader
                        tone="dark"
                        kicker="The Srivari Atelier"
                        title="The Collection"
                        accent="Collection"
                        note="Handwoven silk sarees, sourced loom-direct from the master weavers of the south."
                    />
                </div>
                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent"
                />
            </div>

            <div className="max-w-[1400px] mx-auto px-6 py-8">
                <Breadcrumbs />

                {/* Sticky Command Bar */}
                <div className="sticky top-20 z-30 mt-8 mb-10 flex flex-col gap-4 md:flex-row md:justify-between md:items-center bg-[#FDFBF7]/90 backdrop-blur-md py-4 border-b border-[#E5E5E5]/60">

                    {/* Left: Filter Toggle & Active Count */}
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button
                            onClick={() => setIsFilterDrawerOpen(true)}
                            className="btn-thread font-sans text-[#1A1A1A]"
                        >
                            <SlidersHorizontal size={14} className="text-[#D4AF37]" aria-hidden="true" />
                            Filter & Sort
                            {activeFilterCount > 0 && (
                                <span className="ml-1 flex h-5 w-5 items-center justify-center bg-[#0A0A0A] text-[10px] tracking-normal text-[#D4AF37]">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Right: View Modes & Count */}
                    <div className="flex items-center gap-6 w-full md:w-auto justify-end">
                        <div className="text-[10px] font-sans uppercase tracking-[0.3em] text-[#595959] hidden lg:block">
                            Showing {filteredAndSortedProducts.length} items
                        </div>

                        <div className="flex items-center">
                            <button
                                onClick={() => setViewMode('grid-large')}
                                className={`hidden sm:flex h-10 w-10 items-center justify-center border transition-colors duration-300 ${viewMode === 'grid-large' ? 'bg-[#0A0A0A] border-[#0A0A0A] text-[#D4AF37]' : 'border-[#E5E5E5] text-[#8A8680] hover:text-[#0A0A0A] hover:border-[#0A0A0A]'}`}
                                title="Large Grid"
                                aria-label="Large grid view"
                                aria-pressed={viewMode === 'grid-large'}
                            >
                                <Grid2X2 size={16} aria-hidden="true" />
                            </button>
                            <button
                                onClick={() => setViewMode('grid-standard')}
                                className={`flex h-10 w-10 items-center justify-center border sm:-ml-px transition-colors duration-300 ${viewMode === 'grid-standard' ? 'bg-[#0A0A0A] border-[#0A0A0A] text-[#D4AF37]' : 'border-[#E5E5E5] text-[#8A8680] hover:text-[#0A0A0A] hover:border-[#0A0A0A]'}`}
                                title="Standard Grid"
                                aria-label="Standard grid view"
                                aria-pressed={viewMode === 'grid-standard'}
                            >
                                <Grid3X3 size={16} aria-hidden="true" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex h-10 w-10 items-center justify-center border -ml-px transition-colors duration-300 ${viewMode === 'list' ? 'bg-[#0A0A0A] border-[#0A0A0A] text-[#D4AF37]' : 'border-[#E5E5E5] text-[#8A8680] hover:text-[#0A0A0A] hover:border-[#0A0A0A]'}`}
                                title="List View"
                                aria-label="List view"
                                aria-pressed={viewMode === 'list'}
                            >
                                <ListIcon size={16} aria-hidden="true" />
                            </button>
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
                            <span className="text-[10px] font-sans uppercase tracking-[0.3em] text-[#595959] mr-2">Active</span>
                            {activeCategories.map(cat => (
                                <span key={cat} className="flex items-center gap-2 bg-white border border-[#E5E5E5] text-[#4A0404] px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] font-sans">
                                    {cat}
                                    <button onClick={() => toggleCategory(cat)} aria-label={`Remove ${cat} filter`}>
                                        <X size={11} className="cursor-pointer text-[#8A8680] hover:text-[#4A0404] transition-colors" aria-hidden="true" />
                                    </button>
                                </span>
                            ))}
                            {activeHashtags.map(tag => (
                                <span key={tag} className="flex items-center gap-2 bg-white border border-[#E5E5E5] text-[#4A0404] px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] font-sans">
                                    #{tag}
                                    <button onClick={() => toggleHashtag(tag)} aria-label={`Remove ${tag} filter`}>
                                        <X size={11} className="cursor-pointer text-[#8A8680] hover:text-[#4A0404] transition-colors" aria-hidden="true" />
                                    </button>
                                </span>
                            ))}
                            {isPriceFiltered && (
                                <span className="flex items-center gap-2 bg-white border border-[#E5E5E5] text-[#4A0404] px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] font-sans">
                                    ₹{priceRange[0].toLocaleString('en-IN')} – ₹{priceRange[1].toLocaleString('en-IN')}
                                    <button onClick={() => setPriceRange([0, priceCap])} aria-label="Remove price filter">
                                        <X size={11} className="cursor-pointer text-[#8A8680] hover:text-[#4A0404] transition-colors" aria-hidden="true" />
                                    </button>
                                </span>
                            )}
                            {inStockOnly && (
                                <span className="flex items-center gap-2 bg-white border border-[#E5E5E5] text-[#4A0404] px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] font-sans">
                                    In Stock
                                    <button onClick={() => setInStockOnly(false)} aria-label="Remove in-stock filter">
                                        <X size={11} className="cursor-pointer text-[#8A8680] hover:text-[#4A0404] transition-colors" aria-hidden="true" />
                                    </button>
                                </span>
                            )}
                            <button onClick={clearAllFilters} className="btn-thread font-sans text-[#4A0404] ml-2">
                                Clear All
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Product Grid / List */}
                <div className={
                    viewMode === 'list'
                        ? 'flex flex-col gap-6'
                        : `grid gap-x-8 gap-y-14 ${viewMode === 'grid-large'
                            ? 'grid-cols-1 md:grid-cols-2'
                            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                        }`
                }>
                    <AnimatePresence mode="popLayout">
                        {filteredAndSortedProducts.map((product) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                key={product.id}
                            >
                                {viewMode === 'list' ? (
                                    <ProductListCard product={product} onQuickView={setQuickViewProduct} />
                                ) : (
                                    <ProductCard
                                        product={product}
                                        tone="light"
                                        onQuickView={setQuickViewProduct}
                                    />
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredAndSortedProducts.length === 0 && (
                    <div className="text-center py-32 border border-[#E5E5E5] bg-white mt-12">
                        <Search className="w-10 h-10 text-[#D4AF37]/40 mx-auto mb-8" aria-hidden="true" />
                        <h3 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] mb-3">
                            No <em className="italic text-[#4A0404]">masterpieces</em> found
                        </h3>
                        <p className="text-sm text-[#595959] font-sans mb-10">Try adjusting your filters or search terms.</p>
                        <button onClick={clearAllFilters} className="btn-thread font-sans text-[#4A0404]">
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
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="fixed top-0 right-0 bottom-0 w-full sm:w-[450px] bg-[#FDFBF7] z-50 shadow-2xl flex flex-col"
                        >
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between px-8 py-6 border-b border-[#E5E5E5]">
                                <h2 className="text-2xl font-serif text-[#1A1A1A]">Filter & Sort</h2>
                                <button
                                    onClick={() => setIsFilterDrawerOpen(false)}
                                    className="flex h-9 w-9 items-center justify-center border border-[#E5E5E5] text-[#595959] hover:bg-[#0A0A0A] hover:border-[#0A0A0A] hover:text-[#D4AF37] transition-colors duration-300"
                                    aria-label="Close filters"
                                >
                                    <X size={17} aria-hidden="true" />
                                </button>
                            </div>

                            {/* Drawer Scrollable Content */}
                            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 custom-scrollbar">

                                {/* Search */}
                                <div>
                                    <h3 className={MICRO_LABEL}>Search</h3>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search collection..."
                                            aria-label="Search collection"
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-[#E5E5E5] focus:border-[#D4AF37] outline-none transition-colors duration-300 font-sans text-sm"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8680]" size={17} aria-hidden="true" />
                                    </div>
                                </div>

                                {/* Sort */}
                                <div>
                                    <h3 className={MICRO_LABEL}>Sort By</h3>
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
                                                className={`py-3 px-4 text-xs font-sans tracking-wide border transition-colors duration-300 ${sortBy === opt.id
                                                    ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                                                    : 'border-[#E5E5E5] bg-white text-[#595959] hover:border-[#0A0A0A]'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Price Range */}
                                <div>
                                    <h3 className={MICRO_LABEL}>Price Range</h3>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="flex-1">
                                            <label htmlFor="price-min" className="block text-[9px] uppercase tracking-[0.25em] text-[#8A8680] font-sans mb-1.5">Min</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8680] text-sm" aria-hidden="true">₹</span>
                                                <input
                                                    id="price-min"
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={priceRange[0]}
                                                    onChange={(e) => setPriceBound('min', e.target.value)}
                                                    className="w-full pl-7 pr-3 py-2.5 bg-white border border-[#E5E5E5] focus:border-[#D4AF37] outline-none transition-colors duration-300 font-sans text-sm"
                                                />
                                            </div>
                                        </div>
                                        <span className="text-[#E5E5E5] mt-5" aria-hidden="true">—</span>
                                        <div className="flex-1">
                                            <label htmlFor="price-max" className="block text-[9px] uppercase tracking-[0.25em] text-[#8A8680] font-sans mb-1.5">Max</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8680] text-sm" aria-hidden="true">₹</span>
                                                <input
                                                    id="price-max"
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={priceRange[1]}
                                                    onChange={(e) => setPriceBound('max', e.target.value)}
                                                    className="w-full pl-7 pr-3 py-2.5 bg-white border border-[#E5E5E5] focus:border-[#D4AF37] outline-none transition-colors duration-300 font-sans text-sm"
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
                                                    className={`px-4 py-2 text-[11px] font-sans tracking-wide border transition-colors duration-300 ${isActive
                                                        ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white'
                                                        : 'bg-white border-[#E5E5E5] text-[#595959] hover:border-[#0A0A0A]'
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
                                    <h3 className={MICRO_LABEL}>Availability</h3>
                                    <button
                                        role="switch"
                                        aria-checked={inStockOnly}
                                        onClick={() => setInStockOnly(v => !v)}
                                        className="flex items-center justify-between w-full group"
                                    >
                                        <span className="flex items-center gap-3 text-sm font-sans text-[#595959] group-hover:text-[#1A1A1A] transition-colors">
                                            <PackageCheck size={16} className="text-[#D4AF37]" aria-hidden="true" />
                                            In stock only
                                        </span>
                                        <span
                                            aria-hidden="true"
                                            className={`flex h-5 w-5 shrink-0 items-center justify-center border transition-colors duration-300 ${inStockOnly ? 'bg-[#4A0404] border-[#4A0404]' : 'bg-white border-[#8A8680]/50 group-hover:border-[#4A0404]'}`}
                                        >
                                            {inStockOnly && <Check size={13} className="text-[#D4AF37]" aria-hidden="true" />}
                                        </span>
                                    </button>
                                </div>

                                {/* Categories */}
                                <div>
                                    <h3 className={MICRO_LABEL}>Categories</h3>
                                    <div className="space-y-3">
                                        {categories.map(cat => {
                                            const isActive = activeCategories.includes(cat);
                                            return (
                                                <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={isActive}
                                                        onChange={() => toggleCategory(cat)}
                                                        className="h-4 w-4 shrink-0 accent-[#4A0404] cursor-pointer"
                                                    />
                                                    <span className={`text-sm font-sans transition-colors ${isActive ? 'text-[#1A1A1A]' : 'text-[#595959] group-hover:text-[#1A1A1A]'}`}>
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
                                        <h3 className={MICRO_LABEL}>Style & Occasion</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {hashtags.slice(0, 15).map(tag => {
                                                const isActive = activeHashtags.includes(tag);
                                                return (
                                                    <button
                                                        key={tag}
                                                        onClick={() => toggleHashtag(tag)}
                                                        className={`px-4 py-2 text-[11px] font-sans tracking-wide border transition-colors duration-300 ${isActive
                                                            ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white'
                                                            : 'bg-white border-[#E5E5E5] text-[#595959] hover:border-[#0A0A0A]'
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
                            <div className="p-6 border-t border-[#E5E5E5] bg-[#FDFBF7] flex items-center gap-6">
                                <button
                                    onClick={clearAllFilters}
                                    className="btn-thread font-sans text-[#595959] hover:text-[#1A1A1A] transition-colors shrink-0"
                                >
                                    Clear All
                                </button>
                                <button
                                    onClick={() => setIsFilterDrawerOpen(false)}
                                    className="btn-royal btn-royal--oxblood flex-1"
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
    const displayImage = product.images.find(isRenderableImageSrc) || "";

    return (
        <div className="group flex flex-col sm:flex-row bg-white border border-[#E5E5E5] hover:border-[#D4AF37]/60 transition-colors duration-700">
            {/* Image */}
            <Link
                href={`/product/${product.id}`}
                prefetch={true}
                className="zari-frame relative w-full sm:w-52 md:w-60 aspect-[4/3] sm:aspect-[3/4] shrink-0 overflow-hidden bg-[#F3EEE5]"
                aria-label={`View details of ${product.name}`}
            >
                <SrivariImage
                    src={displayImage}
                    alt={product.name}
                    fallbackLabel={product.category || "The Srivari"}
                    fill
                    sizes="(max-width: 640px) 100vw, 240px"
                    className={`object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06] ${product.stock <= 0 ? 'grayscale opacity-60' : ''}`}
                />
                {product.stock <= 0 && (
                    <div className="absolute inset-x-0 bottom-0 z-10 bg-[#0A0A0A]/80 backdrop-blur-sm py-2.5 text-center">
                        <span className="text-[9px] uppercase tracking-[0.4em] text-marble/80 font-sans">Sold Out</span>
                    </div>
                )}
            </Link>

            {/* Details */}
            <div className="flex-1 flex flex-col justify-between p-6 md:p-8 gap-4">
                <div>
                    <p className="text-[9px] uppercase tracking-[0.35em] text-[#C8AA6E] font-sans mb-2">{product.category}</p>
                    <Link href={`/product/${product.id}`} prefetch={true}>
                        <h3 className="text-xl md:text-2xl font-serif text-[#1A1A1A] group-hover:text-[#4A0404] transition-colors duration-300 mb-2">
                            {product.name}
                        </h3>
                    </Link>
                    <p className="text-sm text-[#595959] font-sans font-light leading-relaxed line-clamp-2">
                        {product.description?.split('--- \n**Wash & Care Instructions:**\n')[0]}
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                    <span className="font-serif text-xl text-[#4A0404]">
                        ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    <div className="flex items-center gap-7">
                        <button
                            onClick={() => onQuickView(product)}
                            aria-label={`Quick view of ${product.name}`}
                            className="btn-thread font-sans text-[#1A1A1A]"
                        >
                            <Eye size={13} aria-hidden="true" />
                            View
                        </button>
                        <button
                            onClick={() => addToCart(product)}
                            disabled={product.stock <= 0}
                            aria-label={`Add ${product.name} to bag`}
                            className="btn-royal btn-royal--oxblood !px-7 !py-3 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ShoppingBag size={13} aria-hidden="true" />
                            Add to Bag
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
