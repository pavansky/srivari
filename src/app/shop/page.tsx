import { getProducts } from '@/lib/db';
import ShopClient from './ShopClient';
import { Metadata } from 'next';

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

export default async function ShopPage() {
    // Fetch data directly from the DB on the server
    const products = await getProducts();

    return (
        <ShopClient initialProducts={products} />
    );
}
