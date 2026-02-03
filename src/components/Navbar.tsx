"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Menu } from "lucide-react";

export default function Navbar() {
    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center"
        >
            {/* Glassmorphic Background Layer */}
            <div className="absolute inset-0 w-full h-full glass -z-10" />

            {/* Logo */}
            <Link href="/">
                <h1 className="text-2xl font-serif text-gold tracking-widest cursor-pointer">
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
            <div className="flex items-center gap-6">
                <button className="relative group">
                    <ShoppingBag className="w-5 h-5 text-gold" />
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
                    </span>
                </button>
                <button className="md:hidden">
                    <Menu className="w-6 h-6 text-marble" />
                </button>
            </div>
        </motion.nav>
    );
}
