"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Product } from "@/types";

interface WishlistContextType {
    wishlist: Product[];
    addToWishlist: (product: Product) => void;
    removeFromWishlist: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;
    /**
     * Re-syncs saved wishlist entries against the live catalogue:
     * updates price/stock/images and drops products that no longer exist.
     */
    refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from LocalStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem("srivari_wishlist");
        if (stored) {
            try {
                setWishlist(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to load wishlist", e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to LocalStorage on change (only after the initial load)
    useEffect(() => {
        if (!isLoaded) return;
        try {
            localStorage.setItem("srivari_wishlist", JSON.stringify(wishlist));
        } catch (e) {
            console.error("Failed to persist wishlist", e);
        }
    }, [wishlist, isLoaded]);

    const addToWishlist = (product: Product) => {
        setWishlist((prev) => {
            if (prev.some((p) => p.id === product.id)) return prev;
            return [...prev, product];
        });
    };

    const removeFromWishlist = (productId: string) => {
        setWishlist((prev) => prev.filter((p) => p.id !== productId));
    };

    const isInWishlist = (productId: string) => {
        return wishlist.some((p) => p.id === productId);
    };

    const refreshWishlist = useCallback(async () => {
        try {
            const res = await fetch("/api/products");
            if (!res.ok) return;
            const products: Product[] = await res.json();
            // A DB hiccup returns 200 with [] (getProducts never throws) —
            // treat that as "no data", not "everything was deleted".
            if (!Array.isArray(products) || products.length === 0) return;
            setWishlist((prev) =>
                prev
                    .map((item) => products.find((p) => String(p.id) === String(item.id)))
                    .filter((p): p is Product => Boolean(p))
            );
        } catch (e) {
            console.error("Failed to refresh wishlist", e);
        }
    }, []);

    return (
        <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, refreshWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error("useWishlist must be used within a WishlistProvider");
    }
    return context;
};
