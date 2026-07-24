import Link from 'next/link';
import { Metadata } from 'next';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import SrivariImage from '@/components/SrivariImage';
import SectionHeader from '@/components/ui/SectionHeader';
import ZariDivider from '@/components/ui/ZariDivider';
import { HOME_CATEGORIES } from '@/components/home/CategoryTiles';
import { getProducts, toPublicProduct } from '@/lib/db';
import { isRenderableImageSrc } from '@/lib/image-src';
import { Product } from '@/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "Saree Collections | Kanjivaram, Banarasi, Silk & More",
    description: "Explore The Srivari's complete range of authentic Indian sarees. From Kanjivaram silks to Banarasi brocades, find the perfect saree for every occasion — weddings, festivals, and celebrations.",
    alternates: { canonical: "/collections" },
    openGraph: {
        title: "Saree Collections | The Srivari",
        description: "Browse our complete range of authentic Kanjivaram, Banarasi, and handloom silk sarees.",
        url: "https://thesrivari.com/collections",
    },
};

interface CategoryGroup {
    name: string;
    blurb: string;
    products: Product[];
    image: string | null;
}

function firstImage(p: Product): string | null {
    return p.images?.find(isRenderableImageSrc) || null;
}

/** Group products into curated categories: the known five first, then anything else in the catalogue. */
function groupByCategory(products: Product[]): CategoryGroup[] {
    const claimed = new Set<string>();
    const groups: CategoryGroup[] = [];

    for (const cat of HOME_CATEGORIES) {
        const matches = products.filter(p => {
            const a = (p.category || "").trim().toLowerCase();
            const b = cat.name.toLowerCase();
            return a === b || a.includes(b) || b.includes(a);
        });
        matches.forEach(p => claimed.add(p.id));
        groups.push({
            name: cat.name,
            blurb: cat.blurb,
            products: matches,
            image: null,
        });
    }

    // Any remaining categories present in the catalogue but outside the curated five
    const rest = products.filter(p => !claimed.has(p.id) && p.category?.trim());
    const extraNames = Array.from(new Set(rest.map(p => p.category.trim())));
    for (const name of extraNames) {
        groups.push({
            name,
            blurb: "A limited edit of rare weaves, curated by The Srivari atelier.",
            products: rest.filter(p => p.category.trim() === name),
            image: null,
        });
    }

    // Pick a representative image per group (prefer featured pieces)
    for (const g of groups) {
        const featured = g.products.find(p => p.isFeatured && firstImage(p));
        const any = g.products.find(p => firstImage(p));
        g.image = featured ? firstImage(featured) : any ? firstImage(any) : null;
    }

    // Groups with products first, empty curated categories last
    return groups.sort((a, b) => Number(b.products.length > 0) - Number(a.products.length > 0));
}

export default async function Collections() {
    // Sanitized: cost/supplier fields must never reach the client RSC payload
    const products: Product[] = (await getProducts()).map(toPublicProduct) as Product[];
    const groups = groupByCategory(products).filter(g => g.products.length > 0);
    const featured = products.filter(p => p.isFeatured && p.stock > 0 && firstImage(p)).slice(0, 4);

    return (
        <main className="bg-[#FDFBF7] min-h-screen">
            {/* Editorial hero band */}
            <section className="texture-silk relative bg-obsidian text-marble pt-36 pb-20 overflow-hidden">
                <div className="container mx-auto px-6">
                    <h1 className="sr-only">The Collections</h1>
                    <SectionHeader
                        tone="dark"
                        kicker="Curated by the Atelier"
                        title="The Collections"
                        accent="Collections"
                        note="Five great weaving traditions, one house of silk — from loom to drape."
                    />
                </div>
                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent"
                />
            </section>

            {/* Editorial Category Banners */}
            <section className="container mx-auto px-6 py-24 md:py-32 space-y-24 md:space-y-32">
                {groups.length === 0 && (
                    <p className="text-center text-[#595959] font-serif italic text-xl py-16">
                        Our looms are busy — new collections arrive shortly.
                    </p>
                )}

                {groups.map((group, index) => (
                    <article
                        key={group.name}
                        className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center ${index % 2 === 1 ? "lg:[direction:rtl]" : ""}`}
                    >
                        {/* Banner image */}
                        <Link
                            href={`/shop?category=${encodeURIComponent(group.name)}`}
                            className="group zari-frame relative block aspect-[16/10] overflow-hidden border border-[#E5E5E5] hover:border-[#D4AF37]/60 transition-colors duration-700 lg:[direction:ltr]"
                            aria-label={`Shop the ${group.name} collection`}
                        >
                            {group.image ? (
                                <SrivariImage
                                    src={group.image}
                                    alt={`${group.name} saree from The Srivari collection`}
                                    fallbackLabel={group.name}
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-[#141005] via-obsidian to-obsidian flex items-center justify-center">
                                    <span aria-hidden="true" className="font-serif italic text-8xl text-gold/15 select-none">
                                        {group.name.charAt(0)}
                                    </span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                            <span className="absolute bottom-5 left-6 z-10 flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-white/90 font-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" aria-hidden="true" />
                                {group.products.length} {group.products.length === 1 ? "weave" : "weaves"}
                            </span>
                        </Link>

                        {/* Copy */}
                        <div className="lg:[direction:ltr]">
                            <span className="kicker mb-5">
                                Collection {String(index + 1).padStart(2, "0")}
                            </span>
                            <h2 className="font-serif text-4xl md:text-5xl leading-[1.05] tracking-tight text-[#1A1A1A]">{group.name}</h2>
                            <p className="mt-5 text-[#595959] font-sans leading-relaxed max-w-md">{group.blurb}</p>
                            <p className="mt-4 font-serif text-lg text-[#4A0404]">
                                From ₹{Math.min(...group.products.map(p => p.price)).toLocaleString('en-IN')}
                            </p>
                            <Link
                                href={`/shop?category=${encodeURIComponent(group.name)}`}
                                className="btn-thread mt-9 font-sans text-[#4A0404]"
                            >
                                Explore {group.name}
                            </Link>
                        </div>
                    </article>
                ))}
            </section>

            {/* Featured strip */}
            {featured.length > 0 && (
                <section className="bg-[#F9F5F0] py-24 md:py-32">
                    <div className="container mx-auto px-6">
                        <ZariDivider tone="light" className="mb-16 md:mb-20" />
                        <SectionHeader
                            tone="light"
                            kicker="Srivari Signatures"
                            title="Featured Masterpieces"
                            accent="Masterpieces"
                            note="Signed pieces from the current season, chosen by the atelier."
                            className="mb-14"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-14">
                            {featured.map((product) => (
                                <ProductCard key={product.id} product={product} tone="light" />
                            ))}
                        </div>
                        <div className="mt-16">
                            <Link
                                href="/shop"
                                className="btn-thread font-sans text-[#4A0404]"
                            >
                                View the Full Catalogue
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            <Footer />
        </main>
    );
}
