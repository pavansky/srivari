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
    title: {
        default: "The Srivari | Royal Silk Sarees",
        template: "%s | The Srivari"
    },
    description: "Exclusive collection of Kanjivaram and Banarasi silk sarees. Experience the ether of high fashion with our Anti-Gravity collection.",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "Srivari",
    },
    openGraph: {
        title: "The Srivari | Royal Silk Sarees",
        description: "Weaving legacy into every thread. Authentic Kanjivaram and Banarasi silks for the modern royalty.",
        url: "https://thesrivari.com",
        siteName: "The Srivari",
        images: [
            {
                url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop", // Using the beautiful saree image we added earlier
                width: 1200,
                height: 630,
            },
        ],
        locale: "en_US",
        type: "website",
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
