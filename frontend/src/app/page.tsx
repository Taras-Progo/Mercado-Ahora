import { CategoriesGrid } from "@/components/home/CategoriesGrid";
import { FeaturedProducers } from "@/components/home/FeaturedProducers";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { HeroSection } from "@/components/home/HeroSection";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ValueBanner } from "@/components/layout/ValueBanner";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <CategoriesGrid />
        <FeaturedProducts />
        <FeaturedProducers />
        <ValueBanner />
      </main>
      <SiteFooter />
    </>
  );
}
