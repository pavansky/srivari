"use client";

import { useState } from "react";
import Image from "next/image";
import { Calendar, Phone, MessageCircle, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import SectionHeader from "@/components/ui/SectionHeader";
import ZariDivider from "@/components/ui/ZariDivider";

/** House easing — slow, unhurried, never springy. */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const FIELD_LABEL = "flex items-center gap-2 text-[9px] font-sans uppercase tracking-[0.3em] text-marble/45 mb-3";
const FIELD_INPUT =
    "w-full bg-transparent border-0 border-b border-white/20 pb-3 text-marble placeholder:text-marble/20 focus:outline-none focus:border-[#D4AF37] transition-colors duration-500 font-serif text-lg";

/** What a private appointment includes — drawn from the Atelier copy below. */
const APPOINTMENT = [
    {
        numeral: "I",
        title: "A Private Viewing",
        text: "Masterpieces rarely displayed publicly, brought out of the vault for you alone.",
    },
    {
        numeral: "II",
        title: "The Senior Stylist",
        text: "Brides, collectors and connoisseurs are received personally by our senior stylists.",
    },
    {
        numeral: "III",
        title: "A Reply Within a Day",
        text: "A stylist will contact you within 24 hours of your reservation to set the hour.",
    },
];

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
        <main className="bg-obsidian min-h-screen text-marble">
            <h1 className="sr-only">The Srivari Atelier</h1>

            {/* Hero Section */}
            <section className="relative min-h-[92vh] flex items-end overflow-hidden">
                <div className="absolute inset-0 z-0">
                    {/* Placeholder image for a very high end dark aesthetic saree photo */}
                    <Image
                        src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=2000"
                        alt="The Srivari Atelier"
                        fill
                        className="object-cover opacity-40 brightness-50"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-obsidian/80"></div>
                </div>

                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-44 pb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: EASE }}
                    >
                        <SectionHeader
                            tone="dark"
                            kicker="By Appointment · Private Commission"
                            title="The Atelier"
                            accent="Atelier"
                            note="Private consultations with our master stylist."
                            className="max-w-5xl"
                        />
                        <p className="mt-10 max-w-xl font-serif italic text-xl md:text-2xl text-marble/70 leading-relaxed">
                            For those who seek the extraordinary. Reserve a private consultation for our most exclusive, pure zari Kanjivaram masterpieces.
                        </p>
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1.2, ease: EASE }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-3"
                >
                    <span className="text-[9px] font-sans uppercase tracking-[0.35em] text-marble/40">Discover</span>
                    <div className="w-px h-14 bg-gradient-to-b from-[#D4AF37] to-transparent"></div>
                </motion.div>
            </section>

            {/* Content Section */}
            <section className="texture-silk relative px-6 py-28 md:py-32">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">

                    {/* Story */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 1.1, ease: EASE }}
                    >
                        <SectionHeader
                            tone="dark"
                            kicker="The Atelier Collection"
                            title={"Beyond a purchase. A legacy."}
                            accent={"A legacy."}
                        />

                        <div className="mt-10 space-y-6 max-w-2xl font-serif text-lg md:text-xl leading-relaxed text-marble/70">
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

                        <div className="grid grid-cols-2 gap-10 mt-14">
                            <div className="border-t border-[#D4AF37]/25 pt-6">
                                <p className="text-[#D4AF37] text-5xl font-serif leading-none mb-4">45+</p>
                                <p className="text-[9px] font-sans uppercase tracking-[0.3em] text-marble/45">Days to Weave</p>
                            </div>
                            <div className="border-t border-[#D4AF37]/25 pt-6">
                                <p className="text-[#D4AF37] text-5xl font-serif leading-none mb-4">988</p>
                                <p className="text-[9px] font-sans uppercase tracking-[0.3em] text-marble/45">Purity Silver Zari</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Consultation Form Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 1.1, delay: 0.15, ease: EASE }}
                        className="relative border border-[#D4AF37]/25 bg-[#0D0D0D] p-8 md:p-12"
                    >
                        {/* Decorative Corner Borders */}
                        <span aria-hidden="true" className="absolute top-3 left-3 w-12 h-12 border-t border-l border-[#D4AF37]/35"></span>
                        <span aria-hidden="true" className="absolute bottom-3 right-3 w-12 h-12 border-b border-r border-[#D4AF37]/35"></span>

                        <div className="mb-12">
                            <span className="kicker mb-5">Reserve</span>
                            <h2 className="font-serif text-3xl md:text-4xl leading-[1.1] text-marble">Request Consultation</h2>
                            <p className="mt-4 font-serif italic text-marble/50">Speak directly with our Master Stylist.</p>
                        </div>

                        <form onSubmit={handleWhatsAppSubmit} className="space-y-8">
                            <div>
                                <label htmlFor="atelier-name" className={FIELD_LABEL}>Full Name</label>
                                <input
                                    id="atelier-name"
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={FIELD_INPUT}
                                    placeholder="E.g. Aishwarya R."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label htmlFor="atelier-phone" className={FIELD_LABEL}>
                                        <Phone size={11} className="text-[#D4AF37]" aria-hidden="true" /> Phone Number
                                    </label>
                                    <input
                                        id="atelier-phone"
                                        type="tel"
                                        required
                                        pattern="[0-9]{10,12}"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className={FIELD_INPUT}
                                        placeholder="10-digit number"
                                        title="Please enter a valid 10-12 digit phone number"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="atelier-date" className={FIELD_LABEL}>
                                        <Calendar size={11} className="text-[#D4AF37]" aria-hidden="true" /> Event Date (Optional)
                                    </label>
                                    <input
                                        id="atelier-date"
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className={`${FIELD_INPUT} [color-scheme:dark] text-marble/80`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="atelier-interest" className={FIELD_LABEL}>Interested In</label>
                                <div className="relative">
                                    <select
                                        id="atelier-interest"
                                        required
                                        value={interest}
                                        onChange={(e) => setInterest(e.target.value)}
                                        className="w-full appearance-none bg-[#0D0D0D] border-0 border-b border-white/20 pb-3 pr-8 text-marble focus:outline-none focus:border-[#D4AF37] transition-colors duration-500 font-serif text-lg"
                                    >
                                        <option value="" disabled>Select an option...</option>
                                        <option value="Bridal Kanjivaram">Bridal Kanjivaram</option>
                                        <option value="Authentic Banarasi">Authentic Banarasi</option>
                                        <option value="Custom Woven Masterpiece">Custom Woven Masterpiece</option>
                                        <option value="General Consultation">General High-End Consultation</option>
                                    </select>
                                    <ChevronDown
                                        size={14}
                                        aria-hidden="true"
                                        className="pointer-events-none absolute right-0 bottom-4 text-[#D4AF37]"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn-royal w-full !mt-12">
                                <MessageCircle size={15} aria-hidden="true" /> Reserve via WhatsApp
                            </button>
                            <p className="text-center text-[10px] font-sans text-marble/35 leading-loose tracking-wide">
                                By reserving, you agree to our Atelier consultation policies. <br /> A stylist will contact you within 24 hours.
                            </p>
                        </form>
                    </motion.div>
                </div>
            </section>

            <ZariDivider tone="dark" className="px-6" />

            {/* What a private appointment includes */}
            <section className="texture-silk px-6 py-28 md:py-32">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader
                        tone="dark"
                        align="center"
                        kicker="What to Expect"
                        title="The Private Appointment"
                        accent="Appointment"
                    />

                    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-px bg-[#D4AF37]/15">
                        {APPOINTMENT.map((item) => (
                            <div key={item.numeral} className="group relative bg-obsidian p-10 md:p-12">
                                <div className="zari-frame absolute inset-0" aria-hidden="true"></div>
                                <span className="block font-serif text-2xl text-[#D4AF37]/70 mb-6">{item.numeral}</span>
                                <h3 className="font-serif text-2xl text-marble mb-4">{item.title}</h3>
                                <p className="text-sm leading-relaxed text-marble/55 font-serif">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
