"use client";

import { motion } from "framer-motion";
import { MagneticButton } from "./ui/MagneticButton";
import { ArrowDown } from "lucide-react";
import Link from "next/link";

export default function Hero() {
    return (
        <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
            {/* Cinematic Background Video */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover opacity-60 z-0"
            >
                <source src="/hero-video.mp4" type="video/mp4" />
            </video>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-black/30 z-10" />

            {/* Content */}
            <div className="relative z-20 text-center flex flex-col items-center gap-6 max-w-4xl px-6">
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="text-gold tracking-[0.3em] uppercase text-sm md:text-base font-medium"
                >
                    Anti-Gravity Luxury
                </motion.p>
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="text-5xl md:text-7xl lg:text-9xl font-serif text-marble font-light tracking-tighter"
                >
                    THE SRIVARI
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 1 }}
                    className="text-marble/80 text-lg md:text-xl font-light tracking-wide max-w-2xl"
                >
                    Where tradition meets weightlessness. Experience the ether of high fashion.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.5, duration: 0.8, type: "spring" }}
                    className="mt-8"
                >
                    <Link href="/shop">
                        <MagneticButton className="px-8 py-4 bg-gold text-obsidian font-semibold tracking-widest text-sm uppercase rounded-full hover:bg-white transition-colors">
                            Explore Collection
                        </MagneticButton>
                    </Link>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5, duration: 1 }}
                className="absolute bottom-10 z-20 animate-bounce"
            >
                <ArrowDown className="w-6 h-6 text-gold/80" />
            </motion.div>
        </section>
    );
}
