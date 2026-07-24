import { getProducts, lastGetProductsError } from '@/lib/db';
import ShopClient from './ShopClient';
import { Metadata } from 'next';
import { Product } from '@/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "Shop Silk Sarees Online | Kanjivaram, Banarasi & Handloom",
    description: "Browse and buy authentic Kanjivaram silk, Banarasi, Mysore silk, and handloom sarees online. Free shipping on select orders. Curated collection of premium Indian bridal and festive sarees.",
    alternates: { canonical: "/shop" },
    openGraph: {
        title: "Shop Premium Silk Sarees | The Srivari",
        description: "Explore our curated collection of authentic handwoven silk sarees. Kanjivaram, Banarasi, Tussar, and more.",
        url: "https://thesrivari.com/shop",
    },
};

interface ShopSearchParams {
    category?: string;
    q?: string;
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<ShopSearchParams> }) {
    const { category, q } = await searchParams;

    // Fetch data directly from the DB on the server, stripping internal
    // cost/supplier fields so they never reach the client payload.
    const products = ((await getProducts()) as Product[]).map(
        ({ priceCps, shipping, supplierId, supplierName, locationBin, ...rest }) => rest as Product
    );
    // getProducts() returns [] on a DB failure; distinguish that outage from a
    // genuinely empty catalogue so the UI doesn't blame the user's filters.
    const dataUnavailable = products.length === 0 && !!lastGetProductsError;

    return (
        <ShopClient
            initialProducts={products}
            initialCategory={typeof category === 'string' ? category : undefined}
            initialQuery={typeof q === 'string' ? q : undefined}
            dataUnavailable={dataUnavailable}
        />
    );
}
