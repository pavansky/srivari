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
        default: "The Srivari | Premium Silk & Bridal Sarees",
        template: "%s | The Srivari"
    },
    description: "Shop authentic Kanjivaram, Banarasi, and pure silk sarees. The Srivari offers an exclusive collection of traditional Indian bridal wear, handloom silks, and designer sarees for modern royalty.",
    keywords: [
        // Primary
        "sarees", "saree", "silk sarees", "bridal sarees", "wedding sarees",
        // Varieties
        "kanjivaram silk", "kanchipuram silk", "banarasi silk", "pattu sarees", "soft silk sarees",
        "handloom sarees", "pure silk sarees", "designer sarees", "traditional sarees",
        // Use cases
        "indian bridal wear", "party wear sarees", "festive sarees", "luxury sarees",
        // Locations / specific intent
        "buy silk sarees online", "authentic kanjivaram", "premium indian ethnic wear"
    ],
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
        title: "The Srivari | Premium Silk & Bridal Sarees",
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
        title: "The Srivari | Premium Silk & Bridal Sarees",
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
import { AudioProvider } from "@/context/AudioContext";
import InstallPrompt from "@/components/InstallPrompt";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${outfit.variable} ${cormorant.variable}`}>
            <head>
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            if ('serviceWorker' in navigator) {
                                window.addEventListener('load', function() {
                                    navigator.serviceWorker.register('/sw.js').then(function(registration) {
                                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                                    }, function(err) {
                                        console.log('ServiceWorker registration failed: ', err);
                                    });
                                });
                            }
                        `
                    }}
                />

                {/* Advanced SEO: JSON-LD Structured Data */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": ["Organization", "Store"],
                            "name": "The Srivari",
                            "url": "https://thesrivari.com",
                            "logo": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
                            "description": "Exclusive collection of premium handwoven Kanjivaram, Banarasi, and pure silk sarees. Traditional Indian bridal wear and luxury ethnic fashion.",
                            "brand": "The Srivari",
                            "contactPoint": {
                                "@type": "ContactPoint",
                                "telephone": "+91-XXXXXXXXXX",
                                "contactType": "Customer Service",
                                "areaServed": "IN",
                                "availableLanguage": ["en", "hi", "te", "ta"]
                            },
                            "sameAs": [
                                "https://www.instagram.com/thesrivari/",
                                "https://www.facebook.com/thesrivari/"
                            ]
                        })
                    }}
                />
            </head>
            <body className="font-sans bg-obsidian text-marble antialiased selection:bg-[#D4AF37]/30 selection:text-[#D4AF37]">
                <AudioProvider>
                    <CartProvider>
                        <WishlistProvider>
                            <ParticleBackground />
                            <Navbar />
                            {children}
                            <InstallPrompt />
                            <SocialFloating />
                        </WishlistProvider>
                    </CartProvider>
                </AudioProvider>
            </body>
        </html>
    );
}
