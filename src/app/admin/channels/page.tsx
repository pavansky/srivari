"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    AlertTriangle, Boxes, Download, ExternalLink, Globe, Loader2, RefreshCw,
    ShoppingBag, Tag,
} from "lucide-react";
import { useAdminData } from "@/components/admin/AdminContext";
import { useToast } from "@/components/admin/Toast";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import {
    EmptyState, GhostButton, GlassCard, GoldButton, SectionHeading,
} from "@/components/admin/ui";

/* Sales channels: one card per registered adapter. Everything on this page is
   driven by /api/admin/channels, which reads the channel registry — a new
   marketplace file appears here with no edit to this component. */

interface ChannelCapabilities {
    listings: boolean;
    orders: boolean;
    inventory: boolean;
}

interface ChannelListingCounts {
    total: number;
    draft?: number;
    listed?: number;
    paused?: number;
    error?: number;
}

interface Channel {
    key: string;
    label: string;
    blurb: string;
    configured: boolean;
    apiBacked: boolean;
    configHint: string;
    note: string;
    docsUrl?: string;
    capabilities: ChannelCapabilities;
    canDownload: boolean;
    listings: ChannelListingCounts;
    lastSyncedAt: string | null;
}

const CAPABILITY_META: { key: keyof ChannelCapabilities; label: string; icon: typeof Tag }[] = [
    { key: "listings", label: "Listings", icon: Tag },
    { key: "orders", label: "Orders", icon: ShoppingBag },
    { key: "inventory", label: "Stock", icon: Boxes },
];

const formatSyncedAt = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });

const filenameFrom = (disposition: string | null): string | null => {
    const match = disposition?.match(/filename="([^"]+)"/);
    return match ? match[1] : null;
};

/* Status = tracked micro-text + a small dot, never a coloured pill. */
function ConfigDot({ on }: { on: boolean }) {
    return (
        <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                on ? "bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.7)]" : "bg-white/20"
            }`}
        />
    );
}

export default function AdminChannelsPage() {
    const { toast } = useToast();
    const { confirm } = useConfirm();
    const { products, isLoaded: productsLoaded } = useAdminData();

    const [channels, setChannels] = useState<Channel[]>([]);
    const [countsAvailable, setCountsAvailable] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [syncing, setSyncing] = useState<string | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [notices, setNotices] = useState<Record<string, string>>({});

    const sellableCount = useMemo(
        () => products.filter(p => !p.isArchived && Number(p.price) > 0).length,
        [products]
    );

    const load = useCallback(async () => {
        setLoadError(null);
        try {
            const res = await fetch(`/api/admin/channels?t=${Date.now()}`);
            if (res.status === 401) {
                setLoadError("Session expired — please sign in again.");
                return;
            }
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setLoadError(data.error || "Could not load your sales channels.");
                return;
            }
            const data = await res.json();
            setChannels(Array.isArray(data.channels) ? data.channels : []);
            setCountsAvailable(data.listingCountsAvailable !== false);
        } catch {
            setLoadError("Network error — could not reach the channels API.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    /* ---------------- Sync ---------------- */

    const syncChannel = async (channel: Channel) => {
        const live = channel.configured && channel.apiBacked;

        const ok = await confirm({
            title: live ? `Publish to ${channel.label}?` : `Prepare ${channel.label} catalogue?`,
            message: live
                ? `This sends your ${sellableCount || "live"} saree listings to ${channel.label} over its live API. Listings already there will be updated.`
                : `${channel.label} has no live connection, so nothing leaves the store. We'll build and save the exact payload for every saree so you can review it and hand it over.`,
            confirmText: live ? "Publish" : "Prepare",
            type: live ? "warning" : "info",
        });
        if (!ok) return;

        setSyncing(channel.key);
        setNotices(prev => ({ ...prev, [channel.key]: "" }));
        try {
            const res = await fetch("/api/admin/channels/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ channel: channel.key }),
            });

            if (res.status === 401) {
                toast("error", "Session expired — please sign in again");
                return;
            }

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setNotices(prev => ({ ...prev, [channel.key]: data.error || "Sync failed." }));
                toast("error", data.error || "Sync failed");
                return;
            }

            const detail = Array.isArray(data.failures) && data.failures.length > 0
                ? `${data.message} First problem: ${data.failures[0].name} — ${data.failures[0].error}`
                : data.message;
            const withRemaining = data.remaining
                ? `${detail} ${data.remaining} more waiting — run it again to continue.`
                : detail;

            setNotices(prev => ({ ...prev, [channel.key]: withRemaining }));
            toast(data.failed > 0 ? "info" : "success", data.message || "Sync complete");
            await load();
        } catch {
            setNotices(prev => ({ ...prev, [channel.key]: "Network error — could not reach the sync API." }));
            toast("error", "Network error — could not sync");
        } finally {
            setSyncing(null);
        }
    };

    /* ---------------- Download ---------------- */

    const downloadCatalogue = async (channel: Channel) => {
        setDownloading(channel.key);
        setNotices(prev => ({ ...prev, [channel.key]: "" }));
        try {
            const res = await fetch(`/api/admin/channels?channel=${encodeURIComponent(channel.key)}&download=1`);

            if (res.status === 401) {
                toast("error", "Session expired — please sign in again");
                return;
            }
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setNotices(prev => ({ ...prev, [channel.key]: data.error || "Could not build that catalogue." }));
                toast("error", data.error || "Could not build that catalogue");
                return;
            }

            const items = Number(res.headers.get("X-Channel-Items")) || 0;
            const filename = filenameFrom(res.headers.get("Content-Disposition")) || `srivari-${channel.key}-catalogue`;

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = filename;
            anchor.click();
            URL.revokeObjectURL(url);

            toast("success", `${filename} — ${items} item${items === 1 ? "" : "s"}`);
        } catch {
            toast("error", "Network error — could not download the catalogue");
        } finally {
            setDownloading(null);
        }
    };

    /* ---------------- Render ---------------- */

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <SectionHeading
                title="Sales Channels"
                subtitle="Where The Srivari sells beyond its own storefront"
                icon={<Globe size={26} className="text-[#D4AF37]" />}
                actions={
                    <GhostButton onClick={load} disabled={isLoading}>
                        <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} /> Refresh
                    </GhostButton>
                }
            />

            {loadError && (
                <GlassCard className="p-5 border-red-500/25">
                    <p className="text-sm text-red-300/90 flex items-start gap-2.5">
                        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                        {loadError}
                    </p>
                </GlassCard>
            )}

            {!countsAvailable && !loadError && (
                <GlassCard className="p-5 border-amber-500/20">
                    <p className="text-sm text-amber-200/80 flex items-start gap-2.5">
                        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                        Listing history couldn&apos;t be read, so the counts below are blank. Syncing still works.
                    </p>
                </GlassCard>
            )}

            {/* ---------------- How each channel really works ---------------- */}
            <GlassCard className="p-6 space-y-4">
                <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold">
                    What each channel actually needs
                </h3>
                <ul className="space-y-3 text-sm text-white/50 leading-relaxed">
                    <li className="flex gap-3">
                        <ConfigDot on />
                        <span>
                            <span className="text-white/80">Amazon India — live API.</span> The Selling Partner API
                            really does list, pull orders and push stock. Add the four credentials below and the
                            sync button starts publishing for real.
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <ConfigDot on={false} />
                        <span>
                            <span className="text-white/80">ONDC — catalogue ready, needs a Seller Network Participant.</span>{" "}
                            ONDC is a network, not a marketplace with a signup page. We build the full{" "}
                            <code className="text-[#D4AF37]/80 text-xs">on_search</code> catalogue; a seller app (SNP)
                            publishes it on your behalf. Download it and hand it over.
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <ConfigDot on={false} />
                        <span>
                            <span className="text-white/80">Blinkit / Swiggy Instamart — commercial onboarding, no public API.</span>{" "}
                            There is nothing to connect to. Their category teams onboard brands over email and ask for
                            a catalogue spreadsheet — download the sheet and send it.
                        </span>
                    </li>
                </ul>
            </GlassCard>

            {/* ---------------- Channel cards ---------------- */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16 text-white/30 gap-3">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-xs uppercase tracking-widest">Loading channels…</span>
                </div>
            ) : channels.length === 0 ? (
                <GlassCard className="p-6">
                    <EmptyState
                        icon={<Globe size={22} />}
                        title="No sales channels registered"
                        subtitle="Add an adapter in src/lib/channels and register it in registry.ts."
                    />
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                    {channels.map(channel => {
                        const counts = channel.listings || { total: 0 };
                        const busy = syncing === channel.key;
                        const isDownloading = downloading === channel.key;
                        const notice = notices[channel.key];
                        const live = channel.configured && channel.apiBacked;

                        return (
                            <GlassCard key={channel.key} className="p-6 flex flex-col gap-5">
                                {/* Header */}
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="font-serif text-xl text-white/90 leading-tight">{channel.label}</p>
                                        {channel.docsUrl && (
                                            <a
                                                href={channel.docsUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-white/25 hover:text-[#D4AF37] transition-colors shrink-0 mt-1"
                                                aria-label={`${channel.label} documentation`}
                                            >
                                                <ExternalLink size={14} />
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ConfigDot on={channel.configured} />
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">
                                            {live
                                                ? "Connected · live API"
                                                : channel.configured
                                                    ? "Ready · no API to connect to"
                                                    : "Not configured"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-white/40 leading-relaxed">{channel.blurb}</p>
                                </div>

                                {/* Capabilities */}
                                <div className="flex flex-wrap gap-2">
                                    {CAPABILITY_META.map(cap => {
                                        const on = channel.capabilities?.[cap.key];
                                        return (
                                            <span
                                                key={cap.key}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] uppercase tracking-widest font-bold ${
                                                    on
                                                        ? "text-[#D4AF37] border-[#D4AF37]/30 bg-[#D4AF37]/[0.07]"
                                                        : "text-white/25 border-white/[0.07]"
                                                }`}
                                            >
                                                <cap.icon size={11} strokeWidth={2} />
                                                {cap.label}
                                            </span>
                                        );
                                    })}
                                </div>

                                {/* Listing counts */}
                                <div className="space-y-1.5 border-t border-white/[0.06] pt-4">
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-semibold">
                                        Catalogue
                                    </p>
                                    <p className="text-sm text-white/60">
                                        {counts.total > 0 ? (
                                            <>
                                                <span className="font-serif text-2xl text-white/90">{counts.total}</span>
                                                <span className="text-white/35 text-xs ml-2">
                                                    {[
                                                        counts.listed ? `${counts.listed} live` : null,
                                                        counts.draft ? `${counts.draft} prepared` : null,
                                                        counts.paused ? `${counts.paused} paused` : null,
                                                        counts.error ? `${counts.error} failed` : null,
                                                    ].filter(Boolean).join(" · ")}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-white/30 text-xs">
                                                Nothing prepared yet
                                                {productsLoaded && sellableCount > 0
                                                    ? ` — ${sellableCount} saree${sellableCount === 1 ? "" : "s"} ready to go`
                                                    : ""}
                                            </span>
                                        )}
                                    </p>
                                    {channel.lastSyncedAt && (
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/25">
                                            Last sync {formatSyncedAt(channel.lastSyncedAt)}
                                        </p>
                                    )}
                                </div>

                                {/* Config hint — only when there is something to add */}
                                {!channel.configured && (
                                    <div className="border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] p-3.5 space-y-1 rounded-xl">
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]/80 font-bold">
                                            To connect
                                        </p>
                                        <p className="text-xs text-white/45 leading-relaxed break-words">
                                            {channel.configHint}
                                        </p>
                                    </div>
                                )}

                                {/* The honest operational note */}
                                <p className="text-xs text-white/30 leading-relaxed italic">{channel.note}</p>

                                {notice && (
                                    <p className="text-xs text-white/55 leading-relaxed border-l-2 border-[#D4AF37]/40 pl-3">
                                        {notice}
                                    </p>
                                )}

                                {/* Actions */}
                                <div className="mt-auto flex flex-col sm:flex-row gap-2.5 pt-1">
                                    <GoldButton
                                        onClick={() => syncChannel(channel)}
                                        disabled={busy || !channel.capabilities?.listings}
                                        className="text-sm px-5 py-2.5 flex-1"
                                    >
                                        {busy ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                                        {busy ? "Syncing…" : "Sync catalogue"}
                                    </GoldButton>
                                    {channel.canDownload && (
                                        <GhostButton
                                            onClick={() => downloadCatalogue(channel)}
                                            disabled={isDownloading}
                                            className="justify-center"
                                        >
                                            {isDownloading
                                                ? <Loader2 size={13} className="animate-spin" />
                                                : <Download size={13} />}
                                            {isDownloading ? "Building…" : "Download"}
                                        </GhostButton>
                                    )}
                                </div>
                            </GlassCard>
                        );
                    })}
                </div>
            )}

            <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 text-center pt-2">
                Channel orders arrive at /api/channels/orders · secured by CHANNEL_INGEST_SECRET
            </p>
        </motion.div>
    );
}
