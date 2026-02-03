"use client";

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AboutPage() {
    return (
        <main className="bg-[#FDFBF7] text-obsidian font-serif">
            <Navbar />

            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-obsidian text-marble">
                <div className="absolute inset-0 opacity-40">
                    <img
                        src="https://images.unsplash.com/photo-1576487248805-cf45f6bcc67f?q=80&w=1920&auto=format&fit=crop"
                        alt="Weaving Loom"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="container relative z-10 text-center px-4">
                    <h1 className="text-5xl md:text-7xl font-heading mb-4 text-gold">Our Heritage</h1>
                    <p className="text-xl md:text-2xl max-w-2xl mx-auto font-light tracking-wide text-marble/90">
                        Preserving the timeless art of Indian handlooms since 1980.
                    </p>
                </div>
            </section>

            {/* Story Section */}
            <section className="container mx-auto px-6 py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-6 text-lg text-obsidian/80 leading-relaxed font-sans">
                        <h2 className="text-4xl font-heading text-maroon mb-6">The Srivari Legacy</h2>
                        <p>
                            Srivari's began as a humble endeavor in the heart of Bangalore, driven by a singular passion: to bring the finest handwoven silks to connoisseurs of Indian tradition.
                            For over four decades, we have traveled to the remotest weaver villages in Kanchipuram and Varanasi, building relationships that go beyond business.
                        </p>
                        <p>
                            We believe that a saree is not just a garment, but a canvas of culture. Every thread tells a story of patience, skill, and ancestry.
                            Our collections are curated with a discerning eye for authenticity, ensuring that when you drape a Srivari saree, you are embracing a piece of history.
                        </p>
                    </div>
                    <div className="relative p-4">
                        <div className="absolute inset-0 border-2 border-gold translate-x-4 translate-y-4 -z-10 rounded-sm"></div>
                        <img
                            src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop"
                            alt="Saree Detail"
                            className="w-full h-auto shadow-lg rounded-sm"
                        />
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="bg-white py-24 border-t border-b border-gold/20">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-4xl font-heading text-maroon mb-16">Our Values</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-8 bg-[#FDFBF7] border border-gold/20 rounded hover:shadow-xl transition-shadow duration-300">
                            <h3 className="text-2xl font-serif text-obsidian mb-4">Authenticity</h3>
                            <p className="text-obsidian/70">Silk Mark certified pure silks, sourced directly from master weavers.</p>
                        </div>
                        <div className="p-8 bg-[#FDFBF7] border border-gold/20 rounded hover:shadow-xl transition-shadow duration-300">
                            <h3 className="text-2xl font-serif text-obsidian mb-4">Craftsmanship</h3>
                            <p className="text-obsidian/70">Celebrating the intricate art of handloom weaving and zari work.</p>
                        </div>
                        <div className="p-8 bg-[#FDFBF7] border border-gold/20 rounded hover:shadow-xl transition-shadow duration-300">
                            <h3 className="text-2xl font-serif text-obsidian mb-4">Elegance</h3>
                            <p className="text-obsidian/70">Designs that blend traditional grandeur with modern aesthetics.</p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
