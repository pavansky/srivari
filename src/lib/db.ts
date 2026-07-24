import prisma from './prisma';
import { Product, Order, Supplier } from '@/types';

// --- Products ---

/**
 * Retrieves all products from the database, ordered by creation date (newest first).
 * 
 * @returns {Promise<any[]>} List of products
 */
// Store last error for debug access
export let lastGetProductsError: string | null = null;

export async function getProducts(includeArchived: boolean = false): Promise<any[]> {
    lastGetProductsError = null;
    try {
        let products;
        try {
            // Tier 1: Full query with deletedAt filter + supplier relation
            const whereClause = includeArchived ? {} : { deletedAt: null };
            products = await prisma.product.findMany({
                where: whereClause as any,
                orderBy: { createdAt: 'desc' },
                include: { supplier: true }
            });
        } catch (tier1Error: any) {
            console.warn("getProducts Tier1 failed:", tier1Error?.message);
            try {
                // Tier 2: No filter, just supplier relation
                products = await prisma.product.findMany({
                    include: { supplier: true }
                });
            } catch (tier2Error: any) {
                console.warn("getProducts Tier2 failed:", tier2Error?.message);
                try {
                    // Tier 3: Absolute bare-bones — no options at all
                    products = await prisma.product.findMany();
                } catch (tier3Error: any) {
                    console.warn("getProducts Tier3 failed:", tier3Error?.message);
                    lastGetProductsError = `T1:${tier1Error?.message} | T2:${tier2Error?.message} | T3:${tier3Error?.message}`;
                    return [];
                }
            }
        }

        console.log(`getProducts: returning ${products.length} products`);

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
            images: p.images as string[] || [],
            isFeatured: p.isFeatured,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            video: p.video || undefined,
            priceCps: p.priceCps || undefined,
            shipping: p.shipping || undefined,
            supplierId: p.supplierId || undefined,
            supplierName: p.supplier?.name || undefined,
            isArchived: !!p.deletedAt,
        }));
    } catch (error: any) {
        console.error("getProducts FATAL:", error?.message);
        lastGetProductsError = `FATAL: ${error?.message}`;
        return [];
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
/**
 * Strips internal-only fields (cost price, shipping cost, supplier, warehouse
 * bin) before a product is serialized into any public payload — API responses
 * AND props passed to client components from server pages (RSC flight data is
 * visible to visitors).
 */
export function toPublicProduct<T extends Record<string, any>>(product: T) {
    const { priceCps, shipping, supplierId, supplierName, locationBin, ...publicFields } = product;
    return publicFields;
}

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
        video: (product.video && String(product.video).trim() !== "") ? String(product.video).trim() : null,
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

export async function restoreProduct(id: string) {
    // Restore softly deleted products
    await prisma.product.update({ 
        where: { id },
        data: { deletedAt: null } as any
    });
}

// --- Orders ---

// Orders in these statuses have had their stock decremented. 'Pending' means a
// Razorpay order that was created but never paid — stock is NOT reserved for it.
const STOCK_HOLDING_STATUSES = ['Placed', 'Paid', 'Shipped', 'Delivered'];

export async function getOrders(): Promise<Order[]> {
    try {
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return orders.map(o => {
            const customer = o.customer as any;
            return {
                id: o.id,
                userId: o.userId || undefined,
                customerName: customer?.name || "Unknown",
                customerPhone: customer?.phone || "",
                customerEmail: customer?.email || "",
                customerAddress: customer?.address || "",
                coupon: customer?.coupon || undefined,
                totalAmount: o.total,
                amount: o.amount,
                shippingCost: o.shipping_cost,
                status: o.status as Order['status'],
                paymentMethod: o.payment_method as any,
                trackingNumber: o.tracking_number || undefined,
                trackingUrl: o.tracking_url || undefined,
                deliveryEta: o.delivery_eta || undefined,
                date: o.createdAt.toISOString(),
                items: o.items as any[]
            };
        });
    } catch (error) {
        console.error("DB Error (Orders):", error);
        return [];
    }
}

/**
 * Creates an order. Stock is decremented atomically unless `skipStockDecrement`
 * is set — used for Razorpay orders, where stock is only taken once payment is
 * verified (see markOrderPaid) so abandoned checkouts don't leak inventory.
 */
export async function createOrder(order: Order, opts: { skipStockDecrement?: boolean } = {}) {
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
                    address: (order as any).address, // Store full address string in JSON for history
                    coupon: (order as any).coupon || undefined
                },
                items: order.items,
                amount: (order as any).amount ?? order.totalAmount,
                shipping_cost: (order as any).shippingCost ?? 0,
                total: order.totalAmount,
                status: order.status || 'Pending',
                payment_method: (order as any).paymentMethod || "Razorpay",
                razorpay_order_id: (order as any).razorpayOrderId
            }
        });

        // 2. Deduct Stock for each item — strict: concurrent orders can't oversell
        if (!opts.skipStockDecrement && order.items && Array.isArray(order.items)) {
            await adjustStockForOrder(tx, order.items, order.id, -1, { strict: true });
        }

        return newOrder;
    });
}

/**
 * Decrement (direction = -1) or restore (direction = +1) stock for order items.
 * With `strict`, a decrement only succeeds if enough stock exists at write time
 * (guards against concurrent-order oversell); insufficient stock throws
 * INSUFFICIENT_STOCK and rolls back the enclosing transaction. Non-strict mode
 * is for post-payment/admin flows where the money or decision already happened —
 * stock may go negative there, which surfaces the oversell to the admin instead
 * of failing a completed payment.
 */
async function adjustStockForOrder(tx: any, items: any[], orderId: string, direction: 1 | -1, opts: { strict?: boolean } = {}) {
    for (const item of items) {
        if (item.productId && item.quantity) {
            const qty = item.quantity * direction;

            if (direction === -1 && opts.strict) {
                const res = await tx.product.updateMany({
                    where: { id: item.productId, stock: { gte: item.quantity } },
                    data: { stock: { decrement: item.quantity } }
                });
                if (res.count === 0) {
                    const exists = await tx.product.findUnique({ where: { id: item.productId }, select: { name: true } });
                    if (exists) throw new Error(`INSUFFICIENT_STOCK:${exists.name}`);
                    console.warn(`Stock adjust skipped for missing product ${item.productId}`);
                    continue;
                }
            } else {
                try {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: qty } }
                    });
                } catch (e: any) {
                    // Product row gone (P2025) — don't fail the whole order update
                    console.warn(`Stock adjust skipped for ${item.productId}:`, e?.message);
                    continue;
                }
            }

            await tx.inventoryTransaction.create({
                data: {
                    productId: item.productId,
                    quantity: qty,
                    type: "ORDER",
                    actor: direction === -1 ? "Customer Order" : "Order Cancelled",
                    reference: orderId,
                    notes: direction === -1 ? `Order #${orderId}` : `Restock from cancelled #${orderId}`
                }
            });
        }
    }
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
        amount: order.amount,
        shippingCost: order.shipping_cost,
        status: order.status as any,
        date: order.createdAt.toISOString(),
        items: order.items as any[],
        paymentMethod: order.payment_method as any,
        razorpayOrderId: order.razorpay_order_id || undefined,
        trackingNumber: order.tracking_number || undefined,
        trackingUrl: order.tracking_url || undefined,
        deliveryEta: order.delivery_eta || undefined
    };
}

/**
 * Marks a Razorpay order as Paid after signature verification and takes the
 * stock it reserved. Idempotent: a second call for an already-paid order is a
 * no-op, so retried webhooks/verifications can't double-decrement — and a
 * Cancelled order is terminal (a replayed verify cannot resurrect it or take
 * stock again). The coupon's redemption count is consumed here, only once the
 * payment is real (offline orders redeem at creation instead).
 */
export async function updateOrderPayment(razorpayOrderId: string, paymentId: string) {
    const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.order.findUnique({ where: { razorpay_order_id: razorpayOrderId } });
        if (!existing) throw new Error(`Order not found for razorpay id ${razorpayOrderId}`);

        // Atomic claim of the Pending -> Paid transition: with two concurrent
        // verify calls (client callback + gateway webhook), only the one whose
        // conditional update matches a still-'Pending' row proceeds to take
        // stock — a plain read-then-write check would let both through.
        const claimed = await tx.order.updateMany({
            where: { razorpay_order_id: razorpayOrderId, status: 'Pending' },
            data: { status: 'Paid' }
        });
        if (claimed.count === 0) {
            return { order: existing, newlyPaid: false, couponCode: undefined as string | undefined };
        }

        // Non-strict: the customer has already paid — never fail the payment
        // over stock; a negative count surfaces the oversell to the admin.
        await adjustStockForOrder(tx, existing.items as any[], existing.id, -1);

        const updated = await tx.order.findUnique({ where: { razorpay_order_id: razorpayOrderId } });
        return { order: updated ?? existing, newlyPaid: true, couponCode: (existing.customer as any)?.coupon?.code as string | undefined };
    });

    // Outside the transaction: a missing Coupon table must never roll back a payment.
    if (result.newlyPaid && result.couponCode) {
        const { redeemCoupon } = await import('./coupons');
        await redeemCoupon(result.couponCode);
    }

    return result.order;
}

/**
 * Updates an order's status and/or tracking details. Cancelling an order whose
 * stock was decremented restores that stock (and re-cancelling is a no-op).
 */
export async function updateOrder(order: Partial<Order> & { id: string }) {
    return await prisma.$transaction(async (tx) => {
        const existing = await tx.order.findUnique({ where: { id: order.id } });
        if (!existing) throw new Error(`Order ${order.id} not found`);

        const data: any = {};
        if (order.status) data.status = order.status;
        if ((order as any).trackingNumber !== undefined) data.tracking_number = (order as any).trackingNumber || null;
        if ((order as any).trackingUrl !== undefined) data.tracking_url = (order as any).trackingUrl || null;
        if ((order as any).deliveryEta !== undefined) data.delivery_eta = (order as any).deliveryEta || null;

        const updated = await tx.order.update({
            where: { id: order.id },
            data
        });

        // Stock reconciliation on status transitions
        if (order.status && order.status !== existing.status) {
            const hadStock = STOCK_HOLDING_STATUSES.includes(existing.status);
            const hasStock = STOCK_HOLDING_STATUSES.includes(order.status);
            if (hadStock && !hasStock) {
                await adjustStockForOrder(tx, existing.items as any[], existing.id, 1);
            } else if (!hadStock && hasStock) {
                await adjustStockForOrder(tx, existing.items as any[], existing.id, -1);
            }
        }

        return updated;
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
