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


        </main>
    );
}
