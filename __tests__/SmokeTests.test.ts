import { describe, it, expect, vi } from 'vitest';

/**
 * Navigation & Page Structure Smoke Tests
 * 
 * These tests verify that key pages and components exist and
 * are importable without errors. They act as a safety net to
 * catch broken imports or missing exports before deployment.
 */

describe('Page Structure Smoke Tests', () => {

    it('should export a default component from the error page', async () => {
        const ErrorPage = await import('@/app/error');
        expect(ErrorPage.default).toBeDefined();
        expect(typeof ErrorPage.default).toBe('function');
    });

    it('should export a default component from the not-found page', async () => {
        const NotFoundPage = await import('@/app/not-found');
        expect(NotFoundPage.default).toBeDefined();
        expect(typeof NotFoundPage.default).toBe('function');
    });

    it('should export CartProvider and useCart from CartContext', async () => {
        const CartModule = await import('@/context/CartContext');
        expect(CartModule.CartProvider).toBeDefined();
        expect(CartModule.useCart).toBeDefined();
    });

    it('should export WishlistProvider from WishlistContext', async () => {
        const WishlistModule = await import('@/context/WishlistContext');
        expect(WishlistModule.WishlistProvider).toBeDefined();
    });

    it('should export AudioProvider from AudioContext', async () => {
        const AudioModule = await import('@/context/AudioContext');
        expect(AudioModule.AudioProvider).toBeDefined();
    });

    it('should export ErrorBoundary component', async () => {
        const EBModule = await import('@/components/ErrorBoundary');
        expect(EBModule.default).toBeDefined();
    });

    it('should export ProductCard component', async () => {
        const PCModule = await import('@/components/ProductCard');
        expect(PCModule.default).toBeDefined();
    });

    it('should have Product and Order types defined', async () => {
        const types = await import('@/types');
        // Types are compile-time, but we verify the module loads
        expect(types).toBeDefined();
    });

});
