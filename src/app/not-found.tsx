import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
            <div className="w-20 h-20 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-6">
                <span className="text-4xl font-serif text-[#D4AF37]">404</span>
            </div>
            <h1 className="text-3xl font-serif text-[#D4AF37] mb-3">
                Page Not Found
            </h1>
            <p className="text-marble/60 max-w-md mb-8 leading-relaxed">
                The page you are looking for has been moved, removed, or perhaps never existed.
                Like a rare saree, some things are meant to be discovered elsewhere.
            </p>
            <div className="flex gap-4">
                <Link
                    href="/"
                    className="px-6 py-3 bg-[#D4AF37] text-[#0a0a0a] font-semibold rounded-lg hover:bg-[#C5A028] transition-colors"
                >
                    Return Home
                </Link>
                <Link
                    href="/shop"
                    className="px-6 py-3 border border-[#D4AF37]/30 text-[#D4AF37] font-semibold rounded-lg hover:bg-[#D4AF37]/10 transition-colors"
                >
                    Browse Shop
                </Link>
            </div>
        </div>
    );
}
