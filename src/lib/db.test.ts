
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProducts, saveProduct } from './db';
import prisma from './prisma';

// Mock Prisma
vi.mock('./prisma', () => ({
    default: {
        product: {
            findMany: vi.fn(),
            create: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn()
        },
        order: {
            findMany: vi.fn(),
            create: vi.fn()
        }
    }
}));

// Mock Data
const mockProduct = {
    id: '123',
    name: 'Test Saree',
    price: 1000,
    description: 'A test saree',
    category: 'Silk',
    stock: 10,
    images: ['img1.jpg'],
    isFeatured: false,
    video: null,
    priceCps: null,
    shipping: null,
    createdAt: new Date(),
    updatedAt: new Date()
};

const mockDomainProduct = {
    ...mockProduct,
    images: ['img1.jpg'],
    video: undefined,
    priceCps: undefined,
    shipping: undefined
};

describe('DB Operations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getProducts', () => {
        it('should return products if they exist', async () => {
            (prisma.product.findMany as any).mockResolvedValue([mockProduct]);

            const result = await getProducts();

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('123');
            expect(result[0].video).toBeUndefined(); // Check type conversion
        });

        it('should seed data if no products exist', async () => {
            // First call returns empty
            (prisma.product.findMany as any)
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([mockProduct]); // Second call after seed returns data

            await getProducts();

            expect(prisma.product.create).toHaveBeenCalled(); // Should attempt to see
        });
    });

    describe('saveProduct', () => {
        it('should create new product if ID is short/new', async () => {
            const newProduct = { ...mockDomainProduct, id: '1' };
            (prisma.product.create as any).mockResolvedValue(mockProduct);

            await saveProduct(newProduct);

            expect(prisma.product.create).toHaveBeenCalled();
            expect(prisma.product.update).not.toHaveBeenCalled();
        });

        it('should update existing product if ID exists', async () => {
            const existingProduct = { ...mockDomainProduct, id: 'existing-uuid' };
            (prisma.product.findUnique as any).mockResolvedValue(mockProduct);
            (prisma.product.update as any).mockResolvedValue(mockProduct);

            await saveProduct(existingProduct);

            expect(prisma.product.update).toHaveBeenCalled();
            expect(prisma.product.create).not.toHaveBeenCalled();
        });
    });
});
