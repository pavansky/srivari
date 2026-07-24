export interface Product {
    id: string;
    sku?: string;
    barcode?: string;
    name: string;
    price: number;
    images: string[];
    video?: string;
    description: string;
    category: string;
    stock: number;
    lowStockThreshold?: number;
    locationBin?: string;
    isFeatured: boolean;
    hashtags?: string[];
    priceCps?: number; // Cost Price from Seller
    shipping?: number; // Shipping cost paid
    weight?: number; // Weight in kg
    supplierId?: string;
    supplierName?: string; // Convenience field for display
    createdAt?: string | Date;
    updatedAt?: string | Date;
    isArchived?: boolean;
}

export interface Collection {
    id: string;
    title: string;
    image: string;
    description: string;
}

export interface Order {
    id: string;
    userId?: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerAddress?: string;
    items: {
        productId: string;
        productName: string;
        quantity: number;
        price: number;
    }[];
    totalAmount: number;
    amount?: number; // Items subtotal
    shippingCost?: number;
    coupon?: { code: string; discount: number };
    date: string;
    status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Placed' | 'Paid';
    paymentMethod?: 'Razorpay' | 'COD' | 'WhatsApp' | 'Manual';
    paymentStatus?: 'Pending' | 'Paid' | 'Failed';
    razorpayOrderId?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    deliveryEta?: string;
}

export interface Review {
    id: string;
    productId: string;
    productName?: string;
    name: string;
    email?: string;
    rating: number;
    title?: string;
    comment: string;
    isApproved: boolean;
    createdAt: string | Date;
}

export interface Coupon {
    id: string;
    code: string;
    description?: string;
    type: 'PERCENT' | 'FLAT';
    value: number;
    minOrder: number;
    maxDiscount?: number;
    usageLimit?: number;
    usedCount: number;
    isActive: boolean;
    expiresAt?: string | Date | null;
    createdAt?: string | Date;
}

export interface Supplier {
    id: string;
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}
