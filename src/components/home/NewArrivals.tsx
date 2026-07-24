import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import SectionHeader from "@/components/ui/SectionHeader";
import { Product } from "@/types";

interface NewArrivalsProps {
    products: Product[];
}

export default function NewArrivals({ products }: NewArrivalsProps) {
    if (products.length === 0) return null;

    return (
        <section className="texture-silk py-28 md:py-32 px-6 bg-obsidian relative">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
                    <SectionHeader
                        kicker="FRESH OFF THE LOOM"
                        title="New Arrivals"
                        accent="Arrivals"
                        tone="dark"
                    />
                    <Link
                        href="/shop"
                        className="btn-thread font-sans text-marble/60 hover:text-gold transition-colors duration-500 shrink-0 sm:mb-2"
                    >
                        View All Sarees
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} tone="dark" />
                    ))}
                </div>
            </div>
        </section>
    );
}
