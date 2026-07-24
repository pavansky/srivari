"use client";

import { createClient } from "@/utils/supabase/client";
import { User as UserIcon, LogOut, LayoutDashboard, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import { emailIsAdmin } from "@/lib/adminEmails";

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
        return <div className="w-5 h-5 bg-white/10 animate-pulse" />;
    }

    if (!user) {
        return (
            <Link href="/login" aria-label="Sign In">
                <button className="flex items-center gap-2 text-white/70 hover:text-[#D4AF37] transition-colors duration-300 group" aria-label="Login">
                    <UserIcon className="w-5 h-5" strokeWidth={1.5} />
                    <span className="text-[10px] uppercase tracking-[0.25em] hidden md:block font-sans">Login</span>
                </button>
            </Link>
        );
    }

    // Role logic — a NAVIGATION HINT only; /admin itself is gated server-side.
    const isAdmin = emailIsAdmin(user.email, process.env.NEXT_PUBLIC_ADMIN_EMAILS);
    const targetLink = isAdmin ? '/admin' : '/account';
    const menuLabel = isAdmin ? 'Admin Console' : 'My Account';
    const MenuIcon = isAdmin ? LayoutDashboard : ShoppingBag;

    return (
        <div className="relative z-50 flex items-center" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>

            {/* Trigger — square hairline monogram, matching the house mark */}
            <Link href={targetLink} className="relative group cursor-pointer block p-1" aria-label={menuLabel}>
                {user.user_metadata.avatar_url ? (
                    <div className="relative w-8 h-8">
                        <img
                            src={user.user_metadata.avatar_url}
                            alt=""
                            className="w-full h-full border border-[#D4AF37]/40 group-hover:border-[#D4AF37] transition-colors duration-500 object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-8 h-8 flex items-center justify-center border border-[#D4AF37]/40 group-hover:border-[#D4AF37] transition-colors duration-500">
                        <span className="font-serif text-[#D4AF37] text-base leading-none">
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
                        <div className="bg-[#0A0A0A]/95 backdrop-blur-2xl border border-[#D4AF37]/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] relative overflow-hidden">

                            {/* Gold hairline along the top edge */}
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent pointer-events-none" />

                            {/* User header */}
                            <div className="p-5 border-b border-white/5">
                                <p className="text-marble font-serif tracking-wide mb-1.5 text-base truncate">
                                    {user.user_metadata.full_name || "Srivari Member"}
                                </p>
                                <p className="text-[#D4AF37]/70 text-[9px] font-sans tracking-[0.25em] uppercase truncate">
                                    {user.email}
                                </p>
                            </div>

                            {/* Menu items */}
                            <div className="p-2">
                                <Link
                                    href={targetLink}
                                    className="flex items-center gap-3 px-3 py-3 text-[10px] uppercase tracking-[0.25em] font-sans text-marble/70 hover:text-[#D4AF37] hover:bg-white/[0.04] transition-colors duration-300"
                                >
                                    <MenuIcon className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
                                    <span>{menuLabel}</span>
                                </Link>

                                <button
                                    onClick={handleSignOut}
                                    className="w-full flex items-center gap-3 px-3 py-3 text-[10px] uppercase tracking-[0.25em] font-sans text-marble/50 hover:text-marble hover:bg-white/[0.04] transition-colors duration-300 text-left"
                                >
                                    <LogOut className="w-4 h-4" strokeWidth={1.5} />
                                    <span>Sign Out</span>
                                </button>
                            </div>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
