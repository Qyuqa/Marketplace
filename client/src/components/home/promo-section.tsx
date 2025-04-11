import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function PromoSection() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-amber-500 to-amber-400 rounded-xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center">
            <div className="md:w-2/3 mb-6 md:mb-0">
              <span className="inline-block bg-white text-amber-500 px-3 py-1 rounded-full text-sm font-medium mb-4">Limited Time</span>
              <h3 className="text-2xl md:text-3xl font-bold mb-2">Summer Collection Sale</h3>
              <p className="mb-4">Get up to 40% off on selected summer items</p>
              <Link href="/products?category=fashion">
                <Button size="sm" variant="secondary" className="bg-white text-amber-500 hover:bg-amber-50 border-0">
                  Shop Now
                </Button>
              </Link>
            </div>
            <div className="md:w-1/3 flex justify-center">
              <img 
                src="https://images.unsplash.com/photo-1572584642822-6f8de0243c93?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80" 
                alt="Summer collection" 
                className="rounded-lg max-w-full h-auto" 
              />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500 to-blue-400 rounded-xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center">
            <div className="md:w-2/3 mb-6 md:mb-0">
              <span className="inline-block bg-white text-blue-500 px-3 py-1 rounded-full text-sm font-medium mb-4">New Arrivals</span>
              <h3 className="text-2xl md:text-3xl font-bold mb-2">Tech Gadgets 2023</h3>
              <p className="mb-4">Explore the latest tech gadgets from top brands</p>
              <Link href="/products?category=electronics">
                <Button size="sm" variant="secondary" className="bg-white text-blue-500 hover:bg-blue-50 border-0">
                  Discover
                </Button>
              </Link>
            </div>
            <div className="md:w-1/3 flex justify-center">
              <img 
                src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80" 
                alt="Tech gadgets" 
                className="rounded-lg max-w-full h-auto" 
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
