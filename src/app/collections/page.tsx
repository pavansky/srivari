import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { products } from '@/data/products';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Saree Collections | Kanjivaram, Banarasi, Silk & More",
    description: "Explore The Srivari's complete range of authentic Indian sarees. From Kanjivaram silks to Banarasi brocades, find the perfect saree for every occasion \u2014 weddings, festivals, and celebrations.",
    alternates: { canonical: "/collections" },
    openGraph: {
        title: "Saree Collections | The Srivari",
        description: "Browse our complete range of authentic Kanjivaram, Banarasi, and handloom silk sarees.",
        url: "https://thesrivari.com/collections",
    },
};

export default function Collections() {
    return (
        <main>
            <Header />
            <div className="section-header" style={{ marginTop: '4rem' }}>
                <h2>All Collections</h2>
                <p>Explore our complete range of authentic sarees</p>
            </div>

            <div className="container" style={{ marginBottom: '6rem' }}>
                <div className="product-grid">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
            <Footer />


        </main>
    );
}
