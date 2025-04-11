import React, { useState } from "react";
import { ReviewProvider, useReviews } from "@/hooks/use-reviews";
import { RatingSummary } from "@/components/review/rating-summary";
import { ReviewList } from "@/components/review/review-item";
import { ReviewForm } from "@/components/review/review-form";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface ReviewsSectionWrapperProps {
  productId: number;
  vendorId: number;
  className?: string;
}

// This wrapper provides the ReviewProvider
export function ReviewsSectionWrapper({
  productId,
  vendorId,
  className,
}: ReviewsSectionWrapperProps) {
  return (
    <ReviewProvider productId={productId} vendorId={vendorId}>
      <ReviewsSection productId={productId} vendorId={vendorId} className={className} />
    </ReviewProvider>
  );
}

interface ReviewsSectionProps {
  productId: number;
  vendorId: number;
  className?: string;
}

// The actual component using the review hook
function ReviewsSection({ productId, vendorId, className }: ReviewsSectionProps) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  
  const { 
    productReviews, 
    isLoadingProductReviews 
  } = useReviews();
  
  const toggleForm = () => {
    setShowForm(prev => !prev);
  };
  
  const handleReviewSubmitted = () => {
    setShowForm(false);
  };
  
  return (
    <div className={className}>
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h2 className="text-2xl font-bold mb-6">Reviews</h2>
        
        <RatingSummary 
          reviews={productReviews} 
          isLoading={isLoadingProductReviews}
          className="mb-6"
        />
        
        {user ? (
          showForm ? (
            <div className="mb-8">
              <ReviewForm 
                productId={productId} 
                vendorId={vendorId}
                onReviewSubmitted={handleReviewSubmitted}
              />
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={toggleForm}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button 
              onClick={toggleForm} 
              className="mb-8"
            >
              Write a Review
            </Button>
          )
        ) : (
          <div className="text-center p-4 border border-gray-200 rounded-lg mb-8">
            <p className="text-gray-600">
              Please <a href="/auth" className="text-primary underline">sign in</a> to write a review.
            </p>
          </div>
        )}
        
        <ReviewList 
          reviews={productReviews}
          isLoading={isLoadingProductReviews}
        />
      </div>
    </div>
  );
}