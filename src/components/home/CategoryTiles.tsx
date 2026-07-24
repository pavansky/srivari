import Link from "next/link";
import SrivariImage from "@/components/SrivariImage";
import { isRenderableImageSrc } from "@/lib/image-src";
import SectionHeader from "@/components/ui/SectionHeader";
import { Product } from "@/types";

export const HOME_CATEGORIES = [
    {
        name: "Kanjivaram",
        blurb: "Temple-born silks with regal zari borders, woven in Kanchipuram.",
    },
    {
        name: "Banarasi",
        blurb: "Opulent brocades from the ghats of Varanasi, threaded with gold.",
    },
    {
        name: "Mysore Silk",
        blurb: "Featherlight crepe silks with an unmistakable royal sheen.",
    },
    {
        name: "Cotton",
        blurb: "Breathable handloom weaves for effortless, everyday elegance.",
    },
    {
        name: "Tussar",
        blurb: "Wild silk with a raw, earthy texture and a natural golden hue.",
    },
];

/** Case-insensitive category match (handles "Mysore Silk" vs "mysore silk" etc.) */
function matchesCategory(productCategory: string | undefined, name: string): boolean {
    if (!productCategory) return false;
    const a = productCategory.trim().toLowerCase();
    const b = name.trim().toLowerCase();
    return a === b || a.includes(b) || b.includes(a);
}

/** Server-side pick of a representative image for a category (prefers featured products). */
function pickCategoryImage(products: Product[], name: string): string | null {
    const inCategory = products.filter(p => matchesCategory(p.category, name));
    const withImage = (p: Product) => p.images?.find(isRenderableImageSrc);
    const featured = inCategory.find(p => p.isFeatured && withImage(p));
    const any = inCategory.find(p => withImage(p));
    const chosen = featured || any;
    return chosen ? (withImage(chosen) as string) : null;
}

interface CategoryTilesProps {
    products: Product[];
}

export default function CategoryTiles({ products }: CategoryTilesProps) {
    const tiles = HOME_CATEGORIES.map((cat) => ({
        ...cat,
        image: pickCategoryImage(products, cat.name),
        count: products.filter(p => matchesCategory(p.category, cat.name)).length,
    }));

    return (
        <section id="collections" className="texture-silk py-28 md:py-32 px-6 bg-obsidian relative">
            <div className="max-w-7xl mx-auto">
                <SectionHeader
                    kicker="THE WARDROBE OF QUEENS"
                    title="Shop by Collection"
                    accent="Collection"
                    tone="dark"
                    className="mb-16"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-6">
                    {tiles.map((tile, index) => (
                        <Link
                            key={tile.name}
                            href={`/shop?category=${encodeURIComponent(tile.name)}`}
                            className={`group zari-frame relative block overflow-hidden border border-white/5 hover:border-gold/40 transition-colors duration-700 ${index < 2 ? "lg:col-span-3 aspect-[4/5] sm:aspect-[16/10]" : "lg:col-span-2 aspect-[4/5]"}`}
                            aria-label={`Shop the ${tile.name} collection`}
                        >
                            {tile.image ? (
                                <>
                                    <SrivariImage
                                        src={tile.image}
                                        alt={`${tile.name} silk saree from The Srivari collection`}
                                        fill
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/20 to-transparent" />
                                </>
                            ) : (
                                /* Gold-on-obsidian fallback tile when a category has no imagery yet */
                                <div className="absolute inset-0 bg-gradient-to-br from-[#141005] via-obsidian to-obsidian">
                                    <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#D4AF37_1px,transparent_1px)] bg-[size:18px_18px]" />
                                    <span
                                        aria-hidden="true"
                                        className="absolute inset-0 flex items-center justify-center font-serif italic text-[7rem] md:text-[9rem] text-gold/10 select-none"
                                    >
                                        {tile.name.charAt(0)}
                                    </span>
                                </div>
                            )}

                            {/* Caption */}
                            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                                <p className="text-[10px] font-sans uppercase tracking-[0.3em] text-gold mb-2">
                                    {tile.count > 0 ? `${tile.count} ${tile.count === 1 ? "weave" : "weaves"}` : "Arriving soon"}
                                </p>
                                <h3 className="text-2xl md:text-3xl font-serif text-marble group-hover:text-gold transition-colors duration-700">
                                    {tile.name}
                                </h3>
                                <p className="mt-2 text-sm text-marble/60 max-w-xs hidden sm:block">
                                    {tile.blurb}
                                </p>
                                <span className="btn-thread mt-5 font-sans text-marble/50 group-hover:text-gold transition-colors duration-500">
                                    Explore
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
