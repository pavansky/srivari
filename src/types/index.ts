export interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    description: string;
    category: string;
    inStock: boolean;
}

export interface Collection {
    id: string;
    title: string;
    image: string;
    description: string;
}
