"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Product } from "@/types";
import { products as initialProducts } from "@/data/products";

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

    // Helper to find a product by ID from localStorage or static data
    const getProductById = (id: string, allProducts: Product[]): Product | undefined => {
        return allProducts.find(p => p.id === id);
    };

    // Load from localStorage
    useEffect(() => {
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
                // Handle legacy format (array of objects with potentially missing quantity)
                const storedItems: any[] = JSON.parse(storedCartJSON);
                const hydratedCart: CartItem[] = [];

                // Reduce legacy items (if duplicates existed) or just load them
                // Ideally, we start fresh or migrate. Let's try to migrate on load.
                const tempMap = new Map<string, number>();

                storedItems.forEach(item => {
                    const pid = item.productId || item.id; // Handle older formats if any
                    const qty = item.quantity || 1;
                    if (pid) {
                        tempMap.set(pid, (tempMap.get(pid) || 0) + qty);
                    }
                });

                tempMap.forEach((qty, pid) => {
                    const product = getProductById(pid, allProducts);
                    if (product) {
                        hydratedCart.push({
                            ...product,
                            uniqueId: Math.random().toString(36).substr(2, 9),
                            quantity: qty
                        });
                    }
                });

                setCart(hydratedCart);
            } catch (e) {
                console.error("Failed to parse cart", e);
            }
        }
        setIsLoaded(true);
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
