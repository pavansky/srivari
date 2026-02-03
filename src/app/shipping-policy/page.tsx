"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowLeft, Truck } from "lucide-react";

export default function ShippingPolicyPage() {
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
                        <h1 className="text-4xl md:text-5xl font-serif text-[#4A0404] mb-6">The Journey to You</h1>
                        <div className="w-24 h-1 bg-gold mx-auto" />
                    </div>

                    {/* Content Card */}
                    <div className="bg-white p-8 md:p-12 border border-[#E5E5E5] shadow-sm relative overflow-hidden">
                        {/* Watermark */}
                        <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
                            <Truck size={300} strokeWidth={0.5} />
                        </div>

                        <div className="relative z-10 space-y-10 text-[#595959] font-light text-lg leading-relaxed">
                            <p>
                                At <strong className="text-[#4A0404] font-serif">Srivari</strong>, the journey of your saree is as important as its weaving. We ensure that your chosen masterpiece reaches you in pristine condition, ready to be adorned.
                            </p>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="bg-[#4A0404]/5 p-6 border-l-4 border-gold">
                                    <h3 className="text-[#4A0404] font-serif text-xl mb-3">Domestic Shipping</h3>
                                    <p className="text-sm">
                                        For our patrons within India, we offer complimentary insured shipping. Your package will arrive within <strong>5-7 business days</strong>, handled by our trusted courier partners.
                                    </p>
                                </div>
                                <div className="bg-[#4A0404]/5 p-6 border-l-4 border-gold">
                                    <h3 className="text-[#4A0404] font-serif text-xl mb-3">International Dispatch</h3>
                                    <p className="text-sm">
                                        We ship globally to over 100 countries. International orders typically arrive within <strong>10-15 business days</strong>. Note that customs duties, if applicable, are the responsibility of the recipient.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-[#4A0404] font-serif text-2xl mb-4">Packaging Standards</h3>
                                <p>
                                    Every Srivari saree is folded with care and encased in our signature eco-friendly, weather-proof packaging. We use triple-layer protection to shield your heirloom from moisture and transit stress.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-[#4A0404] font-serif text-2xl mb-4">Tracking Your Order</h3>
                                <p>
                                    Once dispatched, you will receive a tracking number via email and SMS. You can also track your order status directly through our website's <Link href="/order-tracking" className="text-gold hover:underline">concierge tracking portal</Link>.
                                </p>
                            </div>

                            <p className="italic text-sm text-[#4A0404]/60 border-t border-[#E5E5E5] pt-8">
                                For expedited shipping requests or special delivery instructions, please contact our concierge immediately after placing your order.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
