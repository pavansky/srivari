"use client";

import Image, { ImageProps } from "next/image";
import { useState, useEffect } from "react";

interface SrivariImageProps extends Omit<ImageProps, 'src'> {
    src: string | undefined | null;
    fallbackLabel?: string;
}

export default function SrivariImage({ src, alt, className, fallbackLabel = "The Srivari", ...props }: SrivariImageProps) {
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        setLoadError(false);
    }, [src]);

    const handleError = () => {
        setLoadError(true);
    };

    const isInvalid = !src || src.trim() === "";

    if (isInvalid || loadError) {
        return (
            <div className={`relative w-full h-full bg-gray-200 overflow-hidden ${className || ''}`}>
                <Image
                    src="/srivari-flow.png"
                    alt="The Srivari Flow"
                    fill
                    className="object-cover opacity-80"
                    unoptimized
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <span className="text-white font-serif text-lg md:text-xl tracking-widest uppercase opacity-90 text-center px-4">
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
            onError={handleError}
            placeholder="blur"
            blurDataURL={shimmer}
        />
    );
}
