"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Menu, User } from "lucide-react";

import { useCart } from "@/context/CartContext";
import UserButton from "@/components/UserButton";

export default function Navbar() {
    const { cart } = useCart();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

    // Navbar Style Logic
    // Floating Premium Pill Design
    const navbarWrapper = isScrolled
        ? "fixed top-0 left-0 w-full z-50 pt-4 px-4 transition-all duration-700 ease-out"
        : "fixed top-0 left-0 w-full z-50 px-0 transition-all duration-700 ease-out";

    const navbarInner = isScrolled
        ? isLightPage
            ? "bg-white/90 backdrop-blur-2xl border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-full px-6 py-2.5 mx-auto max-w-7xl w-full flex justify-between items-center supports-[backdrop-filter]:bg-white/60"
            : "bg-obsidian/90 backdrop-blur-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] rounded-full px-6 py-2.5 mx-auto max-w-7xl w-full flex justify-between items-center supports-[backdrop-filter]:bg-obsidian/60"
        : isLightPage
            ? "bg-transparent py-5 px-6 mx-auto w-full flex justify-between items-center"
            : "bg-transparent py-6 px-6 mx-auto w-full flex justify-between items-center";

    // Text Color Logic
    const textColor = isLightPage ? "text-[#1A1A1A]" : "text-marble";
    const hoverColor = "text-[#D4AF37]"; // Gold

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
                    {/* Logo Section */}
                    <Link href="/" className="flex items-center gap-3 shrink-0 group" aria-label="Srivari Home">
                        <div className="relative flex items-center justify-center">
                            {/* The missing logo image the user requested - falls back elegantly if missing */}
                            <img
                                src="/logo.png"
                                alt=""
                                role="presentation"
                                className="w-8 h-8 md:w-10 md:h-10 object-contain absolute opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8C7320] flex items-center justify-center text-black font-serif font-bold text-xl md:text-2xl shadow-[0_0_15px_rgba(212,175,55,0.3)] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] group-hover:scale-105 transition-all duration-500 relative z-10">
                                S
                            </div>
                        </div>
                        <div className="flex flex-col hidden sm:flex">
                            <h1 className={`text-lg md:text-xl font-serif tracking-widest cursor-pointer ${isLightPage ? 'text-[#1A1A1A] group-hover:text-[#D4AF37]' : 'text-[#D4AF37] group-hover:text-white'} transition-colors duration-500 whitespace-nowrap`}>
                                THE SRIVARI
                            </h1>
                            <span className={`text-[8px] md:text-[9px] tracking-[0.2em] font-sans uppercase -mt-1 ${isLightPage ? 'text-black/50' : 'text-white/50'} group-hover:text-[#D4AF37] transition-colors duration-500 whitespace-nowrap`}>
                                Royalty Woven
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Menu */}
                    <div
                        className={`hidden md:flex gap-4 lg:gap-8 items-center text-xs lg:text-sm tracking-widest ${isLightPage ? 'text-[#1A1A1A]/90' : 'text-marble/90'}`}
                        role="menubar"
                    >
                        <Link href="/shop" className={`hover:${hoverColor} transition-colors`} role="menuitem">
                            COLLECTIONS
                        </Link>
                        <Link href="/atelier" className={`text-[#D4AF37] hover:text-white transition-colors font-bold`} role="menuitem">
                            ATELIER
                        </Link>
                        <Link href="/about" className={`hover:${hoverColor} transition-colors`} role="menuitem">
                            ABOUT
                        </Link>
                        <Link href="/contact" className={`hover:${hoverColor} transition-colors`} role="menuitem">
                            CONTACT
                        </Link>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 md:gap-5 shrink-0">
                        <UserButton />
                        <Link href="/cart" className="relative group p-1" aria-label={`Shopping bag, ${cart.reduce((total, item) => total + item.quantity, 0)} items`}>
                            <ShoppingBag className={`w-5 h-5 transition-colors ${isLightPage ? 'text-[#1A1A1A] group-hover:text-[#D4AF37]' : 'text-[#D4AF37] group-hover:text-white'}`} strokeWidth={1.5} />
                            {cart.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4AF37] text-[9px] text-obsidian font-bold shadow-sm" aria-hidden="true">
                                    {cart.reduce((total, item) => total + item.quantity, 0)}
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

            {/* Mobile Sidebar Drawer */}
            {isMobileMenuOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed top-0 right-0 h-full w-[80%] max-w-[300px] bg-[#0A0A0A] border-l border-gold/20 z-50 flex flex-col p-8 shadow-2xl md:hidden"
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
                                COLLECTIONS
                            </Link>
                            <Link href="/atelier" onClick={() => setIsMobileMenuOpen(false)} className="text-lg tracking-widest text-[#D4AF37] hover:text-white transition-colors border-b border-white/5 pb-4">
                                ATELIER
                            </Link>
                            <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="text-lg tracking-widest text-marble/80 hover:text-gold transition-colors border-b border-white/5 pb-4">
                                ABOUT
                            </Link>
                            <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-lg tracking-widest text-marble/80 hover:text-gold transition-colors border-b border-white/5 pb-4">
                                CONTACT
                            </Link>

                            <div className="mt-8 text-center">
                                <p className="text-gold/40 text-xs tracking-widest mb-2">FOLLOW US</p>
                                <div className="flex justify-center gap-4 text-marble/60">
                                    {/* Social Icons could go here */}
                                    <span>IG</span>
                                    <span>FB</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </>
    );
}
