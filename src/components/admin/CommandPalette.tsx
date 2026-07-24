"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Box, Command, Home, LayoutDashboard, Package, Search, ShoppingCart, Star, Tag, Users } from "lucide-react";
import { useAdminData } from "./AdminContext";

/* Cmd+K palette: navigation + jump-to-order / jump-to-product search. */

export function CommandPalette() {
    const router = useRouter();
    const { products, orders } = useAdminData();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen(prev => !prev);
                setQuery("");
            }
            if (e.key === "Escape") setIsOpen(false);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    const go = (href: string) => {
        setIsOpen(false);
        router.push(href);
    };

    const navActions = useMemo(() => [
        { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
        { label: "Products & Inventory", icon: Box, href: "/admin/products" },
        { label: "Orders", icon: ShoppingCart, href: "/admin/orders" },
        { label: "Customers", icon: Users, href: "/admin/customers" },
        { label: "Analytics", icon: BarChart3, href: "/admin/analytics" },
        { label: "Coupons", icon: Tag, href: "/admin/coupons" },
        { label: "Reviews", icon: Star, href: "/admin/reviews" },
        { label: "Suppliers", icon: Package, href: "/admin/suppliers" },
        { label: "Go to Storefront", icon: Home, href: "/" },
    ], []);

    const q = query.trim().toLowerCase();
    const filteredNav = navActions.filter(a => a.label.toLowerCase().includes(q));
    const matchedOrders = q.length >= 2
        ? orders.filter(o =>
            o.id.toLowerCase().includes(q) ||
            o.customerName.toLowerCase().includes(q) ||
            o.customerPhone.includes(q)
        ).slice(0, 5)
        : [];
    const matchedProducts = q.length >= 2
        ? products.filter(p =>
            p.name.toLowerCase().includes(q) ||
            (p.sku || "").toLowerCase().includes(q)
        ).slice(0, 5)
        : [];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[140] flex items-start justify-center bg-black/70 backdrop-blur-sm pt-[15vh] p-4"
                    onClick={() => setIsOpen(false)}
                >
                    <motion.div
                        initial={{ scale: 0.98, y: -8 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.98, y: -8 }}
                        onClick={e => e.stopPropagation()}
                        className="w-full max-w-xl bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden"
                    >
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
                            <Search size={18} className="text-[#D4AF37]" />
                            <input
                                autoFocus
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search pages, orders, products..."
                                className="flex-1 bg-transparent text-white placeholder-white/25 outline-none text-sm"
                                aria-label="Command palette search"
                            />
                            <kbd className="text-[10px] text-white/30 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1">
                                <Command size={10} /> K
                            </kbd>
                        </div>
                        <div className="max-h-[50vh] overflow-y-auto p-2">
                            {filteredNav.length > 0 && (
                                <div className="mb-1">
                                    <p className="text-[10px] uppercase tracking-widest text-white/25 px-3 py-2">Navigate</p>
                                    {filteredNav.map(a => (
                                        <button
                                            key={a.href}
                                            onClick={() => go(a.href)}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-colors text-left"
                                        >
                                            <a.icon size={15} /> {a.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {matchedOrders.length > 0 && (
                                <div className="mb-1">
                                    <p className="text-[10px] uppercase tracking-widest text-white/25 px-3 py-2">Orders</p>
                                    {matchedOrders.map(o => (
                                        <button
                                            key={o.id}
                                            onClick={() => go(`/admin/orders?q=${encodeURIComponent(o.id)}`)}
                                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-colors text-left"
                                        >
                                            <span>#{o.id} — {o.customerName}</span>
                                            <span className="text-xs text-white/40">₹{o.totalAmount.toLocaleString("en-IN")}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {matchedProducts.length > 0 && (
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-white/25 px-3 py-2">Products</p>
                                    {matchedProducts.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => go(`/admin/products?q=${encodeURIComponent(p.name)}`)}
                                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-colors text-left"
                                        >
                                            <span className="truncate">{p.name}</span>
                                            <span className="text-xs text-white/40 shrink-0 ml-3">{p.stock} in stock</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {filteredNav.length === 0 && matchedOrders.length === 0 && matchedProducts.length === 0 && (
                                <p className="text-sm text-white/30 text-center py-8">No matches for &ldquo;{query}&rdquo;</p>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
