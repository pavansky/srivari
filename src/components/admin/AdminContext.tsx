"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Product, Order, Supplier } from "@/types";

/* Shared data layer for all admin pages: one fetch cycle, one refresh knob.
   All admin API calls ride the Supabase session cookie (same-origin). */

const DEFAULT_CATEGORIES = ["Silk", "Banarasi", "Cotton", "Mysore Silk", "Tussar"];

interface AdminData {
    products: Product[];
    orders: Order[];
    suppliers: Supplier[];
    categories: string[];
    isLoaded: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    addCategory: (name: string) => void;
}

const AdminDataContext = createContext<AdminData>({
    products: [], orders: [], suppliers: [], categories: DEFAULT_CATEGORIES,
    isLoaded: false, error: null, refresh: async () => {}, addCategory: () => {},
});

export const useAdminData = () => useContext(AdminDataContext);

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [extraCategories, setExtraCategories] = useState<string[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setError(null);
        try {
            const t = Date.now();
            const [pRes, oRes, sRes] = await Promise.all([
                fetch(`/api/products?archived=true&t=${t}`),
                fetch(`/api/orders?t=${t}`),
                fetch(`/api/admin/suppliers?t=${t}`),
            ]);

            // A route returns 200 + [] even during a DB outage (resilience), but
            // flags it with X-Data-Unavailable so we show an error instead of a
            // healthy-looking empty console.
            const outage = pRes.headers.get('X-Data-Unavailable') === '1'
                || oRes.headers.get('X-Data-Unavailable') === '1'
                || sRes.headers.get('X-Data-Unavailable') === '1';

            if (pRes.ok) setProducts(await pRes.json());
            else {
                const errData = await pRes.json().catch(() => ({}));
                setError(`Failed to load products: ${errData.details || errData.error || pRes.statusText}`);
            }

            if (oRes.ok) setOrders(await oRes.json());
            else if (oRes.status === 401) setError("Session expired — please log in again.");

            if (sRes.ok) setSuppliers(await sRes.json());

            if (outage) setError("Some data couldn't be loaded — the database may be temporarily unavailable. Figures below may be incomplete.");
        } catch (e) {
            console.error("Admin data load failed", e);
            setError("Network Error: Could not reach API.");
        } finally {
            setIsLoaded(true);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const categories = useMemo(() => {
        const fromProducts = products.map(p => p.category).filter(Boolean);
        return Array.from(new Set([...DEFAULT_CATEGORIES, ...fromProducts, ...extraCategories]));
    }, [products, extraCategories]);

    const addCategory = useCallback((name: string) => {
        setExtraCategories(prev => (prev.includes(name) ? prev : [...prev, name]));
    }, []);

    return (
        <AdminDataContext.Provider value={{ products, orders, suppliers, categories, isLoaded, error, refresh, addCategory }}>
            {children}
        </AdminDataContext.Provider>
    );
}

/* --- Shared admin helpers --- */

export const calculateMargin = (selling: number, cost: number = 0, shipping: number = 0) => {
    const totalCost = cost + shipping;
    const profit = selling - totalCost;
    const margin = selling > 0 ? (profit / selling) * 100 : 0;
    return { profit, margin };
};

export const formatINR = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

export function exportCSV(filename: string, header: string[], rows: (string | number | boolean | undefined)[][]) {
    const escape = (v: string | number | boolean | undefined) =>
        `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [header.map(escape).join(","), ...rows.map(r => r.map(escape).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
