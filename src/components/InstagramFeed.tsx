import { Instagram } from "lucide-react";
import SrivariImage from "./SrivariImage";
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
        <section className="py-24 bg-obsidian border-t border-white/5">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <a
                        href={SITE_CONFIG.links.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 mb-4 glass px-5 py-2 rounded-full text-marble hover:text-gold transition-colors"
                    >
                        <Instagram size={18} className="text-gold" aria-hidden="true" />
                        <span className="font-sans text-sm tracking-widest">@thesrivari</span>
                    </a>
                    <h2 className="text-3xl md:text-4xl font-serif text-marble">
                        Follow Our Journey
                    </h2>
                    <p className="text-marble/50 mt-3 font-serif italic">
                        Tag us in your royal moments to be featured.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                    {posts.map((image, index) => (
                        <a
                            key={`${image}-${index}`}
                            href={SITE_CONFIG.links.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative group aspect-square overflow-hidden rounded-sm"
                            aria-label="Open The Srivari on Instagram"
                        >
                            <SrivariImage
                                src={image}
                                alt="A handwoven silk saree from The Srivari"
                                fill
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 17vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-obsidian/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                <Instagram className="text-gold" size={28} aria-hidden="true" />
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
