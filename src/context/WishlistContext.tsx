"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product } from "@/types";

interface WishlistContextType {
    wishlist: Product[];
    addToWishlist: (product: Product) => void;
    removeFromWishlist: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
    const [wishlist, setWishlist] = useState<Product[]>([]);

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
    }, []);

    // Save to LocalStorage on change
    useEffect(() => {
        localStorage.setItem("srivari_wishlist", JSON.stringify(wishlist));
    }, [wishlist]);

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

    return (
        <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist }}>
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
