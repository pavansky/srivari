import type { Metadata } from "next";
import { Outfit, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { SocialFloating } from "@/components/SocialFloating";
import ParticleBackground from "@/components/ParticleBackground";

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-sans",
    display: 'swap',
});

const cormorant = Cormorant_Garamond({
    weight: ["300", "400", "500", "600", "700"],
    subsets: ["latin"],
    variable: "--font-serif",
    display: 'swap',
});

export const metadata: Metadata = {
    metadataBase: new URL('https://thesrivari.com'),
    title: {
        default: "The Srivari | Royal Silk Sarees",
        template: "%s | The Srivari"
    },
    description: "Exclusive collection of premium handwoven Kanjivaram, Banarasi, and pure silk sarees. Experience the ether of high fashion with The Srivari.",
    keywords: ["Silk Sarees", "Kanjivaram Silk", "Banarasi Sarees", "Handwoven Silk", "Indian Ethnic Wear", "Royal Silk Sarees", "The Srivari", "Pure Silk Saree", "Bridal Silk Sarees", "Premium Sarees Online", "Luxury Indian Wear"],
    authors: [{ name: "The Srivari" }],
    creator: "The Srivari",
    publisher: "The Srivari",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    alternates: {
        canonical: "/",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "The Srivari",
    },
    openGraph: {
        title: "The Srivari | Royal Silk Sarees",
        description: "Weaving legacy into every thread. Authentic Kanjivaram and Banarasi silks for modern royalty. Explore our premium collection.",
        url: "https://thesrivari.com",
        siteName: "The Srivari",
        images: [
            {
                url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop", // Using the beautiful saree image we added earlier
                width: 1200,
                height: 630,
                alt: "The Srivari Royal Silk Sarees"
            },
        ],
        locale: "en_IN",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "The Srivari | Royal Silk Sarees",
        description: "Experience the ether of high fashion with our premium collection of authentic handwoven silk sarees.",
        images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop"],
    },
};

import { Viewport } from "next";

export const viewport: Viewport = {
    themeColor: "#1A1A1A",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${outfit.variable} ${cormorant.variable}`}>
            <body className="font-sans bg-obsidian text-marble antialiased selection:bg-[#D4AF37]/30 selection:text-[#D4AF37]">
                <CartProvider>
                    <WishlistProvider>
                        <ParticleBackground />
                        <Navbar />
                        {children}
                        <SocialFloating />
                    </WishlistProvider>
                </CartProvider>
            </body>
        </html>
    );
}
