import Link from "next/link";
import ZariDivider from "@/components/ui/ZariDivider";

/**
 * Route-level 404 for a missing product.
 *
 * The root not-found is obsidian, which is right for arbitrary URLs — but the
 * Navbar styles itself for a light surface on /product/*, so the shared 404
 * would render dark-on-dark chrome here. This cream variant keeps the maison
 * language while matching the navbar treatment this route already uses.
 */
export default function ProductNotFound() {
    return (
        <main className="bg-[#FDFBF7] min-h-[85vh] flex flex-col items-center justify-center text-center px-6 pt-36 pb-28">
            <div className="w-28 h-28 md:w-32 md:h-32 flex items-center justify-center border border-[#4A0404]/25 mb-12">
                <span className="font-serif text-4xl md:text-5xl leading-none text-[#4A0404]">404</span>
            </div>

            <h1 className="max-w-2xl">
                <span className="kicker kicker--plain mb-6 !text-[#C8AA6E]">Piece Not Found</span>
                <span className="block font-serif text-4xl md:text-6xl leading-[1.05] tracking-tight text-[#1A1A1A]">
                    This piece has left the <em className="italic text-[#4A0404]">atelier</em>
                </span>
            </h1>

            <p className="text-[#595959] max-w-md mt-8 leading-relaxed text-sm font-sans">
                The saree you are looking for is no longer in our collection — perhaps claimed by
                another admirer. Our looms are always at work; something new awaits.
            </p>

            <ZariDivider tone="light" className="w-full max-w-md my-14" />

            <div className="flex flex-col sm:flex-row items-center gap-8">
                <Link href="/shop" className="btn-royal btn-royal--oxblood">
                    Browse the Collection
                </Link>
                <Link href="/" className="btn-thread text-[#4A0404]">
                    Return Home
                </Link>
            </div>
        </main>
    );
}
