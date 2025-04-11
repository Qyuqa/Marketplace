import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Product, Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import ProductCard from "@/components/products/product-card";
import { Search, SlidersHorizontal, X } from "lucide-react";

export default function ProductsPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const categorySlug = searchParams.get("category");

  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOption, setSortOption] = useState("newest");
  const [filterOptions, setFilterOptions] = useState({
    newOnly: false,
    inStock: false,
    trending: false,
  });

  // Get all categories
  const { data: categories, isLoading: loadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Get the selected category if a category slug is provided
  const selectedCategory = categories?.find((cat) => cat.slug === categorySlug);

  // Get all products
  const { data: products, isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products", categorySlug ? { category: categorySlug } : {}],
  });

  // Filter and sort products
  const filteredProducts = products
    ? products
        .filter((product) => {
          // Apply search term filter
          if (
            searchTerm &&
            !product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !product.description.toLowerCase().includes(searchTerm.toLowerCase())
          ) {
            return false;
          }

          // Apply price range filter
          if (product.price < priceRange[0] || product.price > priceRange[1]) {
            return false;
          }

          // Apply checkbox filters
          if (filterOptions.newOnly && !product.isNew) {
            return false;
          }
          if (filterOptions.inStock && product.inventory <= 0) {
            return false;
          }
          if (filterOptions.trending && !product.isTrending) {
            return false;
          }

          return true;
        })
        .sort((a, b) => {
          // Apply sorting
          switch (sortOption) {
            case "priceAsc":
              return a.price - b.price;
            case "priceDesc":
              return b.price - a.price;
            case "nameAsc":
              return a.name.localeCompare(b.name);
            case "nameDesc":
              return b.name.localeCompare(a.name);
            case "rating":
              return b.rating - a.rating;
            default: // newest
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
        })
    : [];

  const toggleFilter = () => {
    setShowFilters(!showFilters);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setPriceRange([0, 1000]);
    setFilterOptions({
      newOnly: false,
      inStock: false,
      trending: false,
    });
    setSortOption("newest");
  };

  const handleFilterChange = (key: keyof typeof filterOptions) => {
    setFilterOptions({
      ...filterOptions,
      [key]: !filterOptions[key],
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filter sidebar - Hidden on mobile unless toggled */}
        <div
          className={`w-full md:w-1/4 lg:w-1/5 ${
            showFilters ? "block" : "hidden md:block"
          }`}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Filters</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs"
              >
                Reset
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Price Range */}
              <div>
                <h3 className="font-medium mb-3">Price Range</h3>
                <Slider
                  defaultValue={[0, 1000]}
                  min={0}
                  max={1000}
                  step={10}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}</span>
                </div>
              </div>

              <Separator />

              {/* Categories */}
              <div>
                <h3 className="font-medium mb-3">Categories</h3>
                {loadingCategories ? (
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categories?.map((category) => (
                      <a
                        key={category.id}
                        href={`/products?category=${category.slug}`}
                        className={`block text-sm ${
                          category.slug === categorySlug
                            ? "text-primary-600 font-medium"
                            : "text-gray-700 hover:text-primary-600"
                        }`}
                      >
                        {category.name} ({category.productCount})
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Product Status */}
              <div>
                <h3 className="font-medium mb-3">Product Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Checkbox
                      id="new-only"
                      checked={filterOptions.newOnly}
                      onCheckedChange={() => handleFilterChange("newOnly")}
                    />
                    <label
                      htmlFor="new-only"
                      className="ml-2 text-sm font-medium"
                    >
                      New Arrivals
                    </label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox
                      id="in-stock"
                      checked={filterOptions.inStock}
                      onCheckedChange={() => handleFilterChange("inStock")}
                    />
                    <label
                      htmlFor="in-stock"
                      className="ml-2 text-sm font-medium"
                    >
                      In Stock
                    </label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox
                      id="trending"
                      checked={filterOptions.trending}
                      onCheckedChange={() => handleFilterChange("trending")}
                    />
                    <label
                      htmlFor="trending"
                      className="ml-2 text-sm font-medium"
                    >
                      Trending
                    </label>
                  </div>
                </div>
              </div>

              {/* Mobile only close button */}
              <div className="pt-4 md:hidden">
                <Button onClick={toggleFilter} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="flex-1">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              {selectedCategory ? selectedCategory.name : "All Products"}
            </h1>
            <p className="text-gray-500">
              {selectedCategory ? selectedCategory.description : "Browse our extensive collection of products from various vendors"}
            </p>
          </div>

          {/* Search and filter bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Input
                placeholder="Search products..."
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

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="md:hidden"
                onClick={toggleFilter}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>

              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="priceAsc">Price: Low to High</SelectItem>
                  <SelectItem value="priceDesc">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Best Rating</SelectItem>
                  <SelectItem value="nameAsc">Name: A to Z</SelectItem>
                  <SelectItem value="nameDesc">Name: Z to A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products Grid */}
          {loadingProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 12 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="w-full h-80 rounded-xl"
                />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your filters or search terms.
              </p>
              <Button onClick={resetFilters}>Reset Filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
