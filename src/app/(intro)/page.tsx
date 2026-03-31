import type { Metadata } from "next";

import { HeroSection } from "@/components/hero-section";

export const metadata: Metadata = {
  title: "QavaEat - Eat Better, Spend Smarter",
  description:
    "Discover curated meal plans from trusted chefs. Set your weekly budget and enjoy stress-free meals without overspending.",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function Home() {
  return (
    <main className="min-h-screen w-full">
      <HeroSection />
    </main>
  );
}
