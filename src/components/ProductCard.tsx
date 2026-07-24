"use client";

import SrivariImage, { isRenderableImageSrc } from "./SrivariImage";
import Link from "next/link";
import { Eye, ShoppingBag } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  /** Surface the card sits on. Dark = obsidian home/shop bands, light = cream pages. */
  tone?: "light" | "dark";
}

/**
 * Signature product card: 4:5 portrait, zari frame that draws in on hover,
 * whisper-quiet chrome. The image is the jewel; everything else recedes.
 */
export default function ProductCard({ product, onQuickView, tone = "light" }: ProductCardProps) {
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

  const displayImage = product.images.find(isRenderableImageSrc) || "";
  const dark = tone === "dark";

  return (
    <div className="group relative">
      {/* Image */}
      <Link href={`/product/${product.id}`} prefetch={true} aria-label={`View ${product.name}`} className="block">
        <div className={`zari-frame relative aspect-[4/5] overflow-hidden ${dark ? "bg-[#0d0c0a]" : "bg-[#F3EEE5]"}`}>
          <SrivariImage
            src={displayImage}
            alt={product.name}
            fallbackLabel={product.category || "The Srivari"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className={`object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06] ${product.stock <= 0 ? "grayscale opacity-60" : ""}`}
          />

          {/* Soft vignette so the frame reads on bright imagery */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* Stock state — a quiet mark, not a shouting chip */}
          {product.stock <= 0 ? (
            <div className="absolute inset-x-0 bottom-0 z-10 bg-[#0A0A0A]/80 backdrop-blur-sm py-2.5 text-center">
              <span className="text-[9px] uppercase tracking-[0.4em] text-marble/80 font-sans">Sold Out</span>
            </div>
          ) : (
            product.stock < 5 && (
              <span className={`absolute top-4 left-4 z-10 flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] font-sans ${dark ? "text-marble/90" : "text-white"} drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]`}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                Last {product.stock}
              </span>
            )
          )}

          {/* Actions: a slim rail rising from the base */}
          <div className="absolute inset-x-0 bottom-0 z-20 flex translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              aria-label={`Add ${product.name} to cart`}
              className="flex-1 flex items-center justify-center gap-2.5 bg-[#0A0A0A]/90 backdrop-blur-md text-[#D4AF37] py-3.5 text-[10px] uppercase tracking-[0.3em] font-sans hover:bg-[#D4AF37] hover:text-[#0A0A0A] transition-colors duration-300 disabled:opacity-40 disabled:hover:bg-[#0A0A0A]/90 disabled:hover:text-[#D4AF37]"
            >
              <ShoppingBag size={13} aria-hidden="true" /> Add to Bag
            </button>
            {onQuickView && (
              <button
                onClick={handleQuickView}
                aria-label={`Quick view of ${product.name}`}
                className="w-14 flex items-center justify-center bg-[#0A0A0A]/90 backdrop-blur-md text-marble/70 border-l border-white/10 hover:bg-[#D4AF37] hover:text-[#0A0A0A] transition-colors duration-300"
              >
                <Eye size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </Link>

      {/* Details — left-aligned editorial block */}
      <div className="pt-5 pb-1">
        <p className={`text-[9px] uppercase tracking-[0.35em] mb-2 font-sans ${dark ? "text-[#D4AF37]/70" : "text-[#C8AA6E]"}`}>
          {product.category}
        </p>
        <Link href={`/product/${product.id}`} prefetch={true}>
          <h3 className={`text-lg leading-snug font-serif line-clamp-1 transition-colors duration-300 ${dark ? "text-marble group-hover:text-[#D4AF37]" : "text-[#1A1A1A] group-hover:text-[#4A0404]"}`}>
            {product.name}
          </h3>
        </Link>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className={`font-serif text-base ${dark ? "text-marble/90" : "text-[#4A0404]"}`}>
            ₹{product.price.toLocaleString("en-IN")}
          </span>
        </div>
      </div>
    </div>
  );
}
