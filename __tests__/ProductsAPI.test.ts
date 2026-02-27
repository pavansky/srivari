import { describe, it, expect, vi } from 'vitest';

// Mock the database module
vi.mock('@/lib/db', () => ({
    getProducts: vi.fn(),
    saveProduct: vi.fn(),
    deleteProduct: vi.fn(),
}));

// Mock NextResponse
vi.mock('next/server', () => ({
    NextResponse: {
        json: (data: any, init?: any) => ({
            _data: data,
            status: init?.status || 200,
            json: async () => data,
        } as any),
    },
}));

import { getProducts, saveProduct, deleteProduct } from '@/lib/db';
import { GET, POST, DELETE } from '@/app/api/products/route';

describe('Products API Route', () => {

    it('GET should return products from the database', async () => {
        const mockProducts = [
            { id: '1', name: 'Kanjivaram Silk', price: 45000 },
            { id: '2', name: 'Banarasi Silk', price: 32000 },
        ];
        (getProducts as any).mockResolvedValue(mockProducts);

        const request = new Request('http://localhost:3000/api/products');
        const response = await GET(request);
        const data = await response.json();
        expect(data).toEqual(mockProducts);
        expect(response.status).toBe(200);
    });

    it('GET should return 500 on database error', async () => {
        (getProducts as any).mockRejectedValue(new Error('DB connection failed'));

        const request = new Request('http://localhost:3000/api/products');
        const response = await GET(request);
        const data = await response.json();
        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch');
    });

    it('POST should save a new product', async () => {
        const newProduct = { name: 'New Silk', price: 55000, description: 'Test', category: 'Silk', stock: 10, images: [], isFeatured: false };
        (saveProduct as any).mockResolvedValue({ id: 'new-1', ...newProduct });

        const request = new Request('http://localhost:3000/api/products', {
            method: 'POST',
            body: JSON.stringify(newProduct),
        });

        const response = await POST(request);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.product.name).toBe('New Silk');
    });

    it('POST should return 500 on save failure', async () => {
        (saveProduct as any).mockRejectedValue(new Error('Unique constraint failed'));

        const request = new Request('http://localhost:3000/api/products', {
            method: 'POST',
            body: JSON.stringify({ name: 'Bad Product' }),
        });

        const response = await POST(request);
        const data = await response.json();
        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to save');
    });

    it('DELETE should remove a product by ID', async () => {
        (deleteProduct as any).mockResolvedValue(undefined);

        const request = new Request('http://localhost:3000/api/products?id=test-id', {
            method: 'DELETE',
        });

        const response = await DELETE(request);
        const data = await response.json();
        expect(data.success).toBe(true);
    });

    it('DELETE should return 400 if no ID is provided', async () => {
        const request = new Request('http://localhost:3000/api/products', {
            method: 'DELETE',
        });

        const response = await DELETE(request);
        const data = await response.json();
        expect(response.status).toBe(400);
        expect(data.error).toBe('ID required');
    });

});
