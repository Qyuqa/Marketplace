import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Vendor } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import VendorCard from "@/components/vendors/vendor-card";
import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function VendorsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("productCount");

  const { data: vendors, isLoading, error } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  // Filter and sort vendors
  const filteredVendors = vendors
    ? vendors
        .filter((vendor) => {
          if (
            searchTerm &&
            !vendor.storeName.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !vendor.description.toLowerCase().includes(searchTerm.toLowerCase())
          ) {
            return false;
          }
          return true;
        })
        .sort((a, b) => {
          switch (sortOption) {
            case "rating":
              return b.rating - a.rating;
            case "reviewCount":
              return b.reviewCount - a.reviewCount;
            case "alphabetical":
              return a.storeName.localeCompare(b.storeName);
            default: // productCount
              return b.productCount - a.productCount;
          }
        })
    : [];

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Marketplace Vendors
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Discover unique products from our trusted vendors. Each vendor brings their
            own expertise and quality items to our marketplace.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="max-w-4xl mx-auto mb-10">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-8 w-8"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="productCount">Most Products</SelectItem>
                <SelectItem value="rating">Highest Rating</SelectItem>
                <SelectItem value="reviewCount">Most Reviews</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Vendor Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-72 w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-red-600 mb-2">
              Error loading vendors
            </h3>
            <p className="text-gray-500 mb-6">
              An error occurred while loading the vendor list. Please try again later.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No vendors found
            </h3>
            <p className="text-gray-500 mb-6">
              We couldn't find any vendors matching your search criteria.
            </p>
            <Button onClick={() => setSearchTerm("")}>
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        )}

        {/* Become a Vendor CTA */}
        <div className="mt-20 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-8 md:p-12 flex flex-col md:flex-row items-center">
            <div className="md:w-2/3 mb-8 md:mb-0">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Ready to Sell on Our Marketplace?
              </h2>
              <p className="text-gray-600 mb-6">
                Join our community of successful vendors and reach millions of
                customers. Setting up your store is quick and easy.
              </p>
              <Button size="lg" className="w-full md:w-auto">
                Become a Vendor
              </Button>
            </div>
            <div className="md:w-1/3 md:pl-8">
              <img
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
                alt="Vendor dashboard"
                className="rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
