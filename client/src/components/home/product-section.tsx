import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

type FilterType = "all" | "fashion" | "electronics" | "home";

export default function ProductSection() {
  const [filter, setFilter] = useState<FilterType>("all");
  
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products", { trending: true, limit: 10 }],
  });

  const filteredProducts = products 
    ? filter === "all" 
      ? products 
      : products.filter(p => {
          // This is a simplification. In a real app, you'd have the category info in each product
          if (filter === "fashion") return p.categoryId === 1;
          if (filter === "electronics") return p.categoryId === 2;
          if (filter === "home") return p.categoryId === 3;
          return true;
        })
    : [];

  if (error) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center text-red-500">
            Failed to load trending products. Please try again later.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Trending Products</h2>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button 
              size="sm" 
              variant={filter === "fashion" ? "default" : "outline"}
              onClick={() => setFilter("fashion")}
            >
              Fashion
            </Button>
            <Button 
              size="sm" 
              variant={filter === "electronics" ? "default" : "outline"}
              onClick={() => setFilter("electronics")}
              className="hidden md:block"
            >
              Electronics
            </Button>
            <Button 
              size="sm" 
              variant={filter === "home" ? "default" : "outline"}
              onClick={() => setFilter("home")}
              className="hidden md:block"
            >
              Home
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {isLoading
            ? Array.from({ length: 10 }).map((_, index) => (
                <div key={`product-skeleton-${index}`} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-4">
                    <Skeleton className="h-3 w-24 mb-1" />
                    <Skeleton className="h-5 w-full mb-1" />
                    <Skeleton className="h-4 w-32 mb-2" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))
            : filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>
        
        <div className="mt-10 text-center">
          <Link href="/products">
            <Button variant="outline" size="lg" className="border-primary-600 text-primary-600 hover:bg-primary-50">
              View All Products
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
