import HeroSection from "@/components/home/hero-section";
import CategorySection from "@/components/home/category-section";
import VendorSection from "@/components/home/vendor-section";
import ProductSection from "@/components/home/product-section";
import BecomeVendor from "@/components/home/become-vendor";
import PromoSection from "@/components/home/promo-section";

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <CategorySection />
      <VendorSection />
      <ProductSection />
      <BecomeVendor />
      <PromoSection />
    </div>
  );
}
