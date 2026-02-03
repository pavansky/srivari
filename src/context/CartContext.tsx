"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Product } from "@/types";
import { products as initialProducts } from "@/data/products";

// We only store the ID and quantity in localStorage to save space
interface StoredCartItem {
    productId: string;
    uniqueId: string;
}

// The app uses the full product details
interface CartItem extends Product {
    uniqueId: string;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (uniqueId: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Helper to find a product by ID from localStorage or static data
    const getProductById = (id: string, allProducts: Product[]): Product | undefined => {
        return allProducts.find(p => p.id === id);
    };

    // Load from localStorage
    useEffect(() => {
        const storedCartJSON = localStorage.getItem('srivari_cart');
        const storedProductsJSON = localStorage.getItem('srivari_products');

        // Combine static and local products for lookup
        let allProducts = [...initialProducts];
        if (storedProductsJSON) {
            try {
                const localProducts = JSON.parse(storedProductsJSON);
                // Create a map or just merge. For simplicity, just use local if available as it might have edits, 
                // but actually we expect local to fully override or extend.
                // The Admin flow sets 'srivari_products' as the source.
                // Optimally, we use the same logic as ShopPage:
                allProducts = localProducts.length > 0 ? localProducts : initialProducts;
            } catch (e) {
                console.error("Failed to parse products", e);
            }
        }

        if (storedCartJSON) {
            try {
                const storedItems: StoredCartItem[] = JSON.parse(storedCartJSON);
                const hydratedCart: CartItem[] = [];

                storedItems.forEach(item => {
                    const product = getProductById(item.productId, allProducts);
                    if (product) {
                        hydratedCart.push({ ...product, uniqueId: item.uniqueId });
                    }
                });
                setCart(hydratedCart);
            } catch (e) {
                console.error("Failed to parse cart", e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage (only IDs)
    useEffect(() => {
        if (isLoaded) {
            const itemsToStore: StoredCartItem[] = cart.map(item => ({
                productId: item.id,
                uniqueId: item.uniqueId
            }));
            try {
                localStorage.setItem('srivari_cart', JSON.stringify(itemsToStore));
            } catch (e) {
                console.error("Cart storage quota exceeded", e);
                // Optional: Notify user via toast if possible, but existing items remain in state
                alert("Cart is full! Storage limit reached.");
            }
        }
    }, [cart, isLoaded]);

    const addToCart = (product: Product) => {
        const newItem = { ...product, uniqueId: Math.random().toString(36).substr(2, 9) };
        setCart((prev) => [...prev, newItem]);
    };

    const removeFromCart = (uniqueId: string) => {
        setCart((prev) => prev.filter((item) => item.uniqueId !== uniqueId));
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
