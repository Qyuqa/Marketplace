import { Link } from "wouter";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center mb-4">
              <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              <span className="ml-2 text-xl font-bold text-white">Qyuqa</span>
            </div>
            <p className="mb-4">The ultimate multi-vendor marketplace for all your shopping needs.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Shop</h3>
            <ul className="space-y-2">
              <li><Link href="/products" className="hover:text-white transition">All Categories</Link></li>
              <li><a href="#" className="hover:text-white transition">Deals & Offers</a></li>
              <li><a href="#" className="hover:text-white transition">New Arrivals</a></li>
              <li><a href="#" className="hover:text-white transition">Best Sellers</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">For Vendors</h3>
            <ul className="space-y-2">
              <li><Link href="/vendor/register" className="hover:text-white transition">Sell on Qyuqa</Link></li>
              <li><a href="#" className="hover:text-white transition">Vendor Resources</a></li>
              <li><Link href="/auth" className="hover:text-white transition">Vendor Login</Link></li>
              <li><a href="#" className="hover:text-white transition">Success Stories</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Help & Contact</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition">Customer Support</a></li>
              <li><a href="#" className="hover:text-white transition">FAQs</a></li>
              <li><a href="#" className="hover:text-white transition">Shipping Information</a></li>
              <li><a href="#" className="hover:text-white transition">Returns & Refunds</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p>© {new Date().getFullYear()} Qyuqa. All rights reserved.</p>
            <div className="flex flex-wrap justify-center space-x-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition">Terms of Service</a>
              <a href="#" className="hover:text-white transition">Privacy Policy</a>
              <a href="#" className="hover:text-white transition">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
