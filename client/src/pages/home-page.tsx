import HeroSection from "@/components/home/hero-section";
import CategorySection from "@/components/home/category-section";
import VendorSection from "@/components/home/vendor-section";
import ProductSection from "@/components/home/product-section";
import BecomeVendor from "@/components/home/become-vendor";
import PromoSection from "@/components/home/promo-section";
import { EmergencyLogout } from "@/components/emergency-logout";

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <CategorySection />
      <VendorSection />
      <ProductSection />
      <BecomeVendor />
      <PromoSection />
      
      {/* This component only shows when ?emergency-logout is in the URL */}
      <EmergencyLogout />
    </div>
  );
}
