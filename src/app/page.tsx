import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { products } from '@/data/products';

export default function Home() {
    return (
        <main>
            <Header />

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h1>Weave Your Legacy</h1>
                    <p>Discover the finest collection of Kanjivaram and Banarasi silks, handpicked for the royalty in you.</p>
                    <a href="#collections" className="btn-primary" style={{ display: 'inline-block', marginTop: '2rem' }}>
                        Explore Collection
                    </a>
                </div>
                <div className="hero-overlay"></div>
            </section>

            {/* Featured Collections */}
            <section id="collections" className="container section">
                <div className="section-header">
                    <h2>Exclusive Collections</h2>
                    <p>Hand-woven masterpieces from the weavers of India</p>
                </div>

                <div className="product-grid">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </section>

            {/* About Teaser */}
            <section className="about-section">
                <div className="container about-content">
                    <div className="about-text">
                        <h2>The Srivari's Promise</h2>
                        <p>
                            Located in the heart of Bangalore, Srivari's brings you an authentic experience of Indian heritage.
                            Each saree in our store is a testament to centuries of tradition, woven with passion and precision.
                        </p>
                        <a href="/about" className="btn-secondary" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
                            Read Our Story
                        </a>
                    </div>
                    <div className="about-image">
                        <img src="https://images.unsplash.com/photo-1627931411516-3023778a4865?q=80&w=600&auto=format&fit=crop" alt="Indian Tradition" />
                    </div>
                </div>
            </section>

            <Footer />

            <style jsx>{`
        .hero {
          height: 80vh;
          background-image: url('https://images.unsplash.com/photo-1601053154868-b8034db3d69a?q=80&w=1920&auto=format&fit=crop'); /* Luxurious Wedding Saree BG */
          background-size: cover;
          background-position: center;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #fff;
        }
        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6));
          z-index: 1;
        }
        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 800px;
          padding: 0 1rem;
        }
        .hero h1 {
          font-size: 4rem;
          margin-bottom: 1.5rem;
          font-family: var(--font-serif);
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .hero p {
          font-size: 1.2rem;
          line-height: 1.6;
          opacity: 0.9;
        }

        .section {
          padding: 6rem 1.5rem;
        }
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

        .about-section {
          background-color: #f8f5f0;
          padding: 6rem 0;
        }
        .about-content {
          display: flex;
          align-items: center;
          gap: 4rem;
        }
        .about-text {
          flex: 1;
        }
        .about-text h2 {
          font-size: 2.5rem;
          color: var(--color-primary);
          margin-bottom: 1.5rem;
        }
        .about-text p {
          line-height: 1.8;
          color: var(--color-text-muted);
          margin-bottom: 2rem;
        }
        .about-image {
          flex: 1;
        }
        .about-image img {
          width: 100%;
          border-radius: 8px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        @media (max-width: 768px) {
          .hero h1 {
            font-size: 2.5rem;
          }
          .about-content {
            flex-direction: column;
          }
        }
      `}</style>
        </main>
    );
}
