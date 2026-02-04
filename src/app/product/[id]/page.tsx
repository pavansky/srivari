"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WAButton from "@/components/WAButton";
import Breadcrumbs from "@/components/Breadcrumbs";
import { products as initialProducts } from "@/data/products";
import Image from "next/image";
import SrivariImage from "@/components/SrivariImage";
import { Check, Truck, ShieldCheck, Share2, Heart } from "lucide-react";
import Accordion from "@/components/Accordion";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { Product } from "@/types";

export default function ProductPage() {
    const params = useParams();
    const id = params?.id as string;
    const [isLoading, setIsLoading] = useState(true);
    const [product, setProduct] = useState<Product | undefined>(undefined);
    const [activeImage, setActiveImage] = useState("");
    const [quantity, setQuantity] = useState(1);
    const { addToCart } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

    useEffect(() => {
        if (!id) return;

        console.log("Product Page Mounted. URL ID:", id);

        const normalizeId = (val: any) => String(val).trim();
        const targetId = normalizeId(id);

        let found: Product | undefined;

        // 1. Try LocalStorage
        const storedProducts = localStorage.getItem('srivari_products');
        if (storedProducts) {
            try {
                const products: Product[] = JSON.parse(storedProducts);
                found = products.find(p => normalizeId(p.id) === targetId);
            } catch (error) {
                console.error("LS Parse Error:", error);
            }
        }

        // 2. Fallback to Initial Data
        if (!found) {
            found = initialProducts.find(p => normalizeId(p.id) === targetId);
        }

        setProduct(found);
        if (found) {
            const validImage = found.images.find(img => img && img.trim() !== "") || "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=1000&auto=format&fit=crop";
            setActiveImage(validImage);
        }
        setIsLoading(false);
    }, [id]);

    const handleAddToCart = () => {
        if (product) {
            addToCart(product, quantity);
            alert(`Added ${quantity} item(s) to cart!`);
        }
    };

    const handleShare = async () => {
        if (!product) return;
        const shareData = {
            title: `Srivari - ${product.name}`,
            text: `Check out this beautiful ${product.name} on Srivari!`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log("Share skipped", err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                alert("Link copied to clipboard!");
            } catch (err) {
                alert("Could not copy link.");
            }
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4AF37]"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-4 text-center">
                <h1 className="text-3xl font-heading text-[#4A0404]">Product not found</h1>
                <Link href="/shop" className="mt-8 px-6 py-2 bg-[#D4AF37] text-white font-bold uppercase text-sm tracking-widest hover:bg-[#B5952F] transition-colors">
                    Back to Shop
                </Link>
            </div>
        );
    }

    // WhatsApp Order Logic
    const phoneNumber = "919739988771";
    const message = `Hi, I'd like to order *${product.name}* (Price: ₹${product.price}). Qty: ${quantity}. Please confirm availability.`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    return (
        <main className="bg-[#FDFBF7] min-h-screen">
            <Navbar />

            {/* Luxury V2 Layout */}
            <div className="container mx-auto px-4 pt-32 pb-20">
                <Breadcrumbs />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 relative">

                    {/* Left: Gallery (Sticky) */}
                    <div className="lg:col-span-7">
                        <div className="sticky top-32 space-y-8">
                            {/* Main Image - Art Frame Style */}
                            <div className="relative aspect-[3/4] w-full bg-[#f0eee6] overflow-hidden group">
                                {activeImage && (
                                    <SrivariImage
                                        src={activeImage}
                                        alt={product.name}
                                        fill
                                        className="object-cover transition-transform duration-[1.5s] ease-in-out group-hover:scale-105"
                                    />
                                )}
                                {/* Minimalist Badge */}
                                <div className="absolute top-0 left-0 p-6">
                                    <div className="bg-white/90 backdrop-blur-sm px-4 py-2 border border-[#D4AF37]/20 shadow-sm">
                                        <span className="text-[#1A1A1A] text-[10px] font-[family-name:var(--font-montserrat)] uppercase tracking-[0.25em] font-bold">
                                            {product.category}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Gallery Strip */}
                            <div className="flex items-center gap-4 py-2 border-t border-[#D4AF37]/10">
                                <span className="text-[10px] font-[family-name:var(--font-montserrat)] uppercase tracking-widest text-neutral-400">Gallery</span>
                                <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                                    {product.images?.filter(img => img && img.trim() !== "").map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveImage(img)}
                                            className={`relative w-16 h-20 flex-shrink-0 transition-opacity duration-300
                                                ${activeImage === img ? 'opacity-100 ring-1 ring-[#D4AF37]' : 'opacity-40 hover:opacity-80'}
                                            `}
                                            aria-label={`View gallery image ${i + 1}`}
                                        >
                                            <SrivariImage src={img} alt="Thumbnail" fill className="object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Info & Actions */}
                    <div className="lg:col-span-5 flex flex-col pt-4">
                        <div className="space-y-10">

                            {/* Branding Header */}
                            <div className="space-y-4">
                                <span className="text-[#D4AF37] text-xs font-[family-name:var(--font-montserrat)] font-bold uppercase tracking-[0.3em] pl-1">
                                    Srivari Royal Edition
                                </span>
                                <h1 className="text-5xl lg:text-6xl font-[family-name:var(--font-playfair)] text-[#1A1A1A] leading-[1.1]">
                                    {product.name}
                                </h1>
                                <div className="flex items-center justify-between border-b border-black/5 pb-6">
                                    <p className="text-3xl text-[#1A1A1A] font-[family-name:var(--font-playfair)]">
                                        ₹{product.price.toLocaleString('en-IN')}
                                    </p>
                                    <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1 rounded-full">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></div>
                                        <span className="text-[10px] font-[family-name:var(--font-montserrat)] font-bold uppercase tracking-wider">In Stock</span>
                                    </div>
                                </div>
                            </div>

                            {/* Narrative */}
                            <div className="font-[family-name:var(--font-montserrat)] text-[#595959] font-light leading-relaxed text-sm tracking-wide text-justify">
                                <p className="mb-4">
                                    <span className="text-[#D4AF37] font-bold">Note from the Artisan:</span> {product.description}
                                </p>
                                <p>
                                    Crafted for the modern connoisseur, this saree embodies the perfect symphony of tradition and contemporary elegance.
                                    A drape that commands attention.
                                </p>
                            </div>

                            {/* Designer Action Bar */}
                            <div className="space-y-6">
                                <div className="flex flex-col gap-3">
                                    {/* Quantity Selector */}
                                    <div className="flex items-center gap-6 mb-4">
                                        <span className="text-xs font-[family-name:var(--font-montserrat)] uppercase tracking-widest font-bold text-[#1A1A1A]">
                                            Quantity
                                        </span>
                                        <div className="flex items-center border border-[#1A1A1A] bg-white">
                                            <button
                                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                                className="w-12 h-12 flex items-center justify-center text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors text-xl font-light"
                                                aria-label="Decrease quantity"
                                            >-</button>
                                            <span className="w-12 h-12 flex items-center justify-center font-[family-name:var(--font-playfair)] text-xl text-[#4A0404] font-medium border-l border-r border-[#1A1A1A]/20">
                                                {quantity}
                                            </span>
                                            <button
                                                onClick={() => setQuantity(q => q + 1)}
                                                className="w-12 h-12 flex items-center justify-center text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors text-xl font-light"
                                                aria-label="Increase quantity"
                                            >+</button>
                                        </div>
                                    </div>

                                    <a
                                        href={whatsappUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-[#1A1A1A] text-white h-14 flex items-center justify-center gap-4 hover:bg-[#D4AF37] hover:text-[#1A1A1A] transition-all duration-500 shadow-xl shadow-black/5 group"
                                    >
                                        <span className="font-[family-name:var(--font-montserrat)] text-xs font-bold uppercase tracking-[0.2em]">Acquire via WhatsApp</span>
                                        <Share2 size={18} className="transition-transform group-hover:translate-x-1" />
                                    </a>

                                    <button
                                        onClick={handleAddToCart}
                                        className="w-full bg-transparent border border-[#1A1A1A] text-[#1A1A1A] h-14 flex items-center justify-center gap-4 hover:bg-[#1A1A1A] hover:text-white transition-all duration-500"
                                    >
                                        <span className="font-[family-name:var(--font-montserrat)] text-xs font-bold uppercase tracking-[0.2em]">Add to Bag</span>
                                        <Truck size={18} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-center gap-8 border-t border-b border-black/5 py-6">
                                    <button
                                        onClick={() => product && (isInWishlist(product.id) ? removeFromWishlist(product.id) : addToWishlist(product))}
                                        className={`group flex items-center gap-2 transition-colors font-[family-name:var(--font-montserrat)] text-xs uppercase tracking-widest font-medium
                                            ${isInWishlist(product?.id || '') ? 'text-red-600' : 'text-neutral-500 hover:text-black'}
                                        `}
                                    >
                                        <Heart
                                            size={16}
                                            className={`transition-transform duration-300 ${isInWishlist(product?.id || '') ? 'fill-current scale-110' : 'group-hover:scale-110'}`}
                                        />
                                        <span>{isInWishlist(product?.id || '') ? 'Saved' : 'Wishlist'}</span>
                                    </button>

                                    <div className="w-[1px] h-4 bg-neutral-300"></div>

                                    <button
                                        onClick={handleShare}
                                        className="group flex items-center gap-2 text-neutral-500 hover:text-black transition-colors font-[family-name:var(--font-montserrat)] text-xs uppercase tracking-widest font-medium"
                                    >
                                        <Share2 size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                                        <span>Share</span>
                                    </button>
                                </div>
                            </div>

                            {/* Minimal Details */}
                            <div>
                                <Accordion
                                    items={[
                                        {
                                            title: "Details & Care",
                                            content: (
                                                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-xs font-[family-name:var(--font-montserrat)] text-neutral-600 leading-relaxed pt-2">
                                                    <div>
                                                        <span className="block text-black font-bold uppercase tracking-wider mb-1">Material</span>
                                                        Pure Handloom Silk
                                                    </div>
                                                    <div>
                                                        <span className="block text-black font-bold uppercase tracking-wider mb-1">Weave</span>
                                                        Kanjivaram Zari
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className="block text-black font-bold uppercase tracking-wider mb-1">Care</span>
                                                        Professional dry clean only. Preserve in muslin.
                                                    </div>
                                                </div>
                                            )
                                        },
                                        {
                                            title: "Authenticity & Shipping",
                                            content: (
                                                <div className="text-xs font-[family-name:var(--font-montserrat)] text-neutral-600 leading-relaxed space-y-3 pt-2">
                                                    <p>Includes Silk Mark Certificate of Authenticity.</p>
                                                    <p>Ships within 24 hours. Complimentary express delivery globally on orders above ₹20,000.</p>
                                                </div>
                                            )
                                        }
                                    ]}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
            <WAButton />
        </main>
    );
}
