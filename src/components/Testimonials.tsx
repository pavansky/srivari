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
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="py-20 bg-[#FDFBF7] relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-[#D4AF37]/20 rounded-tl-3xl m-10" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-[#D4AF37]/20 rounded-br-3xl m-10" />

            <div className="container mx-auto px-4 text-center relative z-10">
                <h2 className="text-3xl md:text-4xl font-heading text-[#4A0404] mb-12">
                    Royal Patrons
                </h2>

                <div className="max-w-4xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={current}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.5 }}
                            className="bg-white p-10 md:p-14 shadow-xl border border-[#D4AF37]/30 rounded-lg relative"
                        >
                            <Quote className="absolute top-6 left-6 text-[#D4AF37]/20 rotate-180" size={64} />

                            <p className="text-lg md:text-xl text-[#595959] italic font-serif leading-relaxed mb-8 relative z-10">
                                "{testimonials[current].text}"
                            </p>

                            <div className="flex flex-col items-center gap-2">
                                <div className="flex gap-1 mb-2">
                                    {[...Array(testimonials[current].rating)].map((_, i) => (
                                        <span key={i} className="text-[#B8860B] text-lg">★</span>
                                    ))}
                                </div>
                                <h4 className="font-heading text-xl text-[#4A0404]">{testimonials[current].name}</h4>
                                <span className="text-sm font-sans tracking-widest uppercase text-[#D4AF37]">{testimonials[current].role}</span>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Indicators */}
                    <div className="flex justify-center gap-3 mt-8">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrent(index)}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${current === index ? "bg-[#4A0404] w-8" : "bg-[#D4AF37]/40"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
