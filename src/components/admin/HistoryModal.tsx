"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, History, Loader2, X } from "lucide-react";
import { GlassCard, EmptyState } from "./ui";
import { useToast } from "./Toast";

/* Inventory movement timeline for one product. Rendered inside an
   AnimatePresence by the caller so exit animations play. */

interface HistoryEntry {
    id: string;
    quantity: number;
    type: string;
    actor?: string;
    reference?: string;
    notes?: string;
    createdAt: string;
}

const TYPE_STYLES: Record<string, string> = {
    MANUAL: "text-sky-400 border-sky-500/30 bg-sky-500/10",
    ORDER: "text-violet-400 border-violet-500/30 bg-violet-500/10",
    RESTOCK: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
};

const formatDate = (d: string) =>
    new Date(d).toLocaleString("en-IN", {
        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

export default function HistoryModal({ productId, productName, onClose }: {
    productId: string;
    productName: string;
    onClose: () => void;
}) {
    const { toast } = useToast();
    const [entries, setEntries] = useState<HistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/products/history?id=${encodeURIComponent(productId)}`);
                if (res.status === 401) {
                    if (!cancelled) {
                        setLoadError("Your session expired. Please log in again to view stock history.");
                        toast("error", "Session expired — please log in again.");
                    }
                    return;
                }
                const data = await res.json().catch(() => null);
                if (!res.ok) throw new Error(data?.error || "Failed to load stock history");
                if (!cancelled) setEntries(Array.isArray(data) ? data : []);
            } catch (e) {
                if (!cancelled) {
                    setLoadError(e instanceof Error ? e.message : "Failed to load stock history");
                    toast("error", e instanceof Error ? e.message : "Failed to load stock history");
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                onClick={e => e.stopPropagation()}
                className="max-w-lg w-full"
            >
                <GlassCard className="p-7 max-h-[80vh] flex flex-col">
                    <div className="flex items-start justify-between gap-4 mb-6 shrink-0">
                        <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold flex items-center gap-2 mb-1.5">
                                <History size={12} /> Stock History
                            </p>
                            <h3 className="text-xl font-serif bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] bg-clip-text text-transparent truncate">
                                {productName}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            aria-label="Close stock history"
                            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-all shrink-0"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="overflow-y-auto flex-1 pr-1">
                        {isLoading ? (
                            <div className="py-16 flex justify-center">
                                <Loader2 className="animate-spin text-[#D4AF37]" size={28} />
                            </div>
                        ) : loadError ? (
                            <div className="py-16 text-center">
                                <AlertCircle className="mx-auto mb-4 text-amber-400" size={28} />
                                <p className="text-white/70 text-sm max-w-xs mx-auto">{loadError}</p>
                            </div>
                        ) : entries.length === 0 ? (
                            <EmptyState
                                icon={<History size={22} />}
                                title="No stock movements yet"
                                subtitle="Manual adjustments, restocks and order deductions will appear here."
                            />
                        ) : (
                            <div className="relative pl-6 space-y-5 py-1">
                                <div className="absolute left-[5px] top-2 bottom-2 w-px bg-white/10" />
                                {entries.map(entry => (
                                    <div key={entry.id} className="relative">
                                        <div
                                            className={`absolute -left-6 top-1.5 w-[11px] h-[11px] rounded-full border-2 ${
                                                entry.quantity > 0
                                                    ? "border-emerald-400 bg-emerald-500/20"
                                                    : entry.quantity < 0
                                                        ? "border-red-400 bg-red-500/20"
                                                        : "border-white/30 bg-white/10"
                                            }`}
                                        />
                                        <div className="flex items-center justify-between gap-3 flex-wrap">
                                            <div className="flex items-center gap-2.5">
                                                <span
                                                    className={`text-base font-bold tabular-nums ${
                                                        entry.quantity > 0
                                                            ? "text-emerald-400"
                                                            : entry.quantity < 0 ? "text-red-400" : "text-white/40"
                                                    }`}
                                                >
                                                    {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity}
                                                </span>
                                                <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider ${TYPE_STYLES[entry.type] || "text-white/50 border-white/20 bg-white/5"}`}>
                                                    {entry.type}
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-white/30 whitespace-nowrap">
                                                {formatDate(entry.createdAt)}
                                            </span>
                                        </div>
                                        {entry.actor && (
                                            <p className="text-xs text-white/50 mt-1.5">{entry.actor}</p>
                                        )}
                                        {entry.notes && (
                                            <p className="text-xs text-white/40 italic mt-1 leading-relaxed">{entry.notes}</p>
                                        )}
                                        {entry.reference && (
                                            <p className="text-[10px] font-mono text-white/25 mt-1">{entry.reference}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </GlassCard>
            </motion.div>
        </motion.div>
    );
}
