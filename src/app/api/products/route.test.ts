
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextResponse } from 'next/server';

// Mock DB functions
vi.mock('@/lib/db', () => ({
    getProducts: vi.fn(),
    saveProduct: vi.fn(),
    deleteProduct: vi.fn()
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

            const response = await GET();
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json).toEqual(mockData);
        });

        it('should return 500 on db error', async () => {
            (getProducts as any).mockRejectedValue(new Error('DB Failed'));

            const response = await GET();

            expect(response.status).toBe(500);
        });
    });

    describe('POST', () => {
        it('should save product and return 200', async () => {
            const mockProduct = { name: 'New Saree' };
            const req = {
                json: async () => mockProduct
            } as any;

            (saveProduct as any).mockResolvedValue({ id: '123', ...mockProduct });

            const response = await POST(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.product.id).toBe('123'); // Fixed: accessed nested product
        });
    });
});
