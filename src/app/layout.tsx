import type { Metadata } from "next";
import { Inter, Playfair_Display, Montserrat, Rozha_One } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { SocialFloating } from "@/components/SocialFloating";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const rozha = Rozha_One({ weight: "400", subsets: ["latin", "devanagari"], variable: "--font-rozha" });

export const metadata: Metadata = {
    title: "Srivari's | Royal Silk Sarees",
    description: "Exclusive collection of Kanjivaram and Banarasi silk sarees.",
};

import { CartProvider } from "@/context/CartContext";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.variable} ${playfair.variable} ${montserrat.variable} ${rozha.variable} bg-obsidian text-marble antialiased`}>
                <CartProvider>
                    <Navbar />
                    {children}
                    <SocialFloating />
                </CartProvider>
            </body>
        </html>
    );
}
