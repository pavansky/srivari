"use client";

import { motion } from "framer-motion";
import { useAudio } from "@/context/AudioContext";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function Hero() {
    const { playBell } = useAudio();

    const scrollToCollections = () => {
        const target =
            document.getElementById("collections") ||
            document.getElementById("featured-collections");
        target?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
            {/* Cinematic Background Video */}
            <video
                autoPlay
                loop
                muted
                playsInline
                poster="/og-image.png"
                className="absolute top-0 left-0 w-full h-full object-cover opacity-60 z-0"
            >
                <source src="/hero-video.mp4" type="video/mp4" />
            </video>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-black/30 z-10" />

            {/* Fine corner ornaments — a framed-portrait feel */}
            <div aria-hidden="true" className="absolute inset-6 z-10 pointer-events-none">
                <span className="absolute top-0 left-0 w-16 h-16 border-t border-l border-gold/30" />
                <span className="absolute top-0 right-0 w-16 h-16 border-t border-r border-gold/30" />
                <span className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-gold/30" />
                <span className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-gold/30" />
            </div>

            {/* Content */}
            <div
                className="relative z-20 flex flex-col items-center text-center gap-8 md:gap-10 max-w-5xl px-6"
                style={{ paddingBottom: "clamp(1rem, 4vh, 3rem)" }}
            >
                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 1.1, ease: EASE }}
                    className="kicker kicker--plain text-xs md:text-sm"
                    style={{ letterSpacing: "0.5em" }}
                >
                    Royalty Woven
                </motion.p>

                <motion.h1
                    initial={{ opacity: 0, y: 26 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 1.2, ease: EASE }}
                    className="font-serif font-light text-5xl sm:text-6xl md:text-8xl leading-[1.05] tracking-[0.08em] text-marble drop-shadow-2xl"
                >
                    THE SRIVARI
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.3, duration: 1.2, ease: EASE }}
                    className="font-serif italic text-lg md:text-2xl text-marble/70 leading-relaxed max-w-2xl"
                >
                    Handwoven silk sarees for the modern royalty — where every thread carries a legacy.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.7, duration: 1, ease: EASE }}
                    className="mt-2 md:mt-4"
                >
                    <button
                        onClick={() => { playBell(); scrollToCollections(); }}
                        className="btn-royal"
                    >
                        Explore the Collection
                    </button>
                </motion.div>
            </div>

            {/* Scroll cue — a single gold thread, breathing slowly */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.4, duration: 1.2, ease: EASE }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 cursor-pointer px-4 pt-4 pb-2"
                onClick={scrollToCollections}
                aria-hidden="true"
            >
                <span
                    className="block w-px h-12 bg-gradient-to-b from-gold/0 via-gold/70 to-gold/0 animate-pulse"
                    style={{ animationDuration: "3.2s" }}
                />
            </motion.div>
        </section>
    );
}
