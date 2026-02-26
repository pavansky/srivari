"use client";

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SrivariImage from '@/components/SrivariImage';

export default function AboutPage() {
    return (
        <main className="bg-[#FDFBF7] text-[#1A1A1A] font-sans">
            <Navbar />

            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-obsidian text-marble">
                <div className="absolute inset-0 opacity-40">
                    <SrivariImage
                        src="https://images.unsplash.com/photo-1576487248805-cf45f6bcc67f?q=80&w=1920&auto=format&fit=crop"
                        alt="Weaving Loom"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
                <div className="container relative z-10 text-center px-4">
                    <h1 className="text-5xl md:text-7xl font-serif mb-4 text-[#D4AF37]">Our Heritage</h1>
                    <p className="text-xl md:text-2xl max-w-2xl mx-auto font-light tracking-wide text-white/90">
                        Preserving the timeless art of Indian handlooms since 1980.
                    </p>
                </div>
            </section>

            {/* Story Section */}
            <section className="container mx-auto px-6 py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-6 text-lg text-neutral-600 leading-relaxed font-sans font-light tracking-wide">
                        <h2 className="text-4xl font-serif text-[#4A0404] mb-6">The Srivari Legacy</h2>
                        <p>
                            Srivari's began as a humble endeavor in the heart of Bangalore, driven by a singular passion: to bring the finest handwoven silks to connoisseurs of Indian tradition.
                            For over four decades, we have traveled to the remotest weaver villages in Kanchipuram and Varanasi, building relationships that go beyond business.
                        </p>
                        <p>
                            We believe that a saree is not just a garment, but a canvas of culture. Every thread tells a story of patience, skill, and ancestry.
                            Our collections are curated with a discerning eye for authenticity, ensuring that when you drape a Srivari saree, you are embracing a piece of history.
                        </p>
                    </div>
                    <div className="relative">
                        {/* Image Container with Vignette/Blend Effect */}
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                            <img
                                src="/srivari-legacy.png"
                                alt="The Srivari Legacy"
                                className="w-full h-auto object-cover"
                            />
                            {/* Inset shadow to blend edges into the #FDFBF7 background */}
                            <div className="absolute inset-0 shadow-[inset_0_0_100px_40px_#FDFBF7] pointer-events-none"></div>
                            {/* Additional gradient for smoother integration */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7]/80 via-transparent to-transparent pointer-events-none"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="bg-white py-24 border-t border-b border-[#D4AF37]/20">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-4xl font-serif text-[#4A0404] mb-16">Our Values</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-10 bg-[#FDFBF7] border border-[#D4AF37]/20 rounded-xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300">
                            <h3 className="text-2xl font-serif text-[#1A1A1A] mb-4">Authenticity</h3>
                            <p className="text-neutral-500 font-light leading-relaxed">Silk Mark certified pure silks, sourced directly from master weavers.</p>
                        </div>
                        <div className="p-10 bg-[#FDFBF7] border border-[#D4AF37]/20 rounded-xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300">
                            <h3 className="text-2xl font-serif text-[#1A1A1A] mb-4">Craftsmanship</h3>
                            <p className="text-neutral-500 font-light leading-relaxed">Celebrating the intricate art of handloom weaving and zari work.</p>
                        </div>
                        <div className="p-10 bg-[#FDFBF7] border border-[#D4AF37]/20 rounded-xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300">
                            <h3 className="text-2xl font-serif text-[#1A1A1A] mb-4">Elegance</h3>
                            <p className="text-neutral-500 font-light leading-relaxed">Designs that blend traditional grandeur with modern aesthetics.</p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
