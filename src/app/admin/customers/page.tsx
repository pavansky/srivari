"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    AlertTriangle, ArrowUpRight, Gem, Mail, MessageCircle, Repeat,
    Search, UserPlus, Users
} from "lucide-react";
import { useAdminData, formatINR } from "@/components/admin/AdminContext";
import {
    EmptyState, GhostButton, GlassCard, GlassInput, GlassSelect, SectionHeading
} from "@/components/admin/ui";
import { Order } from "@/types";

/* Derived CRM — there is no Customer table. Customers are aggregated
   client-side from orders, keyed by normalized phone (last 10 digits),
   falling back to email, then name. */

interface CustomerRow {
    key: string;
    name: string;
    phone: string;
    email: string;
    ordersCount: number;
    countedOrders: number;
    lifetimeValue: number;
    avgOrderValue: number;
    firstOrderDate: number;
    lastOrderDate: number;
    statuses: Record<string, number>;
    isRepeat: boolean;
    isVip: boolean;
}

type SortKey = "value" | "recent" | "orders";

const STATUS_ORDER: Order["status"][] = ["Placed", "Paid", "Pending", "Shipped", "Delivered", "Cancelled"];

const isCounted = (o: Order) => o.status !== "Cancelled" && o.status !== "Pending";

const customerKey = (o: Order) => {
    const digits = (o.customerPhone || "").replace(/\D/g, "");
    if (digits) return `p:${digits.slice(-10)}`;
    const email = (o.customerEmail || "").trim().toLowerCase();
    if (email) return `e:${email}`;
    return `n:${(o.customerName || "").trim().toLowerCase() || "unknown"}`;
};

const initials = (name: string) =>
    name.trim().split(/\s+/).slice(0, 2).map(w => (w[0] || "").toUpperCase()).join("") || "?";

const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";

const waDigits = (phone: string) => {
    const d = (phone || "").replace(/\D/g, "");
    if (!d) return "";
    return d.length === 10 ? `91${d}` : d;
};

const waUrl = (c: CustomerRow) =>
    `https://wa.me/${waDigits(c.phone)}?text=${encodeURIComponent(`Namaste ${firstName(c.name)}, thank you for shopping with The Srivari — `)}`;

const relativeDate = (ts: number) => {
    if (!ts) return "—";
    const days = Math.floor((Date.now() - ts) / 86400000);
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const statusSummary = (c: CustomerRow) =>
    STATUS_ORDER.filter(s => c.statuses[s]).map(s => `${c.statuses[s]} ${s}`).join(" · ");

const CustomerBadges = ({ c }: { c: CustomerRow }) => (
    <>
        {c.isVip && (
            <span className="text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider whitespace-nowrap text-[#D4AF37] border-[#D4AF37]/30 bg-[#D4AF37]/10">
                VIP
            </span>
        )}
        {c.isRepeat && (
            <span className="text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider whitespace-nowrap text-violet-400 border-violet-500/30 bg-violet-500/10">
                Repeat
            </span>
        )}
    </>
);

const Avatar = ({ name }: { name: string }) => (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F2D06B] text-black font-bold text-sm flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(212,175,55,0.25)]">
        {initials(name)}
    </div>
);

const CustomerActions = ({ c, withLabels = false }: { c: CustomerRow; withLabels?: boolean }) => (
    <div className={`flex items-center gap-2 ${withLabels ? "flex-wrap" : "justify-end"}`}>
        {waDigits(c.phone) && (
            <GhostButton
                onClick={() => window.open(waUrl(c), "_blank", "noopener,noreferrer")}
                aria-label={`WhatsApp ${c.name}`}
                className={withLabels ? "" : "!px-2.5"}
            >
                <MessageCircle size={14} className="text-emerald-400" />
                {withLabels && "WhatsApp"}
            </GhostButton>
        )}
        {c.email && (
            <a
                href={`mailto:${c.email}`}
                aria-label={`Email ${c.name}`}
                className="px-2.5 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/25 hover:bg-white/[0.04] transition-all flex items-center gap-2 text-xs font-semibold"
            >
                <Mail size={14} />
                {withLabels && "Email"}
            </a>
        )}
        <Link
            href={`/admin/orders?q=${encodeURIComponent(c.phone || c.name)}`}
            className="px-3 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-white/50 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 hover:bg-white/[0.04] transition-all flex items-center gap-1.5"
        >
            Orders <ArrowUpRight size={12} />
        </Link>
    </div>
);

export default function AdminCustomers() {
    const { orders, isLoaded, error, refresh } = useAdminData();
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<SortKey>("value");

    const customers = useMemo(() => {
        const map = new Map<string, CustomerRow>();
        const chronological = [...orders].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        for (const o of chronological) {
            const key = customerKey(o);
            const ts = new Date(o.date).getTime() || 0;
            let c = map.get(key);
            if (!c) {
                c = {
                    key, name: "", phone: "", email: "",
                    ordersCount: 0, countedOrders: 0, lifetimeValue: 0, avgOrderValue: 0,
                    firstOrderDate: ts, lastOrderDate: ts, statuses: {},
                    isRepeat: false, isVip: false,
                };
                map.set(key, c);
            }
            c.ordersCount += 1;
            c.statuses[o.status] = (c.statuses[o.status] || 0) + 1;
            if (isCounted(o)) {
                c.countedOrders += 1;
                c.lifetimeValue += o.totalAmount || 0;
            }
            if (ts && (!c.firstOrderDate || ts < c.firstOrderDate)) c.firstOrderDate = ts;
            if (ts > c.lastOrderDate) c.lastOrderDate = ts;
            // Chronological pass → the last writes win, i.e. most recent order.
            if (o.customerName?.trim()) c.name = o.customerName.trim();
            if (o.customerPhone?.trim()) c.phone = o.customerPhone.trim();
            if (o.customerEmail?.trim()) c.email = o.customerEmail.trim();
        }
        const list = Array.from(map.values());
        for (const c of list) {
            if (!c.name) c.name = "Unknown";
            c.avgOrderValue = c.countedOrders ? c.lifetimeValue / c.countedOrders : 0;
            c.isRepeat = c.countedOrders >= 2;
        }
        const withValue = list.filter(c => c.lifetimeValue > 0).sort((a, b) => b.lifetimeValue - a.lifetimeValue);
        const vipKeys = new Set(withValue.slice(0, Math.ceil(withValue.length * 0.1)).map(c => c.key));
        for (const c of list) {
            c.isVip = c.lifetimeValue >= 50000 || vipKeys.has(c.key);
        }
        return list;
    }, [orders]);

    const stats = useMemo(() => {
        const total = customers.length;
        const repeatCount = customers.filter(c => c.isRepeat).length;
        const totalLtv = customers.reduce((sum, c) => sum + c.lifetimeValue, 0);
        const now = new Date();
        const newThisMonth = customers.filter(c => {
            if (!c.firstOrderDate) return false;
            const d = new Date(c.firstOrderDate);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;
        return {
            total,
            repeatRate: total ? Math.round((repeatCount / total) * 100) : 0,
            avgLtv: total ? totalLtv / total : 0,
            newThisMonth,
        };
    }, [customers]);

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        const qDigits = q.replace(/\D/g, "");
        const filtered = customers.filter(c => {
            if (!q) return true;
            if (c.name.toLowerCase().includes(q)) return true;
            if (c.email.toLowerCase().includes(q)) return true;
            if (c.phone.toLowerCase().includes(q)) return true;
            if (qDigits && c.phone.replace(/\D/g, "").includes(qDigits)) return true;
            return false;
        });
        return filtered.sort((a, b) => {
            if (sort === "recent") return b.lastOrderDate - a.lastOrderDate || b.lifetimeValue - a.lifetimeValue;
            if (sort === "orders") return b.ordersCount - a.ordersCount || b.lifetimeValue - a.lifetimeValue;
            return b.lifetimeValue - a.lifetimeValue || b.lastOrderDate - a.lastOrderDate;
        });
    }, [customers, search, sort]);

    const statCards = [
        { label: "Total Customers", value: String(stats.total), icon: Users, color: "text-[#D4AF37]", bg: "from-[#D4AF37]/20 to-[#D4AF37]/5", border: "border-[#D4AF37]/20" },
        { label: "Repeat Rate", value: `${stats.repeatRate}%`, icon: Repeat, color: "text-violet-400", bg: "from-violet-500/20 to-violet-500/5", border: "border-violet-500/20" },
        { label: "Avg Lifetime Value", value: formatINR(Math.round(stats.avgLtv)), icon: Gem, color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/20" },
        { label: "New This Month", value: String(stats.newThisMonth), icon: UserPlus, color: "text-sky-400", bg: "from-sky-500/20 to-sky-500/5", border: "border-sky-500/20" },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <SectionHeading
                title="Customers"
                subtitle={isLoaded
                    ? `${customers.length} unique customer${customers.length !== 1 ? "s" : ""} · derived live from your orders`
                    : "Deriving your client book from orders…"}
                icon={<Users size={26} className="text-[#D4AF37]" />}
            />

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3">
                    <AlertTriangle size={20} />
                    <p className="text-sm flex-1">{error}</p>
                    <button onClick={refresh} className="bg-red-500/20 px-3 py-1 rounded text-sm hover:bg-red-500/40">Retry</button>
                </div>
            )}

            {/* Stats */}
            <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {statCards.map(stat => (
                    <GlassCard key={stat.label} className="p-5 flex items-center gap-4 hover:border-white/15 transition-all duration-500 h-full">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.bg} border ${stat.border} ${stat.color} shrink-0`}>
                            <stat.icon size={20} strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.15em] mb-1">{stat.label}</p>
                            <p className={`text-lg md:text-xl font-bold tracking-tight truncate ${stat.color}`}>{isLoaded ? stat.value : "—"}</p>
                        </div>
                    </GlassCard>
                ))}
            </section>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                    <GlassInput
                        type="search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, phone or email…"
                        aria-label="Search customers"
                        className="pl-11"
                    />
                </div>
                <GlassSelect
                    wrapperClassName="w-full md:w-56"
                    value={sort}
                    onChange={e => setSort(e.target.value as SortKey)}
                    aria-label="Sort customers"
                >
                    <option value="value">Highest Value</option>
                    <option value="recent">Most Recent</option>
                    <option value="orders">Most Orders</option>
                </GlassSelect>
            </div>

            {!isLoaded ? (
                <GlassCard className="p-6 space-y-3">
                    {[0, 1, 2, 3, 4].map(i => (
                        <div key={i} className="h-14 rounded-xl bg-white/[0.04] animate-pulse" />
                    ))}
                </GlassCard>
            ) : customers.length === 0 ? (
                <GlassCard className="p-7">
                    <EmptyState
                        icon={<Users size={20} />}
                        title="No customers yet"
                        subtitle="They appear with their first order."
                    />
                </GlassCard>
            ) : visible.length === 0 ? (
                <GlassCard className="p-7">
                    <EmptyState
                        icon={<Search size={20} />}
                        title="No matching customers"
                        subtitle="Try a different name, phone or email."
                    />
                </GlassCard>
            ) : (
                <>
                    {/* Desktop table */}
                    <GlassCard className="hidden md:block">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[10px] uppercase tracking-widest text-white/40 border-b border-white/[0.08]">
                                        <th className="px-6 py-4 font-bold">Customer</th>
                                        <th className="px-4 py-4 font-bold">Phone</th>
                                        <th className="px-4 py-4 font-bold">Orders</th>
                                        <th className="px-4 py-4 font-bold">Lifetime Value</th>
                                        <th className="px-4 py-4 font-bold">Avg Order</th>
                                        <th className="px-4 py-4 font-bold">Last Order</th>
                                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {visible.map(c => (
                                        <tr key={c.key} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Avatar name={c.name} />
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-white/90 font-medium truncate">{c.name}</p>
                                                            <CustomerBadges c={c} />
                                                        </div>
                                                        {c.email && <p className="text-[11px] text-white/30 truncate mt-0.5">{c.email}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-white/60 whitespace-nowrap">{c.phone || "—"}</td>
                                            <td className="px-4 py-4">
                                                <p className="text-white/80 font-bold">{c.ordersCount}</p>
                                                <p className="text-[10px] text-white/30 truncate max-w-[150px]" title={statusSummary(c)}>
                                                    {statusSummary(c)}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4 font-bold text-[#D4AF37] whitespace-nowrap">{formatINR(c.lifetimeValue)}</td>
                                            <td className="px-4 py-4 text-white/60 whitespace-nowrap">{formatINR(Math.round(c.avgOrderValue))}</td>
                                            <td className="px-4 py-4 text-white/60 whitespace-nowrap">{relativeDate(c.lastOrderDate)}</td>
                                            <td className="px-6 py-4">
                                                <CustomerActions c={c} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>

                    {/* Mobile cards */}
                    <div className="md:hidden space-y-4">
                        {visible.map(c => (
                            <GlassCard key={c.key} className="p-5">
                                <div className="flex items-start gap-3">
                                    <Avatar name={c.name} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-white/90 font-medium">{c.name}</p>
                                            <CustomerBadges c={c} />
                                        </div>
                                        <p className="text-[11px] text-white/30 mt-0.5 truncate">
                                            {c.phone || "No phone"}{c.email ? ` · ${c.email}` : ""}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <div>
                                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.15em]">Orders</p>
                                        <p className="text-white/80 font-bold mt-0.5">{c.ordersCount}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.15em]">Lifetime Value</p>
                                        <p className="text-[#D4AF37] font-bold mt-0.5">{formatINR(c.lifetimeValue)}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.15em]">Avg Order</p>
                                        <p className="text-white/70 mt-0.5">{formatINR(Math.round(c.avgOrderValue))}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.15em]">Last Order</p>
                                        <p className="text-white/70 mt-0.5">{relativeDate(c.lastOrderDate)}</p>
                                    </div>
                                </div>
                                {statusSummary(c) && (
                                    <p className="text-[10px] text-white/30 mt-3">{statusSummary(c)}</p>
                                )}
                                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                                    <CustomerActions c={c} withLabels />
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </>
            )}
        </motion.div>
    );
}
