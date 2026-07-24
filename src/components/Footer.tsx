"use client";

import { useState } from "react";
import Link from "next/link";
import { Instagram, Facebook } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";

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
    <footer className="bg-obsidian text-marble py-16 border-t border-gold/20 mt-auto" role="contentinfo" aria-label="Site Footer">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand Column */}
        <div className="space-y-6">
          <h2 className="text-3xl font-serif text-gold tracking-wide">THE SRIVARI</h2>
          <p className="text-xs uppercase tracking-[0.3em] text-gold/60 -mt-4">Royalty Woven</p>
          <p className="text-sm opacity-80 leading-relaxed">
            Weaving legacy into every thread. Authentic Kanjivaram and Banarasi silks for the modern royalty.
          </p>
          <div className="flex gap-4 pt-2">
            <a
              href={SITE_CONFIG.links.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="The Srivari on Instagram"
              className="text-marble/60 hover:text-gold transition-colors"
            >
              <Instagram className="w-5 h-5" strokeWidth={1.5} />
            </a>
            <a
              href={SITE_CONFIG.links.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="The Srivari on Facebook"
              className="text-marble/60 hover:text-gold transition-colors"
            >
              <Facebook className="w-5 h-5" strokeWidth={1.5} />
            </a>
          </div>
        </div>

        {/* Shop */}
        <nav className="space-y-6" aria-label="Shop Footer Navigation">
          <h4 className="text-lg font-bold text-gold uppercase tracking-widest">Shop</h4>
          <ul className="space-y-3 text-sm opacity-80">
            {SHOP_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-gold transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Support */}
        <nav className="space-y-6" aria-label="Support Footer Navigation">
          <h4 className="text-lg font-bold text-gold uppercase tracking-widest">Support</h4>
          <ul className="space-y-3 text-sm opacity-80">
            {SUPPORT_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-gold transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Newsletter */}
        <div className="space-y-6">
          <h4 className="text-lg font-bold text-gold uppercase tracking-widest" id="newsletter-heading">Newsletter</h4>
          <p className="text-sm opacity-80">Subscribe for exclusive drops and heritage stories.</p>
          <form onSubmit={handleSubscribe} className="space-y-3" aria-labelledby="newsletter-heading">
            <label htmlFor="newsletter-email" className="sr-only">Email Address</label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (status === "error") { setStatus("idle"); setMessage(""); } }}
              placeholder="Your Email Address"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-gold/50 transition-colors rounded-sm"
              aria-required="true"
            />
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className={`w-full py-3 font-bold tracking-widest uppercase transition-all duration-300 ${status === "success"
                ? "bg-green-700 text-white"
                : "bg-gold text-obsidian hover:bg-white"
                } disabled:cursor-not-allowed`}
            >
              {status === "loading" ? "Subscribing..." : status === "success" ? "Welcome to the Family" : "Subscribe"}
            </button>
            <p aria-live="polite" className={`text-xs min-h-[1rem] ${status === "error" ? "text-red-400" : "text-gold/80"}`}>
              {message}
            </p>
          </form>
        </div>
      </div>

      {/* Copyright */}
      <div className="container mx-auto px-6 mt-16 pt-8 border-t border-white/10 text-center text-xs opacity-40 uppercase tracking-widest">
        <p>&copy; {new Date().getFullYear()} The Srivari. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
