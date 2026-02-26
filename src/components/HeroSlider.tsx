"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import SrivariImage from "./SrivariImage";

const slides = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1920&auto=format&fit=crop",
        subtitle: "ESTD. 1980 — BANGALORE",
        title: "Draped in Legacies",
        description: "Experience the timeless elegance of handwoven Kanjivarams."
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1546872473-b4131df33a08?q=80&w=1920&auto=format&fit=crop", // Placeholder for actual silk saree image
        subtitle: "THE WEDDING COLLECTION",
        title: "Royal Beginnings",
        description: "Crafted for the most special day of your life."
    },
    {
        id: 3,
        image: "https://images.unsplash.com/photo-1601366533287-59b97dbacf29?q=80&w=1920&auto=format&fit=crop", // Placeholder
        subtitle: "FESTIVE EDITION",
        title: "Weave of Gold",
        description: "Shimmering antique zari work for the festive season."
    }
];

export default function HeroSlider() {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

    return (
        <div className="relative h-screen w-full overflow-hidden bg-black text-white">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0"
                >
                    {/* Background Image */}
                    <SrivariImage
                        src={slides[current].image}
                        alt={slides[current].title}
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 z-10" />
                </motion.div>
            </AnimatePresence>

            {/* Content */}
            <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
                <div className="max-w-4xl">
                    <motion.span
                        key={`sub-${current}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="block text-[#D4AF37] tracking-[0.3em] uppercase text-sm md:text-base font-sans mb-4"
                    >
                        {slides[current].subtitle}
                    </motion.span>

                    <motion.h1
                        key={`title-${current}`}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.8 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-serif mb-6 leading-tight text-white drop-shadow-lg"
                    >
                        {slides[current].title}
                    </motion.h1>

                    <motion.p
                        key={`desc-${current}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        className="text-lg md:text-xl text-white/90 font-serif italic mb-10 max-w-2xl mx-auto"
                    >
                        {slides[current].description}
                    </motion.p>

                    <motion.div
                        key={`btn-${current}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, duration: 0.8 }}
                    >
                        <Link
                            href="/shop"
                            className="group inline-flex items-center gap-3 border border-[#D4AF37] px-8 py-4 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#4A0404] transition-all duration-300 uppercase tracking-widest text-sm font-bold"
                        >
                            Explore Collection
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-8 right-8 flex gap-4 z-20">
                <button
                    onClick={prevSlide}
                    className="p-3 border border-white/20 rounded-full hover:bg-white/10 hover:border-white transition-colors"
                    aria-label="Previous slide"
                >
                    <ChevronLeft className="text-white" size={24} />
                </button>
                <button
                    onClick={nextSlide}
                    className="p-3 border border-white/20 rounded-full hover:bg-white/10 hover:border-white transition-colors"
                    aria-label="Next slide"
                >
                    <ChevronRight className="text-white" size={24} />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full">
                <motion.div
                    key={current}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 6, ease: "linear" }}
                    className="h-full bg-[#D4AF37]"
                />
            </div>
        </div>
    );
}
