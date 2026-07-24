"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import SrivariImage from "@/components/SrivariImage";
import { Sparkles } from "lucide-react";

interface ProductGalleryProps {
    name: string;
    category: string;
    images: string[];
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=1000&auto=format&fit=crop";

export default function ProductGallery({ name, category, images }: ProductGalleryProps) {
    const validImages = images.filter((img) => img && img.trim() !== "");
    const [activeImage, setActiveImage] = useState(validImages[0] || FALLBACK_IMAGE);
    const [isZooming, setIsZooming] = useState(false);
    const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
    const frameRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const frame = frameRef.current;
        if (!frame) return;
        const rect = frame.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setZoomOrigin(`${Math.min(100, Math.max(0, x))}% ${Math.min(100, Math.max(0, y))}%`);
    };

    return (
        <div className="sticky top-32 space-y-8">
            {/* Main image — museum frame with an always-on zari border and cursor-follow zoom */}
            <div
                ref={frameRef}
                onMouseEnter={() => setIsZooming(true)}
                onMouseLeave={() => setIsZooming(false)}
                onMouseMove={handleMouseMove}
                className="relative aspect-[3/4] w-full bg-[#F3EEE5] overflow-hidden cursor-zoom-in"
            >
                <div
                    className="absolute inset-0 transition-transform duration-300 ease-out will-change-transform"
                    style={{
                        transformOrigin: zoomOrigin,
                        transform: isZooming ? "scale(1.75)" : "scale(1)",
                    }}
                >
                    <SrivariImage
                        src={activeImage}
                        alt={name}
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 58vw"
                        className="object-cover"
                    />
                </div>

                {/* Always-on zari frame — fine double gold inset */}
                <div className="absolute inset-[10px] border border-[#D4AF37]/45 pointer-events-none z-10" aria-hidden="true" />
                <div className="absolute inset-4 border border-[#D4AF37]/20 pointer-events-none z-10" aria-hidden="true" />

                {/* Category — quiet micro-label on obsidian silk */}
                <div className="absolute top-0 left-0 p-7 z-20 pointer-events-none">
                    <div className="bg-[#0A0A0A]/75 backdrop-blur-sm px-4 py-2 border border-[#D4AF37]/30">
                        <span className="text-[#D4AF37] text-[9px] font-sans uppercase tracking-[0.35em]">
                            {category}
                        </span>
                    </div>
                </div>

                {/* AI Try-On overlay */}
                <Link
                    href={`/try-on?product=${encodeURIComponent(activeImage)}`}
                    className="absolute bottom-7 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 bg-[#0A0A0A]/80 backdrop-blur-md px-6 py-3 border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37] hover:border-[#D4AF37] hover:text-[#0A0A0A] transition-colors duration-500 whitespace-nowrap"
                >
                    <Sparkles size={14} className="transition-colors" aria-hidden="true" />
                    <span className="text-[10px] font-sans uppercase tracking-[0.3em]">
                        Virtual Try-On
                    </span>
                </Link>
            </div>

            {/* Gallery strip */}
            {validImages.length > 0 && (
                <div className="flex items-center gap-5 py-2 border-t border-black/10">
                    <span className="text-[9px] font-sans uppercase tracking-[0.35em] text-neutral-400">Gallery</span>
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                        {validImages.map((img, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveImage(img)}
                                className={`relative w-16 h-20 flex-shrink-0 border transition-all duration-300
                                    ${activeImage === img ? "border-[#4A0404] opacity-100" : "border-black/10 opacity-40 hover:opacity-80"}
                                `}
                                aria-label={`View gallery image ${i + 1} of ${name}`}
                            >
                                <SrivariImage src={img} alt={`${name} view ${i + 1}`} fill sizes="64px" className="object-cover" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
