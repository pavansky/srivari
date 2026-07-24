"use client";

import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import ZariDivider from "@/components/ui/ZariDivider";

/** Left-column marker for each clause — tracked micro-caps, house style. */
const CLAUSE_LABEL = "font-sans text-[11px] uppercase tracking-[0.3em] text-[#4A0404] leading-[1.8]";
/** Serif body column — the reading voice of the maison. */
const CLAUSE_BODY = "font-serif text-lg md:text-xl leading-relaxed text-[#595959] space-y-5";

export default function ShippingPolicyPage() {
    return (
        <main className="bg-[#FDFBF7] min-h-screen flex flex-col font-sans text-[#1A1A1A]">
            <h1 className="sr-only">Shipping Policy</h1>

            {/* Editorial header band */}
            <section className="texture-silk relative bg-obsidian text-marble pt-36 pb-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <SectionHeader
                        tone="dark"
                        kicker="Delivery"
                        title="The Journey to You"
                        accent="Journey"
                        note="Insured, hand-packed, and traced from our atelier to your door."
                    />
                </div>
                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent"
                />
            </section>

            <div className="flex-grow px-6 py-24 md:py-28">
                <div className="max-w-3xl mx-auto">
                    <Link href="/" className="btn-thread text-[#4A0404] mb-16">
                        <ArrowLeft size={14} aria-hidden="true" /> Return to Boutique
                    </Link>

                    {/* Lede */}
                    <p className="font-serif text-2xl md:text-3xl leading-relaxed text-[#1A1A1A]">
                        At <strong className="text-[#4A0404] font-serif font-normal">Srivari</strong>, the journey of your saree is as important as its weaving. We ensure that your chosen masterpiece reaches you in pristine condition, ready to be adorned.
                    </p>

                    <ZariDivider tone="light" className="my-16" />

                    {/* Clause — domestic */}
                    <section className="grid gap-5 md:grid-cols-[190px_1fr] md:gap-12 border-t border-black/10 pt-10">
                        <h2 className={CLAUSE_LABEL}>Domestic Shipping</h2>
                        <div className={CLAUSE_BODY}>
                            <p>
                                For our patrons within India, we offer complimentary insured shipping. Your package will arrive within <strong className="text-[#4A0404] font-normal italic">5-7 business days</strong>, handled by our trusted courier partners.
                            </p>
                        </div>
                    </section>

                    {/* Clause — international */}
                    <section className="grid gap-5 md:grid-cols-[190px_1fr] md:gap-12 border-t border-black/10 pt-10 mt-14">
                        <h2 className={CLAUSE_LABEL}>International Dispatch</h2>
                        <div className={CLAUSE_BODY}>
                            <p>
                                We ship globally to over 100 countries. International orders typically arrive within <strong className="text-[#4A0404] font-normal italic">10-15 business days</strong>. Note that customs duties, if applicable, are the responsibility of the recipient.
                            </p>
                        </div>
                    </section>

                    {/* Clause — packaging */}
                    <section className="grid gap-5 md:grid-cols-[190px_1fr] md:gap-12 border-t border-black/10 pt-10 mt-14">
                        <h2 className={CLAUSE_LABEL}>Packaging Standards</h2>
                        <div className={CLAUSE_BODY}>
                            <p>
                                Every Srivari saree is folded with care and encased in our signature eco-friendly, weather-proof packaging. We use triple-layer protection to shield your heirloom from moisture and transit stress.
                            </p>
                        </div>
                    </section>

                    {/* Clause — tracking */}
                    <section className="grid gap-5 md:grid-cols-[190px_1fr] md:gap-12 border-t border-black/10 pt-10 mt-14">
                        <h2 className={CLAUSE_LABEL}>Tracking Your Order</h2>
                        <div className={CLAUSE_BODY}>
                            <p>
                                Once dispatched, you will receive a tracking number via email and SMS. You can also track your order status directly through our website&apos;s <Link href="/order-tracking" className="text-[#4A0404] underline decoration-[#D4AF37]/50 underline-offset-4 hover:decoration-[#D4AF37] transition-colors duration-500">concierge tracking portal</Link>.
                            </p>
                        </div>
                    </section>

                    {/* Closing */}
                    <p className="font-serif italic text-lg text-[#4A0404]/60 border-t border-black/10 pt-10 mt-16">
                        For expedited shipping requests or special delivery instructions, please contact our concierge immediately after placing your order.
                    </p>
                </div>
            </div>

            <Footer />
        </main>
    );
}
