"use client";

import { useState } from "react";
import Image from "next/image";
import { Sparkles, Calendar, Phone, ArrowRight, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AtelierPage() {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [date, setDate] = useState("");
    const [interest, setInterest] = useState("");

    const handleWhatsAppSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const message = `Namaskaram The Srivari Team.%0A%0A*Atelier Consultation Request*%0A*Name*: ${name}%0A*Phone*: ${phone}%0A*Event Date*: ${date}%0A*Interested In*: ${interest}%0A%0AI would like to schedule a private consultation for a Masterpiece Saree.`;

        // Use generic Srivari business number, fallback to generic
        const whatsappUrl = `https://wa.me/919999999999?text=${message}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <main className="bg-[#050505] min-h-screen text-[#FDFBF7]">
            <Navbar />

            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    {/* Placeholder image for a very high end dark aesthetic saree photo */}
                    <Image
                        src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=2000"
                        alt="The Srivari Atelier"
                        fill
                        className="object-cover opacity-40 brightness-50"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/50"></div>
                </div>

                <div className="relative z-10 text-center max-w-4xl mx-auto px-6 pt-32">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                    >
                        <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.4em] mb-6 block">Private Commission</span>
                        <h1 className="text-5xl md:text-7xl font-serif mb-6 text-white text-shadow-xl">The Atelier</h1>
                        <p className="font-light text-xl md:text-2xl text-white/80 max-w-2xl mx-auto leading-relaxed font-serif italic">
                            For those who seek the extraordinary. Reserve a private consultation for our most exclusive, pure zari Kanjivaram masterpieces.
                        </p>
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                >
                    <span className="text-[10px] uppercase tracking-widest text-white/50">Discover</span>
                    <div className="w-[1px] h-12 bg-gradient-to-b from-[#D4AF37] to-transparent"></div>
                </motion.div>
            </section>

            {/* Content Section */}
            <section className="py-32 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

                {/* Story */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="space-y-8"
                >
                    <Sparkles className="text-[#D4AF37] w-8 h-8" />
                    <h2 className="text-4xl md:text-5xl font-serif leading-tight">Beyond a purchase. <br /><span className="text-[#D4AF37]">A legacy.</span></h2>

                    <div className="space-y-6 text-white/70 font-light text-lg leading-relaxed">
                        <p>
                            The Atelier collection represents the absolute zenith of handloom artistry. These are not merely sarees; they are heirlooms, meticulously woven over 3 to 6 months by master artisans whose lineage traces back centuries.
                        </p>
                        <p>
                            Featuring authentic gold and silver zari, natural dyes, and motifs inspired by temple architecture, these pieces are rarely displayed publicly.
                        </p>
                        <p>
                            We invite brides, collectors, and connoisseurs to schedule a private consultation with our senior stylists to view and reserve these masterpieces.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/10">
                        <div>
                            <p className="text-[#D4AF37] text-4xl font-serif mb-2">45+</p>
                            <p className="text-xs uppercase tracking-widest text-white/50 font-bold">Days to Weave</p>
                        </div>
                        <div>
                            <p className="text-[#D4AF37] text-4xl font-serif mb-2">988</p>
                            <p className="text-xs uppercase tracking-widest text-white/50 font-bold">Purity Silver Zari</p>
                        </div>
                    </div>
                </motion.div>

                {/* Consultation Form Form */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="bg-[#111] border border-white/10 p-10 md:p-14 rounded-2xl shadow-2xl relative overflow-hidden"
                >
                    {/* Decorative Corner Borders */}
                    <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-[#D4AF37]/30 rounded-tl-2xl"></div>
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-[#D4AF37]/30 rounded-br-2xl"></div>

                    <div className="text-center mb-10">
                        <h3 className="text-3xl font-serif mb-3 text-white">Request Consultation</h3>
                        <p className="text-sm text-white/50 font-light">Speak directly with our Master Stylist.</p>
                    </div>

                    <form onSubmit={handleWhatsAppSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] uppercase font-bold tracking-widest text-white/50 mb-2">Full Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-transparent border-b border-white/20 pb-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors placeholder:text-white/20 font-serif text-lg"
                                placeholder="E.g. Aishwarya R."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-white/50 mb-2"><Phone size={12} /> Phone Number</label>
                                <input
                                    type="tel"
                                    required
                                    pattern="[0-9]{10,12}"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full bg-transparent border-b border-white/20 pb-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors placeholder:text-white/20 font-serif text-lg"
                                    placeholder="10-digit number"
                                    title="Please enter a valid 10-12 digit phone number"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-white/50 mb-2"><Calendar size={12} /> Event Date (Optional)</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-transparent border-b border-white/20 pb-2 text-white/80 focus:outline-none focus:border-[#D4AF37] transition-colors appearance-none font-sans"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase font-bold tracking-widest text-white/50 mb-2">Interested In</label>
                            <select
                                required
                                value={interest}
                                onChange={(e) => setInterest(e.target.value)}
                                className="w-full bg-[#111] border-b border-white/20 pb-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors font-serif text-lg py-2"
                            >
                                <option value="" disabled>Select an option...</option>
                                <option value="Bridal Kanjivaram">Bridal Kanjivaram</option>
                                <option value="Authentic Banarasi">Authentic Banarasi</option>
                                <option value="Custom Woven Masterpiece">Custom Woven Masterpiece</option>
                                <option value="General Consultation">General High-End Consultation</option>
                            </select>
                        </div>

                        <button type="submit" className="w-full bg-[#D4AF37] hover:bg-white text-[#050505] font-bold uppercase tracking-[0.2em] text-sm py-5 rounded flex items-center justify-center gap-3 transition-colors mt-8">
                            <MessageCircle size={18} /> Reserve via WhatsApp
                        </button>
                        <p className="text-center text-[10px] text-white/40 mt-4 leading-loose">
                            By reserving, you agree to our Atelier consultation policies. <br /> A stylist will contact you within 24 hours.
                        </p>
                    </form>
                </motion.div>
            </section>

            <Footer />
        </main>
    );
}
