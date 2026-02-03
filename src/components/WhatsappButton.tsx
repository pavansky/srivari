"use client";

import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function WhatsAppButton() {
    const phoneNumber = "919876543210"; // Replace with actual number
    const defaultMessage = "Hi Srivari Team, I'm interested in your exclusive saree collection.";

    const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
        defaultMessage
    )}`;

    return (
        <motion.a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-[999] group"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
        >
            <div className="relative flex items-center justify-center w-14 h-14 bg-[#25D366] rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_16px_rgba(37,211,102,0.4)] transition-all">
                <MessageCircle size={32} color="white" fill="white" />

                {/* Pulse Effect */}
                <span className="absolute inset-0 rounded-full border-2 border-[#25D366] animate-ping opacity-75"></span>

                {/* Tooltip */}
                <span className="absolute right-full mr-4 bg-white text-[#4A0404] px-3 py-1 rounded shadow-md text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Order on WhatsApp
                </span>
            </div>
        </motion.a>
    );
}
