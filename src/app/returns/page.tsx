"use client";

import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import ZariDivider from "@/components/ui/ZariDivider";

/** Left-column marker for each policy clause — tracked micro-caps, house style. */
const CLAUSE_LABEL = "font-sans text-[11px] uppercase tracking-[0.3em] text-[#4A0404] leading-[1.8]";
/** Serif body column — the reading voice of the maison. */
const CLAUSE_BODY = "font-serif text-lg md:text-xl leading-relaxed text-[#595959] space-y-5";

export default function ReturnsPage() {
    return (
        <main className="bg-[#FDFBF7] min-h-screen flex flex-col font-sans text-[#1A1A1A]">
            <h1 className="sr-only">Returns &amp; Exchanges</h1>

            {/* Editorial header band */}
            <section className="texture-silk relative bg-obsidian text-marble pt-36 pb-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <SectionHeader
                        tone="dark"
                        kicker="Customer Care"
                        title="Our Promise of Perfection"
                        accent="Perfection"
                        note="Every drape is inspected, sealed, and sent onward as an heirloom."
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
                        At <strong className="text-[#4A0404] font-serif font-normal">Srivari</strong>, every saree is not merely a garment but a woven legacy, crafted with immaculate precision and inspected with the utmost reverence. We view our creations as heirlooms, intended to be cherished for generations.
                    </p>

                    <ZariDivider tone="light" className="my-16" />

                    {/* Clause — returns */}
                    <section className="grid gap-5 md:grid-cols-[190px_1fr] md:gap-12 border-t border-black/10 pt-10">
                        <h2 className={CLAUSE_LABEL}>Our Returns Policy</h2>
                        <div className={CLAUSE_BODY}>
                            <p>
                                To preserve the purity, exclusivity, and hygiene of our collection, <strong className="text-[#4A0404] font-normal italic">we generally do not accept returns or exchanges.</strong> This policy ensures that every piece you receive is pristine, untouched, and uniquely yours.
                            </p>
                        </div>
                    </section>

                    {/* Clause — damaged packages */}
                    <section className="grid gap-5 md:grid-cols-[190px_1fr] md:gap-12 border-t border-black/10 pt-10 mt-14">
                        <h2 className={CLAUSE_LABEL}>The Exception: Damaged Packages</h2>
                        <div className={CLAUSE_BODY}>
                            <p>
                                We treat your order with the care it deserves. However, in the unlikely event that your package arrives in a visibly damaged condition, we kindly request that you:
                            </p>
                            <ul className="space-y-4 pt-1">
                                <li className="flex gap-4">
                                    <span className="mt-[0.85rem] w-1.5 h-1.5 shrink-0 rotate-45 bg-[#D4AF37]" aria-hidden="true" />
                                    <span><strong className="text-[#4A0404] font-normal">Decline delivery</strong> immediately upon arrival.</span>
                                </li>
                                <li className="flex gap-4">
                                    <span className="mt-[0.85rem] w-1.5 h-1.5 shrink-0 rotate-45 bg-[#D4AF37]" aria-hidden="true" />
                                    <span>Contact our concierge service instantly.</span>
                                </li>
                            </ul>
                            <p>
                                Should you accept a damaged package, we may be unable to honor a return request. We ask for your cooperation in helping us maintain the highest standards of delivery.
                            </p>
                        </div>
                    </section>

                    {/* Closing */}
                    <p className="font-serif italic text-lg text-[#4A0404]/60 border-t border-black/10 pt-10 mt-16">
                        We appreciate your understanding and are honored to be a part of your journey in elegance.
                    </p>
                </div>
            </div>

            <Footer />
        </main>
    );
}
