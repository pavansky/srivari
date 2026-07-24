import { Instagram } from "lucide-react";
import SrivariImage from "./SrivariImage";
import SectionHeader from "@/components/ui/SectionHeader";
import { SITE_CONFIG } from "@/config/site";

interface InstagramFeedProps {
    /** Image URLs (picked server-side from the product catalogue). */
    images: string[];
}

/**
 * InstagramFeed — a follow-us band linking to the real Srivari Instagram.
 * Imagery comes from the live catalogue, passed in from the server.
 */
export default function InstagramFeed({ images }: InstagramFeedProps) {
    const posts = images.filter(Boolean).slice(0, 6);
    if (posts.length === 0) return null;

    return (
        <section className="texture-silk py-28 md:py-32 bg-obsidian">
            <div className="container mx-auto px-6">
                <div className="text-center mb-14">
                    <SectionHeader
                        kicker="FROM THE ATELIER"
                        title="Follow Our Journey"
                        accent="Journey"
                        tone="dark"
                        align="center"
                        note="Tag us in your royal moments to be featured."
                    />
                    <a
                        href={SITE_CONFIG.links.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-thread font-sans mt-8 text-marble/70 hover:text-gold transition-colors duration-500"
                    >
                        <Instagram size={15} className="text-gold" aria-hidden="true" />
                        @thesrivari
                    </a>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                    {posts.map((image, index) => (
                        <a
                            key={`${image}-${index}`}
                            href={SITE_CONFIG.links.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="zari-frame relative group aspect-square overflow-hidden"
                            aria-label="Open The Srivari on Instagram"
                        >
                            <SrivariImage
                                src={image}
                                alt="A handwoven silk saree from The Srivari"
                                fill
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 17vw"
                                className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                            />
                            <div className="absolute inset-0 bg-obsidian/60 opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex items-center justify-center">
                                <Instagram className="text-gold" size={26} aria-hidden="true" />
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
