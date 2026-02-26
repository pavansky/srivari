import prisma from './prisma';

export interface OrderItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
}

export interface Order {
    id: string; // Internal ID (e.g. SR-123456)
    razorpay_order_id?: string;
    customer: {
        name: string;
        email: string;
        phone: string;
        address: string;
    };
    items: OrderItem[];
    amount: number; // Subtotal
    shipping_cost: number;
    total: number;
    status: 'Pending' | 'Paid' | 'Shipped' | 'Delivered' | 'Cancelled';
    created_at: string;
    payment_method: 'Razorpay' | 'WhatsApp';
}

// Create Order
export const createOrder = async (orderData: Partial<Order>): Promise<Order> => {
    // Generate ID: SR-xxxxxx
    const id = `SR-${Date.now().toString().slice(-6)}`;

    // Create in Prisma
    const newOrder = await prisma.order.create({
        data: {
            id,
            razorpay_order_id: orderData.razorpay_order_id,
            customer: orderData.customer as any, // Cast to any for Json type
            items: orderData.items as any,
            amount: orderData.amount || 0,
            shipping_cost: orderData.shipping_cost || 0,
            total: (orderData.amount || 0) + (orderData.shipping_cost || 0),
            status: 'Pending',
            payment_method: orderData.payment_method || 'Razorpay',
        }
    });

    // Map Prisma result back to our Interface (date handling etc)
    return {
        ...newOrder,
        customer: newOrder.customer as any,
        items: newOrder.items as unknown as OrderItem[],
        status: newOrder.status as any,
        created_at: newOrder.createdAt.toISOString(),
        payment_method: newOrder.payment_method as any
    } as Order;
};

// Update Order Payment Status
export const updateOrderPayment = async (razorpayOrderId: string, paymentId: string) => {
    try {
        await prisma.order.update({
            where: { razorpay_order_id: razorpayOrderId },
            data: { status: 'Paid' }
        });
        return true;
    } catch (e) {
        return false;
    }
};

// Update Order by ID (Generic)
export const updateOrder = async (id: string, updates: Partial<Order>) => {
    try {
        await prisma.order.update({
            where: { id },
            data: {
                status: updates.status,
                // Add other fields if needed
            }
        });
        return true;
    } catch (e) {
        return false;
    }
};

// Get All Orders
export const getOrders = async (): Promise<Order[]> => {
    const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' }
    });

    return orders.map(o => ({
        ...o,
        razorpay_order_id: o.razorpay_order_id ?? undefined,
        customer: o.customer as any,
        items: o.items as unknown as OrderItem[],
        status: o.status as any,
        created_at: o.createdAt.toISOString(),
        payment_method: o.payment_method as any
    } as Order));
};
