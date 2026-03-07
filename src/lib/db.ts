import prisma from './prisma';
import { Product, Order, Supplier } from '@/types';
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
            where: { deletedAt: null } as any,
            orderBy: { createdAt: 'desc' },
            include: { supplier: true }
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
            products = await prisma.product.findMany({ 
                where: { deletedAt: null } as any,
                orderBy: { createdAt: 'desc' }, 
                include: { supplier: true } 
            });
        }

        return products.map((p: any) => ({
            id: p.id,
            sku: p.sku || undefined,
            barcode: p.barcode || undefined,
            name: p.name,
            description: p.description,
            price: p.price,
            category: p.category,
            stock: p.stock,
            lowStockThreshold: p.lowStockThreshold ?? 5,
            locationBin: p.locationBin || undefined,
            images: p.images as string[],
            isFeatured: p.isFeatured,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            video: p.video || undefined,
            priceCps: p.priceCps || undefined,
            shipping: p.shipping || undefined,
            supplierId: p.supplierId || undefined,
            supplierName: p.supplier?.name || undefined,
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
            locationBin: undefined,
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
export async function saveProduct(product: any) {
    // Normalize data: ensure numbers are numbers and optional strings are handled
    const normalizedData = {
        name: product.name,
        sku: (product.sku && product.sku.trim() !== "") ? product.sku : null,
        barcode: (product.barcode && product.barcode.trim() !== "") ? product.barcode : null,
        description: product.description,
        price: Number(product.price) || 0,
        category: product.category,
        stock: Number(product.stock) || 0,
        lowStockThreshold: Number(product.lowStockThreshold) || 5,
        images: product.images,
        isFeatured: Boolean(product.isFeatured),
        priceCps: product.priceCps ? Number(product.priceCps) : null,
        shipping: product.shipping ? Number(product.shipping) : null,
        locationBin: (product.locationBin && product.locationBin.trim() !== "") ? product.locationBin : null,
        supplierId: (product.supplierId && product.supplierId.trim() !== "") ? product.supplierId : null
    };

    if (product.id) {
        // Check if exists
        const exists = await prisma.product.findUnique({ where: { id: product.id } });
        if (exists) {
            console.log(`Updating existing product: ${product.id}`);
            
            // Start transaction to log stock change if applicable
            return await prisma.$transaction(async (tx) => {
                const stockDiff = normalizedData.stock - exists.stock;
                
                const updatedProduct = await tx.product.update({
                    where: { id: product.id },
                    data: normalizedData
                });

                if (stockDiff !== 0) {
                     await (tx as any).inventoryTransaction.create({
                         data: {
                             productId: product.id,
                             quantity: stockDiff,
                             type: "MANUAL",
                             actor: product.actor || "System/Admin", // Pass 'actor' via payload if available
                             notes: `Manual stock update: ${stockDiff > 0 ? '+' : ''}${stockDiff}`
                         }
                     });
                }

                return updatedProduct;
            });
        }
    }

    // Create new
    console.log("Creating new product");
    return await prisma.$transaction(async (tx) => {
        const newProduct = await tx.product.create({
            data: {
                ...normalizedData,
                id: product.id || undefined,
            }
        });

        // Log initial stock if > 0
        if (newProduct.stock > 0) {
            await (tx as any).inventoryTransaction.create({
                 data: {
                     productId: newProduct.id,
                     quantity: newProduct.stock,
                     type: "RESTOCK",
                     actor: product.actor || "System/Admin",
                     notes: "Initial inventory setup"
                 }
            });
        }

        return newProduct;
    });
}

export async function deleteProduct(id: string) {
    // Soft delete instead of physical deletion
    await prisma.product.update({ 
        where: { id },
        data: { deletedAt: new Date() } as any
    });
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
                status: order.status || 'Pending',
                payment_method: (order as any).paymentMethod || "Razorpay",
                razorpay_order_id: (order as any).razorpayOrderId
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

                    // Log InventoryTransaction
                    await (tx as any).inventoryTransaction.create({
                         data: {
                             productId: item.productId,
                             quantity: -item.quantity,
                             type: "ORDER",
                             actor: "Customer Order",
                             reference: order.id,
                             notes: `Order #${order.id}`
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
        customerAddress: customer?.address || "",
        totalAmount: order.total,
        status: order.status as any,
        date: order.createdAt.toISOString(),
        items: order.items as any[],
        paymentMethod: order.payment_method as any,
        razorpayOrderId: order.razorpay_order_id || undefined
    };
}

export async function updateOrderPayment(razorpayOrderId: string, paymentId: string) {
    return await prisma.order.update({
        where: { razorpay_order_id: razorpayOrderId },
        data: {
            status: 'Paid',
            // Store payment ID in metadata if needed
        }
    });
}

export async function updateOrder(order: Partial<Order> & { id: string }) {
    return await prisma.order.update({
        where: { id: order.id },
        data: {
            status: order.status
        }
    });
}

// --- Suppliers ---

export async function getSuppliers(): Promise<Supplier[]> {
    try {
        const suppliers = await prisma.supplier.findMany({
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { products: true } } }
        });
        return suppliers.map((s: any) => ({
            id: s.id,
            name: s.name,
            contactName: s.contactName || undefined,
            email: s.email || undefined,
            phone: s.phone || undefined,
            address: s.address || undefined,
            notes: s.notes || undefined,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
            productCount: s._count?.products || 0,
        }));
    } catch (error) {
        console.error("DB Error (Suppliers):", error);
        return [];
    }
}

export async function saveSupplier(supplier: Supplier) {
    if (supplier.id) {
        const exists = await prisma.supplier.findUnique({ where: { id: supplier.id } });
        if (exists) {
            return await prisma.supplier.update({
                where: { id: supplier.id },
                data: {
                    name: supplier.name,
                    contactName: supplier.contactName,
                    email: supplier.email,
                    phone: supplier.phone,
                    address: supplier.address,
                    notes: supplier.notes,
                }
            });
        }
    }
    return await prisma.supplier.create({
        data: {
            name: supplier.name,
            contactName: supplier.contactName,
            email: supplier.email,
            phone: supplier.phone,
            address: supplier.address,
            notes: supplier.notes,
        }
    });
}

export async function deleteSupplier(id: string) {
    // Unlink products first, then delete
    await prisma.product.updateMany({
        where: { supplierId: id },
        data: { supplierId: null }
    });
    await prisma.supplier.delete({ where: { id } });
}
