import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Vendor, Product } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/products/product-card";
import { Rating } from "@/components/ui/rating";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Store, MapPin, ExternalLink, CheckCircle } from "lucide-react";

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const vendorId = parseInt(id);

  // Fetch vendor details
  const { data: vendor, isLoading: loadingVendor, error: vendorError } = useQuery<Vendor>({
    queryKey: [`/api/vendors/${vendorId}`],
  });

  // Fetch vendor products
  const { data: products, isLoading: loadingProducts, error: productsError } = useQuery<Product[]>({
    queryKey: ["/api/products", { vendor: vendorId }],
  });

  if (vendorError) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error loading vendor</h1>
        <p className="mb-8">{vendorError.message}</p>
        <Link href="/vendors">
          <Button>Back to Vendors</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Vendor Header */}
      <div className={`h-48 bg-gradient-to-r ${vendor?.bannerColor || "from-primary-600 to-primary-500"}`}>
        <div className="container mx-auto px-4">
          {/* This is intentionally empty for the banner gradient */}
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-24 pb-16">
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="p-6">
            <div className="flex flex-col md:flex-row">
              {/* Vendor Logo */}
              <div className="flex-shrink-0">
                {loadingVendor ? (
                  <Skeleton className="h-28 w-28 rounded-xl border-4 border-white" />
                ) : (
                  <div className="h-28 w-28 rounded-xl border-4 border-white bg-white shadow-sm overflow-hidden">
                    <img 
                      src={vendor?.logoUrl || `https://via.placeholder.com/112?text=${vendor?.storeName.charAt(0)}`} 
                      alt={`${vendor?.storeName} logo`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Vendor Info */}
              <div className="mt-6 md:mt-0 md:ml-6 flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    {loadingVendor ? (
                      <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center">
                          <h1 className="text-2xl font-bold text-gray-900">{vendor?.storeName}</h1>
                          {vendor?.verified && (
                            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 border-green-200">
                              <CheckCircle className="mr-1 h-3 w-3" /> Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-500">{vendor?.description.split(' ').slice(0, 6).join(' ')}...</p>
                      </>
                    )}
                  </div>
                  <div className="mt-4 md:mt-0">
                    {loadingVendor ? (
                      <Skeleton className="h-10 w-32" />
                    ) : (
                      <Rating value={vendor?.rating || 0} reviewCount={vendor?.reviewCount || 0} showValue size="md" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Vendor Contact Info & Stats */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {loadingVendor ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : (
                <>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-sm mb-1">Contact Information</span>
                    <div className="flex items-center">
                      <Mail className="text-gray-400 mr-2 h-4 w-4" />
                      <a href={`mailto:${vendor?.contactEmail}`} className="text-primary-600 hover:text-primary-700">
                        {vendor?.contactEmail}
                      </a>
                    </div>
                    {vendor?.contactPhone && (
                      <div className="flex items-center mt-1">
                        <Phone className="text-gray-400 mr-2 h-4 w-4" />
                        <a href={`tel:${vendor?.contactPhone}`} className="text-primary-600 hover:text-primary-700">
                          {vendor?.contactPhone}
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-sm mb-1">Store Information</span>
                    <div className="flex items-center">
                      <Store className="text-gray-400 mr-2 h-4 w-4" />
                      <span>{vendor?.productCount} Products</span>
                    </div>
                    <div className="flex items-center mt-1">
                      <MapPin className="text-gray-400 mr-2 h-4 w-4" />
                      <span>Online Store</span>
                    </div>
                  </div>
                  <div className="flex flex-col md:items-end">
                    <Button variant="outline" className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Contact Vendor
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="products" className="px-6 pb-6">
            <TabsList>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="products" className="pt-6">
              {loadingProducts ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <Skeleton key={index} className="h-64 w-full rounded-xl" />
                  ))}
                </div>
              ) : productsError ? (
                <div className="text-center py-12">
                  <p className="text-red-500 mb-4">Error loading products</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              ) : products?.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium mb-2">No products available</h3>
                  <p className="text-gray-500">This vendor hasn't listed any products yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {products?.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="about" className="pt-6">
              {loadingVendor ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <div className="prose max-w-none">
                  <h3>About {vendor?.storeName}</h3>
                  <p>{vendor?.description}</p>
                  
                  <h3 className="mt-6">Our Products</h3>
                  <p>
                    We offer a wide range of products designed with quality and customer satisfaction in mind.
                    Browse our collection and find the perfect items for your needs.
                  </p>

                  <h3 className="mt-6">Shipping & Returns</h3>
                  <p>
                    We offer standard shipping on all orders. Most products can be returned within 30 days of delivery for a full refund.
                    Please contact us for more information about our shipping and return policies.
                  </p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="reviews" className="pt-6">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">Reviews coming soon</h3>
                <p className="text-gray-500">We're working on implementing a review system. Check back later!</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
