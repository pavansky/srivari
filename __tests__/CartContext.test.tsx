import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '@/context/CartContext';
import { AudioProvider } from '@/context/AudioContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Product } from '@/types';

// Mock product for testing
const mockProduct: Product = {
    id: 'test-1',
    name: 'Test Kanjivaram',
    price: 50000,
    images: ['/test.jpg'],
    description: 'Test description',
    category: 'Kanjivaram',
    stock: 5,
    isFeatured: true
};

const mockProduct2: Product = {
    id: 'test-2',
    name: 'Test Banarasi',
    price: 30000,
    images: ['/test2.jpg'],
    description: 'Test description 2',
    category: 'Banarasi',
    stock: 2,
    isFeatured: false
};

// Wrapper to provide necessary contexts
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AudioProvider>
        <CartProvider>{children}</CartProvider>
    </AudioProvider>
);

describe('CartContext', () => {

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        // Mock the playBell function so it doesn't try to play audio in tests
        vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
    });

    it('should initialize with an empty cart', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        expect(result.current.cart.length).toBe(0);
    });

    it('should add a product to the cart', () => {
        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => {
            result.current.addToCart(mockProduct, 1);
        });

        expect(result.current.cart.length).toBe(1);
        expect(result.current.cart[0].id).toBe('test-1');
        expect(result.current.cart[0].quantity).toBe(1);
    });

    it('should increment quantity if the same product is added again', () => {
        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => {
            result.current.addToCart(mockProduct, 1);
            result.current.addToCart(mockProduct, 2);
        });

        expect(result.current.cart.length).toBe(1);
        expect(result.current.cart[0].quantity).toBe(3);
    });

    it('should update the quantity of an existing product', () => {
        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => {
            result.current.addToCart(mockProduct, 1);
            result.current.updateQuantity('test-1', 4);
        });

        expect(result.current.cart[0].quantity).toBe(4);
    });

    it('should remove the product if updated quantity is less than 1', () => {
        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => {
            result.current.addToCart(mockProduct, 1);
            result.current.updateQuantity('test-1', 0);
        });

        expect(result.current.cart.length).toBe(0);
    });

    it('should remove a specific product from the cart', () => {
        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => {
            result.current.addToCart(mockProduct, 1);
            result.current.addToCart(mockProduct2, 1);
            result.current.removeFromCart('test-1');
        });

        expect(result.current.cart.length).toBe(1);
        expect(result.current.cart[0].id).toBe('test-2');
    });

    it('should clear all items from the cart', () => {
        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => {
            result.current.addToCart(mockProduct, 1);
            result.current.addToCart(mockProduct2, 1);
            result.current.clearCart();
        });

        expect(result.current.cart.length).toBe(0);
    });

});
