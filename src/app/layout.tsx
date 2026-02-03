import type { Metadata } from "next";
import { Inter, Playfair_Display, Montserrat, Rozha_One } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { SocialFloating } from "@/components/SocialFloating";
import ParticleBackground from "@/components/ParticleBackground";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const rozha = Rozha_One({ weight: "400", subsets: ["latin", "devanagari"], variable: "--font-rozha" });

export const metadata: Metadata = {
    title: {
        default: "The Srivari | Royal Silk Sarees",
        template: "%s | The Srivari"
    },
    description: "Exclusive collection of Kanjivaram and Banarasi silk sarees. Experience the ether of high fashion with our Anti-Gravity collection.",
    manifest: "/manifest.json",
    themeColor: "#1A1A1A",
    viewport: {
        width: "device-width",
        initialScale: 1,
        maximumScale: 1,
        userScalable: false,
    },
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

import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.variable} ${playfair.variable} ${montserrat.variable} ${rozha.variable} bg-obsidian text-marble antialiased`}>
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
