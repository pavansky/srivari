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
}

export interface Collection {
    id: string;
    title: string;
    image: string;
    description: string;
}
