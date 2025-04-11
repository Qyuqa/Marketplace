import { Link } from "wouter";
import { Product, Vendor } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Heart, Eye, ShoppingCart, Tag, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();
  const { addToCart, isPendingAdd } = useCart();
  
  const { data: vendorData } = useQuery<Vendor>({
    queryKey: [`/api/vendors/${product.vendorId}`],
    enabled: !!product.vendorId,
  });
  
  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      quantity: 1,
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };
  
  return (
    <div className="product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 transition-all duration-200 relative group">
      <div className="relative">
        <Link href={`/products/${product.id}`}>
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-48 object-cover" 
          />
        </Link>
        
        {/* Product badges */}
        <div className="absolute top-2 right-2 flex flex-col space-y-1">
          {product.isNew && (
            <Badge variant="secondary" className="bg-amber-500 hover:bg-amber-500 border-0">New</Badge>
          )}
          {product.comparePrice && product.comparePrice > product.price && (
            <Badge variant="secondary" className="bg-green-500 hover:bg-green-500 border-0">
              -{Math.round((1 - product.price / product.comparePrice) * 100)}%
            </Badge>
          )}
          {product.isTrending && (
            <Badge variant="secondary" className="bg-primary-500 hover:bg-primary-500 border-0">Trending</Badge>
          )}
        </div>
        
        {/* Quick action buttons */}
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col space-y-1">
          <Button variant="secondary" size="icon" className="bg-white hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center shadow-sm">
            <Heart className="h-4 w-4 text-gray-600" />
          </Button>
          <Link href={`/products/${product.id}`}>
            <Button variant="secondary" size="icon" className="bg-white hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center shadow-sm">
              <Eye className="h-4 w-4 text-gray-600" />
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="p-4">
        {/* Vendor name */}
        <div className="flex items-center text-xs mb-1">
          <Link href={`/vendors/${product.vendorId}`} className="text-gray-500 hover:text-primary-600">
            {vendorData?.storeName || `Vendor #${product.vendorId}`}
          </Link>
          {vendorData?.verified && (
            <CheckCircle2 className="h-3 w-3 text-green-500 ml-1" title="Verified Vendor" />
          )}
        </div>
        
        {/* Product name */}
        <Link href={`/products/${product.id}`}>
          <h3 className="font-medium text-gray-900 mb-1 hover:text-primary-600 transition line-clamp-2">
            {product.name}
          </h3>
        </Link>
        
        {/* Ratings */}
        <div className="mb-2">
          <Rating 
            value={product.rating} 
            size="xs" 
            reviewCount={product.reviewCount} 
          />
        </div>
        
        {/* Price and add to cart */}
        <div className="flex justify-between items-center">
          <Price 
            amount={product.price}
            compareAmount={product.comparePrice}
            size="md"
          />
          <Button 
            size="icon"
            disabled={isPendingAdd}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
