import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion'; // Assumes framer-motion is installed as per previous files

export default function AboutPage() {
    return (
        <main>
            <Header />

            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-primary text-white">
                {/* Reusing existing classes where possible, or inline styles for specific layout if needed. 
                    Using inline styles here to ensure structure before moving to CSS modules or globals if preferred, 
                    but sticking to the project's established conventions which seem to use a mix of globals and standard CSS.
                    Checking globals.css, we have .hero-section etc. I will use a custom simple structure here for the About page.
                 */}
                <div style={{ position: 'relative', width: '100%', height: '60vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-primary)' }}>
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
                        <img
                            src="https://images.unsplash.com/photo-1576487248805-cf45f6bcc67f?q=80&w=1920&auto=format&fit=crop"
                            alt="Weaving Loom"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                    <div className="container" style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
                        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', color: 'var(--color-secondary)' }}>Our Heritage</h1>
                        <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>Preserving the timeless art of Indian handlooms since 1980.</p>
                    </div>
                </div>
            </section>

            {/* Story Section */}
            <section className="container" style={{ padding: '6rem 1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: 'var(--color-primary)' }}>The Srivari Legacy</h2>
                        <p style={{ marginBottom: '1.5rem', lineHeight: '1.8', color: '#555' }}>
                            Srivari's began as a humble endeavor in the heart of Bangalore, driven by a singular passion: to bring the finest handwoven silks to connoisseurs of Indian tradition.
                            For over four decades, we have traveled to the remotest weaver villages in Kanchipuram and Varanasi, building relationships that go beyond business.
                        </p>
                        <p style={{ lineHeight: '1.8', color: '#555' }}>
                            We believe that a saree is not just a garment, but a canvas of culture. Every thread tells a story of patience, skill, and ancestry.
                            Our collections are curated with a discerning eye for authenticity, ensuring that when you drape a Srivari saree, you are embracing a piece of history.
                        </p>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', inset: 0, border: '2px solid var(--color-secondary)', transform: 'translate(20px, 20px)', zIndex: -1 }}></div>
                        <img
                            src="https://images.unsplash.com/photo-1606293926075-69a00febf280?q=80&w=800&auto=format&fit=crop"
                            alt="Saree Detail"
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section style={{ backgroundColor: '#f9f9f9', padding: '6rem 0' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '4rem', color: 'var(--color-primary)' }}>Our Values</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                        <div style={{ padding: '2rem', backgroundColor: 'white', border: '1px solid #eee' }}>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--color-secondary)' }}>Authenticity</h3>
                            <p style={{ fontSize: '0.95rem', color: '#666' }}>Silk Mark certified pure silks, sourced directly from master weavers.</p>
                        </div>
                        <div style={{ padding: '2rem', backgroundColor: 'white', border: '1px solid #eee' }}>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--color-secondary)' }}>Craftsmanship</h3>
                            <p style={{ fontSize: '0.95rem', color: '#666' }}>Celebrating the intricate art of handloom weaving and zari work.</p>
                        </div>
                        <div style={{ padding: '2rem', backgroundColor: 'white', border: '1px solid #eee' }}>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--color-secondary)' }}>Elegance</h3>
                            <p style={{ fontSize: '0.95rem', color: '#666' }}>Designs that blend traditional grandeur with modern aesthetics.</p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
