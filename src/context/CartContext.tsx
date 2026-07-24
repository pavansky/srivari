"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Product } from "@/types";
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
    // Persist only after a successful hydration OR a deliberate user change —
    // a failed /api/products fetch must never overwrite the saved cart with [].
    const [canPersist, setCanPersist] = useState(false);
    const { playBell } = useAudio();

    // Helper to find a product by ID from localStorage or static data
    const getProductById = (id: string, allProducts: Product[]): Product | undefined => {
        return allProducts.find(p => p.id === id);
    };

    // Load from localStorage
    useEffect(() => {
        const loadCart = async () => {
            const storedCartJSON = localStorage.getItem('srivari_cart');

            // Fetch live products from the DB API
            let allProducts: Product[] = [];
            let fetchOk = false;
            try {
                const res = await fetch(`/api/products?t=${Date.now()}`);
                if (res.ok) {
                    allProducts = await res.json();
                    fetchOk = allProducts.length > 0;
                }
            } catch (e) {
                console.error("Failed to fetch products for cart hydration", e);
            }

            if (storedCartJSON && fetchOk) {
                try {
                    const storedItems: StoredCartItem[] = JSON.parse(storedCartJSON);
                    const hydratedCart: CartItem[] = [];

                    for (const item of storedItems) {
                        const pid = item.productId || (item as any).id;
                        const product = getProductById(pid, allProducts);

                        // Deleted or sold-out products drop out; quantities are
                        // clamped to the stock available right now.
                        if (product && (product.stock || 0) > 0) {
                            hydratedCart.push({
                                ...product,
                                uniqueId: Math.random().toString(36).substr(2, 9),
                                quantity: Math.min(item.quantity || 1, product.stock)
                            });
                        }
                    }

                    setCart(hydratedCart);
                    setCanPersist(true);
                } catch (e) {
                    console.error("Failed to parse cart", e);
                    setCanPersist(true); // corrupted JSON — safe to overwrite
                }
            } else if (!storedCartJSON) {
                setCanPersist(true); // nothing saved yet — nothing to protect
            }
            // else: fetch failed with a saved cart — keep storage untouched
            // until the user actively modifies the cart this session.
            setIsLoaded(true);
        };

        loadCart();
    }, []);

    // Save to localStorage
    useEffect(() => {
        if (isLoaded && canPersist) {
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
    }, [cart, isLoaded, canPersist]);

    const addToCart = (product: Product, quantity: number = 1) => {
        playBell();
        setCanPersist(true);
        setCart((prev) => {
            const existingItem = prev.find(item => item.id === product.id);
            const currentQty = existingItem ? existingItem.quantity : 0;
            const newTotalQty = currentQty + quantity;

            // Strict Inventory Check
            if (newTotalQty > (product.stock || 0)) {
                console.warn(`Cannot add more than available stock (${product.stock})`);
                const maxAddable = Math.max(0, product.stock - currentQty);
                if (maxAddable <= 0) return prev; // Already at max

                if (existingItem) {
                    return prev.map(item =>
                        item.id === product.id ? { ...item, quantity: product.stock } : item
                    );
                }
                return [...prev, {
                    ...product,
                    uniqueId: Math.random().toString(36).substr(2, 9),
                    quantity: product.stock
                }];
            }

            if (existingItem) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
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

        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                // Ensure we don't exceed stock
                const cappedQty = Math.min(quantity, item.stock || 0);
                return { ...item, quantity: cappedQty };
            }
            return item;
        }));
    };

    const removeFromCart = (productId: string) => {
        setCanPersist(true);
        setCart((prev) => prev.filter((item) => item.id !== productId));
    };

    const clearCart = () => {
        setCanPersist(true);
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
