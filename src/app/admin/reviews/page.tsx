"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    AlertTriangle, Check, CheckCircle2, Clock, ExternalLink, ImageOff,
    Loader2, Star, Trash2, Undo2
} from "lucide-react";
import { GlassCard, GoldButton, GhostButton, SectionHeading, EmptyState } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import { useConfirm } from "@/components/admin/ConfirmDialog";

type AdminReview = {
    id: string;
    productId: string;
    productName: string;
    productImage?: string;
    name: string;
    email?: string;
    rating: number;
    title?: string;
    comment: string;
    isApproved: boolean;
    createdAt: string;
};

type Tab = "pending" | "approved" | "all";

const COMMENT_CLAMP_LENGTH = 220;

const StarRow = ({ rating, size = 14 }: { rating: number; size?: number }) => (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map(i => (
            <Star
                key={i}
                size={size}
                className={i <= rating ? "text-[#D4AF37]" : "text-white/15"}
                fill={i <= rating ? "currentColor" : "none"}
                strokeWidth={1.5}
            />
        ))}
    </div>
);

const Thumbnail = ({ src, alt }: { src?: string; alt: string }) => {
    const [failed, setFailed] = useState(false);
    const usable = src && !failed && (src.startsWith("https://") || src.startsWith("/") || src.startsWith("data:"));
    if (!usable) {
        return (
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/25 shrink-0">
                <ImageOff size={18} strokeWidth={1.5} />
            </div>
        );
    }
    return (
        <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 relative shrink-0 bg-black/40">
            <Image
                src={src}
                alt={alt}
                fill
                sizes="48px"
                className="object-cover"
                unoptimized={src.startsWith("data:")}
                onError={() => setFailed(true)}
            />
        </div>
    );
};

export default function AdminReviews() {
    const { toast } = useToast();
    const { confirm } = useConfirm();

    const [reviews, setReviews] = useState<AdminReview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [tab, setTab] = useState<Tab>("pending");
    const [busyId, setBusyId] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const loadReviews = useCallback(async (showSpinner: boolean) => {
        if (showSpinner) setIsLoading(true);
        try {
            const res = await fetch("/api/admin/reviews");
            if (res.status === 401) {
                toast("error", "Session expired — please log in again.");
                setLoadError("Not authorised. Please log in again.");
                return;
            }
            if (!res.ok) throw new Error(`Request failed (${res.status})`);
            const data = await res.json();
            setReviews(Array.isArray(data) ? data : []);
            setLoadError(null);
        } catch {
            setLoadError("Could not load reviews. Check your connection and retry.");
        } finally {
            if (showSpinner) setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadReviews(true);
    }, [loadReviews]);

    const stats = useMemo(() => {
        const pending = reviews.filter(r => !r.isApproved);
        const approved = reviews.filter(r => r.isApproved);
        const avgRating = approved.length > 0
            ? approved.reduce((sum, r) => sum + r.rating, 0) / approved.length
            : null;
        return { pending, approved, avgRating };
    }, [reviews]);

    const visible = useMemo(() => {
        if (tab === "pending") return stats.pending;
        if (tab === "approved") return stats.approved;
        return reviews;
    }, [tab, stats, reviews]);

    const setApproval = async (review: AdminReview, isApproved: boolean) => {
        setBusyId(review.id);
        try {
            const res = await fetch("/api/admin/reviews", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: review.id, isApproved }),
            });
            if (res.status === 401) {
                toast("error", "Session expired — please log in again.");
                return;
            }
            if (!res.ok) throw new Error("PATCH failed");
            toast("success", isApproved
                ? `Review by ${review.name} approved — now live on the product page.`
                : `Review by ${review.name} unapproved and hidden.`);
            await loadReviews(false);
        } catch {
            toast("error", "Could not update the review. Please try again.");
        } finally {
            setBusyId(null);
        }
    };

    const deleteReview = async (review: AdminReview) => {
        const ok = await confirm({
            title: "Delete Review",
            message: `Permanently delete ${review.name}'s ${review.rating}-star review of "${review.productName}"? This cannot be undone.`,
            confirmText: "Delete",
            type: "danger",
        });
        if (!ok) return;
        setBusyId(review.id);
        try {
            const res = await fetch(`/api/admin/reviews?id=${encodeURIComponent(review.id)}`, { method: "DELETE" });
            if (res.status === 401) {
                toast("error", "Session expired — please log in again.");
                return;
            }
            if (!res.ok) throw new Error("DELETE failed");
            toast("success", "Review deleted.");
            await loadReviews(false);
        } catch {
            toast("error", "Could not delete the review. Please try again.");
        } finally {
            setBusyId(null);
        }
    };

    const statCards = [
        {
            label: "Pending", value: String(stats.pending.length), icon: Clock,
            color: "text-amber-400", bg: "from-amber-500/20 to-amber-500/5", border: "border-amber-500/20",
        },
        {
            label: "Approved", value: String(stats.approved.length), icon: CheckCircle2,
            color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/20",
        },
    ];

    const tabs: { key: Tab; label: string; count: number }[] = [
        { key: "pending", label: "Pending", count: stats.pending.length },
        { key: "approved", label: "Approved", count: stats.approved.length },
        { key: "all", label: "All", count: reviews.length },
    ];

    const emptyCopy: Record<Tab, { title: string; subtitle: string }> = {
        pending: { title: "No pending reviews — all caught up ✨", subtitle: "New customer reviews will land here for moderation." },
        approved: { title: "No approved reviews yet", subtitle: "Approve pending reviews to feature them on product pages." },
        all: { title: "No reviews yet", subtitle: "Customer reviews will appear here as they come in." },
    };

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <SectionHeading
                title="Reviews"
                subtitle="Moderate customer testimonials — approved reviews appear on product pages"
                icon={<Star size={24} className="text-[#D4AF37]" />}
            />

            {loadError && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3">
                    <AlertTriangle size={20} />
                    <p className="text-sm flex-1">{loadError}</p>
                    <button onClick={() => loadReviews(true)} className="bg-red-500/20 px-3 py-1 rounded text-sm hover:bg-red-500/40">
                        Retry
                    </button>
                </div>
            )}

            {/* Stats */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {statCards.map(stat => (
                    <GlassCard key={stat.label} className="p-5 flex items-center gap-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.bg} border ${stat.border} ${stat.color} shrink-0`}>
                            <stat.icon size={20} strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.15em] mb-1">{stat.label}</p>
                            <p className={`text-lg md:text-xl font-bold tracking-tight ${stat.color}`}>{isLoading ? "—" : stat.value}</p>
                        </div>
                    </GlassCard>
                ))}
                <GlassCard className="p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/20 text-[#D4AF37] shrink-0">
                        <Star size={20} strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.15em] mb-1">Average Rating</p>
                        {!isLoading && stats.avgRating !== null ? (
                            <div className="flex items-center gap-2">
                                <p className="text-lg md:text-xl font-bold tracking-tight text-[#D4AF37]">{stats.avgRating.toFixed(1)}</p>
                                <StarRow rating={Math.round(stats.avgRating)} size={13} />
                            </div>
                        ) : (
                            <p className="text-lg md:text-xl font-bold tracking-tight text-white/40">—</p>
                        )}
                    </div>
                </GlassCard>
            </section>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                            tab === t.key
                                ? "bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] text-black shadow-[0_0_18px_rgba(212,175,55,0.3)]"
                                : "text-white/50 border border-white/10 hover:text-white hover:border-white/25"
                        }`}
                    >
                        {t.label}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-black/15" : "bg-white/[0.06]"}`}>
                            {t.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Review list */}
            {isLoading ? (
                <div className="flex items-center justify-center py-24 text-[#D4AF37]">
                    <Loader2 size={32} className="animate-spin" strokeWidth={1.5} />
                </div>
            ) : visible.length === 0 ? (
                <GlassCard>
                    <EmptyState
                        icon={<Star size={22} />}
                        title={emptyCopy[tab].title}
                        subtitle={emptyCopy[tab].subtitle}
                    />
                </GlassCard>
            ) : (
                <div className="space-y-4">
                    {visible.map(review => {
                        const isLong = review.comment.length > COMMENT_CLAMP_LENGTH;
                        const isExpanded = !!expanded[review.id];
                        const isBusy = busyId === review.id;
                        return (
                            <GlassCard
                                key={review.id}
                                className={`p-5 md:p-6 ${review.isApproved ? "" : "border-l-2 border-l-amber-400/70"}`}
                            >
                                <div className="flex flex-col md:flex-row md:items-start gap-4">
                                    {/* Product */}
                                    <div className="flex items-center gap-3 md:w-52 shrink-0">
                                        <Thumbnail src={review.productImage} alt={review.productName} />
                                        <div className="min-w-0">
                                            <Link
                                                href={`/product/${review.productId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-white/60 hover:text-[#D4AF37] transition-colors flex items-center gap-1 group"
                                            >
                                                <span className="truncate">{review.productName}</span>
                                                <ExternalLink size={11} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </Link>
                                            <p className="text-[10px] text-white/25 uppercase tracking-widest mt-1">Product</p>
                                        </div>
                                    </div>

                                    {/* Review body */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                                            <StarRow rating={review.rating} />
                                            <p className="text-sm text-white/90 font-semibold">{review.name}</p>
                                            {review.isApproved && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                                                    Approved
                                                </span>
                                            )}
                                            {!review.isApproved && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider text-amber-400 border-amber-500/30 bg-amber-500/10">
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                        {review.email && <p className="text-[11px] text-white/30 mt-0.5">{review.email}</p>}
                                        {review.title && <p className="text-sm text-white/85 font-medium mt-2.5">{review.title}</p>}
                                        <p className={`text-sm text-white/55 leading-relaxed mt-1.5 ${isLong && !isExpanded ? "line-clamp-3" : ""}`}>
                                            {review.comment}
                                        </p>
                                        {isLong && (
                                            <button
                                                onClick={() => setExpanded(prev => ({ ...prev, [review.id]: !isExpanded }))}
                                                className="text-xs text-[#D4AF37] hover:text-[#F2D06B] mt-1.5 transition-colors"
                                            >
                                                {isExpanded ? "Show less" : "Read more"}
                                            </button>
                                        )}
                                        <p className="text-[11px] text-white/25 mt-3">
                                            {new Date(review.createdAt).toLocaleString("en-IN", {
                                                day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                                            })}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 md:flex-col md:items-stretch shrink-0">
                                        {!review.isApproved ? (
                                            <GoldButton
                                                onClick={() => setApproval(review, true)}
                                                disabled={isBusy}
                                                className="!px-4 !py-2 text-xs"
                                            >
                                                {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                                Approve
                                            </GoldButton>
                                        ) : (
                                            <GhostButton
                                                onClick={() => setApproval(review, false)}
                                                disabled={isBusy}
                                            >
                                                {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Undo2 size={14} />}
                                                Unapprove
                                            </GhostButton>
                                        )}
                                        <button
                                            onClick={() => deleteReview(review)}
                                            disabled={isBusy}
                                            aria-label={`Delete review by ${review.name}`}
                                            className="p-2.5 rounded-xl border border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-all disabled:opacity-40 flex items-center justify-center"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            </GlassCard>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
}
