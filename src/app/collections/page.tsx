import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { products } from '@/data/products';

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

            <style jsx>{`
        .section-header {
            text-align: center;
            margin-bottom: 4rem;
        }
        .section-header h2 {
            font-size: 2.5rem;
            color: var(--color-primary);
            margin-bottom: 1rem;
        }
        .section-header p {
            color: var(--color-text-muted);
            font-family: var(--font-serif);
            font-style: italic;
        }
        .product-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 2rem;
        }
      `}</style>
        </main>
    );
}
