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
            {/* Main Image - Art Frame Style with cursor-follow zoom */}
            <div
                ref={frameRef}
                onMouseEnter={() => setIsZooming(true)}
                onMouseLeave={() => setIsZooming(false)}
                onMouseMove={handleMouseMove}
                className="relative aspect-[3/4] w-full bg-[#f0eee6] overflow-hidden group cursor-zoom-in"
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

                {/* Minimalist Badge */}
                <div className="absolute top-0 left-0 p-6 z-10 pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-sm px-4 py-2 border border-[#D4AF37]/20 shadow-sm">
                        <span className="text-[#1A1A1A] text-[10px] font-sans uppercase tracking-[0.25em] font-bold">
                            {category}
                        </span>
                    </div>
                </div>

                {/* AI Try-On Overlay Button */}
                <Link
                    href={`/try-on?product=${encodeURIComponent(activeImage)}`}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-[#D4AF37]/30 text-[#4A0404] hover:bg-[#4A0404] hover:text-white transition-all duration-300 group/tryon"
                >
                    <Sparkles size={16} className="text-[#D4AF37] group-hover/tryon:text-white transition-colors" />
                    <span className="text-xs font-bold font-sans uppercase tracking-widest">
                        Virtual Try-On
                    </span>
                </Link>
            </div>

            {/* Gallery Strip */}
            {validImages.length > 0 && (
                <div className="flex items-center gap-4 py-2 border-t border-[#D4AF37]/10">
                    <span className="text-[10px] font-sans uppercase tracking-widest text-neutral-400">Gallery</span>
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                        {validImages.map((img, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveImage(img)}
                                className={`relative w-16 h-20 flex-shrink-0 transition-opacity duration-300
                                    ${activeImage === img ? "opacity-100 ring-1 ring-[#D4AF37]" : "opacity-40 hover:opacity-80"}
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
