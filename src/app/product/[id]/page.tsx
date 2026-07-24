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
import SectionHeader from "@/components/ui/SectionHeader";
import ZariDivider from "@/components/ui/ZariDivider";
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
                            <div className="space-y-5">
                                <span className="kicker kicker--plain">
                                    Srivari Royal Edition
                                </span>
                                <h1 className="text-4xl sm:text-5xl font-serif text-[#1A1A1A] leading-[1.05] tracking-tight">
                                    {product.name}
                                </h1>
                                <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-black/10 pb-6">
                                    <p className="font-serif text-2xl text-[#4A0404]">
                                        ₹{product.price.toLocaleString("en-IN")}
                                    </p>
                                    {product.stock > 0 ? (
                                        product.stock < 5 ? (
                                            <span className="flex items-center gap-2 text-[9px] font-sans uppercase tracking-[0.3em] text-[#1A1A1A]/60">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></span>
                                                Only {product.stock} remain
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2 text-[9px] font-sans uppercase tracking-[0.3em] text-[#1A1A1A]/60">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                                                In Stock
                                            </span>
                                        )
                                    ) : (
                                        <span className="flex items-center gap-2 text-[9px] font-sans uppercase tracking-[0.3em] text-[#4A0404]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#4A0404]/60"></span>
                                            Sold Out
                                        </span>
                                    )}
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
                                <div className="space-y-3">
                                    <span className="block text-[#D4AF37] text-[10px] font-sans uppercase tracking-[0.35em]">
                                        Note from the Artisan
                                    </span>
                                    <p className="text-base">{narrative}</p>
                                </div>

                                {care && (
                                    <div className="bg-[#F9F5F0] p-6 border border-black/10">
                                        <h2 className="text-[10px] text-[#1A1A1A] uppercase tracking-[0.3em] mb-4 flex items-center gap-2 font-sans">
                                            <Sparkles size={13} className="text-[#D4AF37] fill-[#D4AF37]/20" aria-hidden="true" />
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
                                                        <span className="block text-[10px] text-[#1A1A1A] uppercase tracking-[0.25em] mb-1.5">Category</span>
                                                        {product.category}
                                                    </div>
                                                    <div>
                                                        <span className="block text-[10px] text-[#1A1A1A] uppercase tracking-[0.25em] mb-1.5">Material</span>
                                                        {details.material}
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className="block text-[10px] text-[#1A1A1A] uppercase tracking-[0.25em] mb-1.5">Weave</span>
                                                        {details.weave}
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className="block text-[10px] text-[#1A1A1A] uppercase tracking-[0.25em] mb-1.5">Wash &amp; Care</span>
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
            <ZariDivider tone="light" className="container mx-auto px-4" />
            <section className="py-28" aria-label="Provenance">
                <div className="container mx-auto px-4 md:px-6">
                    <SectionHeader
                        tone="light"
                        kicker="Provenance"
                        title="The Journey of the Saree"
                        accent="Journey"
                        note="Every masterpiece carries the legacy of centuries — from pure silk thread to authentic gold zari."
                        className="mb-20"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 md:divide-x md:divide-black/10 border-t border-black/10">
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
                            <div key={step.numeral} className="pt-12 pb-4 md:px-10 md:first:pl-0 md:last:pr-0">
                                <span
                                    className="block w-2 h-2 rotate-45 border border-[#D4AF37] bg-[#D4AF37]/30 mb-8"
                                    aria-hidden="true"
                                ></span>
                                <span className="block text-[10px] font-sans uppercase tracking-[0.35em] text-[#D4AF37] mb-3">
                                    {step.numeral}
                                </span>
                                <h3 className="font-serif text-2xl text-[#1A1A1A] mb-4">{step.title}</h3>
                                <p className="text-sm font-sans font-light text-[#595959] leading-loose">{step.copy}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Related Products — server-rendered */}
            {relatedProducts.length > 0 && (
                <>
                    <ZariDivider tone="light" className="container mx-auto px-4" />
                    <section className="container mx-auto px-4 md:px-6 py-28" aria-label="Related products">
                        <SectionHeader
                            tone="light"
                            kicker="From the Same Loom"
                            title="You May Also Adore"
                            accent="Adore"
                            className="mb-14"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
                            {relatedProducts.map((related) => (
                                <ProductCard key={related.id} product={related} tone="light" />
                            ))}
                        </div>
                        <div className="mt-14">
                            <Link
                                href={`/shop?category=${encodeURIComponent(product.category)}`}
                                className="btn-thread font-sans text-[#4A0404]"
                            >
                                View All {product.category}
                            </Link>
                        </div>
                    </section>
                </>
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
