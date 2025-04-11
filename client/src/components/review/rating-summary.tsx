import React from "react";
import { Review } from "@shared/schema";
import { RatingDisplay } from "@/components/ui/rating-stars";

interface RatingSummaryProps {
  reviews: Review[] | undefined;
  isLoading: boolean;
  className?: string;
}

export function RatingSummary({ reviews, isLoading, className }: RatingSummaryProps) {
  if (isLoading) {
    return (
      <div className={className}>
        <div className="animate-pulse space-y-2">
          <div className="h-5 w-1/3 bg-gray-200 rounded" />
          <div className="h-3 w-1/4 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }
  
  if (!reviews || reviews.length === 0) {
    return (
      <div className={className}>
        <RatingDisplay rating={0} reviewCount={0} />
        <p className="text-sm text-gray-500 mt-1">No reviews yet</p>
      </div>
    );
  }
  
  // Calculate average rating
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  // Count ratings by star value
  const ratingCounts = [0, 0, 0, 0, 0]; // 5 elements for 1-5 stars
  reviews.forEach(review => {
    const index = Math.min(Math.max(Math.floor(review.rating) - 1, 0), 4);
    ratingCounts[index]++;
  });
  
  // Calculate percentage for each star rating
  const ratingPercentages = ratingCounts.map(count => (count / reviews.length) * 100);
  
  return (
    <div className={className}>
      <div className="flex items-center mb-4">
        <div className="mr-4">
          <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
          <RatingDisplay rating={averageRating} />
          <div className="text-sm text-gray-500 mt-1">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</div>
        </div>
        
        <div className="flex-1">
          {[5, 4, 3, 2, 1].map((stars, index) => (
            <div key={stars} className="flex items-center text-sm mb-1">
              <span className="w-8">{stars} stars</span>
              <div className="flex-1 mx-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ width: `${ratingPercentages[4 - index]}%` }}
                />
              </div>
              <span className="w-8 text-right">
                {ratingCounts[4 - index]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}