export interface Product {
    id: string;
    name: string;
    price: number;
    images: string[];
    video?: string;
    description: string;
    category: string;
    stock: number;
    isFeatured: boolean;
    priceCps?: number; // Cost Price from Seller
    shipping?: number; // Shipping cost paid
}

export interface Collection {
    id: string;
    title: string;
    image: string;
    description: string;
}

export interface Order {
    id: string;
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
    date: string;
    status: 'Pending' | 'Completed' | 'Cancelled';
}
