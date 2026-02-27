import type { Metadata } from "next";
import Hero from "@/components/Hero";
import AntiGravityGallery from "@/components/AntiGravityGallery";

export const metadata: Metadata = {
  title: "Shop Authentic Kanjivaram & Banarasi Silk Sarees | The Srivari",
  description: "Discover our breathtaking collection of premium handwoven pure silk sarees. The Srivari specializes in bridal kanjivaram, exquisite banarasi, and traditional pattu sarees.",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-obsidian text-marble selection:bg-gold selection:text-obsidian">
      <Hero />
      <AntiGravityGallery />

      {/* Footer Placeholder */}
      <footer className="py-12 border-t border-white/5 text-center text-marble/40 text-sm">
        <p>© 2026 THE SRIVARI. All Rights Reserved.</p>
      </footer>
    </main>
  );
}
