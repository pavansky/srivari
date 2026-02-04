import prisma from './prisma';
import { Product, Order } from '@/types';
import { products as initialProducts } from '@/data/products';

// --- Products ---
export async function getProducts(): Promise<Product[]> {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Auto-seed if empty (so Admin isn't blank for the user)
        if (products.length === 0) {
            console.log("Seeding initial products...");
            // We can't use createMany because of potential SQLite/Postgres differences in some envs, 
            // but here we are on Postgres so createMany is fine.
            // However, let's just map them.

            for (const p of initialProducts) {
                await prisma.product.create({
                    data: {
                        id: p.id,
                        name: p.name,
                        description: p.description,
                        price: p.price,
                        category: p.category,
                        stock: p.stock,
                        images: p.images,
                        isFeatured: p.isFeatured,
                        hashtags: p.hashtags
                    }
                });
            }
            return await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
        }

        return products.map(p => ({
            ...p,
            images: p.images as string[], // Cast JSON to string array
            hashtags: p.hashtags as string[]
        }));
    } catch (error) {
        console.error("DB Error:", error);
        return [];
    }
}

export async function saveProduct(product: Product) {
    if (product.id && product.id.length > 10) {
        // Likely a UUID or existing ID
        // Check if exists
        const exists = await prisma.product.findUnique({ where: { id: product.id } });
        if (exists) {
            return await prisma.product.update({
                where: { id: product.id },
                data: {
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    category: product.category,
                    stock: product.stock,
                    images: product.images,
                    isFeatured: product.isFeatured,
                    hashtags: product.hashtags,
                    priceCps: product.priceCps,
                    shipping: product.shipping
                }
            });
        }
    }

    // Create new
    return await prisma.product.create({
        data: {
            id: product.id, // Optional, Prisma generates if missing usually, but our schema might have it string
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            stock: product.stock,
            images: product.images,
            isFeatured: product.isFeatured,
            hashtags: product.hashtags,
            priceCps: product.priceCps,
            shipping: product.shipping
        }
    });
}

export async function deleteProduct(id: string) {
    await prisma.product.delete({ where: { id } });
}

// --- Orders ---
export async function getOrders(): Promise<Order[]> {
    const orders = await prisma.order.findMany({
        orderBy: { date: 'desc' }
    });
    return orders.map(o => ({
        ...o,
        items: o.items as any[] // Start schema as JSON
    }));
}

export async function createOrder(order: Order) {
    return await prisma.order.create({
        data: {
            id: order.id,
            customerName: order.customerName,
            customerEmail: order.customerEmail || "",
            customerPhone: order.customerPhone,
            totalAmount: order.totalAmount,
            status: order.status,
            date: new Date(order.date),
            items: order.items
        }
    });
}

export async function updateOrder(order: Order) {
    return await prisma.order.update({
        where: { id: order.id },
        data: {
            status: order.status,
            // Allow updating other fields if needed
        }
    });
}
