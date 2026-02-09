"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Upload, Sparkles, Loader2, RefreshCw, Shirt, Camera } from "lucide-react";
import { products } from "@/data/products"; // Using mock data directly for reliability

function TryOnContent() {
    const searchParams = useSearchParams();
    const productParam = searchParams.get('product');

    // State
    const [userImage, setUserImage] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<string | null>(productParam);
    const [isGenerating, setIsGenerating] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);

    // Helper: Convert File/Blob to Base64
    const toBase64 = (file: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    // Helper: Fetch image from URL and convert to Base64
    const urlToBase64 = async (url: string): Promise<string> => {
        const response = await fetch(url);
        const blob = await response.blob();
        return await toBase64(blob);
    };

    const handleGenerate = async () => {
        if (!userImage || !selectedProduct) return;
        setIsGenerating(true);
        setResultImage(null);

        try {
            // 1. Prepare Images
            // userImage is a blob URL (from createObjectURL) -> fetch -> base64
            const userBase64 = await urlToBase64(userImage);

            // selectedProduct is a URL (path) -> fetch -> base64
            const productBase64 = await urlToBase64(selectedProduct);

            // 2. Call API
            const response = await fetch('/api/virtual-try-on', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_image: userBase64,
                    product_image: productBase64,
                    category: 'dresses' // Defaulting to dresses/sarees for now
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details || data.error || "Generation Failed");
            }

            setResultImage(data.result_image);

        } catch (error: any) {
            console.error("Try-On Error:", error);
            // Show specific actionable error to user
            alert(error.message || "Failed to generate. Check console.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setUserImage(url);
        }
    };

    return (
        <div className="container mx-auto px-4 pt-32 pb-20">
            <div className="text-center mb-12">
                <span className="text-[#D4AF37] text-xs font-[family-name:var(--font-montserrat)] font-bold uppercase tracking-[0.3em] block mb-2">
                    AI Virtual Mirror
                </span>
                <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-playfair)] text-[#1A1A1A]">
                    Experience the Drape
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">

                {/* Left: Input Console */}
                <div className="space-y-8">

                    {/* Step 1: User Photo */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#1A1A1A]/5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-serif text-sm">1</div>
                            <h2 className="font-[family-name:var(--font-playfair)] text-xl text-[#1A1A1A]">Upload Your Photo</h2>
                        </div>

                        <div className="relative aspect-[3/4] bg-[#F5F5F0] rounded-xl overflow-hidden border-2 border-dashed border-[#1A1A1A]/10 hover:border-[#D4AF37] transition-colors group cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="absolute inset-0 opacity-0 z-10 cursor-pointer"
                                aria-label="Upload your photo"
                                title="Upload your photo"
                            />

                            {userImage ? (
                                <>
                                    <Image src={userImage} alt="User" fill className="object-cover" />
                                    {/* Scanning Animation Overlay */}
                                    {isGenerating && (
                                        <div className="absolute inset-0 z-20 pointer-events-none">
                                            {/* Scanning Line */}
                                            <div className="absolute top-0 left-0 w-full h-1 bg-[#D4AF37] shadow-[0_0_15px_#D4AF37] animate-[scan_2s_linear_infinite]"
                                                style={{ animation: 'scan 2.5s linear infinite' }} />
                                            {/* Tint */}
                                            <div className="absolute inset-0 bg-[#D4AF37]/10 animate-pulse" />

                                            <style jsx>{`
                                                @keyframes scan {
                                                    0% { top: 0%; opacity: 0; }
                                                    10% { opacity: 1; }
                                                    90% { opacity: 1; }
                                                    100% { top: 100%; opacity: 0; }
                                                }
                                            `}</style>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 gap-4">
                                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                        <Camera size={24} className="text-[#1A1A1A]" />
                                    </div>
                                    <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">Tap to Upload</p>
                                    <p className="text-xs text-center px-8 text-neutral-400">For best results, use a full-length photo with good lighting.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Step 2: Select Product */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#1A1A1A]/5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-serif text-sm">2</div>
                            <h2 className="font-[family-name:var(--font-playfair)] text-xl text-[#1A1A1A]">Select Saree</h2>
                        </div>

                        {selectedProduct ? (
                            <div className="relative aspect-[3/4] w-32 rounded-lg overflow-hidden border border-[#D4AF37]">
                                <Image src={selectedProduct} alt="Selected" fill className="object-cover" />
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="absolute top-1 right-1 bg-white/90 p-1 rounded-full text-red-500 hover:bg-white"
                                    aria-label="Remove selected product"
                                    title="Remove selected product"
                                >
                                    <RefreshCw size={14} />
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {products.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedProduct(p.images[0])}
                                        className="relative aspect-[3/4] rounded-lg overflow-hidden border border-transparent hover:border-[#D4AF37]"
                                        aria-label={`Select product ${p.name}`}
                                        title={p.name}
                                    >
                                        <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={!userImage || !selectedProduct || isGenerating}
                        className={`w-full py-6 rounded-xl font-[family-name:var(--font-montserrat)] text-sm font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all
                            ${!userImage || !selectedProduct
                                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                                : 'bg-[#1A1A1A] text-white hover:bg-[#D4AF37] hover:text-[#1A1A1A] shadow-xl'
                            }
                        `}
                    >
                        {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                        {isGenerating ? "Weaving Dreams..." : "Generate Try-On"}
                    </button>

                </div>

                {/* Right: Result */}
                <div className="bg-[#1A1A1A] text-white p-8 rounded-2xl shadow-2xl flex flex-col items-center justify-center min-h-[600px] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                    {resultImage ? (
                        <div className="relative w-full h-full min-h-[500px] rounded-lg overflow-hidden shadow-2xl animate-in fade-in duration-1000">
                            <Image src={resultImage} alt="Result" fill className="object-cover" />
                            <div className="absolute bottom-6 left-6 right-6">
                                <button className="w-full bg-white/10 backdrop-blur-md text-white py-4 font-[family-name:var(--font-montserrat)] text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors">
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-4 opacity-50">
                            <Shirt size={48} className="mx-auto" />
                            <p className="font-[family-name:var(--font-playfair)] text-2xl">Your Masterpiece Awaits</p>
                            <p className="text-sm font-light">Upload your photo and select a saree to see the magic.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

export default function TryOnPage() {
    return (
        <main className="bg-[#FDFBF7] min-h-screen">
            <Navbar />
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
                <TryOnContent />
            </Suspense>
            <Footer />
        </main>
    );
}
