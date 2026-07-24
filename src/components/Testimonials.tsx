"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote } from "lucide-react";

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
        <section className="py-24 md:py-32 bg-obsidian relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-32 h-32 border-t border-l border-gold/20 rounded-tl-3xl m-6 md:m-10" aria-hidden="true" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-b border-r border-gold/20 rounded-br-3xl m-6 md:m-10" aria-hidden="true" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />

            <div className="container mx-auto px-6 text-center relative z-10">
                <span className="text-gold uppercase tracking-[0.3em] text-xs md:text-sm">Voices of Our Patrons</span>
                <h2 className="text-4xl md:text-5xl font-serif text-marble mt-4 mb-14">
                    Royal Patrons
                </h2>

                <div className="max-w-3xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.figure
                            key={current}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="glass-card p-10 md:p-14 rounded-lg relative"
                        >
                            <Quote className="absolute top-6 left-6 text-gold/15 rotate-180" size={64} aria-hidden="true" />

                            <blockquote className="text-lg md:text-xl text-marble/80 italic font-serif leading-relaxed mb-8 relative z-10">
                                &ldquo;{testimonials[current].text}&rdquo;
                            </blockquote>

                            <figcaption className="flex flex-col items-center gap-1">
                                <div className="flex gap-1 mb-2" aria-label={`Rated ${testimonials[current].rating} out of 5 stars`}>
                                    {[...Array(testimonials[current].rating)].map((_, i) => (
                                        <span key={i} className="text-gold text-lg" aria-hidden="true">★</span>
                                    ))}
                                </div>
                                <span className="font-serif text-xl text-marble">{testimonials[current].name}</span>
                                <span className="text-xs font-sans tracking-[0.25em] uppercase text-gold">{testimonials[current].role}</span>
                            </figcaption>
                        </motion.figure>
                    </AnimatePresence>

                    {/* Indicators */}
                    <div className="flex justify-center gap-3 mt-10">
                        {testimonials.map((t, index) => (
                            <button
                                key={t.id}
                                onClick={() => setCurrent(index)}
                                aria-label={`Show testimonial from ${t.name}`}
                                aria-current={current === index}
                                className={`h-2 rounded-full transition-all duration-300 ${current === index ? "bg-gold w-8" : "bg-gold/30 w-2 hover:bg-gold/60"}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
