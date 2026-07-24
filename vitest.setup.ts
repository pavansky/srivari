import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Admin API routes require auth; unit tests exercise route logic with the
// local-dev bypass (adminAuth.ts only honors this outside production builds).
process.env.ADMIN_DEV_BYPASS = '1';

// jsdom in this vitest version doesn't expose a working localStorage global —
// provide a simple in-memory implementation for context persistence tests.
if (typeof globalThis.localStorage === 'undefined' || globalThis.localStorage === null) {
    const store = new Map<string, string>();
    const localStorageMock: Storage = {
        get length() { return store.size; },
        clear: () => store.clear(),
        getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
        key: (index: number) => Array.from(store.keys())[index] ?? null,
        removeItem: (key: string) => { store.delete(key); },
        setItem: (key: string, value: string) => { store.set(key, String(value)); },
    };
    Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });
    Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
}

// Mock matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
