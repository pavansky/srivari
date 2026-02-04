import { getProducts } from '@/lib/db';
import ShopClient from './ShopClient';

export default async function ShopPage() {
    // Fetch data directly from the DB on the server
    const products = await getProducts();

    return (
        <ShopClient initialProducts={products} />
    );
}
