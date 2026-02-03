"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, ShoppingBag } from "lucide-react";
import { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group relative bg-white border border-[#E5E5E5] hover:border-[#D4AF37] transition-all duration-500 overflow-hidden shadow-sm hover:shadow-xl">
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <Image
          src={product.images[0]} // Use the first image
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
        />

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
          <button className="bg-white text-[#4A0404] p-3 rounded-full transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-100 hover:bg-[#D4AF37] hover:text-white">
            <Eye size={20} />
          </button>
          <button className="bg-white text-[#4A0404] p-3 rounded-full transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-200 hover:bg-[#D4AF37] hover:text-white">
            <ShoppingBag size={20} />
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
        <Link href={`/product/${product.id}`}>
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
