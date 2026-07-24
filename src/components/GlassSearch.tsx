"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, X, ArrowRight } from "lucide-react";

interface GlassSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

const TRENDING = ["Kanjivaram", "Banarasi", "Mysore Silk", "Cotton", "Tussar"];

/**
 * GlassSearch — full-screen glassmorphism search overlay.
 * Opened from the Navbar search icon. Submitting navigates to /shop?q=term.
 * Queries that look like an order id (SR- / ORD- / #) shortcut to order tracking.
 */
// Real order ids are "SR-XXXXXX" (see /api/orders/create); ORD-/# kept as aliases.
// The hyphen is required so product searches like "sri silk" aren't hijacked.
const isOrderIdLike = (q: string) => /^(SR-|ORD-|#)/i.test(q.trim());

export default function GlassSearch({ isOpen, onClose }: GlassSearchProps) {
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const looksLikeOrder = isOrderIdLike(query);

    const close = useCallback(() => {
        setQuery("");
        onClose();
    }, [onClose]);

    // Focus input when opened, close on Escape, lock body scroll
    useEffect(() => {
        if (!isOpen) return;
        const t = setTimeout(() => inputRef.current?.focus(), 100);
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
        };
        window.addEventListener("keydown", onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            clearTimeout(t);
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen, close]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const term = query.trim();
        if (!term) return;
        if (isOrderIdLike(term)) {
            router.push(`/order-tracking?id=${encodeURIComponent(term.replace(/^#/, ""))}`);
        } else {
            router.push(`/shop?q=${encodeURIComponent(term)}`);
        }
        close();
    };

    const goToCategory = (tag: string) => {
        router.push(`/shop?category=${encodeURIComponent(tag)}`);
        close();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="fixed inset-0 z-[70] bg-obsidian/80 backdrop-blur-xl flex items-start justify-center px-4 pt-[18vh]"
                    onClick={close}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Search the store"
                >
                    <motion.div
                        initial={{ opacity: 0, y: -24, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -16, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="w-full max-w-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Search Input */}
                        <form
                            onSubmit={handleSubmit}
                            className="relative glass-card rounded-2xl border border-gold/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)] focus-within:border-gold/50 transition-colors"
                        >
                            <div className="flex items-center px-6 py-5 gap-4">
                                <Search className="w-5 h-5 text-gold shrink-0" aria-hidden="true" />
                                <label htmlFor="glass-search-input" className="sr-only">
                                    Search sarees or track an order
                                </label>
                                <input
                                    id="glass-search-input"
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search 'Kanjivaram', 'Bridal Red'… or an order id"
                                    className="w-full bg-transparent outline-none text-marble placeholder:text-marble/40 font-light tracking-wide"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    autoComplete="off"
                                />
                                <div className="flex items-center gap-2 shrink-0">
                                    {/* Order Tracking Shortcut */}
                                    {looksLikeOrder && (
                                        <Link
                                            href="/order-tracking"
                                            onClick={close}
                                            className="hidden md:flex items-center gap-1 bg-gold text-obsidian text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full hover:bg-white transition-colors"
                                        >
                                            Track Order <ArrowRight size={12} aria-hidden="true" />
                                        </Link>
                                    )}
                                    {query && (
                                        <button
                                            type="button"
                                            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                                            className="text-marble/40 hover:text-marble transition-colors"
                                            aria-label="Clear search"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={close}
                                        className="text-marble/40 hover:text-gold transition-colors border-l border-white/10 pl-3"
                                        aria-label="Close search"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                        </form>

                        {/* Trending Tags */}
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                            <span className="flex items-center gap-2 text-gold text-xs uppercase tracking-[0.3em] font-medium mr-1">
                                <Sparkles size={14} aria-hidden="true" /> Trending
                            </span>
                            {TRENDING.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => goToCategory(tag)}
                                    className="px-4 py-1.5 rounded-full text-xs tracking-widest uppercase border border-white/15 text-marble/70 hover:border-gold hover:text-gold transition-all duration-300"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>

                        <p className="mt-6 text-center text-[11px] uppercase tracking-[0.25em] text-marble/30">
                            Press Enter to search · Esc to close
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
