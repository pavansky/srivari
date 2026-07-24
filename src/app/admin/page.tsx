"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    AlertTriangle, ArrowUpRight, Calendar, Clock, DollarSign, Package,
    Plus, ShoppingCart, Star, TrendingUp
} from "lucide-react";
import { useAdminData, formatINR } from "@/components/admin/AdminContext";
import { GlassCard, EmptyState, StatusBadge } from "@/components/admin/ui";

export default function AdminDashboard() {
    const { products, orders, isLoaded, error, refresh } = useAdminData();
    const [pendingReviews, setPendingReviews] = useState<number | null>(null);

    useEffect(() => {
        fetch("/api/admin/reviews")
            .then(r => (r.ok ? r.json() : []))
            .then((reviews: any[]) => setPendingReviews(reviews.filter(r => !r.isApproved).length))
            .catch(() => setPendingReviews(null));
    }, []);

    const stats = useMemo(() => {
        const active = products.filter(p => !p.isArchived);
        const totalRevenue = orders.filter(o => o.status !== "Cancelled" && o.status !== "Pending")
            .reduce((sum, o) => sum + o.totalAmount, 0);
        const activeOrders = orders.filter(o => ["Pending", "Placed", "Paid", "Shipped"].includes(o.status)).length;
        const stockValue = active.reduce((sum, p) => sum + p.stock * p.price, 0);
        const lowStock = active.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 5));
        const outOfStock = active.filter(p => p.stock === 0);
        const todaysOrders = orders.filter(o => new Date(o.date).toDateString() === new Date().toDateString());
        return { totalRevenue, activeOrders, stockValue, lowStock, outOfStock, todaysOrders };
    }, [products, orders]);

    // 14-day revenue trend
    const trend = useMemo(() => {
        const days = Array.from({ length: 14 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (13 - i));
            return d;
        });
        const daily = days.map(day => {
            const dayStr = day.toDateString();
            return orders
                .filter(o => o.status !== "Cancelled" && o.status !== "Pending" && new Date(o.date).toDateString() === dayStr)
                .reduce((sum, o) => sum + o.totalAmount, 0);
        });
        return { days, daily, max: Math.max(...daily, 1) };
    }, [orders]);

    const recentOrders = orders.slice(0, 6);

    const statCards = [
        { label: "Total Revenue", value: formatINR(stats.totalRevenue), icon: DollarSign, color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/20", href: "/admin/analytics" },
        { label: "Active Orders", value: String(stats.activeOrders), icon: ShoppingCart, color: "text-sky-400", bg: "from-sky-500/20 to-sky-500/5", border: "border-sky-500/20", href: "/admin/orders" },
        { label: "Stock Value", value: formatINR(stats.stockValue), icon: Package, color: "text-[#D4AF37]", bg: "from-[#D4AF37]/20 to-[#D4AF37]/5", border: "border-[#D4AF37]/20", href: "/admin/products" },
        { label: "Stock Alerts", value: String(stats.lowStock.length + stats.outOfStock.length), icon: AlertTriangle, color: stats.lowStock.length + stats.outOfStock.length > 0 ? "text-amber-400" : "text-green-400", bg: "from-amber-500/20 to-amber-500/5", border: "border-amber-500/20", href: "/admin/products?stock=low-stock" },
        { label: "Today's Orders", value: String(stats.todaysOrders.length), icon: Calendar, color: "text-violet-400", bg: "from-violet-500/20 to-violet-500/5", border: "border-violet-500/20", href: "/admin/orders" },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-serif bg-gradient-to-r from-[#D4AF37] via-[#F2D06B] to-[#D4AF37] bg-clip-text text-transparent">
                        Welcome back
                    </h1>
                    <p className="text-sm text-white/40 mt-1">
                        {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        {" · "}Your boutique at a glance
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href="/admin/products?new=1" className="bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2">
                        <Plus size={16} /> Add Product
                    </Link>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3">
                    <AlertTriangle size={20} />
                    <p className="text-sm flex-1">{error}</p>
                    <button onClick={refresh} className="bg-red-500/20 px-3 py-1 rounded text-sm hover:bg-red-500/40">Retry</button>
                </div>
            )}

            {/* Stats */}
            <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                {statCards.map(stat => (
                    <Link key={stat.label} href={stat.href}>
                        <GlassCard className="p-5 flex items-center gap-4 hover:border-white/15 transition-all duration-500 h-full">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.bg} border ${stat.border} ${stat.color} shrink-0`}>
                                <stat.icon size={20} strokeWidth={1.5} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.15em] mb-1">{stat.label}</p>
                                <p className={`text-lg md:text-xl font-bold tracking-tight truncate ${stat.color}`}>{isLoaded ? stat.value : "—"}</p>
                            </div>
                        </GlassCard>
                    </Link>
                ))}
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Revenue trend */}
                <GlassCard className="p-7 xl:col-span-2">
                    <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] mb-6 font-bold flex items-center gap-2">
                        <TrendingUp size={14} /> 14-Day Revenue
                    </h3>
                    <div className="flex items-end gap-1.5 h-36">
                        {trend.daily.map((rev, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                                <div
                                    className="w-full rounded-t-md bg-gradient-to-t from-[#D4AF37]/70 to-[#F2D06B]/50 group-hover:from-[#D4AF37] group-hover:to-[#F2D06B] transition-all duration-500 relative"
                                    style={{ height: `${Math.max((rev / trend.max) * 100, 3)}%` }}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-[#D4AF37] text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-[#D4AF37]/30 z-10 pointer-events-none">
                                        {formatINR(rev)}
                                    </div>
                                </div>
                                <span className="text-[8px] text-white/30">
                                    {trend.days[i].toLocaleDateString("en-IN", { day: "numeric" })}
                                </span>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                {/* Needs attention */}
                <GlassCard className="p-7">
                    <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] mb-6 font-bold flex items-center gap-2">
                        <Clock size={14} /> Needs Attention
                    </h3>
                    <div className="space-y-3 text-sm">
                        <Link href="/admin/orders?status=Pending" className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                            <span className="text-white/70">Orders awaiting action</span>
                            <span className="font-bold text-[#D4AF37]">{orders.filter(o => ["Pending", "Placed", "Paid"].includes(o.status)).length}</span>
                        </Link>
                        <Link href="/admin/products?stock=low-stock" className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                            <span className="text-white/70">Low stock pieces</span>
                            <span className={`font-bold ${stats.lowStock.length ? "text-amber-400" : "text-emerald-400"}`}>{stats.lowStock.length}</span>
                        </Link>
                        <Link href="/admin/products?stock=out-of-stock" className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                            <span className="text-white/70">Out of stock</span>
                            <span className={`font-bold ${stats.outOfStock.length ? "text-red-400" : "text-emerald-400"}`}>{stats.outOfStock.length}</span>
                        </Link>
                        <Link href="/admin/reviews" className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                            <span className="text-white/70 flex items-center gap-2"><Star size={13} className="text-[#D4AF37]" /> Reviews to moderate</span>
                            <span className="font-bold text-[#D4AF37]">{pendingReviews ?? "—"}</span>
                        </Link>
                    </div>
                </GlassCard>
            </div>

            {/* Recent orders */}
            <GlassCard className="p-7">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold flex items-center gap-2">
                        <ShoppingCart size={14} /> Recent Orders
                    </h3>
                    <Link href="/admin/orders" className="text-xs text-white/40 hover:text-[#D4AF37] flex items-center gap-1 transition-colors">
                        View all <ArrowUpRight size={12} />
                    </Link>
                </div>
                {recentOrders.length > 0 ? (
                    <div className="divide-y divide-white/[0.04]">
                        {recentOrders.map(o => (
                            <Link key={o.id} href={`/admin/orders?q=${encodeURIComponent(o.id)}`} className="flex items-center gap-4 py-3.5 group">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-white/80 group-hover:text-white truncate">
                                        <span className="text-[#D4AF37] font-mono text-xs mr-2">#{o.id}</span>
                                        {o.customerName}
                                    </p>
                                    <p className="text-[11px] text-white/30 mt-0.5">
                                        {new Date(o.date).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                        {" · "}{o.items?.length || 0} item{(o.items?.length || 0) !== 1 ? "s" : ""}
                                    </p>
                                </div>
                                <span className="font-bold text-sm text-white/90">{formatINR(o.totalAmount)}</span>
                                <StatusBadge status={o.status} />
                            </Link>
                        ))}
                    </div>
                ) : (
                    <EmptyState title={isLoaded ? "No orders yet" : "Loading…"} subtitle={isLoaded ? "New orders will appear here." : undefined} />
                )}
            </GlassCard>
        </motion.div>
    );
}
