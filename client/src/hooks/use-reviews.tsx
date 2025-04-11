import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Review, InsertReview } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ReviewsContextType {
  productReviews: Review[] | undefined;
  vendorReviews: Review[] | undefined;
  isLoadingProductReviews: boolean;
  isLoadingVendorReviews: boolean;
  errorProductReviews: Error | null;
  errorVendorReviews: Error | null;
  submitReviewMutation: ReturnType<typeof useSubmitReviewMutation>;
}

interface ReviewsProviderProps {
  children: ReactNode;
  productId: number;
  vendorId: number;
}

const ReviewsContext = createContext<ReviewsContextType | null>(null);

function useSubmitReviewMutation() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (review: Omit<InsertReview, "userId">) => {
      const res = await apiRequest("POST", "/api/reviews", review);
      return await res.json();
    },
    onSuccess: (review: Review) => {
      // Invalidate both product and vendor reviews queries
      queryClient.invalidateQueries({ 
        queryKey: [`/api/reviews/product/${review.productId}`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/reviews/vendor/${review.vendorId}`] 
      });
      
      // Also invalidate the product and vendor to update their ratings
      queryClient.invalidateQueries({ 
        queryKey: [`/api/products/${review.productId}`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/vendors/${review.vendorId}`] 
      });
      
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error submitting review",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function ReviewProvider({ children, productId, vendorId }: ReviewsProviderProps) {
  const { toast } = useToast();
  
  const submitReviewMutation = useSubmitReviewMutation();
  
  // Query for product reviews
  const { 
    data: productReviews, 
    isLoading: isLoadingProductReviews,
    error: errorProductReviews,
  } = useQuery<Review[]>({
    queryKey: [`/api/reviews/product/${productId}`],
  });
  
  // Query for vendor reviews
  const { 
    data: vendorReviews, 
    isLoading: isLoadingVendorReviews,
    error: errorVendorReviews,
  } = useQuery<Review[]>({
    queryKey: [`/api/reviews/vendor/${vendorId}`],
  });
  
  return (
    <ReviewsContext.Provider value={{
      productReviews,
      vendorReviews,
      isLoadingProductReviews,
      isLoadingVendorReviews,
      errorProductReviews,
      errorVendorReviews,
      submitReviewMutation,
    }}>
      {children}
    </ReviewsContext.Provider>
  );
}

export function useReviews() {
  const context = useContext(ReviewsContext);
  
  if (!context) {
    throw new Error("useReviews must be used within a ReviewProvider");
  }
  
  return context;
}