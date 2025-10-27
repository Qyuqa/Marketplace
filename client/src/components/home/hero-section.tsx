import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-r from-black to-gray-900 text-white">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Qyuqa — A Safe and Fair marketplace where you can sell  and buy with confidence</h1>
            <p className="text-lg md:text-xl opacity-90 mb-8">We connect local producers with trusted buyers. Women and youth earn with dignity, and everyone shops and sells with safety and confidence.</p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <Link href="/products">
                <Button size="lg" variant="secondary" className="bg-white text-black hover:bg-gray-100 border-0 w-full sm:w-auto">
                  Shop Now
                </Button>
              </Link>
              <Link href="/vendor/register">
                <Button size="lg" variant="outline" className="border-white text-black bg-white hover:bg-gray-100 w-full sm:w-auto">
                  Start Selling
                </Button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <img 
              src="https://images.unsplash.com/photo-1607083206968-13611e3d76db?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" 
              alt="Shopping illustration" 
              className="rounded-lg shadow-xl max-w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
