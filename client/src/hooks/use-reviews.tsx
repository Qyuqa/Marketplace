import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  QueryClient
} from "@tanstack/react-query";
import { Review as SelectReview, InsertReview } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ReviewContextType = {
  // Product reviews
  productReviews: SelectReview[] | undefined;
  isLoadingProductReviews: boolean;
  
  // Vendor reviews
  vendorReviews: SelectReview[] | undefined;
  isLoadingVendorReviews: boolean;
  
  // User's reviews
  userReviews: SelectReview[] | undefined;
  isLoadingUserReviews: boolean;
  
  // Mutations
  submitReviewMutation: UseMutationResult<SelectReview, Error, Omit<InsertReview, "userId">>;
};

export const ReviewContext = createContext<ReviewContextType | null>(null);

export function ReviewProvider({ 
  children,
  productId,
  vendorId 
}: { 
  children: ReactNode;
  productId?: number;
  vendorId?: number;
}) {
  const { toast } = useToast();
  
  // Fetch product reviews if productId is provided
  const {
    data: productReviews,
    isLoading: isLoadingProductReviews,
  } = useQuery<SelectReview[]>({
    queryKey: ['/api/products', productId, 'reviews'],
    queryFn: async () => {
      if (!productId) return [];
      const res = await apiRequest('GET', `/api/products/${productId}/reviews`);
      return await res.json();
    },
    enabled: !!productId
  });
  
  // Fetch vendor reviews if vendorId is provided
  const {
    data: vendorReviews,
    isLoading: isLoadingVendorReviews,
  } = useQuery<SelectReview[]>({
    queryKey: ['/api/vendors', vendorId, 'reviews'],
    queryFn: async () => {
      if (!vendorId) return [];
      const res = await apiRequest('GET', `/api/vendors/${vendorId}/reviews`);
      return await res.json();
    },
    enabled: !!vendorId
  });
  
  // Fetch user's own reviews
  const {
    data: userReviews,
    isLoading: isLoadingUserReviews,
  } = useQuery<SelectReview[]>({
    queryKey: ['/api/user/reviews'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/user/reviews');
      return await res.json();
    }
  });
  
  // Mutation to submit a review
  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: Omit<InsertReview, "userId">) => {
      const res = await apiRequest('POST', '/api/reviews', reviewData);
      return await res.json();
    },
    onSuccess: (review: SelectReview) => {
      // Invalidate the relevant query caches
      if (review.productId) {
        queryClient.invalidateQueries({ queryKey: ['/api/products', review.productId, 'reviews'] });
      }
      if (review.vendorId) {
        queryClient.invalidateQueries({ queryKey: ['/api/vendors', review.vendorId, 'reviews'] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/user/reviews'] });
      
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  return (
    <ReviewContext.Provider
      value={{
        productReviews,
        isLoadingProductReviews,
        vendorReviews,
        isLoadingVendorReviews,
        userReviews,
        isLoadingUserReviews,
        submitReviewMutation,
      }}
    >
      {children}
    </ReviewContext.Provider>
  );
}

export function useReviews() {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error("useReviews must be used within a ReviewProvider");
  }
  return context;
}