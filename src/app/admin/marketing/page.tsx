"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    AlertTriangle, BookOpen, CalendarDays, Check, Copy, Download, FileSpreadsheet,
    Info, Instagram, Loader2, Megaphone, MessageCircle, RefreshCw, ShoppingBag,
    Sparkles, Store
} from "lucide-react";
import {
    EmptyState, FieldLabel, GlassCard, GlassInput, GlassSelect, GhostButton,
    GoldButton, SectionHeading
} from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import { useAdminData } from "@/components/admin/AdminContext";

/* ------------------------------------------------------------------ */
/* Catalogue feeds                                                     */
/* ------------------------------------------------------------------ */

type FeedFormat = "meta" | "google" | "marketplace";

const FEEDS: { format: FeedFormat; title: string; icon: typeof Instagram; blurb: string }[] = [
    {
        format: "meta",
        title: "Instagram & Facebook",
        icon: Instagram,
        blurb: "Upload in Commerce Manager to tag sarees in posts, Reels and your Shop.",
    },
    {
        format: "google",
        title: "Google Shopping",
        icon: ShoppingBag,
        blurb: "Upload as a primary feed in Merchant Center for Shopping and free listings.",
    },
    {
        format: "marketplace",
        title: "Marketplace onboarding sheet",
        icon: Store,
        blurb: "Full catalogue with HSN, GST, weights and box dimensions for partner teams.",
    },
];

/** Pull the server-set filename out of Content-Disposition. */
function filenameFrom(header: string | null): string | null {
    if (!header) return null;
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
    return match ? decodeURIComponent(match[1]) : null;
}

/* ------------------------------------------------------------------ */
/* AI copy                                                             */
/* ------------------------------------------------------------------ */

type CopyKind = "instagram_caption" | "product_story" | "whatsapp_broadcast" | "campaign_plan";

const COPY_KINDS: {
    value: CopyKind;
    label: string;
    hint: string;
    icon: typeof Instagram;
    needsProduct: boolean;
    needsTopic?: boolean;
    topicLabel: string;
    topicPlaceholder: string;
}[] = [
    {
        value: "instagram_caption",
        label: "Instagram captions",
        hint: "Three options, each with hashtags",
        icon: Instagram,
        needsProduct: true,
        topicLabel: "Angle (optional)",
        topicPlaceholder: "e.g. bridal trousseau, first Diwali as a bride",
    },
    {
        value: "product_story",
        label: "Product story",
        hint: "Heritage narrative for a Reel or carousel",
        icon: BookOpen,
        needsProduct: true,
        topicLabel: "Angle (optional)",
        topicPlaceholder: "e.g. the zari work, the weaver's village",
    },
    {
        value: "whatsapp_broadcast",
        label: "WhatsApp broadcast",
        hint: "Short status message with a shop link",
        icon: MessageCircle,
        needsProduct: false,
        topicLabel: "What's the news? (optional)",
        topicPlaceholder: "e.g. new Kanjivaram arrivals, weekend preview",
    },
    {
        value: "campaign_plan",
        label: "7-day campaign",
        hint: "A festival content calendar",
        icon: CalendarDays,
        needsProduct: false,
        needsTopic: true,
        topicLabel: "Festival or theme",
        topicPlaceholder: "e.g. Navratri, wedding season, Ugadi",
    },
];

const TONES = [
    { value: "", label: "Let the AI choose" },
    { value: "regal", label: "Regal & heritage" },
    { value: "warm", label: "Warm & personal" },
    { value: "modern", label: "Modern & minimal" },
    { value: "festive", label: "Festive & celebratory" },
];

interface CopyResult {
    text: string;
    options?: string[];
}

export default function AdminMarketingPage() {
    const { toast } = useToast();
    const { products, isLoaded, error: dataError } = useAdminData();

    const [downloading, setDownloading] = useState<FeedFormat | null>(null);
    const [feedNotice, setFeedNotice] = useState<string | null>(null);

    const [kind, setKind] = useState<CopyKind>("instagram_caption");
    const [productId, setProductId] = useState("");
    const [topic, setTopic] = useState("");
    const [tone, setTone] = useState("");

    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<CopyResult | null>(null);
    const [copyError, setCopyError] = useState<string | null>(null);
    const [llmNotice, setLlmNotice] = useState<string | null>(null);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const activeKind = COPY_KINDS.find(k => k.value === kind)!;

    const sellableProducts = useMemo(
        () => products.filter(p => !p.isArchived).sort((a, b) => a.name.localeCompare(b.name)),
        [products]
    );

    /* ---------------- Feeds ---------------- */

    const downloadFeed = async (feed: (typeof FEEDS)[number]) => {
        setDownloading(feed.format);
        setFeedNotice(null);
        try {
            const res = await fetch(`/api/admin/feeds?format=${feed.format}`);

            if (res.status === 401) {
                toast("error", "Session expired — please sign in again");
                return;
            }
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                toast("error", data.error || "Could not build that feed");
                if (data.error) setFeedNotice(data.error);
                return;
            }

            const rows = Number(res.headers.get("X-Feed-Rows")) || 0;
            const skipped = Number(res.headers.get("X-Feed-Skipped")) || 0;
            const filename = filenameFrom(res.headers.get("Content-Disposition")) || `srivari-${feed.format}-feed.csv`;

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = filename;
            anchor.click();
            URL.revokeObjectURL(url);

            toast("success", `${filename} — ${rows} product${rows === 1 ? "" : "s"}`);
            if (skipped > 0) {
                setFeedNotice(
                    `${skipped} product${skipped === 1 ? " was" : "s were"} left out of the ${feed.title} feed. ` +
                    `Meta and Google reject items without a price or a usable image — add one and export again.`
                );
            }
        } catch {
            toast("error", "Network error — could not download the feed");
        } finally {
            setDownloading(null);
        }
    };

    /* ---------------- AI copy ---------------- */

    const generate = async () => {
        if (activeKind.needsProduct && !productId) {
            toast("error", "Choose a saree to write about");
            return;
        }
        if (activeKind.needsTopic && !topic.trim()) {
            toast("error", "Give the campaign a festival or theme");
            return;
        }

        setIsGenerating(true);
        setCopyError(null);
        setLlmNotice(null);
        try {
            const res = await fetch("/api/admin/marketing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    kind,
                    productId: productId || undefined,
                    topic: topic.trim() || undefined,
                    tone: tone || undefined,
                }),
            });

            if (res.status === 401) {
                toast("error", "Session expired — please sign in again");
                return;
            }

            const data = await res.json().catch(() => ({}));

            if (res.status === 503) {
                setLlmNotice(data.error || "AI is not configured on this deployment.");
                setResult(null);
                return;
            }
            if (!res.ok) {
                setCopyError(data.error || "Could not generate that copy. Try again.");
                toast("error", data.error || "Generation failed");
                return;
            }

            setResult({ text: String(data.text || ""), options: Array.isArray(data.options) ? data.options : undefined });
            toast("success", "Copy ready");
        } catch {
            setCopyError("Network error — could not reach the AI service.");
            toast("error", "Network error — could not generate");
        } finally {
            setIsGenerating(false);
        }
    };

    const copyText = async (text: string, key: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(current => (current === key ? null : current)), 2000);
            toast("success", "Copied");
        } catch {
            toast("error", "Could not copy — select the text and copy manually");
        }
    };

    const copyButton = (text: string, key: string, label = "Copy") => (
        <GhostButton onClick={() => copyText(text, key)} aria-label={`${label} generated copy`}>
            {copiedKey === key ? <Check size={13} className="text-[#D4AF37]" /> : <Copy size={13} />}
            {copiedKey === key ? "Copied" : label}
        </GhostButton>
    );

    /* ---------------- Render ---------------- */

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <SectionHeading
                title="Marketing Studio"
                subtitle="Catalogue feeds for every sales channel, and AI copy to sell with"
                icon={<Megaphone size={26} className="text-[#D4AF37]" />}
            />

            {/* ---------------- Catalogue feeds ---------------- */}
            <section className="space-y-4">
                <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold flex items-center gap-2">
                    <FileSpreadsheet size={14} /> Catalogue Feeds
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {FEEDS.map(feed => (
                        <GlassCard key={feed.format} className="p-6 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/20 text-[#D4AF37] shrink-0">
                                    <feed.icon size={18} strokeWidth={1.5} />
                                </div>
                                <p className="font-serif text-lg text-white/90 leading-tight">{feed.title}</p>
                            </div>
                            <p className="text-sm text-white/40 leading-relaxed flex-1">{feed.blurb}</p>
                            <GoldButton
                                onClick={() => downloadFeed(feed)}
                                disabled={downloading !== null}
                                className="text-sm px-5 py-2.5 w-full"
                            >
                                {downloading === feed.format
                                    ? <Loader2 size={16} className="animate-spin" />
                                    : <Download size={16} />}
                                {downloading === feed.format ? "Building…" : "Download CSV"}
                            </GoldButton>
                        </GlassCard>
                    ))}
                </div>

                {feedNotice && (
                    <div className="bg-amber-500/10 border border-amber-500/40 text-amber-200 p-4 rounded-xl flex items-start gap-3">
                        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                        <p className="text-sm leading-relaxed">{feedNotice}</p>
                    </div>
                )}

                <GlassCard className="p-6">
                    <div className="flex items-start gap-3">
                        <Info size={18} className="text-[#D4AF37] shrink-0 mt-0.5" />
                        <div className="text-sm text-white/50 leading-relaxed space-y-2">
                            <p>
                                <span className="text-white/80">Meta and Google accept these files directly.</span>{" "}
                                Upload the CSV in Commerce Manager (Catalogue → Data sources) or Google Merchant
                                Center (Products → Feeds), and re-upload whenever prices or stock change.
                            </p>
                            <p>
                                <span className="text-white/80">Blinkit, Swiggy Instamart and ONDC do not have a public
                                self-serve seller API</span> — they onboard sellers commercially. Send their category
                                team the marketplace sheet when they ask you for a catalogue; it already carries the
                                HSN codes, GST rates, weights and box dimensions those forms ask for.
                            </p>
                        </div>
                    </div>
                </GlassCard>
            </section>

            {/* ---------------- AI copy studio ---------------- */}
            <section className="space-y-4">
                <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold flex items-center gap-2">
                    <Sparkles size={14} /> AI Copy Studio
                </h3>

                <GlassCard className="p-7 space-y-6">
                    {/* Kind selector */}
                    <div>
                        <FieldLabel gold>What are we writing?</FieldLabel>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                            {COPY_KINDS.map(option => {
                                const isActive = option.value === kind;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setKind(option.value)}
                                        aria-pressed={isActive}
                                        className={`text-left p-4 rounded-xl border transition-all duration-300 ${
                                            isActive
                                                ? "bg-gradient-to-br from-[#D4AF37]/20 to-transparent border-[#D4AF37]/50 shadow-[0_0_20px_rgba(212,175,55,0.1)]"
                                                : "bg-white/[0.02] border-white/10 hover:border-white/25 hover:bg-white/[0.04]"
                                        }`}
                                    >
                                        <option.icon
                                            size={17}
                                            strokeWidth={1.5}
                                            className={isActive ? "text-[#D4AF37]" : "text-white/40"}
                                        />
                                        <p className={`mt-2.5 text-sm font-medium ${isActive ? "text-white" : "text-white/70"}`}>
                                            {option.label}
                                        </p>
                                        <p className="text-[11px] text-white/35 mt-1 leading-relaxed">{option.hint}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <FieldLabel>
                                Saree {activeKind.needsProduct ? "" : "(optional)"}
                            </FieldLabel>
                            <GlassSelect
                                value={productId}
                                onChange={e => setProductId(e.target.value)}
                                disabled={!isLoaded || sellableProducts.length === 0}
                                aria-label="Saree to write about"
                            >
                                <option value="" className="bg-[#0f0f0f]">
                                    {!isLoaded
                                        ? "Loading products…"
                                        : sellableProducts.length === 0
                                            ? "No products yet"
                                            : activeKind.needsProduct ? "Choose a saree…" : "No specific saree"}
                                </option>
                                {sellableProducts.map(p => (
                                    <option key={p.id} value={p.id} className="bg-[#0f0f0f]">
                                        {p.name}{p.category ? ` · ${p.category}` : ""}
                                    </option>
                                ))}
                            </GlassSelect>
                            {dataError && <p className="text-[11px] text-amber-300/80 mt-2">{dataError}</p>}
                        </div>

                        <div>
                            <FieldLabel>Tone</FieldLabel>
                            <GlassSelect value={tone} onChange={e => setTone(e.target.value)} aria-label="Copy tone">
                                {TONES.map(t => (
                                    <option key={t.value} value={t.value} className="bg-[#0f0f0f]">{t.label}</option>
                                ))}
                            </GlassSelect>
                        </div>

                        <div className="md:col-span-2">
                            <FieldLabel gold={!!activeKind.needsTopic}>{activeKind.topicLabel}</FieldLabel>
                            <GlassInput
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                placeholder={activeKind.topicPlaceholder}
                                maxLength={200}
                                onKeyDown={e => {
                                    if (e.key === "Enter" && !isGenerating) generate();
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-1">
                        <GoldButton onClick={generate} disabled={isGenerating} className="px-10">
                            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                            {isGenerating ? "Writing…" : "Generate"}
                        </GoldButton>
                    </div>

                    {/* Notices */}
                    {llmNotice && (
                        <div className="bg-amber-500/10 border border-amber-500/40 text-amber-200 p-4 rounded-xl flex items-start gap-3">
                            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                            <div className="text-sm leading-relaxed space-y-1">
                                <p>{llmNotice}</p>
                                <p className="text-amber-200/60 text-xs">
                                    The feeds above still work — only the copy writer needs an AI endpoint.
                                </p>
                            </div>
                        </div>
                    )}

                    {copyError && !llmNotice && (
                        <div className="bg-red-500/10 border border-red-500/40 text-red-200 p-4 rounded-xl flex items-start gap-3">
                            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                            <p className="text-sm leading-relaxed">{copyError}</p>
                        </div>
                    )}

                    {/* Result */}
                    <div className="border-t border-white/10 pt-6">
                        {isGenerating ? (
                            <div className="py-16 text-center">
                                <div className="w-10 h-10 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-white/40 text-sm">Writing your copy…</p>
                            </div>
                        ) : !result ? (
                            <EmptyState
                                icon={<Sparkles size={22} />}
                                title="Nothing written yet"
                                subtitle="Pick a format above and hit Generate"
                            />
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <p className="text-xs uppercase tracking-widest text-white/30 font-bold">
                                        {activeKind.label}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {copyButton(result.text, "all", result.options ? "Copy all" : "Copy")}
                                        <GhostButton onClick={generate} disabled={isGenerating}>
                                            <RefreshCw size={13} /> Regenerate
                                        </GhostButton>
                                    </div>
                                </div>

                                {result.options ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                        {result.options.map((option, index) => (
                                            <div
                                                key={index}
                                                className="p-5 rounded-xl bg-black/40 border border-white/[0.08] flex flex-col gap-3"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">
                                                        Option {index + 1}
                                                    </span>
                                                    {copyButton(option, `option-${index}`)}
                                                </div>
                                                <p className="text-sm text-white/75 whitespace-pre-wrap leading-relaxed flex-1 break-words">
                                                    {option}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-5 rounded-xl bg-black/40 border border-white/[0.08]">
                                        <p className="text-sm text-white/75 whitespace-pre-wrap leading-relaxed break-words">
                                            {result.text}
                                        </p>
                                    </div>
                                )}

                                <p className="text-[11px] text-white/25 leading-relaxed">
                                    AI-written — read it before you post, and check every price and fabric detail
                                    against the product page.
                                </p>
                            </div>
                        )}
                    </div>
                </GlassCard>
            </section>
        </motion.div>
    );
}
