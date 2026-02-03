import Hero from "@/components/Hero";
import AntiGravityGallery from "@/components/AntiGravityGallery";

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
