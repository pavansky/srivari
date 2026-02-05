import { Product } from '@/types';

export const products: Product[] = [
    {
        id: '1',
        name: 'Royal Kanjivaram Silk - Maroon & Gold',
        price: 25000,
        images: [
            'https://images.unsplash.com/photo-1610189012906-4783fda3ad4a?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1610189004130-b9359c5031a2?q=80&w=800&auto=format&fit=crop'
        ],
        description: 'A pure Kanjivaram silk saree featuring intricate zari work and traditional motifs.',
        category: 'Silk',
        stock: 5,
        isFeatured: true,
        hashtags: ["#RoyalVibes", "#WeddingEdit", "#PureSilk", "#MaroonMagic"],
        weight: 1.0
    },
    {
        id: '2',
        name: 'Banarasi Soft Silk - Peacock Blue',
        price: 18500,
        images: [
            'https://images.unsplash.com/photo-1583391725988-6490d0f799cd?q=80&w=800&auto=format&fit=crop'
        ],
        description: 'Hand-woven Banarasi silk with silver zari, perfect for weddings.',
        category: 'Banarasi',
        stock: 3,
        isFeatured: true,
        hashtags: ["#BanarasiGlow", "#PeacockBlue", "#FestiveReady", "#WeaveArt"],
        weight: 0.8
    },
    {
        id: '3',
        name: 'Mysore Silk Georgette - Emerald Green',
        price: 12000,
        images: [
            'https://images.unsplash.com/photo-1617634667039-8e4cb277ab46?q=80&w=800&auto=format&fit=crop'
        ],
        description: 'Lightweight Mysore silk georgette with a subtle sheen and gold border.',
        category: 'Mysore Silk',
        stock: 8,
        isFeatured: false,
        hashtags: ["#LightweightLuxury", "#EmeraldBeauty", "#MysoreSilk", "#DailyElegance"],
        weight: 0.5
    },
    {
        id: '4',
        name: 'Handloom Cotton - Temple Border',
        price: 4500,
        images: [
            'https://images.unsplash.com/photo-1616616010373-cf6fd2e47e80?q=80&w=800&auto=format&fit=crop'
        ],
        description: 'Authentic handloom cotton with traditional temple border.',
        category: 'Cotton',
        stock: 12,
        isFeatured: false,
        hashtags: ["#SustainableFashion", "#HandloomLove", "#CottonComfort", "#TempleBorder"],
        weight: 0.6
    }
];
