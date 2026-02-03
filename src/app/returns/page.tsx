"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function ReturnsPage() {
    return (
        <main className="bg-[#FFFFFA] min-h-screen flex flex-col">
            <Navbar />

            <div className="flex-grow pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Back Link */}
                    <Link href="/" className="inline-flex items-center gap-2 text-gold/80 hover:text-gold uppercase tracking-widest text-xs font-bold mb-12 transition-colors">
                        <ArrowLeft size={16} /> Return to Boutique
                    </Link>

                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-serif text-[#4A0404] mb-6">Our Promise of Perfection</h1>
                        <div className="w-24 h-1 bg-gold mx-auto" />
                    </div>

                    {/* Content Card */}
                    <div className="bg-white p-8 md:p-12 border border-[#E5E5E5] shadow-sm relative overflow-hidden">
                        {/* Watermark */}
                        <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
                            <ShieldCheck size={300} strokeWidth={0.5} />
                        </div>

                        <div className="relative z-10 space-y-10 text-[#595959] font-light text-lg leading-relaxed">
                            <p>
                                At <strong className="text-[#4A0404] font-serif">Srivari</strong>, every saree is not merely a garment but a woven legacy, crafted with immaculate precision and inspected with the utmost reverence. We view our creations as heirlooms, intended to be cherished for generations.
                            </p>

                            <div className="bg-[#4A0404]/5 p-8 border-l-4 border-gold">
                                <h3 className="text-[#4A0404] font-serif text-2xl mb-4">Our Returns Policy</h3>
                                <p>
                                    To preserve the purity, exclusivity, and hygiene of our collection, <strong>we generally do not accept returns or exchanges.</strong> This policy ensures that every piece you receive is pristine, untouched, and uniquely yours.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-[#4A0404] font-serif text-2xl mb-4">The Exception: Damaged Packages</h3>
                                <p>
                                    We treat your order with the care it deserves. However, in the unlikely event that your package arrives in a visibly damaged condition, we kindly request that you:
                                </p>
                                <ul className="list-disc pl-6 mt-4 space-y-2 marker:text-gold">
                                    <li><strong>Decline delivery</strong> immediately upon arrival.</li>
                                    <li>Contact our concierge service instantly.</li>
                                </ul>
                                <p className="mt-4">
                                    Should you accept a damaged package, we may be unable to honor a return request. We ask for your cooperation in helping us maintain the highest standards of delivery.
                                </p>
                            </div>

                            <p className="italic text-sm text-[#4A0404]/60 border-t border-[#E5E5E5] pt-8">
                                We appreciate your understanding and are honored to be a part of your journey in elegance.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
