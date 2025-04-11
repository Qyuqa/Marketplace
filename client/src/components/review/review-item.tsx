import React from "react";
import { format } from "date-fns";
import { User } from "lucide-react";
import { Review } from "@shared/schema";
import { RatingStars } from "@/components/ui/rating-stars";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ReviewItemProps {
  review: Review;
  className?: string;
}

export function ReviewItem({ review, className }: ReviewItemProps) {
  const createdAt = new Date(review.createdAt);
  
  // Get the user's initials for the avatar
  const getInitials = () => {
    return "U"; // Default initial if we don't have the user's name
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2 flex flex-row justify-between items-start">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              <User size={16} />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold text-sm">
              {review.title || "Review"}
            </div>
            <div className="text-xs text-gray-500">
              {format(createdAt, "MMM d, yyyy")}
            </div>
          </div>
        </div>
        <RatingStars rating={review.rating} size={14} />
      </CardHeader>
      <CardContent>
        {review.comment && (
          <p className="text-sm text-gray-700">{review.comment}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function ReviewList({ 
  reviews,
  isLoading,
  emptyMessage = "No reviews yet. Be the first to leave a review!",
  className
}: { 
  reviews: Review[] | undefined;
  isLoading: boolean;
  emptyMessage?: string;
  className?: string;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gray-200" />
                <div className="space-y-1">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-3 w-16 bg-gray-200 rounded" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-4 w-full bg-gray-200 rounded mb-2" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }
  
  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-4">Customer Reviews</h3>
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}