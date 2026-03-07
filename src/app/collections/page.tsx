import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { getProducts } from '@/lib/db';
import { Metadata } from 'next';

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

export default async function Collections() {
    const products = await getProducts();

    return (
        <main className="bg-[#FDFBF7] min-h-screen">
            {/* Premium Hero Banner */}
            <section className="relative bg-obsidian text-marble pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#D4AF37_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gold/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <span className="text-gold text-xs font-sans font-bold uppercase tracking-[0.4em] mb-4 block">Curated Collection</span>
                    <h1 className="text-5xl md:text-7xl font-serif mb-4 text-white">All Collections</h1>
                    <p className="text-xl max-w-2xl mx-auto font-light tracking-wide text-white/60 font-serif italic">
                        Explore our complete range of authentic sarees
                    </p>
                    <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-8" />
                </div>
            </section>

            {/* Product Grid */}
            <section className="container mx-auto px-6 py-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </section>

            <Footer />
        </main>
    );
}
