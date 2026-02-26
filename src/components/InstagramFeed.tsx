"use client";

import { Instagram } from "lucide-react";
import SrivariImage from "./SrivariImage";

const instaPosts = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1583391725988-6490d0f799cd?q=80&w=600&auto=format&fit=crop",
        link: "#",
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=600&auto=format&fit=crop",
        link: "#",
    },
    {
        id: 3,
        image: "https://images.unsplash.com/photo-1617634667039-8e4cb277ab46?q=80&w=600&auto=format&fit=crop",
        link: "#",
    },
    {
        id: 4,
        image: "https://images.unsplash.com/photo-1610189012906-4783fda3ad4a?q=80&w=600&auto=format&fit=crop",
        link: "#",
    },
    {
        id: 5,
        image: "https://images.unsplash.com/photo-1546872473-b4131df33a08?q=80&w=600&auto=format&fit=crop",
        link: "#",
    },
    {
        id: 6,
        image: "https://images.unsplash.com/photo-1616616010373-cf6fd2e47e80?q=80&w=600&auto=format&fit=crop",
        link: "#",
    },
];

export default function InstagramFeed() {
    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center gap-2 mb-4 bg-[#F5F5F5] px-4 py-2 rounded-full">
                        <Instagram size={20} className="text-[#E1306C]" />
                        <span className="font-sans font-medium text-sm">@srivari_official</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-serif text-[#4A0404]">
                        Follow Our Journey
                    </h2>
                    <p className="text-[#595959] mt-3 font-serif italic">
                        Tag us in your royal moments to be featured.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                    {instaPosts.map((post) => (
                        <a
                            key={post.id}
                            href={post.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative group aspect-square overflow-hidden cursor-pointer"
                            aria-label={`View Instagram post ${post.id}`}
                        >
                            <SrivariImage
                                src={post.image}
                                alt="Instagram Post"
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                <Instagram className="text-white" size={32} />
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
