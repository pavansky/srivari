"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Activity, AlertTriangle, BarChart3, Boxes, Filter, IndianRupee, Package,
    PackageX, ShoppingCart, Tags, TrendingDown, TrendingUp, Trophy, Users, Wallet
} from "lucide-react";
import { useAdminData, formatINR } from "@/components/admin/AdminContext";
import { GlassCard, EmptyState, SectionHeading, StatusBadge } from "@/components/admin/ui";
import { Order } from "@/types";

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

const DAY_MS = 86400000;

const isCounted = (o: Order) => o.status !== "Cancelled" && o.status !== "Pending";

const startOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
};

const initials = (name: string) =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "?";

const timeAgo = (date: Date) => {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const FUNNEL_STATUSES: Order["status"][] = ["Pending", "Placed", "Paid", "Shipped", "Delivered", "Cancelled"];

const FUNNEL_COLORS: Record<string, string> = {
    Pending: "bg-[#D4AF37]/70",
    Placed: "bg-[#F2D06B]/70",
    Paid: "bg-sky-500/70",
    Shipped: "bg-blue-500/70",
    Delivered: "bg-emerald-500/70",
    Cancelled: "bg-red-500/70",
};

export default function AnalyticsPage() {
    const { products, orders, isLoaded, error, refresh } = useAdminData();
    const [range, setRange] = useState<Range>(30);

    const a = useMemo(() => {
        const start = startOfDay(new Date());
        start.setDate(start.getDate() - (range - 1));
        const prevStart = new Date(start);
        prevStart.setDate(prevStart.getDate() - range);

        const inRange = orders.filter(o => new Date(o.date) >= start);
        const counted = inRange.filter(isCounted);
        const prevCounted = orders.filter(o => {
            const d = new Date(o.date);
            return d >= prevStart && d < start && isCounted(o);
        });

        const productById = new Map(products.map(p => [p.id, p]));

        // Headline stats
        const revenue = counted.reduce((s, o) => s + o.totalAmount, 0);
        const prevRevenue = prevCounted.reduce((s, o) => s + o.totalAmount, 0);
        const orderCount = counted.length;
        const aov = orderCount ? revenue / orderCount : 0;
        const change = prevRevenue > 0
            ? ((revenue - prevRevenue) / prevRevenue) * 100
            : revenue > 0 ? 100 : 0;

        // Est. gross profit — only for items whose product has a known cost price
        let profit = 0;
        let hasCost = false;
        counted.forEach(o => (o.items || []).forEach(it => {
            const p = productById.get(it.productId);
            if (p?.priceCps) {
                hasCost = true;
                profit += (it.price - (p.priceCps || 0) - (p.shipping || 0)) * it.quantity;
            }
        }));

        // Chart buckets: daily for 7/30, weekly for 90
        const bucketDays = range === 90 ? 7 : 1;
        const bucketCount = range === 90 ? Math.ceil(90 / 7) : range;
        const buckets = Array.from({ length: bucketCount }, (_, i) => {
            const bStart = new Date(start);
            bStart.setDate(bStart.getDate() + i * bucketDays);
            return { start: bStart, total: 0 };
        });
        counted.forEach(o => {
            const dayIdx = Math.round((startOfDay(new Date(o.date)).getTime() - start.getTime()) / DAY_MS);
            const idx = Math.min(Math.max(Math.floor(dayIdx / bucketDays), 0), bucketCount - 1);
            buckets[idx].total += o.totalAmount;
        });
        const maxBucket = Math.max(...buckets.map(b => b.total), 1);

        // Order funnel (range-filtered, all statuses)
        const funnel = FUNNEL_STATUSES.map(status => ({
            status,
            count: inRange.filter(o => o.status === status).length,
        }));
        const maxFunnel = Math.max(...funnel.map(f => f.count), 1);

        // Top sellers by quantity
        const sellerMap = new Map<string, { name: string; qty: number; revenue: number }>();
        counted.forEach(o => (o.items || []).forEach(it => {
            const cur = sellerMap.get(it.productId)
                || { name: it.productName || productById.get(it.productId)?.name || "Unknown product", qty: 0, revenue: 0 };
            cur.qty += it.quantity;
            cur.revenue += it.price * it.quantity;
            sellerMap.set(it.productId, cur);
        }));
        const topSellers = [...sellerMap.entries()]
            .map(([id, v]) => ({ id, ...v }))
            .sort((x, y) => y.qty - x.qty)
            .slice(0, 5);

        // Revenue by category
        const catMap = new Map<string, number>();
        counted.forEach(o => (o.items || []).forEach(it => {
            const cat = productById.get(it.productId)?.category || "Unknown";
            catMap.set(cat, (catMap.get(cat) || 0) + it.price * it.quantity);
        }));
        const byCategory = [...catMap.entries()]
            .map(([name, rev]) => ({ name, revenue: rev }))
            .sort((x, y) => y.revenue - x.revenue);
        const maxCat = Math.max(...byCategory.map(c => c.revenue), 1);

        // Top customers by revenue
        const custMap = new Map<string, { name: string; orders: number; revenue: number }>();
        counted.forEach(o => {
            const key = o.customerPhone || o.customerEmail || o.customerName;
            const cur = custMap.get(key) || { name: o.customerName || "Guest", orders: 0, revenue: 0 };
            cur.orders += 1;
            cur.revenue += o.totalAmount;
            custMap.set(key, cur);
        });
        const topCustomers = [...custMap.values()].sort((x, y) => y.revenue - x.revenue).slice(0, 5);

        // Inventory health
        const active = products.filter(p => !p.isArchived);
        const stockValue = active.reduce((s, p) => s + p.stock * p.price, 0);
        const lowStockProducts = active.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 5));
        const outOfStock = active.filter(p => p.stock === 0).length;
        const soldIds = new Set<string>();
        counted.forEach(o => (o.items || []).forEach(it => soldIds.add(it.productId)));
        const deadStock = active.filter(p => p.stock > 0 && !soldIds.has(p.id)).length;

        // Activity feed: recent orders + low-stock alerts, newest first
        const events = [
            ...orders.slice(0, 8).map(o => ({ kind: "order" as const, date: new Date(o.date), order: o })),
            ...lowStockProducts.map(p => ({
                kind: "stock" as const,
                date: new Date(p.updatedAt || p.createdAt || Date.now()),
                product: p,
            })),
        ].sort((x, y) => y.date.getTime() - x.date.getTime()).slice(0, 8);

        return {
            counted, revenue, prevRevenue, orderCount, aov, change, profit, hasCost,
            buckets, maxBucket, funnel, maxFunnel, topSellers, byCategory, maxCat,
            topCustomers, stockValue, lowStockCount: lowStockProducts.length, outOfStock,
            deadStock, events,
        };
    }, [orders, products, range]);

    const noSales = isLoaded && a.counted.length === 0;

    const bucketLabel = (d: Date, i: number) => {
        if (range === 90) return i % 2 === 0 ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";
        if (range === 30) return i % 5 === 0 || i === 29 ? d.toLocaleDateString("en-IN", { day: "numeric" }) : "";
        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    };

    const statCards = [
        {
            label: "Revenue", value: formatINR(a.revenue), icon: IndianRupee, caption: undefined as string | undefined,
            color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/20",
        },
        {
            label: "Orders", value: String(a.orderCount), icon: ShoppingCart, caption: undefined as string | undefined,
            color: "text-sky-400", bg: "from-sky-500/20 to-sky-500/5", border: "border-sky-500/20",
        },
        {
            label: "Avg Order Value", value: formatINR(Math.round(a.aov)), icon: Wallet, caption: undefined as string | undefined,
            color: "text-violet-400", bg: "from-violet-500/20 to-violet-500/5", border: "border-violet-500/20",
        },
        {
            label: "Est. Gross Profit", value: a.hasCost ? formatINR(Math.round(a.profit)) : "—", icon: TrendingUp,
            color: "text-[#D4AF37]", bg: "from-[#D4AF37]/20 to-[#D4AF37]/5", border: "border-[#D4AF37]/20",
            caption: a.hasCost ? undefined : "Est. profit (needs cost prices)",
        },
    ];

    const inventoryTiles = [
        { label: "Stock Value", value: formatINR(a.stockValue), icon: Package, color: "text-[#D4AF37]", href: "/admin/products" },
        { label: "Low Stock", value: String(a.lowStockCount), icon: AlertTriangle, color: a.lowStockCount ? "text-amber-400" : "text-emerald-400", href: "/admin/products?stock=low-stock" },
        { label: "Out of Stock", value: String(a.outOfStock), icon: PackageX, color: a.outOfStock ? "text-red-400" : "text-emerald-400", href: "/admin/products?stock=out-of-stock" },
        { label: `Dead Stock (${range}d)`, value: String(a.deadStock), icon: Boxes, color: a.deadStock ? "text-violet-400" : "text-emerald-400", href: "/admin/products" },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <SectionHeading
                title="Business Intelligence"
                subtitle="Computed live from your orders and catalogue"
                icon={<BarChart3 className="text-[#D4AF37]" size={26} strokeWidth={1.5} />}
                actions={
                    <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                        {RANGES.map(r => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                aria-pressed={range === r}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                                    range === r
                                        ? "bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                                        : "text-white/40 hover:text-white"
                                }`}
                            >
                                {r}d
                            </button>
                        ))}
                    </div>
                }
            />

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3">
                    <AlertTriangle size={20} />
                    <p className="text-sm flex-1">{error}</p>
                    <button onClick={refresh} className="bg-red-500/20 px-3 py-1 rounded text-sm hover:bg-red-500/40">Retry</button>
                </div>
            )}

            {/* Range stats */}
            <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {statCards.map(stat => (
                    <GlassCard key={stat.label} className="p-5 flex items-center gap-4 hover:border-white/15 transition-all duration-500 h-full">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.bg} border ${stat.border} ${stat.color} shrink-0`}>
                            <stat.icon size={20} strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.15em] mb-1">{stat.label}</p>
                            <p className={`text-lg md:text-xl font-bold tracking-tight truncate ${stat.color}`}>{isLoaded ? stat.value : "—"}</p>
                            {isLoaded && stat.caption && (
                                <p className="text-[9px] text-white/30 mt-0.5">{stat.caption}</p>
                            )}
                        </div>
                    </GlassCard>
                ))}
            </section>

            {/* Revenue chart */}
            <GlassCard className="p-7">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                    <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold flex items-center gap-2">
                        <TrendingUp size={14} /> Revenue · Last {range} days
                    </h3>
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-white/40">
                            <span className="text-white/80 font-bold">{formatINR(a.revenue)}</span>
                            {" vs "}
                            {formatINR(a.prevRevenue)} previous {range}d
                        </span>
                        <span
                            className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                a.change >= 0
                                    ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                                    : "text-red-400 border-red-500/30 bg-red-500/10"
                            }`}
                        >
                            {a.change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {Math.abs(a.change).toFixed(1)}%
                        </span>
                    </div>
                </div>
                {!isLoaded ? (
                    <EmptyState title="Loading…" />
                ) : noSales ? (
                    <EmptyState icon={<BarChart3 size={22} />} title="No sales in this range" subtitle="Counted orders exclude Pending and Cancelled." />
                ) : (
                    <div className={`flex items-end h-40 ${range === 30 ? "gap-1" : "gap-1.5"}`}>
                        {a.buckets.map((b, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group min-w-0">
                                <div
                                    className="w-full rounded-t-md bg-gradient-to-t from-[#D4AF37]/70 to-[#F2D06B]/50 group-hover:from-[#D4AF37] group-hover:to-[#F2D06B] transition-all duration-500 relative"
                                    style={{ height: `${Math.max((b.total / a.maxBucket) * 100, 3)}%` }}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-[#D4AF37] text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-[#D4AF37]/30 z-10 pointer-events-none">
                                        {range === 90 ? "Wk of " : ""}
                                        {b.start.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                        {" · "}{formatINR(b.total)}
                                    </div>
                                </div>
                                <span className="text-[8px] text-white/30 whitespace-nowrap">{bucketLabel(b.start, i)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </GlassCard>

            {/* Insight grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Order funnel */}
                <GlassCard className="p-7">
                    <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] mb-6 font-bold flex items-center gap-2">
                        <Filter size={14} /> Order Funnel
                    </h3>
                    {!isLoaded ? (
                        <EmptyState title="Loading…" />
                    ) : (
                        <div className="space-y-4">
                            {a.funnel.map(f => (
                                <div key={f.status} className="flex items-center gap-3">
                                    <span className="w-20 text-[10px] uppercase tracking-widest text-white/40 font-bold shrink-0">{f.status}</span>
                                    <div className="flex-1 h-2.5 rounded-full bg-white/[0.05] overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${FUNNEL_COLORS[f.status]}`}
                                            style={{ width: `${(f.count / a.maxFunnel) * 100}%` }}
                                        />
                                    </div>
                                    <span className="w-8 text-right text-sm font-bold text-white/80">{f.count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>

                {/* Top sellers */}
                <GlassCard className="p-7">
                    <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] mb-6 font-bold flex items-center gap-2">
                        <Trophy size={14} /> Top Sellers
                    </h3>
                    {a.topSellers.length > 0 ? (
                        <div className="space-y-3">
                            {a.topSellers.map((p, i) => (
                                <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                                    <span className="w-7 h-7 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-bold flex items-center justify-center shrink-0">
                                        {i + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-white/80 truncate">{p.name}</p>
                                        <p className="text-[11px] text-white/30">{p.qty} sold</p>
                                    </div>
                                    <span className="text-sm font-bold text-[#D4AF37]">{formatINR(p.revenue)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={<Trophy size={22} />} title={isLoaded ? "No sales in this range" : "Loading…"} />
                    )}
                </GlassCard>

                {/* Revenue by category */}
                <GlassCard className="p-7">
                    <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] mb-6 font-bold flex items-center gap-2">
                        <Tags size={14} /> Revenue by Category
                    </h3>
                    {a.byCategory.length > 0 ? (
                        <div className="space-y-4">
                            {a.byCategory.map(c => (
                                <div key={c.name}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-sm text-white/70 truncate">{c.name}</span>
                                        <span className="text-xs font-bold text-white/80 ml-3 shrink-0">{formatINR(c.revenue)}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-[#D4AF37]/80 to-[#F2D06B]/60 transition-all duration-700"
                                            style={{ width: `${(c.revenue / a.maxCat) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={<Tags size={22} />} title={isLoaded ? "No sales in this range" : "Loading…"} />
                    )}
                </GlassCard>

                {/* Top customers */}
                <GlassCard className="p-7">
                    <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] mb-6 font-bold flex items-center gap-2">
                        <Users size={14} /> Top Customers
                    </h3>
                    {a.topCustomers.length > 0 ? (
                        <div className="space-y-3">
                            {a.topCustomers.map((c, i) => (
                                <div key={`${c.name}-${i}`} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                                    <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4AF37]/30 to-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold flex items-center justify-center shrink-0">
                                        {initials(c.name)}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-white/80 truncate">{c.name}</p>
                                        <p className="text-[11px] text-white/30">{c.orders} order{c.orders !== 1 ? "s" : ""}</p>
                                    </div>
                                    <span className="text-sm font-bold text-white/90">{formatINR(c.revenue)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={<Users size={22} />} title={isLoaded ? "No customers in this range" : "Loading…"} />
                    )}
                </GlassCard>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Inventory health */}
                <GlassCard className="p-7">
                    <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] mb-6 font-bold flex items-center gap-2">
                        <Package size={14} /> Inventory Health
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {inventoryTiles.map(tile => (
                            <Link key={tile.label} href={tile.href} className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/15 transition-all">
                                <tile.icon size={16} strokeWidth={1.5} className={`${tile.color} mb-2`} />
                                <p className={`text-base font-bold tracking-tight truncate ${tile.color}`}>{isLoaded ? tile.value : "—"}</p>
                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.15em] mt-1">{tile.label}</p>
                            </Link>
                        ))}
                    </div>
                </GlassCard>

                {/* Recent activity */}
                <GlassCard className="p-7 xl:col-span-2">
                    <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] mb-4 font-bold flex items-center gap-2">
                        <Activity size={14} /> Recent Activity
                    </h3>
                    {a.events.length > 0 ? (
                        <div className="divide-y divide-white/[0.04]">
                            {a.events.map((e, i) => e.kind === "order" ? (
                                <Link key={`o-${e.order.id}-${i}`} href={`/admin/orders?q=${encodeURIComponent(e.order.id)}`} className="flex items-center gap-3 py-3.5 group">
                                    <span className="w-2 h-2 rounded-full bg-[#D4AF37] shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-white/80 group-hover:text-white truncate">
                                            <span className="text-[#D4AF37] font-mono text-xs mr-2">#{e.order.id}</span>
                                            {e.order.customerName}
                                        </p>
                                        <p className="text-[11px] text-white/30 mt-0.5">{timeAgo(e.date)}</p>
                                    </div>
                                    <span className="text-sm font-bold text-white/90">{formatINR(e.order.totalAmount)}</span>
                                    <StatusBadge status={e.order.status} />
                                </Link>
                            ) : (
                                <Link key={`s-${e.product.id}-${i}`} href="/admin/products?stock=low-stock" className="flex items-center gap-3 py-3.5 group">
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-white/80 group-hover:text-white truncate">
                                            Low stock · {e.product.name}
                                        </p>
                                        <p className="text-[11px] text-white/30 mt-0.5">{timeAgo(e.date)}</p>
                                    </div>
                                    <span className="text-xs font-bold text-amber-400 whitespace-nowrap">{e.product.stock} left</span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={<Activity size={22} />} title={isLoaded ? "No recent activity" : "Loading…"} subtitle={isLoaded ? "Orders and stock alerts will appear here." : undefined} />
                    )}
                </GlassCard>
            </div>
        </motion.div>
    );
}
