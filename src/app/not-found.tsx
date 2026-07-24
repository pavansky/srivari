import Link from "next/link";
import ZariDivider from "@/components/ui/ZariDivider";

export default function NotFound() {
    return (
        <div className="texture-silk bg-obsidian min-h-[85vh] flex flex-col items-center justify-center text-center px-6 pt-36 pb-28">
            {/* Square hairline plate — the house treatment for a lone mark */}
            <div className="w-28 h-28 md:w-32 md:h-32 flex items-center justify-center border border-[#D4AF37]/35 mb-12">
                <span className="font-serif text-4xl md:text-5xl leading-none text-[#D4AF37]">404</span>
            </div>

            <h1 className="max-w-2xl">
                <span className="kicker kicker--plain mb-6">Page Not Found</span>
                <span className="block font-serif text-4xl md:text-6xl leading-[1.05] tracking-tight text-marble">
                    This thread leads <em className="italic text-[#D4AF37]">nowhere</em>
                </span>
            </h1>

            <p className="text-marble/50 max-w-md mt-8 leading-relaxed text-sm font-sans">
                The page you are looking for has been moved, removed, or perhaps never existed.
                Like a rare saree, some things are meant to be discovered elsewhere.
            </p>

            <ZariDivider tone="dark" className="w-full max-w-md my-14" />

            <div className="flex flex-col sm:flex-row items-center gap-8">
                <Link href="/" className="btn-royal">
                    Return Home
                </Link>
                <Link href="/shop" className="btn-thread text-[#D4AF37]">
                    Browse Shop
                </Link>
            </div>
        </div>
    );
}
