import Link from 'next/link';
import { Metadata } from 'next';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import SrivariImage from '@/components/SrivariImage';
import { HOME_CATEGORIES } from '@/components/home/CategoryTiles';
import { getProducts, toPublicProduct } from '@/lib/db';
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
    return p.images?.find(img => img && img.trim() !== "") || null;
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
            {/* Premium Hero Banner */}
            <section className="relative bg-obsidian text-marble pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#D4AF37_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gold/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <span className="text-gold text-xs font-sans font-bold uppercase tracking-[0.4em] mb-4 block">Curated by the Atelier</span>
                    <h1 className="text-5xl md:text-7xl font-serif mb-4 text-white">The Collections</h1>
                    <p className="text-xl max-w-2xl mx-auto font-light tracking-wide text-white/60 font-serif italic">
                        Five great weaving traditions, one house of silk
                    </p>
                    <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-8" />
                </div>
            </section>

            {/* Editorial Category Banners */}
            <section className="container mx-auto px-6 py-16 md:py-24 space-y-16 md:space-y-24">
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
                            className="group relative block aspect-[16/10] overflow-hidden rounded-sm border border-[#E5E5E5] hover:border-[#D4AF37] transition-colors duration-500 lg:[direction:ltr]"
                            aria-label={`Shop the ${group.name} collection`}
                        >
                            {group.image ? (
                                <SrivariImage
                                    src={group.image}
                                    alt={`${group.name} saree from The Srivari collection`}
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-[#141005] via-obsidian to-obsidian flex items-center justify-center">
                                    <span aria-hidden="true" className="font-serif italic text-8xl text-gold/15 select-none">
                                        {group.name.charAt(0)}
                                    </span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                            <span className="absolute bottom-5 left-6 text-[10px] uppercase tracking-[0.3em] text-white/90 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                {group.products.length} {group.products.length === 1 ? "weave" : "weaves"}
                            </span>
                        </Link>

                        {/* Copy */}
                        <div className="lg:[direction:ltr]">
                            <span className="text-[#D4AF37] text-[11px] font-bold uppercase tracking-[0.35em]">
                                Collection {String(index + 1).padStart(2, "0")}
                            </span>
                            <h2 className="text-4xl md:text-5xl font-serif text-[#4A0404] mt-3">{group.name}</h2>
                            <p className="mt-5 text-[#595959] leading-relaxed max-w-md">{group.blurb}</p>
                            <p className="mt-2 text-sm text-[#8A8680]">
                                From ₹{Math.min(...group.products.map(p => p.price)).toLocaleString('en-IN')}
                            </p>
                            <Link
                                href={`/shop?category=${encodeURIComponent(group.name)}`}
                                className="mt-8 inline-block text-xs uppercase tracking-[0.25em] text-[#4A0404] border border-[#4A0404]/30 hover:bg-[#4A0404] hover:text-[#D4AF37] px-8 py-4 transition-colors duration-500"
                            >
                                Explore {group.name}
                            </Link>
                        </div>
                    </article>
                ))}
            </section>

            {/* Featured strip */}
            {featured.length > 0 && (
                <section className="bg-[#FAF8F5] border-t border-[#E5E5E5] py-16 md:py-24">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <span className="text-[#D4AF37] text-[11px] font-bold uppercase tracking-[0.35em]">Srivari Signatures</span>
                            <h2 className="text-3xl md:text-4xl font-serif text-[#4A0404] mt-3">Featured Masterpieces</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                            {featured.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                        <div className="text-center mt-12">
                            <Link
                                href="/shop"
                                className="inline-block text-xs uppercase tracking-[0.25em] text-[#4A0404] border-b border-[#4A0404]/30 hover:border-[#D4AF37] hover:text-[#D4AF37] pb-1 transition-colors"
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
