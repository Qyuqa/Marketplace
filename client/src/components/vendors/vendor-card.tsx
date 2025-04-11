import { Link } from "wouter";
import { Vendor } from "@shared/schema";
import { Rating } from "@/components/ui/rating";

interface VendorCardProps {
  vendor: Vendor;
}

export default function VendorCard({ vendor }: VendorCardProps) {
  // Generate a random gradient color if none is provided
  const bannerColor = vendor.bannerColor || getRandomGradient();
  
  function getRandomGradient() {
    const gradients = [
      "from-blue-600 to-blue-400",
      "from-green-600 to-green-400",
      "from-purple-600 to-purple-400",
      "from-pink-600 to-pink-400",
      "from-indigo-600 to-indigo-400",
      "from-red-600 to-red-400",
    ];
    
    return gradients[Math.floor(Math.random() * gradients.length)];
  }
  
  return (
    <div className="vendor-card bg-white rounded-xl overflow-hidden shadow-md border border-gray-100 relative">
      <div className={`h-32 bg-gradient-to-r ${bannerColor}`}></div>
      <div className="p-5 pt-0">
        <div className="flex items-start -mt-10">
          <div className="h-20 w-20 rounded-xl border-4 border-white bg-white shadow-sm overflow-hidden">
            <img 
              src={vendor.logoUrl || "https://via.placeholder.com/80?text=" + vendor.storeName.charAt(0)} 
              alt={`${vendor.storeName} logo`} 
              className="h-full w-full object-cover" 
            />
          </div>
          <div className="ml-4 pt-10">
            <h3 className="font-bold text-lg">{vendor.storeName}</h3>
            <p className="text-gray-500 text-sm">{vendor.description.split(' ').slice(0, 3).join(' ')}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center mb-2">
            <Rating value={vendor.rating} reviewCount={vendor.reviewCount} />
          </div>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{vendor.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">{vendor.productCount} products</span>
            <Link href={`/vendors/${vendor.id}`} className="text-primary-600 hover:text-primary-700 font-medium text-sm">
              Visit Store
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
