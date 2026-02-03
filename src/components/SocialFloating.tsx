"use client";

import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export const SocialFloating = () => {
    return (
        <motion.a
            href="https://wa.me/919739988771"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2, duration: 0.5, type: "spring" }}
            className="fixed bottom-6 right-6 z-50 p-4 bg-gold rounded-full shadow-lg shadow-gold/20 hover:scale-110 transition-transform cursor-pointer flex items-center justify-center"
        >
            <MessageCircle className="w-6 h-6 text-obsidian" />
        </motion.a>
    );
};
