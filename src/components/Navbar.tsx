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

    // Hide Navbar on Admin Dashboard
    if (pathname.startsWith("/admin")) return null;

    // Check if we are on a page that needs a contrasting header (like product details)
    const isLightPage = pathname.startsWith("/product/") || pathname === "/cart";

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: "circOut" }}
                className={`fixed top-0 left-0 w-full z-40 px-6 py-4 flex justify-between items-center border-b transition-colors duration-300
                ${isLightPage ? 'bg-[#1A1A1A] border-white/5 shadow-md' : 'bg-white/5 backdrop-blur-md border-white/10'}
            `}
            >
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
                    <UserButton />
                    <Link href="/cart" className="relative group">
                        <ShoppingBag className="w-5 h-5 text-gold hover:text-white transition-colors" />
                        {cart.length > 0 && (
                            <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] text-obsidian font-bold">
                                {cart.reduce((total, item) => total + item.quantity, 0)}
                            </span>
                        )}
                    </Link>
                    <button
                        className="md:hidden text-marble hover:text-gold transition-colors z-50 relative"
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
