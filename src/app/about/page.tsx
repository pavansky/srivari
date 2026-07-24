"use client";

import Link from 'next/link';
import Footer from '@/components/Footer';
import SrivariImage from '@/components/SrivariImage';
import SectionHeader from '@/components/ui/SectionHeader';
import ZariDivider from '@/components/ui/ZariDivider';

const VALUES = [
    {
        numeral: "I",
        title: "Authenticity",
        text: "Silk Mark certified pure silks, sourced directly from master weavers.",
    },
    {
        numeral: "II",
        title: "Craftsmanship",
        text: "Celebrating the intricate art of handloom weaving and zari work.",
    },
    {
        numeral: "III",
        title: "Elegance",
        text: "Designs that blend traditional grandeur with modern aesthetics.",
    },
];

export default function AboutPage() {
    return (
        <main className="bg-[#FDFBF7] text-[#1A1A1A] font-sans">
            <h1 className="sr-only">The Srivari Heritage</h1>

            {/* Hero Section */}
            <section className="texture-silk relative overflow-hidden bg-obsidian text-marble px-6 pt-40 md:pt-48 pb-24 md:pb-28">
                <div className="absolute inset-0 opacity-30">
                    <SrivariImage
                        src="/tirumala-temple.png"
                        alt="Tirumala Venkateswara Temple - The Golden Gopuram of Lord Srivaru"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/75 to-obsidian/50"></div>

                <div className="relative z-10 max-w-6xl mx-auto">
                    <SectionHeader
                        tone="dark"
                        kicker="Est. 1980 · Bangalore"
                        title="Our Heritage"
                        accent="Heritage"
                    />
                    <p className="mt-10 max-w-xl font-serif italic text-xl md:text-2xl text-marble/70 leading-relaxed">
                        Preserving the timeless art of Indian handlooms since 1980.
                    </p>
                </div>

                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent"
                />
            </section>

            {/* Story Section */}
            <section className="px-6 py-24 md:py-32">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-20 items-center">
                    <div>
                        <SectionHeader
                            tone="light"
                            kicker="Four Decades of Devotion"
                            title="The Srivari Legacy"
                            accent="Legacy"
                        />
                        <div className="mt-10 space-y-6 max-w-2xl font-serif text-lg md:text-xl leading-relaxed text-[#3A3A3A]">
                            <p>
                                Srivari's began as a humble endeavor in the heart of Bangalore, driven by a singular passion: to bring the finest handwoven silks to connoisseurs of Indian tradition.
                                For over four decades, we have traveled to the remotest weaver villages in Kanchipuram and Varanasi, building relationships that go beyond business.
                            </p>
                            <p>
                                We believe that a saree is not just a garment, but a canvas of culture. Every thread tells a story of patience, skill, and ancestry.
                                Our collections are curated with a discerning eye for authenticity, ensuring that when you drape a Srivari saree, you are embracing a piece of history.
                            </p>
                        </div>

                        <div className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-6">
                            <Link href="/shop" className="btn-royal btn-royal--oxblood">
                                Explore the Collection
                            </Link>
                            <Link href="/contact" className="btn-thread font-sans text-[#4A0404]">
                                Speak with the House
                            </Link>
                        </div>
                    </div>

                    <div className="group relative">
                        {/* Image Container with Vignette/Blend Effect */}
                        <div className="zari-frame relative aspect-[3/4] overflow-hidden border border-black/10">
                            <img
                                src="/srivari-legacy.png"
                                alt="The Srivari Legacy"
                                className="absolute inset-0 w-full h-full object-cover object-top"
                            />
                            {/* Inset shadow to blend edges into the #FDFBF7 background */}
                            <div className="absolute inset-0 shadow-[inset_0_0_100px_40px_#FDFBF7] pointer-events-none"></div>
                            {/* Additional gradient for smoother integration */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7]/80 via-transparent to-transparent pointer-events-none"></div>
                        </div>
                    </div>
                </div>
            </section>

            <ZariDivider tone="light" className="px-6" />

            {/* Values Section */}
            <section className="bg-[#F9F5F0] px-6 py-24 md:py-28">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader
                        tone="light"
                        align="center"
                        kicker="What We Hold To"
                        title="Our Values"
                        accent="Values"
                    />

                    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-px bg-[#D4AF37]/25">
                        {VALUES.map((value) => (
                            <div key={value.numeral} className="group relative bg-[#FDFBF7] p-10 md:p-12">
                                <div className="zari-frame absolute inset-0" aria-hidden="true"></div>
                                <span className="block font-serif text-2xl text-[#D4AF37] mb-6">{value.numeral}</span>
                                <h3 className="font-serif text-2xl text-[#1A1A1A] mb-4">{value.title}</h3>
                                <p className="font-serif text-[#3A3A3A] leading-relaxed">{value.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
