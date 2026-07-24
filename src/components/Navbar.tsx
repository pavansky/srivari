"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu, Heart, Search, Instagram, Facebook } from "lucide-react";

import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { SITE_CONFIG } from "@/config/site";
import UserButton from "@/components/UserButton";
import GlassSearch from "@/components/GlassSearch";

export default function Navbar() {
    const { cart } = useCart();
    const { wishlist } = useWishlist();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const pathname = usePathname();

    const [isScrolled, setIsScrolled] = useState(false);

    // Check if we are on a page that needs a contrasting header
    const isLightPage = pathname.startsWith("/product/") || pathname === "/cart" || pathname === "/try-on";

    // Handle Scroll Effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Hide Navbar on Admin Dashboard
    if (pathname.startsWith("/admin")) return null;

    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

    // Navbar Style Logic — hairline maison bar (square corners, fine gold rule)
    const navbarWrapper = "fixed top-0 left-0 w-full z-50 transition-all duration-700 ease-out";

    const navbarInner = isScrolled
        ? isLightPage
            ? "bg-[#FDFBF7]/90 backdrop-blur-2xl border-b border-[#C8AA6E]/25 px-6 lg:px-10 py-3 w-full flex justify-between items-center"
            : "bg-obsidian/90 backdrop-blur-2xl border-b border-[#D4AF37]/20 px-6 lg:px-10 py-3 w-full flex justify-between items-center"
        : isLightPage
            ? "bg-transparent py-5 px-6 lg:px-10 w-full flex justify-between items-center border-b border-transparent"
            : "bg-transparent py-6 px-6 lg:px-10 w-full flex justify-between items-center border-b border-transparent";

    // Underline-on-hover nav link (classes must be literal for Tailwind)
    const navLink = `relative pb-1 transition-colors duration-300 after:absolute after:left-0 after:bottom-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-[#D4AF37] after:transition-transform after:duration-500 after:ease-[cubic-bezier(0.22,1,0.36,1)] hover:after:scale-x-100 ${isLightPage ? "hover:text-[#4A0404]" : "hover:text-[#D4AF37]"}`;

    const iconColor = isLightPage
        ? "text-[#1A1A1A] group-hover:text-[#4A0404]"
        : "text-[#D4AF37] group-hover:text-white";

    return (
        <>
            <motion.div
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: "circOut" }}
                className={navbarWrapper}
                role="banner"
            >
                <nav className={`${navbarInner} transition-all duration-700 delay-75`} aria-label="Main Navigation">
                    {/* Logo Section — square monogram with hairline zari border */}
                    <Link href="/" className="flex items-center gap-3.5 shrink-0 group" aria-label="Srivari Home">
                        <div className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center border transition-colors duration-500 ${isLightPage ? "border-[#4A0404]/40 group-hover:border-[#4A0404]" : "border-[#D4AF37]/50 group-hover:border-[#D4AF37]"}`}>
                            <span className={`font-serif text-xl md:text-2xl leading-none ${isLightPage ? "text-[#4A0404]" : "text-[#D4AF37]"}`}>S</span>
                        </div>
                        <div className="flex-col hidden sm:flex">
                            <h1 className={`text-base md:text-lg font-serif tracking-[0.22em] cursor-pointer ${isLightPage ? 'text-[#1A1A1A]' : 'text-marble'} transition-colors duration-500 whitespace-nowrap`}>
                                THE SRIVARI
                            </h1>
                            <span className={`text-[8px] tracking-[0.4em] font-sans uppercase ${isLightPage ? 'text-[#4A0404]/60' : 'text-[#D4AF37]/70'} transition-colors duration-500 whitespace-nowrap`}>
                                Royalty Woven
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Menu */}
                    <div
                        className={`hidden md:flex gap-5 lg:gap-9 items-center text-[11px] lg:text-xs tracking-[0.25em] font-sans ${isLightPage ? 'text-[#1A1A1A]/80' : 'text-marble/80'}`}
                        role="menubar"
                    >
                        <Link href="/shop" className={navLink} role="menuitem">
                            SHOP
                        </Link>
                        <Link href="/collections" className={navLink} role="menuitem">
                            COLLECTIONS
                        </Link>
                        <Link href="/atelier" className={`${navLink} text-[#D4AF37]`} role="menuitem">
                            ATELIER
                        </Link>
                        <Link href="/about" className={navLink} role="menuitem">
                            ABOUT
                        </Link>
                        <Link href="/contact" className={navLink} role="menuitem">
                            CONTACT
                        </Link>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 md:gap-5 shrink-0">
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="group p-1"
                            aria-label="Open search"
                        >
                            <Search className={`w-5 h-5 transition-colors ${iconColor}`} strokeWidth={1.5} />
                        </button>
                        <UserButton />
                        <Link href="/wishlist" className="relative group p-1 hidden sm:block" aria-label={`Wishlist, ${wishlist.length} items`}>
                            <Heart className={`w-5 h-5 transition-colors ${iconColor}`} strokeWidth={1.5} />
                            {wishlist.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 px-0.5 items-center justify-center bg-[#D4AF37] text-[9px] text-obsidian font-bold font-sans" aria-hidden="true">
                                    {wishlist.length}
                                </span>
                            )}
                        </Link>
                        <Link href="/cart" className="relative group p-1" aria-label={`Shopping bag, ${cartCount} items`}>
                            <ShoppingBag className={`w-5 h-5 transition-colors ${iconColor}`} strokeWidth={1.5} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 px-0.5 items-center justify-center bg-[#D4AF37] text-[9px] text-obsidian font-bold font-sans" aria-hidden="true">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                        <button
                            className={`md:hidden p-1 transition-colors z-50 relative ${isLightPage ? 'text-[#1A1A1A] hover:text-[#D4AF37]' : 'text-[#D4AF37] hover:text-white'}`}
                            onClick={() => setIsMobileMenuOpen(true)}
                            aria-label="Toggle mobile menu"
                            aria-expanded={isMobileMenuOpen}
                        >
                            <Menu className="w-5 h-5" strokeWidth={1.5} />
                        </button>
                    </div>
                </nav>
            </motion.div>

            {/* Search Overlay */}
            <GlassSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            {/* Mobile Sidebar Drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="mobile-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
                        />

                        {/* Drawer */}
                        <motion.div
                            key="mobile-drawer"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed top-0 right-0 h-full w-[80%] max-w-[300px] bg-[#0A0A0A] border-l border-gold/20 z-50 flex flex-col p-8 shadow-2xl md:hidden overflow-y-auto custom-scrollbar"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Mobile menu"
                        >
                            <div className="flex justify-end mb-12">
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-gold"
                                    aria-label="Close mobile menu"
                                >
                                    <Menu className="w-8 h-8 rotate-90" />
                                </button>
                            </div>

                            <div className="flex flex-col gap-8">
                                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-serif text-gold tracking-widest border-b border-white/5 pb-4">
                                    HOME
                                </Link>
                                <Link href="/shop" onClick={() => setIsMobileMenuOpen(false)} className="text-lg tracking-widest text-marble/80 hover:text-gold transition-colors border-b border-white/5 pb-4">
                                    SHOP
                                </Link>
                                <Link href="/collections" onClick={() => setIsMobileMenuOpen(false)} className="text-lg tracking-widest text-marble/80 hover:text-gold transition-colors border-b border-white/5 pb-4">
                                    COLLECTIONS
                                </Link>
                                <Link href="/atelier" onClick={() => setIsMobileMenuOpen(false)} className="text-lg tracking-widest text-[#D4AF37] hover:text-white transition-colors border-b border-white/5 pb-4">
                                    ATELIER
                                </Link>
                                <Link href="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="text-lg tracking-widest text-marble/80 hover:text-gold transition-colors border-b border-white/5 pb-4 flex items-center gap-3">
                                    WISHLIST
                                    {wishlist.length > 0 && (
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#D4AF37] text-[10px] text-obsidian font-bold">
                                            {wishlist.length}
                                        </span>
                                    )}
                                </Link>
                                <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="text-lg tracking-widest text-marble/80 hover:text-gold transition-colors border-b border-white/5 pb-4">
                                    ABOUT
                                </Link>
                                <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-lg tracking-widest text-marble/80 hover:text-gold transition-colors border-b border-white/5 pb-4">
                                    CONTACT
                                </Link>

                                <div className="mt-8 text-center">
                                    <p className="text-gold/40 text-xs tracking-widest mb-4">FOLLOW US</p>
                                    <div className="flex justify-center gap-6 text-marble/60">
                                        <a
                                            href={SITE_CONFIG.links.instagram}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label="The Srivari on Instagram"
                                            className="hover:text-gold transition-colors"
                                        >
                                            <Instagram className="w-5 h-5" strokeWidth={1.5} />
                                        </a>
                                        <a
                                            href={SITE_CONFIG.links.facebook}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label="The Srivari on Facebook"
                                            className="hover:text-gold transition-colors"
                                        >
                                            <Facebook className="w-5 h-5" strokeWidth={1.5} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
