"use client";

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function CartPage() {
    // Placeholder state since we don't have a real cart context/backend yet.
    // In a real app, this would come from a Context provider or Redux.
    const [cartItems, setCartItems] = useState<any[]>([]);

    useEffect(() => {
        // Simulating checking local storage or just showing empty for now as requested
        // "Basic cart listing" - implies we might want to show how it looks.
        // Let's add a dummy item for visualization if requested, 
        // but typically a new user's cart is empty.
        // For the sake of the user "seeing" the cart page, I'll leave it empty initially 
        // or we could add a "demo" button to add item.
        // Let's stick to empty state for now with a nice message.
    }, []);

    return (
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />

            <div className="container" style={{ flex: 1, padding: '8rem 1.5rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '3rem', color: 'var(--color-primary)', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>Shopping Cart</h1>

                {cartItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                        <ShoppingBag size={64} style={{ color: '#ccc', margin: '0 auto 1.5rem' }} />
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#555' }}>Your cart is empty</h3>
                        <p style={{ color: '#888', marginBottom: '2rem' }}>Looks like you haven't added any royal drapes to your collection yet.</p>
                        <Link href="/collections" className="cta-button">
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div>
                        {/* Cart Items List would go here */}
                        <div style={{ marginBottom: '2rem' }}>
                            {/* Map through items */}
                            <p>Items...</p>
                        </div>

                        <div style={{ textAlign: 'right', marginTop: '3rem' }}>
                            <button className="cta-button">Checkout via WhatsApp</button>
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </main>
    );
}
