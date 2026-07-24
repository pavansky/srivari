"use client";

import Image, { ImageProps } from "next/image";
import { useState, useEffect } from "react";

interface SrivariImageProps extends Omit<ImageProps, 'src'> {
    src: string | undefined | null;
    fallbackLabel?: string;
}

// Single source of truth lives in a server-safe module; re-exported here so
// client components can import it alongside the component.
import { isRenderableImageSrc } from "@/lib/image-src";
export { isRenderableImageSrc };

export default function SrivariImage({ src, alt, className, fallbackLabel = "The Srivari", ...props }: SrivariImageProps) {
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        setLoadError(false);
    }, [src]);

    if (!isRenderableImageSrc(src) || loadError) {
        // Branded fallback: obsidian silk tile with a fine zari frame and the
        // house monogram — at home on dark and light surfaces alike.
        return (
            <div className={`relative w-full h-full overflow-hidden bg-[#0d0c0a] ${className || ''}`} role="img" aria-label={typeof alt === 'string' ? alt : fallbackLabel}>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(212,175,55,0.12),transparent_55%),radial-gradient(ellipse_at_75%_85%,rgba(74,4,4,0.35),transparent_60%)]" />
                <div className="absolute inset-3 border border-[#D4AF37]/25" />
                <div className="absolute inset-[15px] border border-[#D4AF37]/10" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
                    <span className="font-serif text-4xl md:text-5xl text-[#D4AF37]/70 leading-none">S</span>
                    <span className="h-px w-8 bg-[#D4AF37]/40" />
                    <span className="text-[#F5F5F5]/60 font-sans text-[9px] md:text-[10px] tracking-[0.35em] uppercase">
                        {fallbackLabel}
                    </span>
                </div>
            </div>
        );
    }

    // A simple, elegant solid color #F9F5F0 placeholder encoded in base64
    const shimmer = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDBwJSIgaGVpZ2h0PSIxMDBwJSI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y5ZjVmMCIvPjwvc3ZnPg==`;

    return (
        <Image
            {...props}
            src={src}
            alt={alt}
            className={className}
            onError={() => setLoadError(true)}
            placeholder="blur"
            blurDataURL={shimmer}
        />
    );
}
