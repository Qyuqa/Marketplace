import React from "react";
import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  className?: string;
  size?: number;
  color?: string;
  emptyColor?: string;
}

export function RatingStars({
  rating,
  maxRating = 5,
  className,
  size = 16,
  color = "text-yellow-500",
  emptyColor = "text-gray-300"
}: RatingStarsProps) {
  // Ensure rating is between 0 and maxRating
  const safeRating = Math.max(0, Math.min(rating, maxRating));
  
  const stars = [];
  
  // Create the stars based on the rating
  for (let i = 1; i <= maxRating; i++) {
    if (i <= safeRating) {
      // Full star
      stars.push(
        <Star 
          key={i} 
          size={size} 
          className={color} 
          fill="currentColor" 
        />
      );
    } else if (i - 0.5 <= safeRating) {
      // Half star
      stars.push(
        <StarHalf 
          key={i} 
          size={size} 
          className={color} 
          fill="currentColor" 
        />
      );
    } else {
      // Empty star
      stars.push(
        <Star 
          key={i} 
          size={size} 
          className={emptyColor} 
        />
      );
    }
  }
  
  return (
    <div className={cn("flex", className)}>
      {stars}
    </div>
  );
}

// Read-only display of rating with text
export function RatingDisplay({
  rating,
  reviewCount,
  className,
}: {
  rating: number;
  reviewCount?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <RatingStars rating={rating} />
      <span className="text-sm font-medium">
        {rating.toFixed(1)}
        {reviewCount !== undefined && (
          <span className="text-gray-500 ml-1">({reviewCount})</span>
        )}
      </span>
    </div>
  );
}

// Interactive star rating for forms
export function InteractiveRating({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (rating: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={24}
          className={cn(
            "cursor-pointer transition-colors",
            star <= value 
              ? "text-yellow-500 fill-current" 
              : "text-gray-300 hover:text-yellow-300"
          )}
          onClick={() => onChange(star)}
        />
      ))}
    </div>
  );
}