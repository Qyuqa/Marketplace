import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Vendor } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import VendorCard from "@/components/vendors/vendor-card";
import { ChevronRight } from "lucide-react";

export default function VendorSection() {
  const { data: vendors, isLoading, error } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors/featured"],
  });

  if (error) {
    return (
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center text-red-500">
            Failed to load featured vendors. Please try again later.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Featured Vendors</h2>
          <Link href="/vendors" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div key={`vendor-skeleton-${index}`} className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-100">
                  <Skeleton className="h-32 w-full" />
                  <div className="p-5 pt-0">
                    <div className="flex items-start -mt-10">
                      <Skeleton className="h-20 w-20 rounded-xl border-4 border-white" />
                      <div className="ml-4 pt-10">
                        <Skeleton className="h-6 w-32 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            : vendors?.map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} />
              ))}
        </div>
      </div>
    </section>
  );
}
