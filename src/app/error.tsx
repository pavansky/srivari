'use client';

import { useEffect } from 'react';
import ZariDivider from '@/components/ui/ZariDivider';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to monitoring service
        console.error('🚨 Page Error:', error);
        // TODO: Sentry.captureException(error);
    }, [error]);

    return (
        <div className="texture-silk bg-obsidian min-h-[85vh] flex flex-col items-center justify-center text-center px-6 pt-36 pb-28">
            {/* Square hairline monogram — the maison's mark, even in failure */}
            <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center border border-[#D4AF37]/35 mb-12">
                <span className="font-serif text-3xl md:text-4xl leading-none text-[#D4AF37]">S</span>
            </div>

            <span className="kicker kicker--plain mb-6">A Knot in the Weave</span>

            <h2 className="font-serif text-4xl md:text-6xl leading-[1.05] tracking-tight text-marble max-w-2xl">
                Something went <em className="italic text-[#D4AF37]">wrong</em>
            </h2>

            <p className="text-marble/50 max-w-md mt-8 leading-relaxed text-sm font-sans">
                We encountered an unexpected error. Our artisans have been notified and are weaving a fix.
            </p>

            <ZariDivider tone="dark" className="w-full max-w-md my-14" />

            <div className="flex flex-col sm:flex-row items-center gap-8">
                <button onClick={reset} className="btn-royal">
                    Try Again
                </button>
                <a href="/" className="btn-thread text-[#D4AF37]">
                    Go Home
                </a>
            </div>
        </div>
    );
}
