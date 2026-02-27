"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Product } from "@/types";
import { products as initialProducts } from "@/data/products";
import { useAudio } from "@/context/AudioContext";

// We only store the ID and quantity in localStorage to save space
interface StoredCartItem {
    productId: string;
    quantity: number;
}

// The app uses the full product details
export interface CartItem extends Product {
    uniqueId: string; // Kept for backwards compatibility / keys
    quantity: number;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: Product, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const { playBell } = useAudio();

    // Helper to find a product by ID from localStorage or static data
    const getProductById = (id: string, allProducts: Product[]): Product | undefined => {
        return allProducts.find(p => p.id === id);
    };

    // Load from localStorage
    useEffect(() => {
        const loadCart = async () => {
            const storedCartJSON = localStorage.getItem('srivari_cart');
            const storedProductsJSON = localStorage.getItem('srivari_products');

            let allProducts = [...initialProducts];
            if (storedProductsJSON) {
                try {
                    const localProducts = JSON.parse(storedProductsJSON);
                    allProducts = localProducts.length > 0 ? localProducts : initialProducts;
                } catch (e) {
                    console.error("Failed to parse products", e);
                }
            }

            if (storedCartJSON) {
                try {
                    const storedItems: StoredCartItem[] = JSON.parse(storedCartJSON);
                    const hydratedCart: CartItem[] = [];

                    for (const item of storedItems) {
                        const pid = item.productId || (item as any).id;
                        let product = getProductById(pid, allProducts);

                        // If not in local data, attempt to fetch from DB (graceful fallback)
                        if (!product) {
                            try {
                                const res = await fetch('/api/products');
                                if (res.ok) {
                                    const dbProducts = await res.json();
                                    product = dbProducts.find((p: Product) => p.id === pid);
                                }
                            } catch (e) {
                                console.error("Could not fetch product for cart hydration", e);
                            }
                        }

                        if (product) {
                            hydratedCart.push({
                                ...product,
                                uniqueId: Math.random().toString(36).substr(2, 9),
                                quantity: item.quantity || 1
                            });
                        }
                    }

                    setCart(hydratedCart);
                } catch (e) {
                    console.error("Failed to parse cart", e);
                }
            }
            setIsLoaded(true);
        };

        loadCart();
    }, []);

    // Save to localStorage
    useEffect(() => {
        if (isLoaded) {
            const itemsToStore: StoredCartItem[] = cart.map(item => ({
                productId: item.id,
                quantity: item.quantity
            }));
            try {
                localStorage.setItem('srivari_cart', JSON.stringify(itemsToStore));
            } catch (e) {
                console.error("Cart storage quota exceeded", e);
            }
        }
    }, [cart, isLoaded]);

    const addToCart = (product: Product, quantity: number = 1) => {
        playBell();
        setCart((prev) => {
            const existingItem = prev.find(item => item.id === product.id);
            if (existingItem) {
                // Update quantity if exists
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            // Add new item
            return [...prev, {
                ...product,
                uniqueId: Math.random().toString(36).substr(2, 9),
                quantity: quantity
            }];
        });
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity < 1) {
            removeFromCart(productId);
            return;
        }
        setCart(prev => prev.map(item =>
            item.id === productId ? { ...item, quantity } : item
        ));
    };

    const removeFromCart = (productId: string) => {
        setCart((prev) => prev.filter((item) => item.id !== productId));
    };

    const clearCart = () => {
        setCart([]);
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}>
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
