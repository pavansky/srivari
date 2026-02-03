"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WAButton from "@/components/WAButton";
import { products as initialProducts } from "@/data/products";
import Image from "next/image";
import { Check, Truck, ShieldCheck, Share2, Heart } from "lucide-react";
import Accordion from "@/components/Accordion";
import { useCart } from "@/context/CartContext";
import { Product } from "@/types";

export default function ProductPage() {
    const params = useParams();
    const id = params?.id as string;
    const [isLoading, setIsLoading] = useState(true);
    const [product, setProduct] = useState<Product | undefined>(undefined);
    const [activeImage, setActiveImage] = useState("");
    const [selectedSize, setSelectedSize] = useState("Free Size");
    const { addToCart } = useCart();

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
                console.log("LocalStorage Products:", products.length);
                found = products.find(p => normalizeId(p.id) === targetId);
                console.log("Found in LocalStorage?", !!found);
            } catch (error) {
                console.error("LS Parse Error:", error);
            }
        }

        // 2. Fallback to Initial Data
        if (!found) {
            console.log("Checking Initial Data...");
            found = initialProducts.find(p => normalizeId(p.id) === targetId);
            console.log("Found in Initial?", !!found);
        }

        setProduct(found);
        if (found) setActiveImage(found.images[0] || "");
        setIsLoading(false);
    }, [id]);

    const handleAddToCart = () => {
        if (product) {
            addToCart(product);
            alert("Added to cart!");
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
        // Collect debug info
        const storedProducts = typeof window !== 'undefined' ? localStorage.getItem('srivari_products') : null;
        let debugStoredIds: string[] = [];
        if (storedProducts) {
            try {
                const parsed = JSON.parse(storedProducts);
                debugStoredIds = parsed.map((p: any) => p.id);
            } catch (e) { }
        }
        const initialIds = initialProducts.map(p => p.id);

        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-4 text-center">
                <h1 className="text-3xl font-heading text-[#4A0404]">Product not found</h1>
                <p className="text-[#595959] mt-2 mb-8">The product you are looking for does not exist or has been removed.</p>

                <div className="bg-white p-4 rounded border border-gray-200 text-left text-xs text-gray-500 font-mono w-full max-w-lg">
                    <p className="font-bold mb-2 text-red-500">DEBUG INFO:</p>
                    <p>Searched ID: <span className="bg-yellow-100 px-1 text-black">{id}</span> (Type: {typeof id})</p>
                    <p className="mt-2">LocalStorage IDs ({debugStoredIds.length}):</p>
                    <div className="max-h-20 overflow-y-auto border p-1 mb-2">
                        {debugStoredIds.join(', ') || "None"}
                    </div>
                    <p>Initial IDs ({initialIds.length}):</p>
                    <div className="max-h-20 overflow-y-auto border p-1">
                        {initialIds.join(', ')}
                    </div>
                </div>

                <Link href="/shop" className="mt-8 px-6 py-2 bg-[#D4AF37] text-white font-bold uppercase text-sm tracking-widest hover:bg-[#B5952F] transition-colors">
                    Back to Shop
                </Link>
            </div>
        );
    }

    // WhatsApp Order Logic
    const phoneNumber = "919739988771";
    const message = `Hi, I'd like to order *${product.name}* (Price: ₹${product.price}). Color: ${product.description.split(' ')[0] || 'Standard'}. Please confirm availability.`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    return (
        <main className="bg-[#FDFBF7] min-h-screen">
            <Navbar />

            <div className="container mx-auto px-4 pt-32 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* Image Gallery */}
                    <div className="space-y-4">
                        <div className="relative aspect-[3/4] overflow-hidden rounded-sm border border-[#E5E5E5] group">
                            {activeImage && (
                                <Image
                                    src={activeImage}
                                    alt={product.name}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-125 cursor-zoom-in"
                                    unoptimized
                                />
                            )}
                            <span className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 text-xs uppercase tracking-widest font-bold">
                                {product.category}
                            </span>
                        </div>

                        {/* Thumbnails (Simulated) */}
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {product.images?.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveImage(img)}
                                    className={`relative w-24 h-32 flex-shrink-0 border-2 ${activeImage === img ? 'border-[#4A0404]' : 'border-transparent'} hover:border-[#D4AF37] transition-all`}
                                >
                                    <Image src={img} alt="Thumbnail" fill className="object-cover" unoptimized />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Details */}
                    <div>
                        <div className="mb-2 text-[#D4AF37] text-sm font-bold uppercase tracking-widest">
                            Srivari Royal Collection
                        </div>
                        <h1 className="text-4xl md:text-5xl font-heading text-[#1A1A1A] mb-4 leading-tight">
                            {product.name}
                        </h1>
                        <p className="text-2xl text-[#4A0404] font-medium mb-6 font-body">
                            ₹{product.price.toLocaleString('en-IN')}
                        </p>

                        <div className="prose prose-stone mb-8 text-[#595959]">
                            <p>{product.description} Handwoven with purity and passion, ensuring a drape that feels like second skin. Perfect for weddings and grand celebrations.</p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-[#25D366] text-white py-4 px-8 font-bold uppercase tracking-widest hover:bg-[#1DA851] transition-colors text-center flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                            >
                                <span>Order via WhatsApp</span>
                            </a>
                            <button
                                onClick={handleAddToCart}
                                className="flex-1 border border-[#4A0404] text-[#4A0404] py-4 px-8 font-bold uppercase tracking-widest hover:bg-[#4A0404] hover:text-white transition-colors text-center"
                            >
                                Add to Cart
                            </button>
                        </div>

                        <div className="flex gap-4 text-[#595959] mb-8">
                            <button className="flex items-center gap-2 hover:text-[#4A0404] transition-colors"><Heart size={18} /> Add to Wishlist</button>
                            <button className="flex items-center gap-2 hover:text-[#4A0404] transition-colors"><Share2 size={18} /> Share</button>
                        </div>

                        {/* Product Accordion */}
                        <div className="mb-8">
                            <Accordion
                                items={[
                                    {
                                        title: "Product Specifications",
                                        content: (
                                            <ul className="list-disc pl-5">
                                                <li>Material: Pure Silk</li>
                                                <li>Zari: High Quality Half-Fine Zari</li>
                                                <li>Pattern: Traditional Motifs</li>
                                                <li>Occasion: Wedding / Festival</li>
                                                <li>Blouse Piece: Included (Unstitched)</li>
                                            </ul>
                                        )
                                    },
                                    {
                                        title: "Fabric Care & Storage",
                                        content: (
                                            <ul className="list-disc pl-5">
                                                <li>Dry clean only to maintain the sheen and texture.</li>
                                                <li>Store in a muslin bag to allow the fabric to breathe.</li>
                                                <li>Change folds every 3 months to prevent creases from becoming permanent.</li>
                                                <li>Avoid spraying perfume directly on the zari.</li>
                                            </ul>
                                        )
                                    },
                                    {
                                        title: "Shipping & Returns",
                                        content: (
                                            <p>
                                                Free shipping across India. International shipping available at standard rates.
                                                Returns accepted within 7 days of delivery if the tag is intact and the saree is in original condition.
                                            </p>
                                        )
                                    }
                                ]}
                            />
                        </div>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-200 pt-8">
                            <div className="flex items-center gap-3">
                                <Truck className="text-[#D4AF37]" size={24} />
                                <div className="text-sm">
                                    <span className="block font-bold text-[#1A1A1A]">Free Shipping</span>
                                    <span className="text-gray-500">On orders over ₹5000</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="text-[#D4AF37]" size={24} />
                                <div className="text-sm">
                                    <span className="block font-bold text-[#1A1A1A]">Silk Mark Certified</span>
                                    <span className="text-gray-500">100% Authentic</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Check className="text-[#D4AF37]" size={24} />
                                <div className="text-sm">
                                    <span className="block font-bold text-[#1A1A1A]">7-Day Returns</span>
                                    <span className="text-gray-500">Questions asked</span>
                                </div>
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
