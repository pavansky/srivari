"use client";

import SrivariImage from "./SrivariImage";
import Link from "next/link";
import { Eye, ShoppingBag } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link navigation if wrapped
    e.stopPropagation();
    addToCart(product);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) onQuickView(product);
  };

  // Find first valid image
  const displayImage = product.images.find(img => img && img.trim() !== "") || "";

  return (
    <div className="group relative bg-white border border-[#E5E5E5]/60 hover:border-[#D4AF37] transition-all duration-500 overflow-hidden shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] rounded-sm">
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#F9F5F0]">
        <SrivariImage
          src={displayImage}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-1000 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-110"
        />

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-3">
          {onQuickView ? (
            <button
              onClick={handleQuickView}
              className="bg-white/95 backdrop-blur-sm text-[#1A1A1A] p-3.5 rounded-full transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out hover:bg-[#1A1A1A] hover:text-[#D4AF37]"
            >
              <Eye size={18} />
            </button>
          ) : (
            <Link href={`/product/${product.id}`} prefetch={true}>
              <button className="bg-white/95 backdrop-blur-sm text-[#1A1A1A] p-3.5 rounded-full transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out hover:bg-[#1A1A1A] hover:text-[#D4AF37]">
                <Eye size={18} />
              </button>
            </Link>
          )}
          <button
            onClick={handleAddToCart}
            className="bg-white/95 backdrop-blur-sm text-[#1A1A1A] p-3.5 rounded-full transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-50 ease-out hover:bg-[#1A1A1A] hover:text-[#D4AF37]"
          >
            <ShoppingBag size={18} />
          </button>
        </div>

        {/* Badges */}
        {product.stock > 0 ? (
          product.stock < 5 && (
            <span className="absolute top-3 left-3 bg-[#D4AF37] text-white text-[10px] uppercase font-bold px-2 py-1 tracking-wider">
              Low Stock
            </span>
          )
        ) : (
          <span className="absolute top-3 left-3 bg-red-800 text-white text-[10px] uppercase font-bold px-2 py-1 tracking-wider">
            Out of Stock
          </span>
        )}
      </div>

      {/* Product Details */}
      <div className="p-5 text-center">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 font-sans">
          {product.category}
        </p>
        <Link href={`/product/${product.id}`} prefetch={true}>
          <h3 className="text-lg font-serif text-[#1A1A1A] group-hover:text-[#4A0404] transition-colors line-clamp-1 mb-2">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-center gap-2 font-body font-medium">
          <span className="text-[#4A0404]">₹{product.price.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
}
