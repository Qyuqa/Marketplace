import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function BecomeVendor() {
  return (
    <section className="py-16 bg-gradient-to-r from-black to-gray-900 text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Start Selling on Qyuqa</h2>
            <p className="text-lg opacity-90 mb-6">Join our growing community of successful vendors reaching eager customers. We provide all the tools you need to grow your business.</p>
            <ul className="mb-8 space-y-3">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Access to millions of customers</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Simple seller tools and dashboard</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Secure payments and order management</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>24/7 seller support and resources</span>
              </li>
            </ul>
            <Link href="/vendor/register">
              <Button size="lg" variant="secondary" className="bg-white text-black hover:bg-gray-100 border-0">
                Become a Vendor
              </Button>
            </Link>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <img 
              src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" 
              alt="Vendor using laptop" 
              className="rounded-lg shadow-xl max-w-full h-auto" 
            />
          </div>
        </div>
      </div>
    </section>
  );
}
