import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/types';

// Mock the CartContext
vi.mock('@/context/CartContext', () => ({
    useCart: () => ({
        addToCart: vi.fn(),
        cart: [],
        removeFromCart: vi.fn(),
        updateQuantity: vi.fn(),
        clearCart: vi.fn(),
    }),
}));

// Mock SrivariImage to avoid Next.js Image complexity in tests
vi.mock('@/components/SrivariImage', () => ({
    default: ({ alt, fallbackLabel, ...props }: any) => <img alt={alt} data-testid="product-image" {...props} />,
    isRenderableImageSrc: (src: string | undefined | null) => !!src && src.trim() !== "",
}));

// Mock next/link
vi.mock('next/link', () => ({
    default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

const mockProduct: Product = {
    id: 'kanchi-001',
    name: 'Grand Kanjivaram Bridal',
    price: 85000,
    images: ['/images/kanchi-bridal.jpg'],
    description: 'A masterpiece of the Kanjivaram weaving tradition.',
    category: 'Kanjivaram',
    stock: 3,
    isFeatured: true,
};

const outOfStockProduct: Product = {
    ...mockProduct,
    id: 'kanchi-002',
    name: 'Out of Stock Saree',
    stock: 0,
};

describe('ProductCard', () => {

    it('renders the product name correctly', () => {
        render(<ProductCard product={mockProduct} />);
        expect(screen.getByText('Grand Kanjivaram Bridal')).toBeInTheDocument();
    });

    it('renders the product category', () => {
        render(<ProductCard product={mockProduct} />);
        expect(screen.getByText('Kanjivaram')).toBeInTheDocument();
    });

    it('renders the formatted price in INR', () => {
        render(<ProductCard product={mockProduct} />);
        expect(screen.getByText('₹85,000')).toBeInTheDocument();
    });

    it('shows the "Last N" scarcity mark when stock is below 5', () => {
        render(<ProductCard product={mockProduct} />);
        expect(screen.getByText(/Last 3/i)).toBeInTheDocument();
    });

    it('shows the "Sold Out" band when stock is 0', () => {
        render(<ProductCard product={outOfStockProduct} />);
        expect(screen.getByText(/Sold Out/i)).toBeInTheDocument();
    });

    it('renders a link to the product detail page', () => {
        render(<ProductCard product={mockProduct} />);
        const links = screen.getAllByRole('link');
        const productLinks = links.filter(link => link.getAttribute('href') === '/product/kanchi-001');
        expect(productLinks.length).toBeGreaterThan(0);
    });

    it('renders the product image with correct alt text', () => {
        render(<ProductCard product={mockProduct} />);
        expect(screen.getByTestId('product-image')).toHaveAttribute('alt', 'Grand Kanjivaram Bridal');
    });

});
