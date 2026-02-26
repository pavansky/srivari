"use client";

import { useState } from "react";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");

    // Simulate API request
    setTimeout(() => {
      setStatus("success");
      setEmail("");
      // Reset success message after 3 seconds
      setTimeout(() => setStatus("idle"), 3000);
    }, 1500);
  };

  return (
    <footer className="bg-obsidian text-marble py-16 border-t border-gold/20 mt-auto">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand Column */}
        <div className="space-y-6">
          <h2 className="text-3xl font-serif text-gold tracking-wide">SRIVARI'S</h2>
          <p className="text-sm opacity-80 leading-relaxed">
            Weaving legacy into every thread. Authentic Kanjivaram and Banarasi silks for the modern royalty.
          </p>
        </div>

        {/* Collections */}
        <div className="space-y-6">
          <h4 className="text-lg font-bold text-gold uppercase tracking-widest">Collections</h4>
          <ul className="space-y-3 text-sm opacity-80">
            <li><a href="/shop?category=kanjivaram" className="hover:text-gold transition-colors">Kanjivaram Silk</a></li>
            <li><a href="/shop?category=banarasi" className="hover:text-gold transition-colors">Banarasi Silk</a></li>
            <li><a href="/shop?category=mysore" className="hover:text-gold transition-colors">Mysore Silk</a></li>
            <li><a href="/shop?category=tussar" className="hover:text-gold transition-colors">Tussar Georgette</a></li>
          </ul>
        </div>

        {/* Support */}
        <div className="space-y-6">
          <h4 className="text-lg font-bold text-gold uppercase tracking-widest">Support</h4>
          <ul className="space-y-3 text-sm opacity-80">
            <li><a href="/order-tracking" className="hover:text-gold transition-colors">Order Tracking</a></li>
            <li><a href="/shipping-policy" className="hover:text-gold transition-colors">Shipping Policy</a></li>
            <li><a href="/returns" className="hover:text-gold transition-colors">Returns & Exchange</a></li>
            <li><a href="/contact" className="hover:text-gold transition-colors">Contact Us</a></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="space-y-6">
          <h4 className="text-lg font-bold text-gold uppercase tracking-widest">Newsletter</h4>
          <p className="text-sm opacity-80">Subscribe for exclusive drops and heritage stories.</p>
          <form onSubmit={handleSubscribe} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your Email Address"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-gold/50 transition-colors rounded-sm"
            />
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className={`w-full py-3 font-bold tracking-widest uppercase transition-all duration-300 ${status === "success"
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gold text-obsidian hover:bg-white"
                }`}
            >
              {status === "loading" ? "Subscribing..." : status === "success" ? "Welcome to the Family" : "Subscribe"}
            </button>
          </form>
        </div>
      </div>

      {/* Copyright */}
      <div className="container mx-auto px-6 mt-16 pt-8 border-t border-white/10 text-center text-xs opacity-40 uppercase tracking-widest">
        <p>&copy; {new Date().getFullYear()} Srivari's Saree Store. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
