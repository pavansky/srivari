import { products } from '@/data/products';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsappButton from '@/components/WhatsappButton';
import Link from 'next/link';

export function generateStaticParams() {
    return products.map((product) => ({
        id: product.id,
    }));
}

export default function ProductPage({ params }: { params: { id: string } }) {
    const product = products.find((p) => p.id === params.id);

    if (!product) {
        return (
            <main>
                <Header />
                <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>
                    <h2>Product Not Found</h2>
                    <Link href="/" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Back to Home</Link>
                </div>
                <Footer />
            </main>
        );
    }

    return (
        <main>
            <Header />

            <div className="container product-container">
                <div className="breadcrumb">
                    <Link href="/">Home</Link> / <Link href="/collections">Collections</Link> / <span>{product.name}</span>
                </div>

                <div className="product-layout">
                    <div className="product-gallery">
                        <img src={product.image} alt={product.name} className="main-image" />
                    </div>

                    <div className="product-details">
                        <span className="category-tag">{product.category}</span>
                        <h1 className="product-title">{product.name}</h1>
                        <p className="price">₹{product.price.toLocaleString('en-IN')}</p>

                        <div className="description">
                            <p>{product.description}</p>
                            <p>
                                <strong>Authenticity Guaranteed:</strong> Hand-picked from the finest weavers.
                                Comes with Silk Mark certification.
                            </p>
                        </div>

                        <div className="actions">
                            <WhatsappButton productName={product.name} price={product.price} />
                        </div>

                        <div className="fabric-care">
                            <h4>Fabric Care</h4>
                            <ul>
                                <li>Dry Clean Only</li>
                                <li>Wrap in muslin cloth for storage</li>
                                <li>Avoid direct sunlight</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />

            <style jsx>{`
        .product-container {
            padding: 2rem 1.5rem 4rem;
        }
        .breadcrumb {
            margin-bottom: 2rem;
            color: var(--color-text-muted);
            font-size: 0.9rem;
        }
        .breadcrumb span {
            color: var(--color-text-main);
        }
        .product-layout {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
        }
        .main-image {
            width: 100%;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }
        .category-tag {
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--color-secondary);
            font-size: 0.9rem;
            font-weight: 600;
        }
        .product-title {
            font-size: 2.5rem;
            margin: 0.5rem 0 1rem;
            color: var(--color-primary);
        }
        .price {
            font-size: 1.8rem;
            font-weight: 500;
            color: var(--color-text-main);
            margin-bottom: 2rem;
        }
        .description {
            line-height: 1.8;
            color: var(--color-text-muted);
            margin-bottom: 2rem;
        }
        .description p {
            margin-bottom: 1rem;
        }
        .fabric-care {
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid #eee;
        }
        .fabric-care h4 {
            margin-bottom: 1rem;
        }
        .fabric-care ul {
            list-style-position: inside;
            color: var(--color-text-muted);
        }
        @media (max-width: 768px) {
            .product-layout {
                grid-template-columns: 1fr;
                gap: 2rem;
            }
        }
      `}</style>
        </main>
    );
}
