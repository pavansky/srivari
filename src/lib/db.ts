import prisma from './prisma';
import { Product, Order } from '@/types';
import { products as initialProducts } from '@/data/products';

// --- Products ---

/**
 * Retrieves all products from the database, ordered by creation date (newest first).
 * If the database is empty, it seeds initial data from `@/data/products`.
 * 
 * @returns {Promise<Product[]>} List of products
 */
export async function getProducts(): Promise<Product[]> {
    try {
        let products = await prisma.product.findMany({
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
                        // hashtags removed
                    }
                });
            }
            // Re-fetch after seeding
            products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
        }

        return products.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            category: p.category,
            stock: p.stock,
            images: p.images as string[],
            isFeatured: p.isFeatured,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            video: p.video || undefined,
            priceCps: p.priceCps || undefined,
            shipping: p.shipping || undefined,
        }));
    } catch (error) {
        console.error("DB Error (Falling back to Mock Data):", error);
        // Fallback to initialProducts so the app works even offline/blocked
        return initialProducts.map(p => ({
            ...p,
            images: p.images,
            video: undefined,
            priceCps: undefined,
            shipping: undefined,
            createdAt: new Date(),
            updatedAt: new Date()
        }));
    }
}

/**
 * Saves a product to the database.
 * If the product exists (has a valid ID), it updates the existing record.
 * Otherwise, it creates a new product.
 * 
 * @param {Product} product - The product object to save
 * @returns {Promise<Product>} The saved product
 */
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
                    // hashtags removed (not in schema)
                    priceCps: product.priceCps,
                    shipping: product.shipping
                }
            });
        }
    }

    // Create new
    return await prisma.product.create({
        data: {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            stock: product.stock,
            images: product.images,
            isFeatured: product.isFeatured,
            // hashtags removed (not in schema)
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
    try {
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return orders.map(o => {
            const customer = o.customer as any;
            return {
                id: o.id,
                customerName: customer?.name || "Unknown",
                customerPhone: customer?.phone || "",
                customerEmail: customer?.email || "",
                totalAmount: o.total,
                status: o.status as 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled',
                date: o.createdAt.toISOString(),
                items: o.items as any[]
            };
        });
    } catch (error) {
        console.error("DB Error (Orders):", error);
        return [];
    }
}

export async function createOrder(order: Order) {
    // Start a transaction to ensure both order creation and stock deduction succeed or fail together
    return await prisma.$transaction(async (tx) => {
        // 1. Create the Order
        const newOrder = await tx.order.create({
            data: {
                id: order.id,
                userId: (order as any).userId, // Add userId link
                customer: {
                    name: order.customerName,
                    phone: order.customerPhone,
                    email: order.customerEmail,
                    address: (order as any).address // Store full address string in JSON for history
                },
                items: order.items,
                amount: order.totalAmount, // Assuming logic
                total: order.totalAmount,
                status: order.status,
                payment_method: (order as any).paymentMethod || "Razorpay"
            }
        });

        // 2. Deduct Stock for each item
        if (order.items && Array.isArray(order.items)) {
            for (const item of order.items) {
                if (item.productId && item.quantity) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: {
                                decrement: item.quantity
                            }
                        }
                    });
                }
            }
        }

        return newOrder;
    });
}

export async function getOrder(id: string): Promise<Order | null> {
    const order = await prisma.order.findUnique({
        where: { id }
    });
    if (!order) return null;
    const customer = order.customer as any;
    return {
        id: order.id,
        customerName: customer?.name || "",
        customerPhone: customer?.phone || "",
        customerEmail: customer?.email || "",
        totalAmount: order.total,
        status: order.status as any,
        date: order.createdAt.toISOString(),
        items: order.items as any[]
    };
}

export async function updateOrder(order: Order) {
    return await prisma.order.update({
        where: { id: order.id },
        data: {
            status: order.status,
        }
    });
}
