import { Product } from '@/types';

export const products: Product[] = [
    {
        id: '1',
        name: 'Royal Kanjivaram Silk - Maroon & Gold',
        price: 25000,
        image: 'https://images.unsplash.com/photo-1610189012906-4783fda3ad4a?q=80&w=800&auto=format&fit=crop', // Saree texture/look
        description: 'A pure Kanjivaram silk saree featuring intricate zari work and traditional motifs.',
        category: 'Silk',
        inStock: true,
    },
    {
        id: '2',
        name: 'Banarasi Soft Silk - Peacock Blue',
        price: 18500,
        image: 'https://images.unsplash.com/photo-1583391725988-6490d0f799cd?q=80&w=800&auto=format&fit=crop', // Indian fabric
        description: 'Hand-woven Banarasi silk with silver zari, perfect for weddings.',
        category: 'Banarasi',
        inStock: true,
    },
    {
        id: '3',
        name: 'Mysore Silk Georgette - Emerald Green',
        price: 12000,
        image: 'https://images.unsplash.com/photo-1617634667039-8e4cb277ab46?q=80&w=800&auto=format&fit=crop', // Green fabric
        description: 'Lightweight Mysore silk georgette with a subtle sheen and gold border.',
        category: 'Mysore Silk',
        inStock: true,
    },
    {
        id: '4',
        name: 'Handloom Cotton - Temple Border',
        price: 4500,
        image: 'https://images.unsplash.com/photo-1616616010373-cf6fd2e47e80?q=80&w=800&auto=format&fit=crop',
        description: 'Authentic handloom cotton with traditional temple border.',
        category: 'Cotton',
        inStock: true,
    }
];
