import type { Metadata } from "next";
import { getProducts, toPublicProduct } from "@/lib/db";
import { Product } from "@/types";

import Hero from "@/components/Hero";
import AntiGravityGallery from "@/components/AntiGravityGallery";
import CategoryTiles from "@/components/home/CategoryTiles";
import LegacySection from "@/components/home/LegacySection";
import NewArrivals from "@/components/home/NewArrivals";
import Testimonials from "@/components/Testimonials";
import InstagramFeed from "@/components/InstagramFeed";
import NewsletterBand from "@/components/home/NewsletterBand";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop Authentic Kanjivaram & Banarasi Silk Sarees | The Srivari",
  description: "Discover our breathtaking collection of premium handwoven pure silk sarees. The Srivari specializes in bridal kanjivaram, exquisite banarasi, and traditional pattu sarees.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  // Sanitized: cost/supplier fields must never reach the client RSC payload
  const products: Product[] = (await getProducts()).map(toPublicProduct) as Product[];

  // Featured masterpieces for the parallax gallery (fallback: latest with images)
  const withImage = (p: Product) => p.images?.some(img => img && img.trim() !== "");
  const featured = products.filter(p => p.isFeatured && withImage(p)).slice(0, 4);
  const gallery = featured.length > 0 ? featured : products.filter(withImage).slice(0, 4);

  // Latest 4 in-stock arrivals (getProducts is newest-first)
  const newArrivals = products.filter(p => p.stock > 0).slice(0, 4);

  // Catalogue imagery for the Instagram band
  const instagramImages = products
    .map(p => p.images?.find(img => img && img.trim() !== ""))
    .filter((img): img is string => Boolean(img))
    .slice(0, 6);

  return (
    <main className="min-h-screen bg-obsidian text-marble selection:bg-gold selection:text-obsidian">
      <Hero />
      <CategoryTiles products={products} />
      <AntiGravityGallery products={gallery} />
      <LegacySection />
      <NewArrivals products={newArrivals} />
      <Testimonials />
      <InstagramFeed images={instagramImages} />
      <NewsletterBand />
      <Footer />
    </main>
  );
}
