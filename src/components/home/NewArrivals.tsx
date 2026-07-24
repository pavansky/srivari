import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types";

interface NewArrivalsProps {
    products: Product[];
}

export default function NewArrivals({ products }: NewArrivalsProps) {
    if (products.length === 0) return null;

    return (
        <section className="py-24 md:py-32 px-6 bg-obsidian relative">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-14 gap-6">
                    <div>
                        <span className="text-gold uppercase tracking-[0.3em] text-xs md:text-sm">Fresh off the Loom</span>
                        <h2 className="text-4xl md:text-5xl font-serif text-marble mt-4">New Arrivals</h2>
                    </div>
                    <Link
                        href="/shop"
                        className="text-xs uppercase tracking-[0.25em] text-marble/60 hover:text-gold border-b border-marble/20 hover:border-gold pb-1 transition-colors shrink-0"
                    >
                        View All Sarees
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
}
