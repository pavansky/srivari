import { cache } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getProducts } from "@/lib/db";
import prisma from "@/lib/prisma";
import { Product } from "@/types";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import Accordion from "@/components/Accordion";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/product/ProductGallery";
import ProductActions from "@/components/product/ProductActions";
import RecentlyViewed from "@/components/product/RecentlyViewed";
import ReviewsSection from "@/components/reviews/ReviewsSection";

export const dynamic = "force-dynamic";

const CARE_DELIMITER = "--- \n**Wash & Care Instructions:**\n";
const DEFAULT_CARE =
    "Professional dry clean only. Store wrapped in soft muslin, away from direct sunlight and moisture. Air the drape gently every few months to preserve the zari.";

/** Strip internal cost/supplier fields so they never reach the client payload. */
function toPublicProduct(p: Product): Product {
    const { priceCps, shipping, supplierId, supplierName, locationBin, ...rest } = p;
    return rest as Product;
}

const getCatalogue = cache(async (): Promise<Product[]> => {
    return (await getProducts()) as Product[];
});

const getProduct = cache(async (id: string): Promise<Product | undefined> => {
    const normalize = (val: unknown) => String(val).trim();
    const target = normalize(decodeURIComponent(id));
    const products = await getCatalogue();
    const found = products.find((p) => normalize(p.id) === target);
    if (!found || found.isArchived) return undefined;
    return found;
});

const getReviewStats = cache(async (productId: string): Promise<{ count: number; average: number }> => {
    try {
        const agg = await prisma.review.aggregate({
            where: { productId, isApproved: true },
            _count: { _all: true },
            _avg: { rating: true },
        });
        const count = agg._count._all;
        const average = count ? Math.round((agg._avg.rating || 0) * 10) / 10 : 0;
        return { count, average };
    } catch {
        return { count: 0, average: 0 };
    }
});

function splitDescription(description: string): { narrative: string; care: string | null } {
    if (description?.includes(CARE_DELIMITER)) {
        const [narrative, care] = description.split(CARE_DELIMITER);
        return { narrative: narrative.trim(), care: (care || "").trim() || null };
    }
    return { narrative: description || "", care: null };
}

function categoryDetails(category: string): { material: string; weave: string } {
    const key = (category || "").toLowerCase();
    if (key.includes("kanjivaram") || key.includes("kanchipuram"))
        return { material: "Pure Mulberry Silk", weave: "Kanjivaram Zari, hand-loomed in Kanchipuram" };
    if (key.includes("banarasi"))
        return { material: "Pure Katan Silk", weave: "Banarasi brocade with woven zari motifs" };
    if (key.includes("mysore"))
        return { material: "Pure Mysore Crepe Silk", weave: "Traditional Mysore weave with gold border" };
    if (key.includes("tussar") || key.includes("tussah"))
        return { material: "Wild Tussar Silk", weave: "Handloom Tussar with natural texture" };
    if (key.includes("organza"))
        return { material: "Silk Organza", weave: "Sheer handwoven organza" };
    if (key.includes("cotton"))
        return { material: "Fine Handloom Cotton", weave: "Traditional pit-loom cotton weave" };
    if (key.includes("georgette"))
        return { material: "Pure Silk Georgette", weave: "Lightweight georgette drape" };
    return { material: `Handpicked ${category || "Silk"}`, weave: `Traditional ${category || "handloom"} craftsmanship` };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const product = await getProduct(id);
    if (!product) {
        return { title: "Product Not Found" };
    }

    const { narrative } = splitDescription(product.description);
    const description =
        narrative.length > 160 ? `${narrative.slice(0, 157).trimEnd()}...` : narrative || `${product.name} — ${product.category} saree from The Srivari.`;
    const image = product.images?.find((img) => img && img.trim() !== "");

    // Bare name — the root layout's title template appends "| The Srivari"
    return {
        title: product.name,
        description,
        alternates: { canonical: `/product/${product.id}` },
        openGraph: {
            title: `${product.name} | The Srivari`,
            description,
            type: "website",
            url: `https://thesrivari.com/product/${product.id}`,
            ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
        },
    };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const product = await getProduct(id);
    if (!product) notFound();

    const [catalogue, reviewStats] = await Promise.all([getCatalogue(), getReviewStats(product.id)]);

    const publicProduct = toPublicProduct(product);
    const { narrative, care } = splitDescription(product.description);
    const details = categoryDetails(product.category);

    const relatedProducts = catalogue
        .filter(
            (p) =>
                p.category === product.category &&
                String(p.id) !== String(product.id) &&
                p.stock > 0 &&
                !p.isArchived
        )
        .slice(0, 4)
        .map(toPublicProduct);

    const validImages = (product.images || []).filter((img) => img && img.trim() !== "");

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        ...(validImages.length ? { image: validImages } : {}),
        description: narrative,
        ...(product.sku ? { sku: product.sku } : {}),
        brand: { "@type": "Brand", name: "The Srivari" },
        category: product.category,
        offers: {
            "@type": "Offer",
            priceCurrency: "INR",
            price: product.price,
            availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: `https://thesrivari.com/product/${product.id}`,
        },
        ...(reviewStats.count > 0
            ? {
                  aggregateRating: {
                      "@type": "AggregateRating",
                      ratingValue: reviewStats.average,
                      reviewCount: reviewStats.count,
                  },
              }
            : {}),
    };

    return (
        <main className="bg-[#FDFBF7] min-h-screen">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <div className="container mx-auto px-4 pt-32 pb-20">
                <Breadcrumbs />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 relative">
                    {/* Left: Gallery (Sticky) */}
                    <div className="lg:col-span-7">
                        <ProductGallery name={product.name} category={product.category} images={product.images || []} />
                    </div>

                    {/* Right: Info & Actions */}
                    <div className="lg:col-span-5 flex flex-col pt-4">
                        <div className="space-y-10">
                            {/* Branding Header */}
                            <div className="space-y-4">
                                <span className="text-[#D4AF37] text-xs font-sans font-bold uppercase tracking-[0.3em] pl-1">
                                    Srivari Royal Edition
                                </span>
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#1A1A1A] leading-[1.1]">
                                    {product.name}
                                </h1>
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-6">
                                    <p className="text-3xl text-[#1A1A1A] font-serif">
                                        ₹{product.price.toLocaleString("en-IN")}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {product.stock > 0 ? (
                                            product.stock < 5 ? (
                                                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/50">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></div>
                                                    <span className="text-[10px] font-sans font-bold uppercase tracking-wider">
                                                        Only {product.stock} left in stock
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200/50">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                                                    <span className="text-[10px] font-sans font-bold uppercase tracking-wider">In Stock</span>
                                                </div>
                                            )
                                        ) : (
                                            <div className="flex items-center gap-2 text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-200/50">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                                                <span className="text-[10px] font-sans font-bold uppercase tracking-wider">Sold Out</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {reviewStats.count > 0 && (
                                    <a href="#reviews" className="inline-flex items-center gap-2 text-xs font-sans text-neutral-500 hover:text-[#4A0404] transition-colors">
                                        <span className="text-[#D4AF37]" aria-hidden="true">
                                            {"★".repeat(Math.round(reviewStats.average))}
                                        </span>
                                        <span>
                                            {reviewStats.average.toFixed(1)} · {reviewStats.count} review{reviewStats.count > 1 ? "s" : ""}
                                        </span>
                                    </a>
                                )}
                            </div>

                            {/* Narrative */}
                            <div className="font-sans text-[#595959] font-light leading-relaxed text-sm tracking-wide space-y-6">
                                <p className="text-base">
                                    <span className="text-[#D4AF37] font-bold tracking-widest uppercase text-xs mr-2">
                                        Note from the Artisan:
                                    </span>
                                    {narrative}
                                </p>

                                {care && (
                                    <div className="bg-[#FAF8F5] p-6 border border-[#D4AF37]/20 rounded-sm">
                                        <h2 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <Sparkles size={14} className="text-[#D4AF37] fill-[#D4AF37]/20" aria-hidden="true" />
                                            Wash &amp; Care Instructions
                                        </h2>
                                        <div className="text-xs text-[#595959] space-y-2 leading-relaxed whitespace-pre-line">{care}</div>
                                    </div>
                                )}
                            </div>

                            {/* Actions: quantity, add-to-bag, WhatsApp, wishlist, share */}
                            <ProductActions product={publicProduct} />

                            {/* Details Accordion — derived from the product itself */}
                            <div>
                                <Accordion
                                    items={[
                                        {
                                            title: "Details & Care",
                                            content: (
                                                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-xs font-sans text-neutral-600 leading-relaxed pt-2">
                                                    <div>
                                                        <span className="block text-black font-bold uppercase tracking-wider mb-1">Category</span>
                                                        {product.category}
                                                    </div>
                                                    <div>
                                                        <span className="block text-black font-bold uppercase tracking-wider mb-1">Material</span>
                                                        {details.material}
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className="block text-black font-bold uppercase tracking-wider mb-1">Weave</span>
                                                        {details.weave}
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className="block text-black font-bold uppercase tracking-wider mb-1">Wash &amp; Care</span>
                                                        <span className="whitespace-pre-line">{care || DEFAULT_CARE}</span>
                                                    </div>
                                                </div>
                                            ),
                                        },
                                        {
                                            title: "About this Piece",
                                            content: (
                                                <p className="text-xs font-sans text-neutral-600 leading-relaxed pt-2">
                                                    {narrative || `A handpicked ${product.category} drape from The Srivari collection.`}
                                                </p>
                                            ),
                                        },
                                        {
                                            title: "Authenticity & Shipping",
                                            content: (
                                                <div className="text-xs font-sans text-neutral-600 leading-relaxed space-y-3 pt-2">
                                                    <p>Includes Silk Mark Certificate of Authenticity.</p>
                                                    <p>Ships within 24 hours. Complimentary express delivery globally on orders above ₹20,000.</p>
                                                </div>
                                            ),
                                        },
                                    ]}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Journey of the Saree / Provenance Section */}
            <div className="bg-[#050505] text-[#FDFBF7] py-24 mt-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-3xl mx-auto text-center mb-20">
                        <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.4em] mb-6 block">Provenance</span>
                        <h2 className="text-4xl md:text-5xl font-serif mb-6 text-white">The Journey of the Saree</h2>
                        <p className="font-light text-white/70 leading-relaxed text-sm md:text-base">
                            Every masterpiece in our collection carries the legacy of centuries. From the careful selection of pure
                            silk threads to the intricate winding of the authentic gold zari, witness the dedication woven into
                            every inch.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12 lg:gap-20 text-center max-w-5xl mx-auto">
                        {[
                            {
                                numeral: "I",
                                title: "The Loom",
                                copy: "Woven on ancestral pit looms traversing generations of master artisan families in Kanchipuram.",
                            },
                            {
                                numeral: "II",
                                title: "The Zari",
                                copy: "Authentic silver wire delicately electroplated with pure gold, defining the classic lustrous borders.",
                            },
                            {
                                numeral: "III",
                                title: "The Time",
                                copy: "Taking upwards of 45 days, each complex motif is painstakingly hand-woven without jacquard machines.",
                            },
                        ].map((step) => (
                            <div key={step.numeral} className="group">
                                <div className="w-16 h-16 mx-auto border border-[#D4AF37]/20 rounded-full flex items-center justify-center mb-6 group-hover:border-[#D4AF37] transition-colors duration-500 bg-white/5">
                                    <span className="text-[#D4AF37] font-serif text-xl italic group-hover:scale-110 transition-transform duration-500">
                                        {step.numeral}
                                    </span>
                                </div>
                                <h3 className="text-xl font-serif mb-4 text-white/90 tracking-wide">{step.title}</h3>
                                <p className="text-sm font-light text-white/50 leading-loose">{step.copy}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Related Products — server-rendered */}
            {relatedProducts.length > 0 && (
                <section className="container mx-auto px-4 md:px-6 py-16 md:py-24" aria-label="Related products">
                    <div className="text-center mb-12">
                        <span className="text-[#D4AF37] text-[10px] font-sans font-bold uppercase tracking-[0.4em] block mb-3">
                            From the Same Loom
                        </span>
                        <h2 className="text-3xl md:text-4xl font-serif text-[#1A1A1A]">You May Also Adore</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {relatedProducts.map((related) => (
                            <ProductCard key={related.id} product={related} />
                        ))}
                    </div>
                    <div className="text-center mt-12">
                        <Link
                            href={`/shop?category=${encodeURIComponent(product.category)}`}
                            className="inline-block px-10 py-4 border border-[#1A1A1A] text-[#1A1A1A] uppercase tracking-widest text-xs font-bold hover:bg-[#1A1A1A] hover:text-[#D4AF37] transition-all duration-300"
                        >
                            View All {product.category}
                        </Link>
                    </div>
                </section>
            )}

            {/* Reviews */}
            <div id="reviews">
                <ReviewsSection productId={String(product.id)} productName={product.name} />
            </div>

            {/* Recently viewed — records this product on mount */}
            <RecentlyViewed currentProductId={String(product.id)} />

            <Footer />
        </main>
    );
}
