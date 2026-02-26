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
        <div className="relative z-50 flex items-center" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>

            {/* Trigger Avatar */}
            <Link href={targetLink} className="relative group cursor-pointer block p-1">
                {user.user_metadata.avatar_url ? (
                    <div className="relative w-9 h-9">
                        <img
                            src={user.user_metadata.avatar_url}
                            alt="Profile"
                            className="w-full h-full rounded-full border border-[#D4AF37]/50 group-hover:border-[#D4AF37] transition-all duration-300 object-cover shadow-[0_0_10px_rgba(212,175,55,0.2)] group-hover:shadow-[0_0_15px_rgba(212,175,55,0.5)]"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 bg-[#D4AF37] w-3 h-3 rounded-full border-2 border-[#0A0A0A] flex items-center justify-center">
                            <span className="sr-only">Active</span>
                        </div>
                    </div>
                ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8C7323] flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.3)] group-hover:shadow-[0_0_20px_rgba(212,175,55,0.6)] transition-all duration-300 border border-white/10 group-hover:border-white/30">
                        <span className="font-serif text-[#0A0A0A] font-bold text-lg drop-shadow-sm">
                            {user.email?.[0].toUpperCase()}
                        </span>
                    </div>
                )}
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
                        <div className="bg-[#0A0A0A]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] relative overflow-hidden">

                            {/* Decorative Background Glow */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#D4AF37]/10 blur-3xl rounded-full pointer-events-none"></div>

                            {/* User Header */}
                            <div className="p-5 border-b border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent relative z-10">
                                <p className="text-[#D4AF37] font-serif tracking-wide mb-1 text-base drop-shadow-sm truncate">
                                    {user.user_metadata.full_name || "Srivari Member"}
                                </p>
                                <p className="text-white/50 text-[10px] font-sans tracking-widest uppercase truncate">
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
