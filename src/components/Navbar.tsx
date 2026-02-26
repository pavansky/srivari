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
    // "Compact Glossy" Look
    // Scrolled: Minimal height (py-2), high transparency, strong blur.
    const navbarStyle = isScrolled
        ? isLightPage
            ? "bg-white/40 backdrop-blur-md border-b border-black/5 shadow-sm py-2 supports-[backdrop-filter]:bg-white/20" // Compact Light Glass
            : "bg-black/30 backdrop-blur-md border-b border-white/5 shadow-md py-2 supports-[backdrop-filter]:bg-black/20"  // Compact Dark Glass
        : isLightPage
            ? "bg-transparent py-5"
            : "bg-transparent py-6";

    // Text Color Logic
    // On Light Pages: Always Dark (unless specific overrides needed)
    // On Dark Pages: Always White/Marble
    const textColor = isLightPage ? "text-[#1A1A1A]" : "text-marble";
    const hoverColor = "text-[#D4AF37]"; // Gold

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: "circOut" }}
                className={`fixed top-0 left-0 w-full z-40 px-6 flex justify-between items-center transition-all duration-700 ease-out ${navbarStyle}`}
            >
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 md:gap-4 group">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#8C7320] flex items-center justify-center text-black font-serif font-bold text-xl md:text-2xl shadow-[0_0_15px_rgba(212,175,55,0.3)] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] group-hover:scale-105 transition-all duration-500">
                        S
                    </div>
                    <div className="flex flex-col">
                        <h1 className={`text-xl md:text-2xl font-serif tracking-widest cursor-pointer ${hoverColor} group-hover:text-white transition-colors duration-500 line-clamp-1`}>
                            THE SRIVARI
                        </h1>
                        <span className={`text-[8px] md:text-[10px] tracking-[0.2em] font-sans uppercase -mt-1 ${isLightPage ? 'text-black/50' : 'text-white/50'} group-hover:text-[#D4AF37] transition-colors duration-500`}>
                            Royalty Woven
                        </span>
                    </div>
                </Link>

                {/* Desktop Menu */}
                <div className={`hidden md:flex gap-8 items-center text-sm tracking-widest ${isLightPage ? 'text-[#1A1A1A]/80' : 'text-marble/80'}`}>
                    <Link href="/shop" className={`hover:${hoverColor} transition-colors`}>
                        COLLECTIONS
                    </Link>
                    <Link href="/about" className={`hover:${hoverColor} transition-colors`}>
                        ATELIER
                    </Link>
                    <Link href="/contact" className={`hover:${hoverColor} transition-colors`}>
                        CONTACT
                    </Link>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 md:gap-6">
                    <UserButton />
                    <Link href="/cart" className="relative group">
                        <ShoppingBag className={`w-5 h-5 transition-colors ${isLightPage ? 'text-[#1A1A1A] hover:text-[#D4AF37]' : 'text-[#D4AF37] hover:text-white'}`} />
                        {cart.length > 0 && (
                            <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4AF37] text-[10px] text-obsidian font-bold">
                                {cart.reduce((total, item) => total + item.quantity, 0)}
                            </span>
                        )}
                    </Link>
                    <button
                        className={`md:hidden transition-colors z-50 relative ${isLightPage ? 'text-[#1A1A1A] hover:text-[#D4AF37]' : 'text-marble hover:text-[#D4AF37]'}`}
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </motion.nav>

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
                    >
                        <div className="flex justify-end mb-12">
                            <button onClick={() => setIsMobileMenuOpen(false)} className="text-gold">
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
                            <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="text-lg tracking-widest text-marble/80 hover:text-gold transition-colors border-b border-white/5 pb-4">
                                ATELIER
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
