"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Mail, Phone, MapPin, Instagram, Facebook } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";

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
                            <div className="flex items-start gap-4 p-6 bg-white border border-gold/10 rounded-sm shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-3 bg-obsidian text-gold rounded-full">
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-1">Phone & WhatsApp</h3>
                                    <p className="text-obsidian/80 font-sans">+91 97399 88771</p>
                                    <p className="text-sm text-gray-500 mt-1">Mon - Sat, 10:00 AM - 7:00 PM</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-6 bg-white border border-gold/10 rounded-sm shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-3 bg-obsidian text-gold rounded-full">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-1">Email</h3>
                                    <p className="text-obsidian/80 font-sans">support@thesrivari.com</p>
                                    <p className="text-sm text-gray-500 mt-1">We usually reply within 24 hours.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-6 bg-white border border-gold/10 rounded-sm shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-3 bg-obsidian text-gold rounded-full">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-1">Boutique</h3>
                                    <p className="text-obsidian/80 font-sans">
                                        123, Heritage Lane, Indiranagar<br />
                                        Bangalore, Karnataka - 560038
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Social Media */}
                        <div className="pt-8 border-t border-gray-200">
                            <h3 className="text-2xl font-heading text-maroon mb-6">Follow Our Journey</h3>
                            <div className="flex gap-4">
                                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-6 py-3 bg-gradient-to-tr from-purple-600 to-pink-500 text-white rounded hover:opacity-90 transition-opacity">
                                    <Instagram size={24} />
                                    <span className="font-bold tracking-wider">Instagram</span>
                                </a>
                                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-6 py-3 bg-[#1877F2] text-white rounded hover:opacity-90 transition-opacity">
                                    <Facebook size={24} />
                                    <span className="font-bold tracking-wider">Facebook</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Image / Map Placeholder */}
                    <div className="relative h-[600px] bg-gray-100 rounded-sm overflow-hidden border border-gold/20">
                        <img
                            src="https://images.unsplash.com/photo-1566244662768-b80c102a9009?q=80&w=1200&auto=format&fit=crop"
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
            <WhatsAppButton />
        </main>
    );
}
