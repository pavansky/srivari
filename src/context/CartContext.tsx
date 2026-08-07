"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Product } from "@/types";
import { useAudio } from "@/context/AudioContext";
import {
    BLOUSE_CODE,
    addOnsTotal,
    normalizeAddOnCodes,
    sanitizeMeasurements,
} from "@/config/customization";

// We only store the ID, quantity and the chosen finishing add-ons in
// localStorage to save space. `options`/`measurements` were added later — carts
// saved before that have neither, so both are optional and read defensively.
interface StoredCartItem {
    productId: string;
    quantity: number;
    /** Add-on codes from config/customization (fall_pico, blouse_stitch, …). */
    options?: string[];
    /** Blouse measurements in inches, only meaningful with blouse_stitch. */
    measurements?: Record<string, string>;
}

// The app uses the full product details
export interface CartItem extends Product {
    /** Stable line key — the same saree with different finishing is a separate line. */
    uniqueId: string;
    quantity: number;
    options: string[];
    measurements?: Record<string, string>;
}

/**
 * Identity of a cart line. Two lines of the same saree with different add-ons
 * must stay apart (one plain, one with a stitched blouse), so the key is the
 * product id plus its add-ons in a canonical order.
 */
export function lineKey(productId: string, options: readonly string[] = []): string {
    return `${productId}::${[...options].sort().join(",")}`;
}

/** Saree + add-ons for a single piece, in integer rupees. */
export function lineUnitPrice(item: Pick<CartItem, "price" | "options">): number {
    return item.price + addOnsTotal(item.options || []);
}

/** What this line contributes to the subtotal. */
export function lineTotal(item: Pick<CartItem, "price" | "options" | "quantity">): number {
    return lineUnitPrice(item) * item.quantity;
}

interface CartContextType {
    cart: CartItem[];
    /** `options` are add-on codes; unknown codes are dropped server-side too. */
    addToCart: (
        product: Product,
        quantity?: number,
        options?: string[],
        measurements?: Record<string, string>
    ) => void;
    /** Omit `options` to remove every line of that product. */
    removeFromCart: (productId: string, options?: string[]) => void;
    /** Omit `options` to target that product's first line. */
    updateQuantity: (productId: string, quantity: number, options?: string[]) => void;
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

                    // 1. Fold any duplicate lines together first, keyed on the
                    //    product AND its add-ons.
                    const merged = new Map<string, { productId: string; quantity: number; options: string[]; measurements?: Record<string, string> }>();
                    for (const item of Array.isArray(storedItems) ? storedItems : []) {
                        const pid = item?.productId || (item as any)?.id;
                        if (!pid) continue;
                        // A cart saved before add-ons existed simply has none.
                        const options = normalizeAddOnCodes(item?.options);
                        const key = lineKey(pid, options);
                        const quantity = Math.max(1, Number(item?.quantity) || 1);
                        const existing = merged.get(key);
                        if (existing) {
                            existing.quantity += quantity;
                        } else {
                            merged.set(key, {
                                productId: pid,
                                quantity,
                                options,
                                measurements: options.includes(BLOUSE_CODE)
                                    ? sanitizeMeasurements(item?.measurements)
                                    : undefined,
                            });
                        }
                    }

                    // 2. Deleted or sold-out products drop out; quantities are
                    //    clamped to the stock available right now, counted
                    //    across every line of the same saree.
                    const hydratedCart: CartItem[] = [];
                    const claimed = new Map<string, number>();
                    for (const [key, line] of merged) {
                        const product = getProductById(line.productId, allProducts);
                        const stock = product?.stock || 0;
                        if (!product || stock <= 0) continue;

                        const room = stock - (claimed.get(line.productId) || 0);
                        if (room <= 0) continue;

                        const quantity = Math.min(line.quantity, room);
                        claimed.set(line.productId, (claimed.get(line.productId) || 0) + quantity);
                        hydratedCart.push({
                            ...product,
                            uniqueId: key,
                            quantity,
                            options: line.options,
                            measurements: line.measurements,
                        });
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
                quantity: item.quantity,
                // Omitted entirely when empty, so a plain cart stays exactly as
                // small as it was before add-ons existed.
                ...(item.options?.length ? { options: item.options } : {}),
                ...(item.measurements && Object.keys(item.measurements).length
                    ? { measurements: item.measurements }
                    : {}),
            }));
            try {
                localStorage.setItem('srivari_cart', JSON.stringify(itemsToStore));
            } catch (e) {
                console.error("Cart storage quota exceeded", e);
            }
        }
    }, [cart, isLoaded, canPersist]);

    const addToCart = (
        product: Product,
        quantity: number = 1,
        options: string[] = [],
        measurements?: Record<string, string>
    ) => {
        playBell();
        setCanPersist(true);

        const codes = normalizeAddOnCodes(options);
        const cleanMeasurements = codes.includes(BLOUSE_CODE)
            ? sanitizeMeasurements(measurements)
            : {};
        const key = lineKey(product.id, codes);

        setCart((prev) => {
            // Strict inventory check across every line of this saree — two
            // differently-finished lines still draw on the same single stock.
            const held = prev.reduce((sum, item) => sum + (item.id === product.id ? item.quantity : 0), 0);
            const room = Math.max(0, (product.stock || 0) - held);
            if (room <= 0) {
                console.warn(`Cannot add more than available stock (${product.stock})`);
                return prev;
            }
            const toAdd = Math.min(Math.max(1, quantity), room);

            const existing = prev.find(item => item.uniqueId === key);
            if (existing) {
                return prev.map(item =>
                    item.uniqueId === key
                        ? {
                            ...item,
                            quantity: item.quantity + toAdd,
                            // A fresh set of measurements replaces the old one;
                            // an empty one leaves what is already recorded.
                            measurements: Object.keys(cleanMeasurements).length
                                ? cleanMeasurements
                                : item.measurements,
                        }
                        : item
                );
            }

            return [...prev, {
                ...product,
                uniqueId: key,
                quantity: toAdd,
                options: codes,
                measurements: Object.keys(cleanMeasurements).length ? cleanMeasurements : undefined,
            }];
        });
    };

    const updateQuantity = (productId: string, quantity: number, options?: string[]) => {
        if (quantity < 1) {
            removeFromCart(productId, options);
            return;
        }
        setCanPersist(true);

        const key = options ? lineKey(productId, normalizeAddOnCodes(options)) : null;

        setCart(prev => {
            const target = key
                ? prev.find(item => item.uniqueId === key)
                : prev.find(item => item.id === productId);
            if (!target) return prev;

            // Other lines of the same saree already hold part of the stock.
            const heldElsewhere = prev.reduce(
                (sum, item) =>
                    sum + (item.id === productId && item.uniqueId !== target.uniqueId ? item.quantity : 0),
                0
            );
            const capped = Math.min(quantity, Math.max(0, (target.stock || 0) - heldElsewhere));
            if (capped < 1) return prev.filter(item => item.uniqueId !== target.uniqueId);

            return prev.map(item =>
                item.uniqueId === target.uniqueId ? { ...item, quantity: capped } : item
            );
        });
    };

    const removeFromCart = (productId: string, options?: string[]) => {
        setCanPersist(true);
        const key = options ? lineKey(productId, normalizeAddOnCodes(options)) : null;
        setCart((prev) =>
            prev.filter((item) => (key ? item.uniqueId !== key : item.id !== productId))
        );
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
