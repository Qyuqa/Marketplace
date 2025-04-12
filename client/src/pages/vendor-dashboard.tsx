import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Vendor, Product, InsertProduct, Category } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { 
  Package, 
  Store, 
  PlusCircle, 
  Trash2, 
  Edit, 
  Loader2, 
  Upload,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

// Schema for creating a product
const productSchema = z.object({
  name: z.string().min(3, { message: "Product name must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  price: z.coerce.number().positive({ message: "Price must be positive" }),
  comparePrice: z.coerce.number().nonnegative({ message: "Compare price must be positive" }).optional(),
  categoryId: z.coerce.number().positive({ message: "Please select a category" }),
  imageUrl: z.string().min(1, { message: "Please upload a product image" }),
  inventory: z.coerce.number().nonnegative({ message: "Inventory must be 0 or higher" }).optional(),
  isNew: z.boolean().optional(),
  isTrending: z.boolean().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function VendorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isNewProductDialogOpen, setIsNewProductDialogOpen] = useState(false);
  const [isEditProductDialogOpen, setIsEditProductDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Fetch vendor profile
  const { data: vendor, isLoading: loadingVendor } = useQuery<Vendor>({
    queryKey: ["/api/user/vendor"],
    retry: false,
    queryFn: async () => {
      const res = await fetch("/api/user/vendor", {
        credentials: "include"
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch vendor profile");
      }
      return await res.json() as Vendor;
    },
    onSuccess: (data) => {
      if (!data) {
        navigate("/vendor/register");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Not a vendor",
        description: "You need to register as a vendor first",
        variant: "destructive",
      });
      navigate("/vendor/register");
    }
  });
  
  // Fetch vendor products
  const { data: products, isLoading: loadingProducts, refetch: refetchProducts } = useQuery<Product[]>({
    queryKey: ["/api/products", { vendor: vendor?.id }],
    enabled: !!vendor?.id,
  });
  
  // Fetch categories for dropdown
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Product form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: undefined,
      comparePrice: undefined,
      categoryId: undefined,
      imageUrl: "",
      inventory: 0,
      isNew: true,
      isTrending: false,
    },
  });
  
  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const res = await apiRequest("POST", "/api/products", data);
      return await res.json() as Product;
    },
    onSuccess: () => {
      setIsNewProductDialogOpen(false);
      form.reset();
      setPreviewImage(null);
      refetchProducts();
      toast({
        title: "Product created",
        description: "Your product has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating product",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await apiRequest("DELETE", `/api/products/${productId}`);
      return res.ok;
    },
    onSuccess: () => {
      refetchProducts();
      toast({
        title: "Product deleted",
        description: "The product has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting product",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Edit product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data: { id: number; product: ProductFormValues }) => {
      const res = await apiRequest("PUT", `/api/products/${data.id}`, data.product);
      return await res.json() as Product;
    },
    onSuccess: () => {
      setIsEditProductDialogOpen(false);
      form.reset();
      setPreviewImage(null);
      setCurrentProduct(null);
      refetchProducts();
      toast({
        title: "Product updated",
        description: "Your product has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating product",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle file upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingImage(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload image");
      }
      
      const data = await response.json();
      form.setValue("imageUrl", data.url);
      setPreviewImage(data.url);
      toast({
        title: "Image uploaded",
        description: "Your product image has been uploaded.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };
  
  const onProductSubmit = (data: ProductFormValues) => {
    if (currentProduct) {
      updateProductMutation.mutateAsync({ id: currentProduct.id, product: data });
    } else {
      createProductMutation.mutateAsync(data);
    }
  };
  
  const handleDeleteProduct = (productId: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutateAsync(productId);
    }
  };
  
  const handleEditProduct = (product: Product) => {
    setCurrentProduct(product);
    setPreviewImage(product.imageUrl);
    form.reset({
      name: product.name,
      description: product.description,
      price: product.price,
      comparePrice: product.comparePrice || undefined,
      categoryId: product.categoryId,
      imageUrl: product.imageUrl,
      inventory: product.inventory || 0,
      isNew: product.isNew || false,
      isTrending: product.isTrending || false,
    });
    setIsEditProductDialogOpen(true);
  };
  
  if (!user) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Unauthorized</h1>
        <p className="mb-8">Please log in to access your vendor dashboard.</p>
        <Link href="/auth">
          <Button>Log In</Button>
        </Link>
      </div>
    );
  }
  
  if (loadingVendor) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-10 w-52" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Vendor Dashboard</h1>
          <p className="text-gray-500">Manage your store and products</p>
        </div>
        <Link href={`/vendors/${vendor?.id}`}>
          <Button variant="outline" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            View My Store
          </Button>
        </Link>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Products</p>
                <h3 className="text-3xl font-bold">{vendor?.productCount || 0}</h3>
              </div>
              <div className="h-12 w-12 bg-primary-50 rounded-full flex items-center justify-center">
                <Package className="h-6 w-6 text-primary-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Store Rating</p>
                <h3 className="text-3xl font-bold">{(vendor?.rating || 0).toFixed(1)}</h3>
              </div>
              <div className="h-12 w-12 bg-amber-50 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Based on {vendor?.reviewCount || 0} reviews</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Store Status</p>
                <h3 className="text-xl font-bold flex items-center gap-2 mt-1">
                  {vendor?.verified ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Verified</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      <span>Pending Verification</span>
                    </>
                  )}
                </h3>
              </div>
              <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center">
                <Store className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold">Products</h2>
          <Dialog open={isNewProductDialogOpen} onOpenChange={setIsNewProductDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Add New Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Fill in the details to add a new product to your store.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onProductSubmit)} className="space-y-6 py-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (KSh)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="comparePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Compare Price (KSh) (Optional)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.00" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormDescription>
                            Original price for showing discounts
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="inventory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inventory Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} value={field.value || 0} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter product description" 
                            className="min-h-32" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Image</FormLabel>
                        <div className="space-y-3">
                          <div className="flex items-center gap-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById("product-image-upload")?.click()}
                              disabled={uploadingImage}
                              className="w-full"
                            >
                              {uploadingImage ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload Image
                                </>
                              )}
                            </Button>
                            <input
                              id="product-image-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                              disabled={uploadingImage}
                            />
                          </div>
                          
                          {previewImage && (
                            <div className="relative w-full h-40 rounded-md overflow-hidden border">
                              <img
                                src={previewImage}
                                alt="Product preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          <input type="hidden" {...field} />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="isNew"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Mark as New</FormLabel>
                            <FormDescription>
                              Shows a "New" badge on the product
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isTrending"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Mark as Trending</FormLabel>
                            <FormDescription>
                              Shows a "Trending" badge on the product
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={() => setIsNewProductDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createProductMutation.isPending}
                    >
                      {createProductMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Product"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        {loadingProducts ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-9 w-20" />
              </div>
            ))}
          </div>
        ) : products?.length === 0 ? (
          <div className="text-center py-12 border rounded-md">
            <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No products yet
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Start adding products to your store by clicking the "Add New Product" button above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Inventory</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products?.map((product) => {
                  const category = categories?.find(c => c.id === product.categoryId);
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded overflow-hidden bg-gray-100">
                            <img 
                              src={product.imageUrl} 
                              alt={product.name} 
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-gray-500 text-sm line-clamp-1">
                              {product.description.length > 30
                                ? `${product.description.substring(0, 30)}...`
                                : product.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{category?.name || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{formatCurrency(product.price)}</span>
                          {product.comparePrice && (
                            <span className="text-gray-500 text-sm line-through">
                              {formatCurrency(product.comparePrice)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.inventory !== null ? product.inventory : "∞"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {product.isNew && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">
                              New
                            </Badge>
                          )}
                          {product.isTrending && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-50 border-purple-200">
                              Trending
                            </Badge>
                          )}
                          {!product.isNew && !product.isTrending && (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200">
                              Regular
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            asChild
                          >
                            <Link href={`/products/${product.id}`}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteProduct(product.id)}
                            disabled={deleteProductMutation.isPending}
                          >
                            {deleteProductMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-red-500" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      
      {/* Edit Product Dialog */}
      <Dialog open={isEditProductDialogOpen} onOpenChange={setIsEditProductDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the details of your product.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onProductSubmit)} className="space-y-6 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (KSh)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="comparePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compare Price (KSh) (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormDescription>
                        Original price for showing discounts
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value?.toString()}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="inventory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inventory Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} value={field.value || 0} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter product description" 
                        className="min-h-32" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Image</FormLabel>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("product-image-upload-edit")?.click()}
                          disabled={uploadingImage}
                          className="w-full"
                        >
                          {uploadingImage ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Change Image
                            </>
                          )}
                        </Button>
                        <input
                          id="product-image-upload-edit"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                      </div>
                      
                      {previewImage && (
                        <div className="relative w-full h-40 rounded-md overflow-hidden border">
                          <img
                            src={previewImage}
                            alt="Product preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <input type="hidden" {...field} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isNew"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Mark as New</FormLabel>
                        <FormDescription>
                          Shows a "New" badge on the product
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isTrending"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Mark as Trending</FormLabel>
                        <FormDescription>
                          Shows a "Trending" badge on the product
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => {
                    setIsEditProductDialogOpen(false);
                    setCurrentProduct(null);
                    form.reset();
                    setPreviewImage(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateProductMutation.isPending}
                >
                  {updateProductMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Product"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}