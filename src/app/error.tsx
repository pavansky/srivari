'use client';

import { useEffect } from 'react';

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
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-6">
                <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-serif text-[#D4AF37] mb-3">
                Something went wrong
            </h2>
            <p className="text-marble/60 max-w-md mb-8 leading-relaxed">
                We encountered an unexpected error. Our artisans have been notified and are weaving a fix.
            </p>
            <div className="flex gap-4">
                <button
                    onClick={reset}
                    className="px-6 py-3 bg-[#D4AF37] text-[#0a0a0a] font-semibold rounded-lg hover:bg-[#C5A028] transition-colors"
                >
                    Try Again
                </button>
                <a
                    href="/"
                    className="px-6 py-3 border border-[#D4AF37]/30 text-[#D4AF37] font-semibold rounded-lg hover:bg-[#D4AF37]/10 transition-colors"
                >
                    Go Home
                </a>
            </div>
        </div>
    );
}
