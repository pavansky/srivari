"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionHeader from "@/components/ui/SectionHeader";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const testimonials = [
    {
        id: 1,
        name: "Priya Sundaram",
        role: "Bangalore",
        text: "The Kanjivaram I bought for my daughter's wedding was absolutely divine. The sheen, the texture, everything spoke of royalty. Srivari is now our family's go-to for silks.",
        rating: 5,
    },
    {
        id: 2,
        name: "Anjali Mehta",
        role: "Mumbai",
        text: "I was hesitant to buy silk online, but the video call service and the transparency of Srivari changed my mind. The saree looks even more beautiful in person!",
        rating: 5,
    },
    {
        id: 3,
        name: "Lakshmi Narayan",
        role: "Chennai",
        text: "Authentic weaves and such intricate designs. It feels like wearing a piece of art. Highly recommended for anyone looking for genuine handlooms.",
        rating: 5,
    },
];

export default function Testimonials() {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % testimonials.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="texture-silk py-28 md:py-32 bg-obsidian relative overflow-hidden">
            {/* Background Decor — square hairline corners */}
            <div className="absolute top-0 left-0 w-32 h-32 border-t border-l border-gold/20 m-6 md:m-10" aria-hidden="true" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-b border-r border-gold/20 m-6 md:m-10" aria-hidden="true" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />

            <div className="container mx-auto px-6 relative z-10">
                <SectionHeader
                    kicker="VOICES OF OUR PATRONS"
                    title="Royal Patrons"
                    accent="Patrons"
                    tone="dark"
                    align="center"
                    className="mb-16 md:mb-20"
                />

                <div className="max-w-3xl mx-auto text-center">
                    <AnimatePresence mode="wait">
                        <motion.figure
                            key={current}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.8, ease: EASE }}
                            className="relative px-2 md:px-10"
                        >
                            {/* Grand decorative quotation mark behind the words */}
                            <span
                                aria-hidden="true"
                                className="absolute -top-16 md:-top-20 left-1/2 -translate-x-1/2 font-serif text-[10rem] md:text-[14rem] leading-none text-gold/10 select-none pointer-events-none"
                            >
                                &ldquo;
                            </span>

                            <blockquote className="relative z-10 font-serif italic text-2xl md:text-3xl text-marble/90 leading-snug md:leading-[1.35]">
                                &ldquo;{testimonials[current].text}&rdquo;
                            </blockquote>

                            <figcaption className="relative z-10 mt-10 flex flex-col items-center gap-4">
                                <span
                                    aria-hidden="true"
                                    className="w-11 h-11 border border-gold/40 flex items-center justify-center font-serif text-xl text-gold"
                                >
                                    {testimonials[current].name.charAt(0)}
                                </span>
                                <div>
                                    <span className="block text-[11px] font-sans uppercase tracking-[0.3em] text-marble">
                                        {testimonials[current].name}
                                    </span>
                                    <span className="block mt-2 text-[9px] font-sans uppercase tracking-[0.35em] text-gold/80">
                                        {testimonials[current].role}
                                    </span>
                                </div>
                                <div
                                    className="flex gap-1.5 text-gold/80 text-sm"
                                    aria-label={`Rated ${testimonials[current].rating} out of 5 stars`}
                                >
                                    {[...Array(testimonials[current].rating)].map((_, i) => (
                                        <span key={i} aria-hidden="true">★</span>
                                    ))}
                                </div>
                            </figcaption>
                        </motion.figure>
                    </AnimatePresence>

                    {/* Progress threads */}
                    <div className="flex justify-center gap-2 mt-14">
                        {testimonials.map((t, index) => (
                            <button
                                key={t.id}
                                onClick={() => setCurrent(index)}
                                aria-label={`Show testimonial from ${t.name}`}
                                aria-current={current === index}
                                className="group px-1 py-2.5"
                            >
                                <span
                                    className={`block h-px w-10 transition-colors duration-500 ${current === index ? "bg-gold" : "bg-gold/25 group-hover:bg-gold/60"}`}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
