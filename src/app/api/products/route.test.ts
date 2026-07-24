
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextResponse } from 'next/server';

// Mock DB functions
vi.mock('@/lib/db', () => ({
    getProducts: vi.fn(),
    saveProduct: vi.fn(),
    deleteProduct: vi.fn(),
    lastGetProductsError: null
}));

import { getProducts, saveProduct } from '@/lib/db';

describe('Product API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET', () => {
        it('should return products on success', async () => {
            const mockData = [{ id: '1', name: 'Test' }];
            (getProducts as any).mockResolvedValue(mockData);

            const req = new Request('http://localhost:3000/api/products');
            const response = await GET(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json).toEqual(mockData);
        });

        it('should return 500 on db error', async () => {
            (getProducts as any).mockRejectedValue(new Error('DB Failed'));

            const req = new Request('http://localhost:3000/api/products');
            const response = await GET(req);

            expect(response.status).toBe(500);
        });
    });

    describe('POST', () => {
        it('should save product and return 200', async () => {
            const mockProduct = { name: 'New Saree' };
            const req = {
                json: async () => mockProduct,
                headers: new Headers(),
            } as any;

            (saveProduct as any).mockResolvedValue({ id: '123', ...mockProduct });

            const response = await POST(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.product.id).toBe('123'); // Fixed: accessed nested product
        });

        it('should reject unauthenticated writes with 401 when the dev bypass is off', async () => {
            const prev = process.env.ADMIN_DEV_BYPASS;
            delete process.env.ADMIN_DEV_BYPASS;
            try {
                const req = {
                    json: async () => ({ name: 'Sneaky Saree' }),
                    headers: new Headers(),
                } as any;

                const response = await POST(req);
                expect(response.status).toBe(401);
                expect(saveProduct).not.toHaveBeenCalled();
            } finally {
                process.env.ADMIN_DEV_BYPASS = prev;
            }
        });
    });
});
