"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import WAButton from "@/components/WAButton";
import GlassSearch from "@/components/GlassSearch";
import Breadcrumbs from "@/components/Breadcrumbs";
import { products } from "@/data/products";
import { Filter } from "lucide-react";

// Default categories fallback
const initialCategories = ["All", "Kanjivaram", "Banarasi", "Mysore Silk", "Cotton", "Tussar"];
const colors = ["All", "Maroon", "Gold", "Green", "Blue", "Red", "Pink"];
const priceRanges = ["All", "Under ₹5,000", "₹5,000 - ₹15,000", "₹15,000 - ₹25,000", "Above ₹25,000"];

function ShopContent() {
    const searchParams = useSearchParams();
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "All");
    const [selectedColor, setSelectedColor] = useState("All");
    const [selectedPrice, setSelectedPrice] = useState("All");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [productsData, setProductsData] = useState(products);
    const [categories, setCategories] = useState(initialCategories);

    const [searchQuery, setSearchQuery] = useState("");
    const [activeHashtag, setActiveHashtag] = useState<string | null>(null);

    useEffect(() => {
        const storedProducts = localStorage.getItem('srivari_products');
        if (storedProducts) {
            setProductsData(JSON.parse(storedProducts));
        }

        const storedCategories = localStorage.getItem('srivari_categories');
        if (storedCategories) {
            // Ensure 'All' is at the start
            const parsed = JSON.parse(storedCategories);
            if (!parsed.includes("All")) {
                setCategories(["All", ...parsed]);
            } else {
                setCategories(parsed);
            }
        }
    }, []);

    // Extract unique trending hashtags
    const trendingTags = Array.from(new Set(productsData.flatMap(p => p.hashtags || []))).slice(0, 5);

    // Advanced Filter Logic
    const filteredProducts = productsData.filter((product) => {
        // 1. Category Filter
        const categoryMatch = selectedCategory === "All" || product.category.toLowerCase().includes(selectedCategory.toLowerCase());

        // 2. Color/Attribute Filter (Legacy)
        const colorMatch = selectedColor === "All" || product.name.toLowerCase().includes(selectedColor.toLowerCase()) || product.description.toLowerCase().includes(selectedColor.toLowerCase());

        // 3. Price Filter
        let priceMatch = true;
        if (selectedPrice === "Under ₹5,000") priceMatch = product.price < 5000;
        else if (selectedPrice === "₹5,000 - ₹15,000") priceMatch = product.price >= 5000 && product.price <= 15000;
        else if (selectedPrice === "₹15,000 - ₹25,000") priceMatch = product.price > 15000 && product.price <= 25000;
        else if (selectedPrice === "Above ₹25,000") priceMatch = product.price > 25000;

        // 4. Search Query (Name, Description, Hashtags)
        const q = searchQuery.toLowerCase();
        const searchMatch = !q ||
            product.name.toLowerCase().includes(q) ||
            product.description.toLowerCase().includes(q) ||
            product.hashtags?.some(tag => tag.toLowerCase().includes(q));

        // 5. Hashtag Filter
        const hashtagMatch = !activeHashtag || product.hashtags?.includes(activeHashtag);

        return categoryMatch && colorMatch && priceMatch && searchMatch && hashtagMatch;
    });

    return (
        <main className="bg-[#FDFBF7] min-h-screen">
            <Navbar />

            {/* Header */}
            <div className="pt-32 pb-12 bg-black/90 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[#4A0404]/20" />
                <h1 className="text-4xl md:text-5xl font-heading relative z-10">Royal Collection</h1>
                <p className="mt-4 text-[#D4AF37] tracking-widest uppercase text-sm relative z-10">
                    Handpicked for Elegance
                </p>
            </div>

            {/* Advanced Search Section */}
            <div className="-mt-8 relative z-20">
                <GlassSearch
                    onSearch={setSearchQuery}
                    onHashtagSelect={setActiveHashtag}
                    activeHashtag={activeHashtag}
                    trendingTags={trendingTags}
                />
            </div>

            <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row gap-8">
                <div className="w-full md:hidden">
                    <Breadcrumbs />
                </div>

                {/* Mobile Filter Toggle */}
                <button
                    className="md:hidden flex items-center gap-2 bg-white border border-[#D4AF37] px-4 py-2 text-[#4A0404] uppercase font-bold tracking-widest text-sm"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                    <Filter size={16} /> Filters
                </button>

                {/* Sidebar Filters */}
                <aside className={`md:w-1/4 bg-white p-6 shadow-sm border border-gray-100 h-fit transition-all ${isFilterOpen ? 'block' : 'hidden md:block'}`}>
                    <div className="mb-8">
                        <h3 className="font-heading text-xl text-[#4A0404] mb-4 border-b border-[#D4AF37]/30 pb-2">Category</h3>
                        <ul className="space-y-2">
                            {categories.map((cat) => (
                                <li key={cat}>
                                    <button
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`text-sm font-sans uppercase tracking-wider hover:text-[#D4AF37] transition-colors ${selectedCategory === cat ? 'text-[#D4AF37] font-bold' : 'text-[#595959]'}`}
                                    >
                                        {cat}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mb-8">
                        <h3 className="font-heading text-xl text-[#4A0404] mb-4 border-b border-[#D4AF37]/30 pb-2">Color</h3>
                        <div className="flex flex-wrap gap-2">
                            {colors.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={`px-3 py-1 text-xs border ${selectedColor === color ? 'bg-[#4A0404] text-white border-[#4A0404]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#D4AF37]'}`}
                                >
                                    {color}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-heading text-xl text-[#4A0404] mb-4 border-b border-[#D4AF37]/30 pb-2">Price</h3>
                        <ul className="space-y-2">
                            {priceRanges.map((range) => (
                                <li key={range}>
                                    <label className="flex items-center gap-2 cursor-pointer text-sm text-[#595959]">
                                        <input
                                            type="radio"
                                            name="price"
                                            checked={selectedPrice === range}
                                            onChange={() => setSelectedPrice(range)}
                                            className="accent-[#4A0404]"
                                        />
                                        {range}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                {/* Product Grid */}
                <div className="md:w-3/4">
                    <p className="mb-6 text-[#595959] font-serif italic">Showing {filteredProducts.length} masterpieces</p>

                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <h3 className="text-2xl font-heading text-[#4A0404] mb-4">No treasures found</h3>
                            <p className="text-gray-500">Try adjusting your filters to discover more.</p>
                            <button
                                onClick={() => { setSelectedCategory("All"); setSelectedColor("All"); setSelectedPrice("All") }}
                                className="mt-6 text-[#D4AF37] underline hover:text-[#4A0404] transition-colors"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
            <WAButton />
        </main>
    );
}

export default function ShopPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">Loading...</div>}>
            <ShopContent />
        </Suspense>
    );
}
