"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

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
        <section className="relative bg-obsidian py-24 px-6 overflow-hidden border-t border-gold/10">
            {/* Ambient glow */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" aria-hidden="true" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gold/5 rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />

            <div className="relative max-w-2xl mx-auto text-center">
                <Mail className="w-8 h-8 text-gold mx-auto mb-6" strokeWidth={1} aria-hidden="true" />
                <span className="text-gold uppercase tracking-[0.3em] text-xs">The Inner Circle</span>
                <h2 className="text-3xl md:text-5xl font-serif text-marble mt-4">
                    First to the Loom
                </h2>
                <p className="mt-4 text-marble/60 font-light leading-relaxed max-w-lg mx-auto">
                    New weaves arrive in whispers. Join our list for private previews of fresh arrivals,
                    heritage stories and atelier invitations.
                </p>

                {status === "success" ? (
                    <p aria-live="polite" className="mt-10 text-gold font-serif text-xl italic">
                        {message}
                    </p>
                ) : (
                    <>
                        <form onSubmit={handleSubmit} className="mt-10 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                            <label htmlFor="home-newsletter-email" className="sr-only">Email address</label>
                            <input
                                id="home-newsletter-email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); if (status === "error") { setStatus("idle"); setMessage(""); } }}
                                placeholder="Your email address"
                                className="flex-1 px-5 py-4 bg-white/5 border border-white/10 rounded-full text-marble placeholder:text-marble/40 focus:outline-none focus:border-gold/50 transition-colors text-sm"
                                aria-required="true"
                            />
                            <button
                                type="submit"
                                disabled={status === "loading"}
                                className="px-8 py-4 bg-gold text-obsidian text-xs font-semibold uppercase tracking-[0.2em] rounded-full hover:bg-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
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
