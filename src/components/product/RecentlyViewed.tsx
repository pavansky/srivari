"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types";
import ProductCard from "@/components/ProductCard";
import SectionHeader from "@/components/ui/SectionHeader";
import ZariDivider from "@/components/ui/ZariDivider";

const STORAGE_KEY = "srivari_recently_viewed";
const MAX_ITEMS = 8;

function readStoredIds(): string[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
        return [];
    }
}

/**
 * Records the current product as "viewed" and renders the visitor's
 * recently viewed pieces (excluding the one they're currently on).
 */
export default function RecentlyViewed({ currentProductId }: { currentProductId: string }) {
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        // 1. Record the current product (most recent first, capped)
        const previous = readStoredIds().filter((id) => id !== currentProductId);
        const nextIds = [currentProductId, ...previous].slice(0, MAX_ITEMS);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds));
        } catch {
            // Storage unavailable — the strip simply won't persist
        }

        // 2. Hydrate the strip from the live catalogue (excluding the current piece)
        const idsToShow = nextIds.filter((id) => id !== currentProductId);
        if (idsToShow.length === 0) return;

        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/products");
                if (!res.ok) return;
                const all: Product[] = await res.json();
                if (cancelled) return;
                const byId = new Map(all.map((p) => [String(p.id), p]));
                const hydrated = idsToShow
                    .map((id) => byId.get(id))
                    .filter((p): p is Product => Boolean(p));
                setProducts(hydrated);
            } catch {
                // Silent — this strip is a nice-to-have
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [currentProductId]);

    if (products.length === 0) return null;

    return (
        <>
            <ZariDivider tone="light" className="container mx-auto px-4" />
            <section className="container mx-auto px-4 md:px-6 py-28" aria-label="Recently viewed">
                <SectionHeader
                    tone="light"
                    kicker="Your Journey"
                    title="Recently Viewed"
                    accent="Viewed"
                    className="mb-14"
                />
                <div className="flex gap-6 overflow-x-auto pb-4 snap-x scrollbar-hide">
                    {products.map((product) => (
                        <div key={product.id} className="w-64 sm:w-72 flex-shrink-0 snap-start">
                            <ProductCard product={product} tone="light" />
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}
