"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Mail, Phone, MapPin, Instagram, Facebook } from "lucide-react";
import WAButton from "@/components/WAButton";

export default function ContactPage() {
    return (
        <main className="bg-[#FDFBF7] min-h-screen text-obsidian font-serif">
            <Navbar />

            {/* Hero Section */}
            <section className="relative h-[50vh] flex items-center justify-center overflow-hidden bg-obsidian text-marble">
                <div className="absolute inset-0 bg-black/60 z-0"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596462502278-27bfdd403ea6?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>

                <div className="container relative z-10 text-center px-4">
                    <h1 className="text-5xl md:text-7xl font-heading mb-4 text-gold">Contact Us</h1>
                    <p className="text-xl md:text-2xl max-w-2xl mx-auto font-light tracking-wide text-marble/90">
                        We'd love to hear from you.
                    </p>
                </div>
            </section>

            {/* Contact Details */}
            <section className="container mx-auto px-6 py-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

                    {/* Information */}
                    <div className="space-y-12">
                        <div>
                            <h2 className="text-3xl font-heading text-maroon mb-6">Get in Touch</h2>
                            <p className="text-lg text-obsidian/80 font-sans leading-relaxed">
                                Whether you have a question about our collections, need styling advice, or want to discuss a custom order, our team is here to assist you.
                            </p>
                        </div>

                        <div className="space-y-8">
                            <a href="tel:+919739988771" className="block group">
                                <div className="flex items-start gap-4 p-6 bg-white border border-[#D4AF37]/20 rounded-sm shadow-sm transition-all duration-300 hover:shadow-xl hover:border-[#D4AF37] hover:-translate-y-1">
                                    <div className="p-3 bg-[#1A1A1A] text-[#D4AF37] rounded-full group-hover:bg-[#D4AF37] group-hover:text-[#1A1A1A] transition-colors">
                                        <Phone size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-1 font-[family-name:var(--font-playfair)] text-[#1A1A1A]">Phone & WhatsApp</h3>
                                        <p className="text-[#595959] font-[family-name:var(--font-montserrat)] group-hover:text-[#D4AF37] transition-colors">+91 97399 88771</p>
                                        <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Mon - Sat, 10:00 AM - 7:00 PM</p>
                                    </div>
                                </div>
                            </a>

                            <a href="mailto:support@thesrivari.com" className="block group">
                                <div className="flex items-start gap-4 p-6 bg-white border border-[#D4AF37]/20 rounded-sm shadow-sm transition-all duration-300 hover:shadow-xl hover:border-[#D4AF37] hover:-translate-y-1">
                                    <div className="p-3 bg-[#1A1A1A] text-[#D4AF37] rounded-full group-hover:bg-[#D4AF37] group-hover:text-[#1A1A1A] transition-colors">
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-1 font-[family-name:var(--font-playfair)] text-[#1A1A1A]">Email</h3>
                                        <p className="text-[#595959] font-[family-name:var(--font-montserrat)] group-hover:text-[#D4AF37] transition-colors">support@thesrivari.com</p>
                                        <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">We usually reply within 24 hours.</p>
                                    </div>
                                </div>
                            </a>

                            <a href="https://www.google.com/maps/search/?api=1&query=36+Balaji+Layout+Subramayapura+Bangalore+560061" target="_blank" rel="noopener noreferrer" className="block group">
                                <div className="flex items-start gap-4 p-6 bg-white border border-[#D4AF37]/20 rounded-sm shadow-sm transition-all duration-300 hover:shadow-xl hover:border-[#D4AF37] hover:-translate-y-1">
                                    <div className="p-3 bg-[#1A1A1A] text-[#D4AF37] rounded-full group-hover:bg-[#D4AF37] group-hover:text-[#1A1A1A] transition-colors">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-1 font-[family-name:var(--font-playfair)] text-[#1A1A1A]">Boutique</h3>
                                        <p className="text-[#595959] font-[family-name:var(--font-montserrat)] group-hover:text-[#D4AF37] transition-colors">
                                            36, Balaji Layout, Subramayapura<br />
                                            Bangalore, Karnataka - 560061
                                        </p>
                                    </div>
                                </div>
                            </a>
                        </div>

                        {/* Social Media */}
                        <div className="pt-8 border-t border-[#D4AF37]/10">
                            <h3 className="text-2xl font-[family-name:var(--font-playfair)] text-[#1A1A1A] mb-6">Follow Our Journey</h3>
                            <div className="flex gap-4">
                                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-6 py-4 bg-[#1A1A1A] text-white rounded-sm hover:bg-[#D4AF37] hover:text-[#1A1A1A] transition-all duration-300 group shadow-lg shadow-black/5">
                                    <Instagram size={20} className="group-hover:scale-110 transition-transform" />
                                    <span className="font-[family-name:var(--font-montserrat)] text-xs font-bold uppercase tracking-[0.2em]">Instagram</span>
                                </a>
                                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-6 py-4 bg-transparent border border-[#1A1A1A] text-[#1A1A1A] rounded-sm hover:bg-[#1A1A1A] hover:text-white transition-all duration-300 group">
                                    <Facebook size={20} className="group-hover:scale-110 transition-transform" />
                                    <span className="font-[family-name:var(--font-montserrat)] text-xs font-bold uppercase tracking-[0.2em]">Facebook</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Image / Map Placeholder */}
                    <div className="relative h-[600px] bg-gray-100 rounded-sm overflow-hidden border border-gold/20">
                        <img
                            src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=1200&auto=format&fit=crop"
                            alt="Boutique Interior"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-8">
                            <p className="text-white font-heading text-2xl">Visit The Srivari Boutique</p>
                        </div>
                    </div>

                </div>
            </section>

            <Footer />
            <WAButton />
        </main>
    );
}
