import type { Metadata } from "next";
import { getProducts, toPublicProduct } from "@/lib/db";
import { Product } from "@/types";
import { isRenderableImageSrc } from "@/lib/image-src";

import Hero from "@/components/Hero";
import AntiGravityGallery from "@/components/AntiGravityGallery";
import CategoryTiles from "@/components/home/CategoryTiles";
import LegacySection from "@/components/home/LegacySection";
import NewArrivals from "@/components/home/NewArrivals";
import Testimonials from "@/components/Testimonials";
import InstagramFeed from "@/components/InstagramFeed";
import NewsletterBand from "@/components/home/NewsletterBand";
import Footer from "@/components/Footer";
import ZariDivider from "@/components/ui/ZariDivider";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop Authentic Kanjivaram & Banarasi Silk Sarees | The Srivari",
  description: "Discover our breathtaking collection of premium handwoven pure silk sarees. The Srivari specializes in bridal kanjivaram, exquisite banarasi, and traditional pattu sarees.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  // Sanitized: cost/supplier fields must never reach the client RSC payload
  const products: Product[] = (await getProducts()).map(toPublicProduct) as Product[];

  // Featured masterpieces for the parallax gallery — only products with imagery
  // that can actually render (Instagram page links cannot).
  const withRenderableImage = (p: Product) => p.images?.some(isRenderableImageSrc);
  const featured = products.filter(p => p.isFeatured && withRenderableImage(p)).slice(0, 4);
  const gallery = featured.length > 0 ? featured : products.filter(withRenderableImage).slice(0, 4);

  // Latest 4 in-stock arrivals (getProducts is newest-first); ProductCard has a
  // branded fallback tile, so no image filter here.
  const newArrivals = products.filter(p => p.stock > 0).slice(0, 4);

  // Catalogue imagery for the Instagram band — renderable URLs only
  const instagramImages = products
    .map(p => p.images?.find(isRenderableImageSrc))
    .filter((img): img is string => Boolean(img))
    .slice(0, 6);

  return (
    <main className="min-h-screen bg-obsidian text-marble selection:bg-gold selection:text-obsidian">
      <Hero />
      <CategoryTiles products={products} />
      <ZariDivider tone="dark" />
      <AntiGravityGallery products={gallery} />
      <ZariDivider tone="dark" />
      <LegacySection />
      <ZariDivider tone="dark" />
      <NewArrivals products={newArrivals} />
      <ZariDivider tone="dark" />
      <Testimonials />
      <ZariDivider tone="dark" />
      <InstagramFeed images={instagramImages} />
      <ZariDivider tone="dark" />
      <NewsletterBand />
      <Footer />
    </main>
  );
}
