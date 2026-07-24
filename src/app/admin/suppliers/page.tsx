"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Building2, ChevronDown, ChevronUp, Mail, MapPin, MessageCircle,
    Package, Pencil, Phone, Plus, Save, Search, StickyNote, Trash2, User, X
} from "lucide-react";
import { Supplier } from "@/types";
import { useAdminData } from "@/components/admin/AdminContext";
import { useToast } from "@/components/admin/Toast";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import {
    EmptyState, FieldLabel, GhostButton, GlassCard, GlassInput,
    GlassTextarea, GoldButton, SectionHeading
} from "@/components/admin/ui";

type SupplierRow = Supplier & { productCount?: number };

const EMPTY_FORM = { name: "", contactName: "", email: "", phone: "", address: "", notes: "" };

const waLink = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
};

export default function AdminSuppliersPage() {
    const { suppliers, isLoaded, refresh } = useAdminData();
    const { toast } = useToast();
    const { confirm } = useConfirm();

    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
    const formRef = useRef<HTMLDivElement>(null);

    const rows = suppliers as SupplierRow[];
    const totalLinked = useMemo(() => rows.reduce((sum, s) => sum + (s.productCount || 0), 0), [rows]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(s =>
            [s.name, s.contactName, s.email, s.phone].some(v => v && v.toLowerCase().includes(q))
        );
    }, [rows, search]);

    const setField = (key: keyof typeof EMPTY_FORM) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setForm(prev => ({ ...prev, [key]: e.target.value }));

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
    };

    const startEdit = (s: SupplierRow) => {
        setEditingId(s.id);
        setForm({
            name: s.name || "",
            contactName: s.contactName || "",
            email: s.email || "",
            phone: s.phone || "",
            address: s.address || "",
            notes: s.notes || "",
        });
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast("error", "Supplier name is required.");
            return;
        }
        setIsSaving(true);
        try {
            const body: Record<string, string> = {
                name: form.name.trim(),
                contactName: form.contactName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                address: form.address.trim(),
                notes: form.notes.trim(),
            };
            if (editingId) body.id = editingId;
            const res = await fetch("/api/admin/suppliers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data?.error) {
                toast("error", res.status === 401
                    ? "Session expired — please log in again."
                    : data?.error || "Failed to save supplier.");
                return;
            }
            toast("success", editingId ? "Supplier updated." : "Supplier added.");
            resetForm();
            await refresh();
        } catch {
            toast("error", "Network error — could not save supplier.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (s: SupplierRow) => {
        const count = s.productCount || 0;
        const ok = await confirm({
            title: "Delete Supplier",
            message: `Remove "${s.name}" from your vendor network? ${count > 0
                ? `${count} linked product${count !== 1 ? "s" : ""} will be unlinked — the products themselves will not be deleted.`
                : "Any linked products will be unlinked, not deleted."}`,
            confirmText: "Delete",
            type: "danger",
        });
        if (!ok) return;
        try {
            const res = await fetch("/api/admin/suppliers", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: s.id }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data?.error) {
                toast("error", res.status === 401
                    ? "Session expired — please log in again."
                    : data?.error || "Failed to delete supplier.");
                return;
            }
            if (editingId === s.id) resetForm();
            toast("success", `"${s.name}" deleted.`);
            await refresh();
        } catch {
            toast("error", "Network error — could not delete supplier.");
        }
    };

    const statCards = [
        { label: "Total Suppliers", value: String(rows.length), icon: Building2, color: "text-[#D4AF37]", bg: "from-[#D4AF37]/20 to-[#D4AF37]/5", border: "border-[#D4AF37]/20" },
        { label: "Products Linked", value: String(totalLinked), icon: Package, color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/20" },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <SectionHeading title="Suppliers" subtitle="Your weaver & vendor network" icon={<Building2 className="text-[#D4AF37]" size={26} strokeWidth={1.5} />} />

            {/* Stat mini-row */}
            <section className="grid grid-cols-2 gap-4 max-w-lg">
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

            {/* Create / edit form */}
            <div ref={formRef} className="scroll-mt-24">
                <GlassCard className="p-7">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold flex items-center gap-2">
                            {editingId ? <Pencil size={14} /> : <Plus size={14} />}
                            {editingId ? "Edit Supplier" : "Add Supplier"}
                        </h3>
                        {editingId && (
                            <GhostButton type="button" onClick={resetForm}>
                                <X size={14} /> Cancel Edit
                            </GhostButton>
                        )}
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <FieldLabel gold>Name *</FieldLabel>
                            <GlassInput value={form.name} onChange={setField("name")} placeholder="e.g. Kanchi Silk Weavers" required />
                        </div>
                        <div>
                            <FieldLabel>Contact Person</FieldLabel>
                            <GlassInput value={form.contactName} onChange={setField("contactName")} placeholder="e.g. Ramesh Kumar" />
                        </div>
                        <div>
                            <FieldLabel>Email</FieldLabel>
                            <GlassInput type="email" value={form.email} onChange={setField("email")} placeholder="orders@weavers.in" />
                        </div>
                        <div>
                            <FieldLabel>Phone</FieldLabel>
                            <GlassInput type="tel" value={form.phone} onChange={setField("phone")} placeholder="+91 98765 43210" />
                        </div>
                        <div>
                            <FieldLabel>Address</FieldLabel>
                            <GlassTextarea rows={3} value={form.address} onChange={setField("address")} placeholder="Street, city, state, PIN" />
                        </div>
                        <div>
                            <FieldLabel>Notes</FieldLabel>
                            <GlassTextarea rows={3} value={form.notes} onChange={setField("notes")} placeholder="Payment terms, lead times, specialities…" />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <GoldButton type="submit" disabled={isSaving}>
                                <Save size={16} />
                                {isSaving ? "Saving…" : editingId ? "Update Supplier" : "Add Supplier"}
                            </GoldButton>
                        </div>
                    </form>
                </GlassCard>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none z-10" />
                <GlassInput
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, contact, email or phone…"
                    className="pl-11"
                    aria-label="Search suppliers"
                />
            </div>

            {/* Supplier cards */}
            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filtered.map(s => {
                        const notes = s.notes || "";
                        const isLong = notes.length > 140;
                        const expanded = !!expandedNotes[s.id];
                        return (
                            <GlassCard key={s.id} className="p-6 flex flex-col gap-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h4 className="text-xl font-serif bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] bg-clip-text text-transparent truncate">
                                            {s.name}
                                        </h4>
                                        {s.contactName && (
                                            <p className="text-sm text-white/60 mt-1 flex items-center gap-2">
                                                <User size={13} className="text-white/30 shrink-0" /> {s.contactName}
                                            </p>
                                        )}
                                    </div>
                                    <Link
                                        href="/admin/products"
                                        className="shrink-0 text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider whitespace-nowrap text-[#D4AF37] border-[#D4AF37]/30 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 transition-colors"
                                    >
                                        {s.productCount || 0} product{(s.productCount || 0) !== 1 ? "s" : ""}
                                    </Link>
                                </div>

                                <div className="space-y-2 text-sm">
                                    {s.email && (
                                        <a href={`mailto:${s.email}`} className="flex items-center gap-2 text-white/60 hover:text-[#D4AF37] transition-colors break-all">
                                            <Mail size={13} className="text-white/30 shrink-0" /> {s.email}
                                        </a>
                                    )}
                                    {s.phone && (
                                        <div className="flex items-center gap-2">
                                            <a href={`tel:${s.phone}`} className="flex items-center gap-2 text-white/60 hover:text-[#D4AF37] transition-colors">
                                                <Phone size={13} className="text-white/30 shrink-0" /> {s.phone}
                                            </a>
                                            <a
                                                href={waLink(s.phone)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                aria-label={`WhatsApp ${s.name}`}
                                                className="p-1.5 rounded-lg text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                                            >
                                                <MessageCircle size={13} />
                                            </a>
                                        </div>
                                    )}
                                    {s.address && (
                                        <p className="flex items-start gap-2 text-white/50">
                                            <MapPin size={13} className="text-white/30 shrink-0 mt-0.5" />
                                            <span className="whitespace-pre-line">{s.address}</span>
                                        </p>
                                    )}
                                    {notes && (
                                        <div className="flex items-start gap-2 text-white/50">
                                            <StickyNote size={13} className="text-white/30 shrink-0 mt-0.5" />
                                            <div className="min-w-0 flex-1">
                                                <p className={`whitespace-pre-line italic ${!expanded && isLong ? "line-clamp-2" : ""}`}>
                                                    {notes}
                                                </p>
                                                {isLong && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedNotes(prev => ({ ...prev, [s.id]: !expanded }))}
                                                        className="mt-1 text-[11px] text-[#D4AF37]/80 hover:text-[#D4AF37] flex items-center gap-1 transition-colors"
                                                    >
                                                        {expanded ? <>Show less <ChevronUp size={11} /></> : <>Show more <ChevronDown size={11} /></>}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 pt-3 mt-auto border-t border-white/[0.06]">
                                    <GhostButton type="button" onClick={() => startEdit(s)}>
                                        <Pencil size={13} /> Edit
                                    </GhostButton>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(s)}
                                        aria-label={`Delete supplier ${s.name}`}
                                        className="p-2.5 rounded-xl text-red-400/70 hover:text-red-400 border border-white/10 hover:border-red-500/40 hover:bg-red-500/10 transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </GlassCard>
                        );
                    })}
                </div>
            ) : (
                <GlassCard className="p-7">
                    <EmptyState
                        icon={<Building2 size={22} />}
                        title={!isLoaded ? "Loading…" : search ? "No suppliers match your search" : "No suppliers yet"}
                        subtitle={!isLoaded ? undefined : search ? "Try a different name, contact, email or phone." : "Add your first weaver or vendor using the form above."}
                    />
                </GlassCard>
            )}
        </motion.div>
    );
}
