"use client";

import { useState } from "react";
import SectionHeader from "@/components/ui/SectionHeader";

/**
 * NewsletterBand — homepage newsletter CTA wired to POST /api/newsletter.
 * Inline success/error feedback; no alert().
 */
export default function NewsletterBand() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || status === "loading") return;
        setStatus("loading");
        setMessage("");

        try {
            const res = await fetch("/api/newsletter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, source: "homepage" }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setStatus("success");
                setMessage(data.message || "Welcome to the inner circle.");
                setEmail("");
            } else {
                setStatus("error");
                setMessage(data.error || "Could not subscribe right now. Please try again.");
            }
        } catch {
            setStatus("error");
            setMessage("Could not subscribe right now. Please try again.");
        }
    };

    return (
        <section className="texture-silk relative bg-obsidian py-28 md:py-32 px-6 overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gold/5 rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />

            <div className="relative max-w-2xl mx-auto text-center">
                <SectionHeader
                    kicker="THE INNER CIRCLE"
                    title="First to the Loom"
                    accent="Loom"
                    tone="dark"
                    align="center"
                />
                <p className="mt-6 text-marble/60 font-light leading-relaxed max-w-lg mx-auto">
                    New weaves arrive in whispers. Join our list for private previews of fresh arrivals,
                    heritage stories and atelier invitations.
                </p>

                {status === "success" ? (
                    <p aria-live="polite" className="mt-12 text-gold font-serif text-xl italic">
                        {message}
                    </p>
                ) : (
                    <>
                        <form onSubmit={handleSubmit} className="mt-12 flex flex-col sm:flex-row sm:items-end gap-8 sm:gap-6 max-w-xl mx-auto">
                            <div className="flex-1 text-left">
                                <label htmlFor="home-newsletter-email" className="sr-only">Email address</label>
                                <input
                                    id="home-newsletter-email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); if (status === "error") { setStatus("idle"); setMessage(""); } }}
                                    placeholder="Your email address"
                                    className="w-full bg-transparent border-b border-marble/30 focus:border-gold rounded-none px-1 py-3 text-marble placeholder:text-marble/40 focus:outline-none transition-colors duration-500 text-sm tracking-wide"
                                    aria-required="true"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={status === "loading"}
                                className="btn-royal shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {status === "loading" ? "Joining…" : "Join"}
                            </button>
                        </form>
                        <p aria-live="polite" className="mt-4 text-xs min-h-[1rem] text-red-400">
                            {status === "error" ? message : ""}
                        </p>
                    </>
                )}
            </div>
        </section>
    );
}
