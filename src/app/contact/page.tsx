"use client";

import Footer from "@/components/Footer";
import { Mail, Phone, MapPin, Instagram, Facebook } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import SectionHeader from "@/components/ui/SectionHeader";
import ZariDivider from "@/components/ui/ZariDivider";

/** Square hairline channel card — gold glyph, micro-label, serif value. */
const CARD = "group relative block border border-black/10 bg-[#F9F5F0] p-8 transition-colors duration-700 hover:border-[#D4AF37]/70";
const GLYPH = "mt-1 flex h-11 w-11 shrink-0 items-center justify-center border border-[#D4AF37]/40 text-[#D4AF37] transition-colors duration-700 group-hover:bg-[#D4AF37] group-hover:text-[#0A0A0A]";
const CHANNEL = "text-[10px] font-sans uppercase tracking-[0.3em] text-[#4A0404]";
const META = "mt-3 text-[9px] font-sans uppercase tracking-[0.3em] text-neutral-400";
const ACTION = "btn-thread mt-6 font-sans text-[#4A0404]";

export default function ContactPage() {
    return (
        <main className="bg-[#FDFBF7] min-h-screen text-[#1A1A1A] font-sans">
            <h1 className="sr-only">Contact The Srivari</h1>

            {/* Hero Section */}
            <section className="texture-silk relative overflow-hidden bg-obsidian text-marble px-6 pt-40 md:pt-48 pb-24 md:pb-28">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596462502278-27bfdd403ea6?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center opacity-45"></div>
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/70 to-obsidian/40"></div>

                <div className="relative z-10 max-w-6xl mx-auto">
                    <SectionHeader
                        tone="dark"
                        kicker="The Srivari Concierge"
                        title="Contact Us"
                        accent="Us"
                        note="We'd love to hear from you."
                        className="max-w-5xl"
                    />
                </div>

                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent"
                />
            </section>

            {/* Contact Details */}
            <section className="px-6 py-24 md:py-28">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20">

                    {/* Information */}
                    <div>
                        <SectionHeader
                            tone="light"
                            kicker="Correspondence"
                            title="Get in Touch"
                            accent="Touch"
                        />
                        <p className="mt-8 max-w-2xl font-serif text-lg md:text-xl leading-relaxed text-[#3A3A3A]">
                            Whether you have a question about our collections, need styling advice, or want to discuss a custom order, our team is here to assist you.
                        </p>

                        <div className="mt-14 space-y-6">
                            <a href={`tel:+${SITE_CONFIG.contact.phone}`} className={CARD}>
                                <div className="zari-frame absolute inset-0" aria-hidden="true"></div>
                                <div className="relative flex items-start gap-6">
                                    <span className={GLYPH} aria-hidden="true">
                                        <Phone size={17} strokeWidth={1.5} />
                                    </span>
                                    <div className="min-w-0">
                                        <h3 className={CHANNEL}>Phone & WhatsApp</h3>
                                        <p className="mt-4 font-serif text-2xl md:text-3xl text-[#1A1A1A] leading-tight tracking-wide">
                                            +{SITE_CONFIG.contact.phone.replace(/(\d{2})(\d{5})(\d{5})/, '$1 $2 $3')}
                                        </p>
                                        <p className={META}>Mon - Sat, 10:00 AM - 7:00 PM</p>
                                        <span className={ACTION}>Call the Boutique</span>
                                    </div>
                                </div>
                            </a>

                            <a href="mailto:support@thesrivari.com" className={CARD}>
                                <div className="zari-frame absolute inset-0" aria-hidden="true"></div>
                                <div className="relative flex items-start gap-6">
                                    <span className={GLYPH} aria-hidden="true">
                                        <Mail size={17} strokeWidth={1.5} />
                                    </span>
                                    <div className="min-w-0">
                                        <h3 className={CHANNEL}>Email</h3>
                                        <p className="mt-4 font-serif text-xl md:text-2xl text-[#1A1A1A] leading-tight break-words">
                                            support@thesrivari.com
                                        </p>
                                        <p className={META}>We usually reply within 24 hours.</p>
                                        <span className={ACTION}>Write to Us</span>
                                    </div>
                                </div>
                            </a>

                            <a href="https://www.google.com/maps/search/?api=1&query=36+Balaji+Layout+Subramayapura+Bangalore+560061" target="_blank" rel="noopener noreferrer" className={CARD}>
                                <div className="zari-frame absolute inset-0" aria-hidden="true"></div>
                                <div className="relative flex items-start gap-6">
                                    <span className={GLYPH} aria-hidden="true">
                                        <MapPin size={17} strokeWidth={1.5} />
                                    </span>
                                    <div className="min-w-0">
                                        <h3 className={CHANNEL}>Boutique</h3>
                                        <p className="mt-4 font-serif text-xl md:text-2xl text-[#1A1A1A] leading-snug">
                                            36, Balaji Layout, Subramayapura<br />
                                            Bangalore, Karnataka - 560061
                                        </p>
                                        <span className={ACTION}>Open in Maps</span>
                                    </div>
                                </div>
                            </a>
                        </div>

                        <ZariDivider tone="light" className="mt-16" />

                        {/* Social Media */}
                        <div className="mt-16">
                            <span className="kicker mb-6">Follow Our Journey</span>
                            <div className="flex flex-wrap gap-5">
                                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                                    className="btn-royal btn-royal--oxblood">
                                    <Instagram size={15} strokeWidth={1.5} aria-hidden="true" />
                                    Instagram
                                </a>
                                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                                    className="btn-royal btn-royal--oxblood">
                                    <Facebook size={15} strokeWidth={1.5} aria-hidden="true" />
                                    Facebook
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Image / Map Placeholder */}
                    <div className="group relative h-[420px] lg:h-auto lg:min-h-[640px] lg:sticky lg:top-28 overflow-hidden border border-[#D4AF37]/25 bg-[#F3EEE5]">
                        <div className="zari-frame absolute inset-0 z-10" aria-hidden="true"></div>
                        <img
                            src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=1200&auto=format&fit=crop"
                            alt="Boutique Interior"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0A0A0A]/85 via-[#0A0A0A]/40 to-transparent p-10">
                            <span className="kicker mb-4">The House</span>
                            <p className="text-marble font-serif text-3xl md:text-4xl leading-tight">Visit The Srivari Boutique</p>
                        </div>
                    </div>

                </div>
            </section>

            <Footer />

        </main>
    );
}
