"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertTriangle, BadgePercent, CalendarClock, Check, Copy, Loader2, Pencil,
    Plus, Save, Sparkles, Ticket, Trash2, X
} from "lucide-react";
import {
    EmptyState, FieldLabel, GlassCard, GlassInput, GlassSelect, GlassTextarea,
    GoldButton, SectionHeading
} from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { formatINR } from "@/components/admin/AdminContext";
import type { Coupon } from "@/types";

type CouponForm = {
    id?: string;
    code: string;
    description: string;
    type: "PERCENT" | "FLAT";
    value: string;
    minOrder: string;
    maxDiscount: string;
    usageLimit: string;
    expiresAt: string;
    isActive: boolean;
};

const BLANK_FORM: CouponForm = {
    code: "", description: "", type: "PERCENT", value: "", minOrder: "",
    maxDiscount: "", usageLimit: "", expiresAt: "", isActive: true,
};

const isExpired = (c: Coupon) => !!c.expiresAt && new Date(c.expiresAt).getTime() < Date.now();

const formatExpiry = (d: string | Date) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const discountLabel = (c: Coupon) =>
    c.type === "PERCENT"
        ? `${c.value}% off${c.maxDiscount ? ` (max ${formatINR(c.maxDiscount)})` : ""}`
        : `${formatINR(c.value)} off`;

export default function AdminCouponsPage() {
    const { toast } = useToast();
    const { confirm } = useConfirm();

    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<CouponForm>(BLANK_FORM);
    const [isSaving, setIsSaving] = useState(false);
    const [showMigrationHint, setShowMigrationHint] = useState(false);

    const loadCoupons = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/coupons");
            if (res.status === 401) {
                toast("error", "Session expired — please sign in again");
                setIsLoaded(true);
                return;
            }
            if (!res.ok) throw new Error("bad status");
            const data = await res.json();
            setCoupons(Array.isArray(data) ? data : []);
        } catch {
            toast("error", "Could not load coupons");
        } finally {
            setIsLoaded(true);
        }
    }, [toast]);

    useEffect(() => {
        loadCoupons();
    }, [loadCoupons]);

    const stats = useMemo(() => {
        const now = Date.now();
        const week = now + 7 * 24 * 60 * 60 * 1000;
        return {
            active: coupons.filter(c => c.isActive && !isExpired(c)).length,
            redemptions: coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0),
            expiring: coupons.filter(c => {
                if (!c.expiresAt) return false;
                const t = new Date(c.expiresAt).getTime();
                return t >= now && t <= week;
            }).length,
        };
    }, [coupons]);

    const resetForm = () => {
        setForm(BLANK_FORM);
        setIsSaving(false);
    };

    const toggleFormOpen = () => {
        if (showForm) {
            setShowForm(false);
            resetForm();
        } else {
            resetForm();
            setShowForm(true);
        }
    };

    const startEdit = (c: Coupon) => {
        setForm({
            id: c.id,
            code: c.code,
            description: c.description || "",
            type: c.type,
            value: String(c.value),
            minOrder: c.minOrder ? String(c.minOrder) : "",
            maxDiscount: c.maxDiscount ? String(c.maxDiscount) : "",
            usageLimit: c.usageLimit ? String(c.usageLimit) : "",
            expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 10) : "",
            isActive: c.isActive,
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = form.code.trim().toUpperCase();
        const value = Number(form.value);
        if (!code) return toast("error", "Coupon code is required");
        if (!value || value <= 0) return toast("error", "Value must be greater than zero");
        if (form.type === "PERCENT" && value > 100) return toast("error", "Percentage discount cannot exceed 100%");

        setIsSaving(true);
        try {
            const res = await fetch("/api/admin/coupons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: form.id,
                    code,
                    description: form.description.trim() || undefined,
                    type: form.type,
                    value,
                    minOrder: Number(form.minOrder) || 0,
                    maxDiscount: form.type === "PERCENT" && form.maxDiscount ? Number(form.maxDiscount) : undefined,
                    usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
                    isActive: form.isActive,
                    expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
                }),
            });
            if (res.status === 401) {
                toast("error", "Session expired — please sign in again");
                return;
            }
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                if (res.status === 500 && coupons.length === 0) setShowMigrationHint(true);
                toast("error", data.error || (res.status === 409 ? "A coupon with that code already exists" : "Failed to save coupon"));
                return;
            }
            setShowMigrationHint(false);
            toast("success", form.id ? `Coupon ${code} updated` : `Coupon ${code} created`);
            setShowForm(false);
            resetForm();
            await loadCoupons();
        } catch {
            toast("error", "Network error — could not save coupon");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleActive = async (c: Coupon) => {
        try {
            const res = await fetch("/api/admin/coupons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...c, isActive: !c.isActive }),
            });
            if (res.status === 401) return toast("error", "Session expired — please sign in again");
            const data = await res.json().catch(() => ({}));
            if (!res.ok) return toast("error", data.error || "Failed to update coupon");
            toast("success", `${c.code} ${c.isActive ? "deactivated" : "activated"}`);
            await loadCoupons();
        } catch {
            toast("error", "Network error — could not update coupon");
        }
    };

    const handleDelete = async (c: Coupon) => {
        const ok = await confirm({
            title: "Delete coupon?",
            message: `"${c.code}" will be permanently removed. Customers will no longer be able to redeem it at checkout.`,
            confirmText: "Delete",
            type: "danger",
        });
        if (!ok) return;
        try {
            const res = await fetch(`/api/admin/coupons?id=${encodeURIComponent(c.id)}`, { method: "DELETE" });
            if (res.status === 401) return toast("error", "Session expired — please sign in again");
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                return toast("error", data.error || "Failed to delete coupon");
            }
            toast("success", `Coupon ${c.code} deleted`);
            await loadCoupons();
        } catch {
            toast("error", "Network error — could not delete coupon");
        }
    };

    const copyCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            toast("success", "Copied");
        } catch {
            toast("error", "Could not copy code");
        }
    };

    const statCards = [
        { label: "Active Coupons", value: String(stats.active), icon: BadgePercent, color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/20" },
        { label: "Total Redemptions", value: String(stats.redemptions), icon: Ticket, color: "text-sky-400", bg: "from-sky-500/20 to-sky-500/5", border: "border-sky-500/20" },
        { label: "Expiring in 7 Days", value: String(stats.expiring), icon: CalendarClock, color: stats.expiring > 0 ? "text-amber-400" : "text-white/60", bg: "from-amber-500/20 to-amber-500/5", border: "border-amber-500/20" },
    ];

    const renderActiveToggle = (coupon: Coupon) => (
        <button
            onClick={() => toggleActive(coupon)}
            aria-label={coupon.isActive ? `Deactivate coupon ${coupon.code}` : `Activate coupon ${coupon.code}`}
            className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${coupon.isActive ? "bg-gradient-to-r from-[#D4AF37] to-[#F2D06B]" : "bg-white/10 border border-white/15"}`}
        >
            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform duration-300 ${coupon.isActive ? "bg-black translate-x-5" : "bg-white/40"}`} />
        </button>
    );

    const renderRowActions = (coupon: Coupon) => (
        <div className="flex items-center gap-1">
            <button
                onClick={() => startEdit(coupon)}
                aria-label={`Edit coupon ${coupon.code}`}
                className="p-2 rounded-lg text-white/40 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
            >
                <Pencil size={15} />
            </button>
            <button
                onClick={() => handleDelete(coupon)}
                aria-label={`Delete coupon ${coupon.code}`}
                className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
                <Trash2 size={15} />
            </button>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <SectionHeading
                title="Coupons & Offers"
                subtitle="Discount codes for checkout"
                icon={<BadgePercent size={26} className="text-[#D4AF37]" />}
                actions={
                    <GoldButton onClick={toggleFormOpen} className="text-sm px-5 py-2.5">
                        {showForm ? <X size={16} /> : <Plus size={16} />}
                        {showForm ? "Close" : "New Coupon"}
                    </GoldButton>
                }
            />

            {showMigrationHint && (
                <div className="bg-amber-500/10 border border-amber-500/40 text-amber-200 p-4 rounded-xl flex items-start gap-3">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <p className="text-sm leading-relaxed">
                        If this is a fresh database, run{" "}
                        <code className="font-mono text-amber-100 bg-black/40 px-1.5 py-0.5 rounded">npx prisma db push</code>{" "}
                        to create the Coupon table.
                    </p>
                </div>
            )}

            {/* Create / edit form */}
            <AnimatePresence initial={false}>
                {showForm && (
                    <motion.div
                        key="coupon-form"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <GlassCard className="p-7">
                            <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] mb-6 font-bold flex items-center gap-2">
                                <Ticket size={14} /> {form.id ? "Edit Coupon" : "New Coupon"}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <FieldLabel gold>Code</FieldLabel>
                                        <GlassInput
                                            value={form.code}
                                            onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                            placeholder="e.g. FESTIVE20"
                                            maxLength={24}
                                            required
                                            className="font-mono tracking-widest uppercase"
                                        />
                                    </div>
                                    <div>
                                        <FieldLabel>Type</FieldLabel>
                                        <GlassSelect
                                            value={form.type}
                                            onChange={e => setForm({ ...form, type: e.target.value as "PERCENT" | "FLAT" })}
                                        >
                                            <option value="PERCENT" className="bg-[#0f0f0f]">% off</option>
                                            <option value="FLAT" className="bg-[#0f0f0f]">₹ off</option>
                                        </GlassSelect>
                                    </div>
                                    <div className="md:col-span-2">
                                        <FieldLabel>Description</FieldLabel>
                                        <GlassTextarea
                                            value={form.description}
                                            onChange={e => setForm({ ...form, description: e.target.value })}
                                            placeholder="Internal note or shopper-facing blurb (optional)"
                                            rows={2}
                                            maxLength={200}
                                        />
                                    </div>
                                    <div>
                                        <FieldLabel>Value</FieldLabel>
                                        <div className="relative">
                                            <GlassInput
                                                type="number"
                                                min="1"
                                                max={form.type === "PERCENT" ? 100 : undefined}
                                                step="any"
                                                value={form.value}
                                                onChange={e => setForm({ ...form, value: e.target.value })}
                                                placeholder={form.type === "PERCENT" ? "e.g. 20" : "e.g. 500"}
                                                required
                                                className="pr-12"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#D4AF37] font-bold text-sm pointer-events-none">
                                                {form.type === "PERCENT" ? "%" : "₹"}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <FieldLabel>Min Order ₹</FieldLabel>
                                        <GlassInput
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={form.minOrder}
                                            onChange={e => setForm({ ...form, minOrder: e.target.value })}
                                            placeholder="0 = no minimum"
                                        />
                                    </div>
                                    {form.type === "PERCENT" && (
                                        <div>
                                            <FieldLabel>Max Discount ₹</FieldLabel>
                                            <GlassInput
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={form.maxDiscount}
                                                onChange={e => setForm({ ...form, maxDiscount: e.target.value })}
                                                placeholder="Blank = uncapped"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <FieldLabel>Usage Limit</FieldLabel>
                                        <GlassInput
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={form.usageLimit}
                                            onChange={e => setForm({ ...form, usageLimit: e.target.value })}
                                            placeholder="Blank = unlimited"
                                        />
                                    </div>
                                    <div>
                                        <FieldLabel>Expires At</FieldLabel>
                                        <GlassInput
                                            type="date"
                                            value={form.expiresAt}
                                            onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                                            className="[color-scheme:dark]"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <div
                                            className={`flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${form.isActive ? "bg-gradient-to-r from-[#D4AF37]/20 to-transparent border-[#D4AF37]/50" : "bg-white/5 border-white/10 hover:border-white/30"}`}
                                            onClick={() => setForm({ ...form, isActive: !form.isActive })}
                                        >
                                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-300 ${form.isActive ? "bg-[#D4AF37] border-[#D4AF37]" : "bg-transparent border-white/30"}`}>
                                                {form.isActive && <Check size={16} className="text-black" />}
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-sm text-white font-medium select-none block">Active</span>
                                                <span className="text-xs text-white/40 block mt-0.5">Shoppers can apply this code at checkout</span>
                                            </div>
                                            {form.isActive && <Sparkles size={22} className="text-[#D4AF37]" />}
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-5 flex justify-end gap-4 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={toggleFormOpen}
                                        className="px-6 py-3 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <GoldButton type="submit" disabled={isSaving} className="px-10">
                                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                        {form.id ? "Update Coupon" : "Create Coupon"}
                                    </GoldButton>
                                </div>
                            </form>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {statCards.map(stat => (
                    <GlassCard key={stat.label} className="p-5 flex items-center gap-4">
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

            {/* Coupon list */}
            <GlassCard className="p-7">
                <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] mb-6 font-bold flex items-center gap-2">
                    <Ticket size={14} /> All Coupons
                </h3>

                {!isLoaded ? (
                    <div className="py-16 text-center">
                        <div className="w-10 h-10 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-white/40 text-sm">Loading coupons…</p>
                    </div>
                ) : coupons.length === 0 ? (
                    <EmptyState icon={<Ticket size={22} />} title="No coupons yet" subtitle="Create your first offer" />
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[10px] uppercase tracking-widest text-white/30 border-b border-white/10">
                                        <th className="py-3 pr-4 font-semibold">Code</th>
                                        <th className="py-3 pr-4 font-semibold">Discount</th>
                                        <th className="py-3 pr-4 font-semibold">Min Order</th>
                                        <th className="py-3 pr-4 font-semibold">Usage</th>
                                        <th className="py-3 pr-4 font-semibold">Expires</th>
                                        <th className="py-3 pr-4 font-semibold">Active</th>
                                        <th className="py-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {coupons.map(c => (
                                        <tr key={c.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="py-4 pr-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-[#D4AF37] tracking-wider">{c.code}</span>
                                                    <button
                                                        onClick={() => copyCode(c.code)}
                                                        aria-label={`Copy code ${c.code}`}
                                                        className="p-1.5 rounded-md text-white/30 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
                                                    >
                                                        <Copy size={13} />
                                                    </button>
                                                </div>
                                                {c.description && <p className="text-[11px] text-white/30 mt-0.5 max-w-[220px] truncate">{c.description}</p>}
                                            </td>
                                            <td className="py-4 pr-4 text-white/80">{discountLabel(c)}</td>
                                            <td className="py-4 pr-4 text-white/60">{c.minOrder > 0 ? formatINR(c.minOrder) : "—"}</td>
                                            <td className="py-4 pr-4 text-white/60 font-mono text-xs">{c.usedCount} / {c.usageLimit ?? "∞"}</td>
                                            <td className="py-4 pr-4">
                                                {c.expiresAt ? (
                                                    <span className={isExpired(c) ? "text-red-400 font-semibold" : "text-white/60"}>
                                                        {formatExpiry(c.expiresAt)}
                                                        {isExpired(c) && <span className="block text-[10px] uppercase tracking-wider">Expired</span>}
                                                    </span>
                                                ) : (
                                                    <span className="text-white/25">Never</span>
                                                )}
                                            </td>
                                            <td className="py-4 pr-4">{renderActiveToggle(c)}</td>
                                            <td className="py-4 text-right">
                                                <div className="flex justify-end">{renderRowActions(c)}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden space-y-3">
                            {coupons.map(c => (
                                <div key={c.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="font-mono font-bold text-[#D4AF37] tracking-wider truncate">{c.code}</span>
                                            <button
                                                onClick={() => copyCode(c.code)}
                                                aria-label={`Copy code ${c.code}`}
                                                className="p-1.5 rounded-md text-white/30 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors shrink-0"
                                            >
                                                <Copy size={13} />
                                            </button>
                                        </div>
                                        {renderActiveToggle(c)}
                                    </div>
                                    {c.description && <p className="text-xs text-white/40">{c.description}</p>}
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                        <div>
                                            <p className="text-white/30 text-[10px] uppercase tracking-widest mb-0.5">Discount</p>
                                            <p className="text-white/80">{discountLabel(c)}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/30 text-[10px] uppercase tracking-widest mb-0.5">Min Order</p>
                                            <p className="text-white/60">{c.minOrder > 0 ? formatINR(c.minOrder) : "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/30 text-[10px] uppercase tracking-widest mb-0.5">Usage</p>
                                            <p className="text-white/60 font-mono">{c.usedCount} / {c.usageLimit ?? "∞"}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/30 text-[10px] uppercase tracking-widest mb-0.5">Expires</p>
                                            {c.expiresAt ? (
                                                <p className={isExpired(c) ? "text-red-400 font-semibold" : "text-white/60"}>
                                                    {formatExpiry(c.expiresAt)}{isExpired(c) ? " · Expired" : ""}
                                                </p>
                                            ) : (
                                                <p className="text-white/25">Never</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-end border-t border-white/[0.06] pt-2">
                                        {renderRowActions(c)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </GlassCard>
        </motion.div>
    );
}
