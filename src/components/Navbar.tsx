"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Menu, User } from "lucide-react";

import { useCart } from "@/context/CartContext";

export default function Navbar() {
    const { cart } = useCart();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    // Hide Navbar on Admin Dashboard
    if (pathname.startsWith("/admin")) return null;

    // Check if we are on a page that needs a contrasting header (like product details)
    const isLightPage = pathname.startsWith("/product/") || pathname === "/cart";

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className={`fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center border-b transition-colors duration-300
                ${isLightPage ? 'bg-[#1A1A1A] border-white/5 shadow-md' : 'bg-white/5 backdrop-blur-md border-white/10'}
            `}
        >
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-obsidian z-50 flex flex-col items-center justify-center gap-8 md:hidden">
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="absolute top-6 right-6 text-gold p-2"
                    >
                        <Menu className="w-8 h-8 rotate-90" />
                    </button>
                    <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-serif text-gold tracking-widest">
                        HOME
                    </Link>
                    <Link href="/shop" onClick={() => setIsMobileMenuOpen(false)} className="text-xl tracking-widest text-marble hover:text-gold transition-colors">
                        COLLECTIONS
                    </Link>
                    <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="text-xl tracking-widest text-marble hover:text-gold transition-colors">
                        ATELIER
                    </Link>
                    <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-xl tracking-widest text-marble hover:text-gold transition-colors">
                        CONTACT
                    </Link>
                </div>
            )}

            {/* Glassmorphic Background Layer - simplified for better mobile support */}
            <div className="absolute inset-0 w-full h-full -z-10" />

            {/* Logo */}
            <Link href="/">
                <h1 className="text-xl md:text-2xl font-serif text-gold tracking-widest cursor-pointer">
                    THE SRIVARI
                </h1>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex gap-8 items-center text-sm tracking-widest text-marble/80">
                <Link href="/shop" className="hover:text-gold transition-colors">
                    COLLECTIONS
                </Link>
                <Link href="/about" className="hover:text-gold transition-colors">
                    ATELIER
                </Link>
                <Link href="/contact" className="hover:text-gold transition-colors">
                    CONTACT
                </Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 md:gap-6">
                <Link href="/admin">
                    <button className="hover:text-gold transition-colors text-marble">
                        <User className="w-5 h-5" />
                    </button>
                </Link>
                <Link href="/cart" className="relative group">
                    <ShoppingBag className="w-5 h-5 text-gold hover:text-white transition-colors" />
                    {cart.length > 0 && (
                        <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] text-obsidian font-bold">
                            {cart.length}
                        </span>
                    )}
                </Link>
                <button
                    className="md:hidden text-marble hover:text-gold transition-colors"
                    onClick={() => setIsMobileMenuOpen(true)}
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>
        </motion.nav>
    );
}
