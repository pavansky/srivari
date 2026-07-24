import Image from "next/image";
import Link from "next/link";
import SectionHeader from "@/components/ui/SectionHeader";

const MOTIFS = [
    {
        title: "The Loom",
        text: "Weeks at a wooden handloom — never hours at a machine. Every drape begins as thread, warp and prayer.",
    },
    {
        title: "The Zari",
        text: "Tested gold and silver zari, burnished by hand so the border outlives the bride who first wore it.",
    },
    {
        title: "The Time",
        text: "Forty to sixty days for a single saree. Patience is the most precious fibre we weave with.",
    },
];

export default function LegacySection() {
    return (
        <section className="texture-silk relative bg-obsidian py-28 md:py-32 px-6 overflow-hidden">
            {/* Ambient gold glow */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />

            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Editorial imagery */}
                    <div className="relative">
                        <div className="relative aspect-[4/5] overflow-hidden border border-gold/10">
                            <Image
                                src="/srivari-legacy.png"
                                alt="A master weaver's silk saree from The Srivari legacy collection"
                                fill
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-obsidian/60 via-transparent to-transparent" />
                        </div>
                        {/* Overlapping temple accent */}
                        <div className="absolute -bottom-8 -right-4 md:-right-8 w-36 md:w-48 aspect-[3/4] overflow-hidden border border-gold/30 shadow-[0_20px_60px_rgba(0,0,0,0.7)] hidden sm:block">
                            <Image
                                src="/tirumala-temple.png"
                                alt="The Tirumala temple, inspiration behind The Srivari name"
                                fill
                                sizes="192px"
                                className="object-cover"
                            />
                        </div>
                    </div>

                    {/* Copy */}
                    <div className="lg:pl-4">
                        <SectionHeader
                            kicker="HERITAGE · CRAFTSMANSHIP"
                            title="The Srivari Legacy"
                            accent="Legacy"
                            tone="dark"
                        />
                        <p className="mt-8 text-marble/70 leading-relaxed font-light">
                            Named for the Lord of the Seven Hills, The Srivari carries the devotion of South India&apos;s
                            great weaving houses into the modern wardrobe. Our sarees are sourced directly from master
                            handloom families of Kanchipuram, Varanasi and Mysore — artisans whose craft has passed,
                            unbroken, through generations.
                        </p>
                        <p className="mt-5 text-marble/70 leading-relaxed font-light">
                            No two drapes are ever identical. The slight, human irregularity of a handwoven silk is not a
                            flaw — it is a signature.
                        </p>

                        {/* The Loom · The Zari · The Time */}
                        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
                            {MOTIFS.map((motif) => (
                                <div key={motif.title} className="border-t border-gold/20 pt-5">
                                    <h3 className="font-serif text-xl text-gold">{motif.title}</h3>
                                    <p className="mt-3 text-xs text-marble/60 leading-relaxed">{motif.text}</p>
                                </div>
                            ))}
                        </div>

                        {/* Silk Mark authenticity */}
                        <div className="mt-12 flex items-center gap-5 border border-gold/20 bg-white/[0.03] p-5">
                            <Image
                                src="/silk-mark.png"
                                alt="Silk Mark certification of pure silk authenticity"
                                width={64}
                                height={64}
                                className="h-16 w-16 object-contain shrink-0"
                            />
                            <div>
                                <p className="text-sm font-medium text-marble tracking-wide">Silk Mark Certified</p>
                                <p className="text-xs text-marble/60 mt-1 leading-relaxed">
                                    Every pure silk saree we sell is guaranteed 100% natural silk, certified by the
                                    Silk Mark Organisation of India.
                                </p>
                            </div>
                        </div>

                        <Link href="/about" className="btn-royal mt-10">
                            Our Story
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
