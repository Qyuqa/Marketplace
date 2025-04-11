import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  max?: number;
  size?: "xs" | "sm" | "md" | "lg";
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
}

export function Rating({
  value,
  max = 5,
  size = "md",
  showValue = false,
  reviewCount,
  className,
}: RatingProps) {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const iconClass = sizeClasses[size];
  const fullStars = Math.floor(value);
  const hasHalfStar = value - fullStars >= 0.5;

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex text-amber-400">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`star-full-${i}`} className={iconClass} fill="currentColor" />
        ))}

        {hasHalfStar && <StarHalf className={iconClass} fill="currentColor" />}

        {Array.from({ length: max - fullStars - (hasHalfStar ? 1 : 0) }).map((_, i) => (
          <Star
            key={`star-empty-${i}`}
            className={cn(iconClass, "text-gray-300")}
          />
        ))}
      </div>

      {(showValue || reviewCount !== undefined) && (
        <span className="text-gray-500 text-sm ml-1">
          {showValue && value.toFixed(1)}
          {reviewCount !== undefined && `(${reviewCount})`}
        </span>
      )}
    </div>
  );
}
