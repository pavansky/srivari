import fs from 'fs';
import path from 'path';

const ORDER_FILE = path.join(process.cwd(), 'data', 'orders.json');

export interface OrderItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
}

export interface Order {
    id: string; // Internal ID (e.g. ORD-123)
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

// Ensure DB exists
const ensureDB = () => {
    const dir = path.dirname(ORDER_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(ORDER_FILE)) fs.writeFileSync(ORDER_FILE, '[]');
};

// Create Order
export const createOrder = async (orderData: Partial<Order>): Promise<Order> => {
    ensureDB();
    const orders: Order[] = JSON.parse(fs.readFileSync(ORDER_FILE, 'utf8'));

    const newOrder: Order = {
        id: `SR-${Date.now().toString().slice(-6)}`,
        customer: orderData.customer!,
        items: orderData.items!,
        amount: orderData.amount || 0,
        shipping_cost: orderData.shipping_cost || 0,
        total: (orderData.amount || 0) + (orderData.shipping_cost || 0),
        status: 'Pending',
        created_at: new Date().toISOString(),
        payment_method: orderData.payment_method || 'Razorpay',
        razorpay_order_id: orderData.razorpay_order_id
    };

    orders.unshift(newOrder); // Add to top
    fs.writeFileSync(ORDER_FILE, JSON.stringify(orders, null, 2));
    return newOrder;
};

// Update Order Payment Status
export const updateOrderPayment = async (razorpayOrderId: string, paymentId: string) => {
    ensureDB();
    const orders: Order[] = JSON.parse(fs.readFileSync(ORDER_FILE, 'utf8'));

    // Find order
    const index = orders.findIndex(o => o.razorpay_order_id === razorpayOrderId);
    if (index !== -1) {
        orders[index].status = 'Paid';
        // You could add paymentId to the record if you updated the interface
        fs.writeFileSync(ORDER_FILE, JSON.stringify(orders, null, 2));
        return true;
    }
    return false;
};

// Update Order by ID (Generic)
export const updateOrder = async (id: string, updates: Partial<Order>) => {
    ensureDB();
    const orders: Order[] = JSON.parse(fs.readFileSync(ORDER_FILE, 'utf8'));

    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
        orders[index] = { ...orders[index], ...updates };
        fs.writeFileSync(ORDER_FILE, JSON.stringify(orders, null, 2));
        return true;
    }
    return false;
};

// Get All Orders
export const getOrders = async (): Promise<Order[]> => {
    ensureDB();
    return JSON.parse(fs.readFileSync(ORDER_FILE, 'utf8'));
};
