"use client";

import { motion } from "framer-motion";
import { SITE_CONFIG } from "@/config/site";

export default function WAButton() {
    const whatsappLink = SITE_CONFIG.links.whatsapp("Hi Srivari Team, I'm interested in your exclusive saree collection.");

    return (
        <motion.a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 lg:bottom-10 right-6 lg:right-10 z-[70] group"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
        >
            <div className="relative flex items-center justify-center w-14 h-14 bg-[#25D366] rounded-full shadow-[0_8px_30px_rgba(37,211,102,0.3)] hover:shadow-[0_12px_40px_rgba(37,211,102,0.5)] transition-all">
                {/* SVG WhatsApp Logo */}
                <svg
                    viewBox="0 0 24 24"
                    width="32"
                    height="32"
                    fill="white"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.41 0 12.046c0 2.121.54 4.191 1.57 6.056L0 24l6.105-1.602a11.834 11.834 0 005.937 1.604h.005c6.637 0 12.048-5.414 12.052-12.05a11.82 11.82 0 00-3.483-8.42z" />
                </svg>

                {/* Pulse Effect */}
                <div className="absolute inset-0 rounded-full border-4 border-[#25D366] animate-ping opacity-20"></div>

                {/* Tooltip */}
                <span className="absolute right-full mr-4 bg-white text-[#4A0404] px-4 py-2 rounded-xl shadow-xl text-xs font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none transform translate-x-2 group-hover:translate-x-0 border border-[#D4AF37]/10 uppercase tracking-widest">
                    Concierge Connect
                </span>
            </div>
        </motion.a>
    );
}
