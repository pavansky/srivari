"use client";

import { useState } from "react";
import Link from "next/link";
import { Instagram, Facebook } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import ZariDivider from "@/components/ui/ZariDivider";

const SHOP_LINKS = [
  { label: "Shop All Sarees", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "Kanjivaram Silk", href: "/shop?category=Kanjivaram" },
  { label: "Banarasi Silk", href: "/shop?category=Banarasi" },
  { label: "Mysore Silk", href: "/shop?category=Mysore Silk" },
  { label: "Tussar", href: "/shop?category=Tussar" },
  { label: "Wishlist", href: "/wishlist" },
];

const SUPPORT_LINKS = [
  { label: "Order Tracking", href: "/order-tracking" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Returns & Exchange", href: "/returns" },
];

const Footer = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setMessage(data.message || "Welcome to the family.");
        setEmail("");
        setTimeout(() => { setStatus("idle"); setMessage(""); }, 4000);
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
    <footer className="texture-silk bg-obsidian text-marble pt-10 pb-12 mt-auto" role="contentinfo" aria-label="Site Footer">
      <ZariDivider tone="dark" className="mb-16" />

      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand Column */}
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-serif text-gold tracking-[0.08em]">THE SRIVARI</h2>
            <p className="mt-3 text-[10px] font-sans uppercase tracking-[0.4em] text-gold/60">Royalty Woven</p>
          </div>
          <p className="text-sm text-marble/70 leading-relaxed">
            Weaving legacy into every thread. Authentic Kanjivaram and Banarasi silks for the modern royalty.
          </p>
          <div className="flex gap-3 pt-2">
            <a
              href={SITE_CONFIG.links.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="The Srivari on Instagram"
              className="w-10 h-10 flex items-center justify-center border border-marble/20 text-marble/60 hover:text-gold hover:border-gold/60 transition-colors duration-500"
            >
              <Instagram className="w-4 h-4" strokeWidth={1.5} />
            </a>
            <a
              href={SITE_CONFIG.links.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="The Srivari on Facebook"
              className="w-10 h-10 flex items-center justify-center border border-marble/20 text-marble/60 hover:text-gold hover:border-gold/60 transition-colors duration-500"
            >
              <Facebook className="w-4 h-4" strokeWidth={1.5} />
            </a>
          </div>
        </div>

        {/* Shop */}
        <nav className="space-y-7" aria-label="Shop Footer Navigation">
          <h4 className="text-[11px] font-sans uppercase tracking-[0.35em] text-gold">Shop</h4>
          <ul className="space-y-3.5 text-sm text-marble/70">
            {SHOP_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-gold transition-colors duration-300">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Support */}
        <nav className="space-y-7" aria-label="Support Footer Navigation">
          <h4 className="text-[11px] font-sans uppercase tracking-[0.35em] text-gold">Support</h4>
          <ul className="space-y-3.5 text-sm text-marble/70">
            {SUPPORT_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-gold transition-colors duration-300">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Newsletter */}
        <div className="space-y-7">
          <h4 className="text-[11px] font-sans uppercase tracking-[0.35em] text-gold" id="newsletter-heading">Newsletter</h4>
          <p className="text-sm text-marble/70">Subscribe for exclusive drops and heritage stories.</p>
          <form onSubmit={handleSubscribe} className="space-y-5" aria-labelledby="newsletter-heading">
            <label htmlFor="newsletter-email" className="sr-only">Email Address</label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (status === "error") { setStatus("idle"); setMessage(""); } }}
              placeholder="Your Email Address"
              required
              className="w-full bg-transparent border-b border-marble/30 focus:border-gold rounded-none px-1 py-3 text-marble placeholder:text-marble/40 focus:outline-none transition-colors duration-500 text-sm tracking-wide"
              aria-required="true"
            />
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className="btn-royal w-full disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "loading" ? "Subscribing…" : status === "success" ? "Welcome to the Family" : "Subscribe"}
            </button>
            <p aria-live="polite" className={`text-xs min-h-[1rem] ${status === "error" ? "text-red-400" : "text-gold/80"}`}>
              {message}
            </p>
          </form>
        </div>
      </div>

      {/* Copyright */}
      <div className="container mx-auto px-6 mt-16 pt-8 border-t border-marble/10 text-center">
        <p className="text-[10px] font-sans uppercase tracking-[0.35em] text-marble/40">
          &copy; {new Date().getFullYear()} The Srivari. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
