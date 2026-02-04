"use client";

import { createClient } from "@/utils/supabase/client";
import { User as UserIcon, LogOut, LayoutDashboard, ShoppingBag, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";

export default function UserButton() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setIsLoading(false);
        };
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    if (isLoading) {
        return <div className="w-5 h-5 bg-white/10 animate-pulse rounded-full" />;
    }

    if (!user) {
        return (
            <Link href="/login" aria-label="Sign In">
                <button className="flex items-center gap-2 text-white/70 hover:text-[#D4AF37] transition-all duration-300 group" aria-label="Login">
                    <UserIcon className="w-5 h-5 group-hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
                    <span className="text-xs uppercase tracking-widest hidden md:block font-medium">Login</span>
                </button>
            </Link>
        );
    }

    // Role Logic
    const isAdmin = user.email?.toLowerCase() === 'support@thesrivari.com';
    const targetLink = isAdmin ? '/admin' : '/orders';
    const menuLabel = isAdmin ? 'Admin Console' : 'My Orders';
    const MenuIcon = isAdmin ? LayoutDashboard : ShoppingBag;

    return (
        <div className="relative z-50" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>

            {/* Trigger Button */}
            <Link href={targetLink} className="flex items-center gap-3 group py-2">
                {user.user_metadata.avatar_url ? (
                    <div className="relative">
                        <img
                            src={user.user_metadata.avatar_url}
                            alt="Profile"
                            className="w-8 h-8 rounded-full border border-[#D4AF37]/50 group-hover:border-[#D4AF37] transition-colors object-cover"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-[#D4AF37] w-3 h-3 rounded-full border-2 border-black flex items-center justify-center">
                            <span className="sr-only">Active</span>
                        </div>
                    </div>
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8C7323] flex items-center justify-center shadow-lg group-hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all">
                        <span className="font-serif text-black font-bold text-lg">
                            {user.email?.[0].toUpperCase()}
                        </span>
                    </div>
                )}

                {/* Desktop Name Label */}
                <span className="hidden md:flex flex-col text-left">
                    <span className="text-[10px] uppercase text-[#D4AF37] tracking-widest leading-none mb-0.5">Welcome</span>
                    <span className="text-xs font-serif text-white tracking-wide group-hover:text-[#D4AF37] transition-colors whitespace-nowrap max-w-[100px] truncate">
                        {user.user_metadata.full_name || user.email?.split('@')[0]}
                    </span>
                </span>
            </Link>

            {/* Premium Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full pt-4 min-w-[240px]"
                    >
                        <div className="bg-[#050505]/95 backdrop-blur-xl border border-[#D4AF37]/30 rounded-none shadow-2xl relative overflow-hidden">

                            {/* Decorative Top Line */}
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>

                            {/* User Header */}
                            <div className="p-4 border-b border-white/10 bg-white/5">
                                <p className="text-[#D4AF37] font-serif text-sm tracking-wide mb-1">
                                    {user.user_metadata.full_name || "Srivari Member"}
                                </p>
                                <p className="text-white/40 text-[10px] tracking-wider uppercase truncate">
                                    {user.email}
                                </p>
                            </div>

                            {/* Menu Items */}
                            <div className="p-2 space-y-1">
                                <Link
                                    href={targetLink}
                                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all group/item"
                                >
                                    <MenuIcon className="w-4 h-4 text-[#D4AF37] group-hover/item:scale-110 transition-transform" />
                                    <span className="tracking-wide font-light">{menuLabel}</span>
                                </Link>

                                <button
                                    onClick={handleSignOut}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all group/item text-left"
                                >
                                    <LogOut className="w-4 h-4 group-hover/item:-translate-x-1 transition-transform" />
                                    <span className="tracking-wide font-light">Sign Out</span>
                                </button>
                            </div>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
