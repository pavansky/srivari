"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
    BarChart3, Box, Command, Globe, Home, LayoutDashboard, LogOut, Megaphone, Menu, Moon,
    Package, ShoppingCart, Star, Sun, Tag, Users, X, Settings} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { ToastProvider } from "@/components/admin/Toast";
import { ConfirmProvider } from "@/components/admin/ConfirmDialog";
import { AdminDataProvider } from "@/components/admin/AdminContext";
import { CommandPalette } from "@/components/admin/CommandPalette";
import { GlassCard } from "@/components/admin/ui";

const NAV_ITEMS = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { label: "Products", icon: Box, href: "/admin/products" },
    { label: "Orders", icon: ShoppingCart, href: "/admin/orders" },
    { label: "Customers", icon: Users, href: "/admin/customers" },
    { label: "Analytics", icon: BarChart3, href: "/admin/analytics" },
    { label: "Coupons", icon: Tag, href: "/admin/coupons" },
    { label: "Reviews", icon: Star, href: "/admin/reviews" },
    { label: "Marketing", icon: Megaphone, href: "/admin/marketing" },
    { label: "Channels", icon: Globe, href: "/admin/channels" },
    { label: "Settings", icon: Settings, href: "/admin/settings/notifications" },
    { label: "Suppliers", icon: Package, href: "/admin/suppliers" },
];

// Client-side gate is UX only — every admin API enforces auth server-side.
const CLIENT_ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "support@thesrivari.com")
    .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
const DEV_BYPASS = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_ADMIN_DEV_BYPASS === "1";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [authState, setAuthState] = useState<"checking" | "ok">("checking");
    const [isLightMode, setIsLightMode] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    useEffect(() => {
        if (DEV_BYPASS) {
            setAuthState("ok");
            return;
        }
        const check = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email && CLIENT_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
                setAuthState("ok");
            } else {
                window.location.href = "/login?redirect=/admin";
            }
        };
        check();
    }, []);

    // Persisted light/dark preference
    useEffect(() => {
        setIsLightMode(localStorage.getItem("srivari_admin_theme") === "light");
    }, []);
    const toggleTheme = () => {
        setIsLightMode(prev => {
            localStorage.setItem("srivari_admin_theme", prev ? "dark" : "light");
            return !prev;
        });
    };

    // Hide the storefront particle background while inside the console
    useEffect(() => {
        window.dispatchEvent(new CustomEvent("toggleParticles", { detail: { hide: true } }));
        return () => {
            window.dispatchEvent(new CustomEvent("toggleParticles", { detail: { hide: false } }));
        };
    }, []);

    // Close the mobile drawer on navigation
    useEffect(() => {
        setIsMobileNavOpen(false);
    }, [pathname]);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    if (authState === "checking") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
                <GlassCard className="p-10 text-center">
                    <div className="w-10 h-10 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white/40 text-sm tracking-widest uppercase">Verifying access…</p>
                </GlassCard>
            </div>
        );
    }

    const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

    const navLinks = (
        <nav className="flex-1 space-y-1">
            {NAV_ITEMS.map(item => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-300 ${
                        isActive(item.href)
                            ? "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 shadow-[0_0_15px_rgba(212,175,55,0.1)] font-semibold"
                            : "text-white/40 hover:text-white/80 hover:bg-white/[0.04] border border-transparent"
                    }`}
                >
                    <item.icon size={17} strokeWidth={1.75} />
                    {item.label}
                </Link>
            ))}
        </nav>
    );

    const sidebarFooter = (
        <div className="space-y-1 pt-4 border-t border-white/[0.06]">
            <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-emerald-400/70 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all">
                <Home size={16} /> Storefront
            </Link>
            <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-[#D4AF37] hover:bg-white/[0.04] transition-all">
                {isLightMode ? <Moon size={16} /> : <Sun size={16} />}
                {isLightMode ? "Dark Mode" : "Light Mode"}
            </button>
            <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all">
                <LogOut size={16} /> Sign Out
            </button>
        </div>
    );

    return (
        <ToastProvider>
            <ConfirmProvider>
                <AdminDataProvider>
                    <div className={`min-h-screen bg-[#020202] text-gray-200 font-sans selection:bg-[#D4AF37]/30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/20 via-[#020202] to-[#020202] transition-colors duration-500 ${isLightMode ? "admin-light" : ""}`}>

                        {/* --- Desktop Sidebar --- */}
                        <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-[#0A0A0A]/90 backdrop-blur-3xl border-r border-white/[0.06] p-5 z-40">
                            <Link href="/admin" className="flex items-center gap-3 px-2 pb-6 mb-4 border-b border-white/[0.06]">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#8C7320] rounded-xl flex items-center justify-center text-black font-serif font-bold text-lg shadow-[0_0_25px_rgba(212,175,55,0.35)]">
                                    S
                                </div>
                                <div>
                                    <p className="font-serif text-lg bg-gradient-to-r from-[#D4AF37] via-[#F2D06B] to-[#D4AF37] bg-clip-text text-transparent leading-tight">The Srivari</p>
                                    <p className="text-white/30 text-[9px] tracking-[0.2em] uppercase">Command Center</p>
                                </div>
                            </Link>
                            {navLinks}
                            <button
                                onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
                                className="flex items-center gap-2 px-4 py-2.5 mb-2 rounded-xl text-xs text-white/30 hover:text-white/60 hover:bg-white/[0.04] border border-white/[0.06] transition-all"
                            >
                                <Command size={12} /> Quick search <kbd className="ml-auto text-[9px] border border-white/10 rounded px-1">⌘K</kbd>
                            </button>
                            {sidebarFooter}
                        </aside>

                        {/* --- Mobile top bar --- */}
                        <header className="lg:hidden sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-3xl border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
                            <Link href="/admin" className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#8C7320] rounded-lg flex items-center justify-center text-black font-serif font-bold shadow-[0_0_20px_rgba(212,175,55,0.3)]">S</div>
                                <span className="font-serif text-lg bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] bg-clip-text text-transparent">Command Center</span>
                            </Link>
                            <button onClick={() => setIsMobileNavOpen(true)} className="p-2 text-white/60 hover:text-[#D4AF37]" aria-label="Open admin menu">
                                <Menu size={22} />
                            </button>
                        </header>

                        {/* --- Mobile drawer --- */}
                        <AnimatePresence>
                            {isMobileNavOpen && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                                    onClick={() => setIsMobileNavOpen(false)}
                                >
                                    <motion.aside
                                        initial={{ x: "-100%" }}
                                        animate={{ x: 0 }}
                                        exit={{ x: "-100%" }}
                                        transition={{ type: "tween", duration: 0.25 }}
                                        onClick={e => e.stopPropagation()}
                                        className="flex flex-col w-72 max-w-[85vw] h-full bg-[#0A0A0A] border-r border-white/[0.08] p-5"
                                    >
                                        <div className="flex items-center justify-between pb-5 mb-4 border-b border-white/[0.06]">
                                            <span className="font-serif text-lg text-[#D4AF37]">Command Center</span>
                                            <button onClick={() => setIsMobileNavOpen(false)} className="p-1.5 text-white/50 hover:text-white" aria-label="Close admin menu">
                                                <X size={20} />
                                            </button>
                                        </div>
                                        {navLinks}
                                        {sidebarFooter}
                                    </motion.aside>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* --- Content --- */}
                        <main className="lg:pl-64">
                            <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-10 space-y-8">
                                {children}
                            </div>
                        </main>

                        <CommandPalette />
                    </div>
                </AdminDataProvider>
            </ConfirmProvider>
        </ToastProvider>
    );
}
