import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';

interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    return (
        <div className="product-card">
            <div className="image-container">
                {/* In a real app, use next/image with proper config. Using standard img for simplicity with external URLs without config hassle if needed, but next/image is better */}
                <img
                    src={product.image}
                    alt={product.name}
                    className="product-image"
                />
                <div className="overlay">
                    <Link href={`/product/${product.id}`} className="view-btn">
                        View Details
                    </Link>
                </div>
            </div>
            <div className="product-info">
                <h3 className="product-title">{product.name}</h3>
                <p className="product-category">{product.category}</p>
                <div className="price-row">
                    <span className="price">₹{product.price.toLocaleString('en-IN')}</span>
                </div>
            </div>

            <style jsx>{`
        .product-card {
          group: relative;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .image-container {
          position: relative;
          aspect-ratio: 3/4;
          overflow: hidden;
          background-color: #f0f0f0;
        }
        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .image-container:hover .product-image {
          transform: scale(1.05);
        }
        .overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .image-container:hover .overlay {
          opacity: 1;
        }
        .view-btn {
          background: #fff;
          color: var(--color-primary);
          padding: 0.75rem 2rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 0.8rem;
          font-weight: 500;
        }
        .product-info {
          text-align: center;
        }
        .product-title {
          font-family: var(--font-serif);
          font-size: 1.1rem;
          color: var(--color-text-main);
          margin-bottom: 0.25rem;
        }
        .product-category {
          font-size: 0.8rem;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 0.5rem;
        }
        .price {
          font-weight: 600;
          color: var(--color-primary);
        }
      `}</style>
        </div>
    );
};

export default ProductCard;
