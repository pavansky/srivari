import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "About The Srivari | Our Heritage & Craft",
    description: "Discover the story behind The Srivari \u2014 a legacy of handwoven silk sarees rooted in the traditions of Kanjivaram and Banarasi weaving. Learn about our artisans, our craft, and our commitment to preserving India's textile heritage.",
    alternates: { canonical: "/about" },
    openGraph: {
        title: "About The Srivari | Our Heritage & Craft",
        description: "A legacy woven in silk. Discover the artisans and traditions behind The Srivari's premium saree collections.",
        url: "https://thesrivari.com/about",
    },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
