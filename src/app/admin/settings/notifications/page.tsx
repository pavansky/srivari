"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    AlertTriangle, Check, Copy, Info, Loader2, MessageCircle, Send, Smartphone, Sparkles,
} from "lucide-react";
import {
    EmptyState, FieldLabel, GhostButton, GlassCard, GlassInput, GlassSelect, GoldButton, SectionHeading,
} from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import type { MessageKind } from "@/lib/templates/messages";

/* Shapes returned by GET /api/admin/notify/test — kept in step with notify.ts. */

interface TemplateRow {
    kind: MessageKind;
    name: string;
    envVar: string;
    usingDefault: boolean;
}

interface NotifyStatus {
    enabled: boolean;
    disabledReason: string | null;
    whatsapp: {
        configured: boolean;
        missing: string[];
        phoneNumberIdHint: string | null;
        apiVersion: string;
        language: string;
        endpoint: string;
    };
    sms: { configured: boolean; provider: string | null; envVars: string[] };
    templates: TemplateRow[];
    rateLimit: { messages: number; windowMinutes: number };
}

interface Preview {
    kind: MessageKind;
    title: string;
    body: string;
    smsBody: string;
    params: string[];
    paramLabels: string[];
    templateBody: string;
}

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

const StatusDot = ({ on }: { on: boolean }) => (
    <span
        className={`w-2 h-2 rounded-full shrink-0 ${on ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" : "bg-white/25"}`}
    />
);

const EnvChip = ({ name, set }: { name: string; set: boolean }) => (
    <span
        className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg border ${
            set
                ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
                : "text-amber-200 border-amber-500/30 bg-amber-500/10"
        }`}
    >
        {set ? <Check size={11} /> : <AlertTriangle size={11} />}
        {name}
    </span>
);

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            toast("error", "Your browser blocked the clipboard — select and copy manually.");
        }
    };

    return (
        <GhostButton onClick={copy} type="button">
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied" : label}
        </GhostButton>
    );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function NotificationSettingsPage() {
    const { toast } = useToast();

    const [status, setStatus] = useState<NotifyStatus | null>(null);
    const [previews, setPreviews] = useState<Preview[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [activeKind, setActiveKind] = useState<MessageKind>("order_confirmed");
    const [testPhone, setTestPhone] = useState("");
    const [testKind, setTestKind] = useState<MessageKind>("order_confirmed");
    const [sending, setSending] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError("");
        try {
            const res = await fetch("/api/admin/notify/test");
            if (!res.ok) {
                setLoadError(
                    res.status === 401
                        ? "Session expired — please log in again."
                        : "Could not read the messaging settings right now."
                );
                return;
            }
            const data = await res.json();
            setStatus(data.status as NotifyStatus);
            setPreviews(Array.isArray(data.previews) ? (data.previews as Preview[]) : []);
        } catch {
            setLoadError("Network error — the messaging settings could not be loaded.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const active = useMemo(
        () => previews.find(p => p.kind === activeKind) || previews[0] || null,
        [previews, activeKind]
    );

    const whatsappOn = !!status?.whatsapp.configured;
    const smsOn = !!status?.sms.configured;
    const anyTransport = whatsappOn || smsOn;

    const sendTest = async () => {
        if (!testPhone.trim()) {
            toast("error", "Enter a phone number to test with.");
            return;
        }
        setSending(true);
        try {
            const res = await fetch("/api/admin/notify/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: testPhone.trim(), kind: testKind }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data?.sent) {
                toast("success", `Test ${testKind.replace(/_/g, " ")} sent to ${data.to} via ${data.channel}.`);
                return;
            }
            toast(
                "error",
                data?.reason ||
                    (res.status === 401 ? "Session expired — please log in again." : "The test message was not sent.")
            );
        } catch {
            toast("error", "Network error — the test message was not sent.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-8">
            <SectionHeading
                title="Order notifications"
                subtitle="WhatsApp updates at every step — confirmed, shipped, delivered, refunded."
                icon={<MessageCircle size={26} />}
                actions={
                    <GhostButton onClick={load} disabled={loading} type="button">
                        {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                        Refresh
                    </GhostButton>
                }
            />

            {loading && !status && (
                <GlassCard className="p-16">
                    <div className="flex flex-col items-center gap-3 text-white/40">
                        <Loader2 size={22} className="animate-spin text-[#D4AF37]" />
                        <p className="text-sm">Reading messaging configuration…</p>
                    </div>
                </GlassCard>
            )}

            {loadError && (
                <div className="bg-red-500/10 border border-red-500/40 text-red-200 p-4 rounded-xl flex items-start gap-3">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <p className="text-sm leading-relaxed">{loadError}</p>
                </div>
            )}

            {status && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-8"
                >
                    {/* --- Onboarding notice ---------------------------------- */}
                    {!whatsappOn && (
                        <div className="bg-amber-500/10 border border-amber-500/40 text-amber-200 p-5 rounded-xl flex items-start gap-3">
                            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                            <div className="text-sm leading-relaxed space-y-2">
                                <p className="font-semibold">WhatsApp is not connected yet — no order updates are being sent.</p>
                                <p className="text-amber-200/70">
                                    Business-initiated WhatsApp messages need a Meta WhatsApp Business account:
                                    create a Meta Business app, add the WhatsApp product, verify the business, attach a
                                    sender number, generate a permanent system-user token, and submit the four message
                                    templates below for approval. Approval usually takes a few minutes to a day.
                                </p>
                                <p className="text-amber-200/70">
                                    Then set{" "}
                                    <span className="font-mono text-amber-100">WHATSAPP_PHONE_NUMBER_ID</span> and{" "}
                                    <span className="font-mono text-amber-100">WHATSAPP_ACCESS_TOKEN</span> in the Vercel
                                    project environment and redeploy. Until then checkout, shipping and the delivery
                                    webhook all work exactly as they do today — every notification is simply skipped.
                                </p>
                            </div>
                        </div>
                    )}

                    {status.disabledReason && (
                        <div className="bg-amber-500/10 border border-amber-500/40 text-amber-200 p-4 rounded-xl flex items-start gap-3">
                            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                            <p className="text-sm leading-relaxed">{status.disabledReason}</p>
                        </div>
                    )}

                    {/* --- Transports ---------------------------------------- */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <GlassCard className="p-6 space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <MessageCircle size={18} className="text-[#D4AF37]" />
                                    <h3 className="font-serif text-lg text-white">WhatsApp Cloud API</h3>
                                </div>
                                <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/50">
                                    <StatusDot on={whatsappOn} />
                                    {whatsappOn ? "Connected" : "Not connected"}
                                </span>
                            </div>

                            <p className="text-sm text-white/45 leading-relaxed">
                                Primary channel. Sends pre-approved templates from your verified business number.
                            </p>

                            <div className="flex flex-wrap gap-2">
                                <EnvChip name="WHATSAPP_PHONE_NUMBER_ID" set={!status.whatsapp.missing.includes("WHATSAPP_PHONE_NUMBER_ID")} />
                                <EnvChip name="WHATSAPP_ACCESS_TOKEN" set={!status.whatsapp.missing.includes("WHATSAPP_ACCESS_TOKEN")} />
                            </div>

                            <dl className="text-xs text-white/40 space-y-1.5 pt-2 border-t border-white/10">
                                <div className="flex justify-between gap-4">
                                    <dt>Sender</dt>
                                    <dd className="font-mono text-white/60">{status.whatsapp.phoneNumberIdHint || "—"}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt>Graph API version</dt>
                                    <dd className="font-mono text-white/60">{status.whatsapp.apiVersion}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt>Template language</dt>
                                    <dd className="font-mono text-white/60">{status.whatsapp.language}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt>Per-number limit</dt>
                                    <dd className="font-mono text-white/60">
                                        {status.rateLimit.messages} / {status.rateLimit.windowMinutes} min
                                    </dd>
                                </div>
                            </dl>
                        </GlassCard>

                        <GlassCard className="p-6 space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <Smartphone size={18} className="text-[#D4AF37]" />
                                    <h3 className="font-serif text-lg text-white">SMS fallback</h3>
                                </div>
                                <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/50">
                                    <StatusDot on={smsOn} />
                                    {smsOn ? status.sms.provider || "Connected" : "Not connected"}
                                </span>
                            </div>

                            <p className="text-sm text-white/45 leading-relaxed">
                                Used only when WhatsApp is unavailable or a send fails. Plain-text version of the same
                                message, trimmed to two SMS segments.
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {status.sms.envVars.map(name => (
                                    <EnvChip key={name} name={name} set={smsOn} />
                                ))}
                            </div>

                            {!smsOn && (
                                <p className="text-xs text-white/35 leading-relaxed pt-2 border-t border-white/10">
                                    Optional. Fast2SMS has a free Indian tier; Twilio works worldwide. Without either,
                                    the SMS step is skipped rather than silently pretending to send.
                                </p>
                            )}
                        </GlassCard>
                    </div>

                    {/* --- Templates ------------------------------------------ */}
                    <GlassCard className="p-6 space-y-5">
                        <div className="flex items-start gap-3">
                            <Info size={18} className="text-[#D4AF37] shrink-0 mt-0.5" />
                            <p className="text-sm text-white/50 leading-relaxed">
                                <span className="text-white/80">These are the template names in use.</span> Register each
                                one in Meta Business Manager → WhatsApp Manager → Message templates, using the exact body
                                shown in the preview below (the <span className="font-mono text-white/70">{"{{n}}"}</span>{" "}
                                placeholders must match). Name them differently if you prefer — just set the matching env
                                var.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[520px]">
                                <thead>
                                    <tr className="text-left text-[10px] uppercase tracking-widest text-white/35 border-b border-white/10">
                                        <th className="py-2 pr-4 font-medium">Event</th>
                                        <th className="py-2 pr-4 font-medium">Template name</th>
                                        <th className="py-2 pr-4 font-medium">Env var</th>
                                        <th className="py-2 font-medium">Source</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {status.templates.map(row => (
                                        <tr key={row.kind} className="border-b border-white/5 last:border-0">
                                            <td className="py-3 pr-4 text-white/80 capitalize">{row.kind.replace(/_/g, " ")}</td>
                                            <td className="py-3 pr-4 font-mono text-xs text-[#D4AF37]">{row.name}</td>
                                            <td className="py-3 pr-4 font-mono text-[11px] text-white/40">{row.envVar}</td>
                                            <td className="py-3 text-xs text-white/40">
                                                {row.usingDefault ? "Default" : "From env"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>

                    {/* --- Previews ------------------------------------------- */}
                    <GlassCard className="p-6 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-serif text-xl text-white">Message preview</h3>
                                <p className="text-sm text-white/40 mt-1">Rendered with sample order data.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {previews.map(p => (
                                    <button
                                        key={p.kind}
                                        type="button"
                                        onClick={() => setActiveKind(p.kind)}
                                        className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                            activeKind === p.kind
                                                ? "bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#D4AF37]"
                                                : "border-white/10 text-white/50 hover:text-white hover:border-white/25"
                                        }`}
                                    >
                                        {p.title}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {!active ? (
                            <EmptyState
                                icon={<MessageCircle size={20} />}
                                title="No previews available"
                                subtitle="Refresh to reload the message templates."
                            />
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Phone-like bubble */}
                                <div className="space-y-3">
                                    <FieldLabel gold>As the customer sees it</FieldLabel>
                                    <div className="bg-[#0B141A] border border-white/10 rounded-2xl p-5">
                                        <div className="bg-[#005C4B] text-[#E9EDEF] rounded-2xl rounded-tr-sm px-4 py-3 max-w-[92%] ml-auto shadow-lg">
                                            <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                                                {active.body}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <CopyButton text={active.body} label="Copy message" />
                                        <CopyButton text={active.templateBody} label="Copy Meta template body" />
                                    </div>
                                </div>

                                {/* Params + SMS */}
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <FieldLabel gold>Template variables</FieldLabel>
                                        <ul className="space-y-1.5">
                                            {active.params.map((value, i) => (
                                                <li key={i} className="flex items-start gap-3 text-xs">
                                                    <span className="font-mono text-[#D4AF37] shrink-0 pt-0.5">
                                                        {`{{${i + 1}}}`}
                                                    </span>
                                                    <span className="text-white/35 w-36 shrink-0">
                                                        {active.paramLabels[i] || "—"}
                                                    </span>
                                                    <span className="text-white/70 break-all">{value}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="space-y-2">
                                        <FieldLabel>SMS fallback</FieldLabel>
                                        <p className="text-xs text-white/50 leading-relaxed bg-black/40 border border-white/10 rounded-xl p-4 whitespace-pre-wrap break-words">
                                            {active.smsBody}
                                        </p>
                                        <p className="text-[11px] text-white/30">
                                            {active.smsBody.length} characters · {Math.ceil(active.smsBody.length / 160)}{" "}
                                            SMS segment{active.smsBody.length > 160 ? "s" : ""}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </GlassCard>

                    {/* --- Test send ------------------------------------------ */}
                    <GlassCard className="p-6 space-y-5">
                        <div>
                            <h3 className="font-serif text-xl text-white">Send a test message</h3>
                            <p className="text-sm text-white/40 mt-1">
                                Goes to your own number with sample data — no customer is contacted.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 md:items-end">
                            <div>
                                <FieldLabel>Phone number</FieldLabel>
                                <GlassInput
                                    value={testPhone}
                                    onChange={e => setTestPhone(e.target.value)}
                                    placeholder="9739988771"
                                    inputMode="tel"
                                    autoComplete="off"
                                />
                            </div>
                            <div>
                                <FieldLabel>Message</FieldLabel>
                                <GlassSelect value={testKind} onChange={e => setTestKind(e.target.value as MessageKind)}>
                                    {(previews.length ? previews : []).map(p => (
                                        <option key={p.kind} value={p.kind} className="bg-[#111]">
                                            {p.title}
                                        </option>
                                    ))}
                                </GlassSelect>
                            </div>
                            <GoldButton onClick={sendTest} disabled={sending || !anyTransport} type="button">
                                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                {sending ? "Sending…" : "Send test"}
                            </GoldButton>
                        </div>

                        <p className="text-xs text-white/30 leading-relaxed">
                            Indian numbers may be entered as 10 digits, with 0, or with +91 — all are normalised to
                            E.164 before sending.{" "}
                            {!anyTransport && "Connect WhatsApp above before a test can actually be delivered."}{" "}
                            {whatsappOn &&
                                "While your Meta app is in development mode, only numbers added as test recipients will receive it."}
                        </p>
                    </GlassCard>
                </motion.div>
            )}
        </div>
    );
}
