"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Sparkles, X, ArrowRight } from "lucide-react";

interface GlassSearchProps {
    onSearch: (query: string) => void;
    onHashtagSelect: (tag: string) => void;
    activeHashtag: string | null;
    trendingTags: string[];
}

export default function GlassSearch({ onSearch, onHashtagSelect, activeHashtag, trendingTags }: GlassSearchProps) {
    const [query, setQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        onSearch(val);
    };

    const clearActiveTag = () => {
        onHashtagSelect("");
    };

    return (
        <div className="w-full max-w-4xl mx-auto mb-12 relative px-4">
            <div
                className={`relative group bg-white/80 backdrop-blur-md rounded-2xl border transition-all duration-300 ${isFocused ? 'border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10' : 'border-neutral-200'}`}
            >
                {/* Search Input */}
                <div className="flex items-center px-6 py-4 gap-4">
                    <Search className={`w-5 h-5 transition-colors ${isFocused ? 'text-[#D4AF37]' : 'text-neutral-400'}`} />
                    <input
                        type="text"
                        placeholder="Search for 'Kanjivaram', 'Red Wedding', or '#RoyalVibes'..."
                        className="w-full bg-transparent outline-none text-[#4A0404] placeholder:text-neutral-400 font-medium"
                        value={query}
                        onChange={handleSearch}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                    />
                    {query && (
                        <div className="flex items-center gap-2">
                            {/* Order Tracking Shortcut */}
                            {(query.toUpperCase().startsWith("ORD-") || query.startsWith("#")) && (
                                <a
                                    href="/order-tracking"
                                    className="hidden md:flex items-center gap-1 bg-[#4A0404] text-gold text-[10px] font-bold uppercase px-3 py-1.5 rounded-full hover:bg-black transition-colors mr-2"
                                >
                                    Track Order <ArrowRight size={12} />
                                </a>
                            )}
                            <button
                                onClick={() => { setQuery(""); onSearch(""); }}
                                className="text-neutral-400 hover:text-black"
                                aria-label="Clear search"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Trending Tags & Active Filter Display */}
            <div className="mt-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">

                {/* Trending Section */}
                <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex items-center gap-2 text-[#D4AF37] text-xs uppercase tracking-widest font-bold mr-2">
                        <Sparkles size={14} /> Trending
                    </div>
                    {trendingTags.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => onHashtagSelect(tag === activeHashtag ? "" : tag)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border ${activeHashtag === tag
                                ? 'bg-[#4A0404] text-[#D4AF37] border-[#4A0404]'
                                : 'bg-white text-neutral-600 border-neutral-200 hover:border-[#D4AF37] hover:text-[#D4AF37]'
                                }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                {/* Active Filter Indicator (if hashtag selected) */}
                {activeHashtag && (
                    <div className="flex items-center gap-2 bg-[#4A0404]/5 px-4 py-1.5 rounded-lg border border-[#4A0404]/10">
                        <span className="text-xs text-[#595959]">Filtering by:</span>
                        <span className="text-sm font-bold text-[#4A0404]">{activeHashtag}</span>
                        <button
                            onClick={clearActiveTag}
                            className="ml-2 text-[#4A0404] hover:bg-[#4A0404]/10 rounded-full p-0.5"
                            aria-label="Remove filter"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
