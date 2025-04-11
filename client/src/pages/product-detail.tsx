import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Product, Vendor } from "@shared/schema";
import { Link } from "wouter";
import { 
  Minus, 
  Plus, 
  ShoppingCart, 
  Heart, 
  TruckIcon, 
  RotateCcw,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { RatingDisplay } from "@/components/ui/rating-stars";
import { ReviewsSectionWrapper } from "@/components/review/reviews-section";
import { Price } from "@/components/ui/price";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { addToCart, isPendingAdd } = useCart();
  const [quantity, setQuantity] = useState(1);
  
  const { data, isLoading, error } = useQuery<{ product: Product, vendor: Vendor }>({
    queryKey: [`/api/products/${id}`],
  });
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error loading product</h1>
        <p className="mb-8">{error.message}</p>
        <Link href="/products">
          <Button>Back to Products</Button>
        </Link>
      </div>
    );
  }
  
  const product = data?.product;
  const vendor = data?.vendor;
  
  const incrementQuantity = () => setQuantity(q => q + 1);
  const decrementQuantity = () => setQuantity(q => Math.max(1, q - 1));
  
  const handleAddToCart = () => {
    if (product) {
      addToCart({
        productId: product.id,
        quantity,
      });
      
      toast({
        title: "Added to cart",
        description: `${quantity} x ${product.name} has been added to your cart.`,
      });
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="mb-8">
          <ol className="flex text-sm text-gray-500">
            <li className="after:content-['/'] after:mx-2">
              <Link href="/" className="hover:text-primary-600">Home</Link>
            </li>
            <li className="after:content-['/'] after:mx-2">
              <Link href="/products" className="hover:text-primary-600">Products</Link>
            </li>
            {product && (
              <li className="text-gray-900 font-medium truncate">{product.name}</li>
            )}
          </ol>
        </nav>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Product image */}
          <div className="aspect-square overflow-hidden rounded-xl border bg-white">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : product ? (
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          
          {/* Product details */}
          <div className="flex flex-col">
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-6 w-40 mb-4" />
                <Skeleton className="h-5 w-24 mb-6" />
                <Skeleton className="h-32 w-full mb-8" />
                <Skeleton className="h-10 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
              </>
            ) : product && vendor ? (
              <>
                {/* Product badges */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {product.isNew && (
                    <Badge variant="secondary" className="bg-amber-500 text-white hover:bg-amber-500 border-0">New</Badge>
                  )}
                  {product.isTrending && (
                    <Badge variant="secondary" className="bg-primary-500 text-white hover:bg-primary-500 border-0">Trending</Badge>
                  )}
                </div>
                
                {/* Product name */}
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                
                {/* Vendor info */}
                <div className="flex items-center mb-2">
                  <span className="text-gray-500 mr-2">Sold by:</span>
                  <Link href={`/vendors/${vendor.id}`} className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
                    {vendor.storeName}
                    {vendor.verified && (
                      <CheckCircle className="h-4 w-4 text-green-500 ml-1" />
                    )}
                  </Link>
                </div>
                
                {/* Rating */}
                <div className="mb-4">
                  <RatingDisplay 
                    rating={product.rating !== null ? product.rating : 0} 
                    reviewCount={product.reviewCount !== null ? product.reviewCount : 0} 
                  />
                </div>
                
                {/* Price */}
                <div className="flex items-baseline mb-6">
                  <span className="text-2xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
                  {product.comparePrice && product.comparePrice > product.price && (
                    <>
                      <span className="text-gray-500 text-lg line-through ml-2">${product.comparePrice.toFixed(2)}</span>
                      <Badge variant="secondary" className="bg-green-500 text-white hover:bg-green-500 border-0 ml-2">
                        Save ${(product.comparePrice - product.price).toFixed(2)}
                      </Badge>
                    </>
                  )}
                </div>
                
                {/* Description */}
                <p className="text-gray-600 mb-8">{product.description}</p>
                
                {/* Quantity selector */}
                <div className="flex mb-6">
                  <span className="mr-4 font-medium text-gray-700 flex items-center">Quantity:</span>
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-none"
                      onClick={decrementQuantity}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="px-4 text-center w-12">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-none"
                      onClick={incrementQuantity}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                  <Button 
                    className="flex-1 gap-2" 
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={isPendingAdd}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Add to Cart
                  </Button>
                  <Button variant="outline" size="lg" className="flex-1 gap-2">
                    <Heart className="h-5 w-5" />
                    Add to Wishlist
                  </Button>
                </div>
                
                {/* Features */}
                <div className="border-t border-b py-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <TruckIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">Free Shipping</h4>
                      <p className="text-sm text-gray-500">On orders over $50</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <RotateCcw className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">Easy Returns</h4>
                      <p className="text-sm text-gray-500">30 day return policy</p>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
        
        {/* Reviews Section */}
        {product && vendor && (
          <ReviewsSectionWrapper 
            productId={product.id} 
            vendorId={vendor.id}
            className="mt-12"
          />
        )}
      </div>
    </div>
  );
}
