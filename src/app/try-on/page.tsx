"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import SectionHeader from "@/components/ui/SectionHeader";
import ZariDivider from "@/components/ui/ZariDivider";
import { Sparkles, Loader2, RefreshCw, Shirt, Camera } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { Product } from "@/types";

/** Tracked micro-caps used for the studio's secondary labels. */
const MICRO_LABEL = "font-sans text-[10px] uppercase tracking-[0.3em] text-[#4A0404]";

function TryOnContent() {
    const searchParams = useSearchParams();
    const productParam = searchParams.get('product');

    // State
    const [userImage, setUserImage] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<string | null>(productParam);
    const [isGenerating, setIsGenerating] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [notice, setNotice] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/products?t=${Date.now()}`)
            .then(res => res.ok ? res.json() : [])
            .then(data => setProducts(data))
            .catch(() => setProducts([]));
    }, []);

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
        setNotice(null);

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
            // Surface the reason in the page rather than a browser alert — while the
            // studio is paused this is the FEATURE_PAUSED message from the API.
            setNotice(error.message || "The studio could not complete this drape. Please try again shortly.");
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

    const isReady = Boolean(userImage && selectedProduct);

    return (
        <div className="pb-4">
            {/* Editorial header */}
            <div className="container mx-auto px-4 lg:px-8 pt-36">
                <SectionHeader
                    tone="light"
                    kicker="AI Virtual Mirror"
                    title="Experience the Drape"
                    accent="Drape"
                    note="A private studio for seeing a weave fall before it ever leaves the loom."
                />
                <ZariDivider tone="light" className="mt-12" />
            </div>

            {/* The mirror is resting — the house's own notice, not a raw error */}
            <motion.section
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                className="texture-silk relative bg-obsidian text-marble mt-16"
            >
                <div className="max-w-3xl mx-auto px-6 py-24 md:py-28 text-center">
                    <span className="kicker kicker--plain mb-7">Presently Resting</span>
                    <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-marble">
                        The mirror is being <em className="italic text-[#D4AF37]">rewoven</em>
                    </h2>
                    <p className="text-marble/55 text-sm font-sans leading-relaxed max-w-xl mx-auto mt-8">
                        Our virtual drape studio is resting while we craft its next chapter. Rather than
                        entrust your photographs to a house we have not vetted, we have paused it — and
                        until it returns, our stylists will gladly drape any saree for you by hand.
                    </p>

                    <ZariDivider tone="dark" className="my-12" />

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                        <Link href="/shop" className="btn-royal">
                            Explore the Collection
                        </Link>
                        <a
                            href={SITE_CONFIG.links.whatsapp("Hello Srivari, could a stylist help me visualise how a saree would drape?")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-thread text-[#D4AF37]"
                        >
                            Speak with a Stylist
                        </a>
                    </div>
                </div>
                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent"
                />
            </motion.section>

            {/* The studio itself — kept intact, held in a quieter register until the mirror reopens */}
            <div className="container mx-auto px-4 lg:px-8 mt-24">
                <div className="max-w-6xl mx-auto border-t border-black/10 pt-12">
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 mb-4">
                        <span className={MICRO_LABEL}>The Studio, Preserved</span>
                        <span className="flex items-center gap-2.5 font-sans text-[9px] uppercase tracking-[0.3em] text-neutral-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" aria-hidden="true" />
                            Awaiting its next chapter
                        </span>
                    </div>
                    <p className="text-neutral-500 text-sm font-sans leading-relaxed max-w-xl mb-14">
                        The atelier below remains exactly as it was, ready for the day the mirror reopens.
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                        {/* Left: Input Console */}
                        <div className="space-y-10">

                            {/* Step 1: User Photo */}
                            <div className="bg-[#F9F5F0] p-8 md:p-10 border border-black/10">
                                <div className="flex items-center gap-5 mb-8">
                                    <span className="w-9 h-9 shrink-0 flex items-center justify-center border border-[#4A0404]/30 font-serif text-sm text-[#4A0404]" aria-hidden="true">1</span>
                                    <h2 className="font-serif text-2xl text-[#1A1A1A]">Upload Your Photo</h2>
                                </div>

                                <div className="relative aspect-[3/4] bg-[#FDFBF7] overflow-hidden border border-dashed border-black/15 hover:border-[#D4AF37] transition-colors duration-500 group cursor-pointer">
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
                                                    <div className="absolute top-0 left-0 w-full h-px bg-[#D4AF37] shadow-[0_0_15px_#D4AF37] animate-[scan_2s_linear_infinite]"
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
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8">
                                            <span className="w-14 h-14 flex items-center justify-center border border-[#4A0404]/25 group-hover:border-[#D4AF37] transition-colors duration-500">
                                                <Camera size={20} strokeWidth={1.25} className="text-[#4A0404]" aria-hidden="true" />
                                            </span>
                                            <p className={MICRO_LABEL}>Tap to Upload</p>
                                            <p className="text-xs text-center text-neutral-400 font-sans leading-relaxed">For best results, use a full-length photo with good lighting.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Step 2: Select Product */}
                            <div className="bg-[#F9F5F0] p-8 md:p-10 border border-black/10">
                                <div className="flex items-center gap-5 mb-8">
                                    <span className="w-9 h-9 shrink-0 flex items-center justify-center border border-[#4A0404]/30 font-serif text-sm text-[#4A0404]" aria-hidden="true">2</span>
                                    <h2 className="font-serif text-2xl text-[#1A1A1A]">Select Saree</h2>
                                </div>

                                {selectedProduct ? (
                                    <div className="relative aspect-[3/4] w-32 overflow-hidden border border-[#D4AF37]">
                                        <Image src={selectedProduct} alt="Selected" fill className="object-cover" />
                                        <button
                                            onClick={() => setSelectedProduct(null)}
                                            className="absolute top-0 right-0 bg-[#FDFBF7]/90 p-1.5 text-[#4A0404] hover:bg-[#FDFBF7] transition-colors duration-300"
                                            aria-label="Remove selected product"
                                            title="Remove selected product"
                                        >
                                            <RefreshCw size={13} strokeWidth={1.5} aria-hidden="true" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {products.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => setSelectedProduct(p.images[0])}
                                                className="relative aspect-[3/4] overflow-hidden border border-transparent hover:border-[#D4AF37] transition-colors duration-500"
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
                            <div className="space-y-5">
                                <button
                                    onClick={handleGenerate}
                                    disabled={!isReady || isGenerating}
                                    className="btn-royal btn-royal--oxblood w-full disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {isGenerating
                                        ? <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                                        : <Sparkles size={14} aria-hidden="true" />}
                                    {isGenerating ? "Weaving Dreams..." : "Generate Try-On"}
                                </button>

                                {notice && (
                                    <p className="font-serif text-base italic leading-relaxed text-[#4A0404]/80 border-l border-[#D4AF37] pl-5" role="alert">
                                        {notice}
                                    </p>
                                )}
                            </div>

                        </div>

                        {/* Right: Result */}
                        <div className="texture-silk bg-obsidian text-marble p-8 md:p-10 border border-[#D4AF37]/15 flex flex-col items-center justify-center min-h-[600px] relative overflow-hidden">
                            {resultImage ? (
                                <div className="relative w-full h-full min-h-[500px] overflow-hidden">
                                    <Image src={resultImage} alt="Result" fill className="object-cover" />
                                    <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-obsidian/85 via-obsidian/50 to-transparent">
                                        <button className="btn-royal w-full">
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center px-6">
                                    <Shirt size={32} strokeWidth={0.9} className="mx-auto text-[#D4AF37]/70" aria-hidden="true" />
                                    <p className="font-serif text-3xl md:text-4xl leading-[1.1] text-marble mt-8">
                                        Your Masterpiece <em className="italic text-[#D4AF37]">Awaits</em>
                                    </p>
                                    <p className="text-marble/45 text-sm font-sans leading-relaxed mt-5 max-w-xs mx-auto">
                                        Upload your photo and select a saree to see the magic.
                                    </p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TryOnPage() {
    return (
        <main className="bg-[#FDFBF7] min-h-screen flex flex-col font-sans text-[#1A1A1A]">
            <h1 className="sr-only">Virtual Try-On</h1>
            <Suspense
                fallback={
                    <div className="min-h-screen flex items-center justify-center">
                        <Loader2 className="animate-spin text-[#D4AF37]" strokeWidth={1.25} aria-hidden="true" />
                    </div>
                }
            >
                <TryOnContent />
            </Suspense>
            <Footer />
        </main>
    );
}
