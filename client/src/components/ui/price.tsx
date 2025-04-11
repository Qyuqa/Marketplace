import { formatKshPrice, formatUsdPrice } from "@/lib/currency";

interface PriceProps {
  amount: number | null | undefined;
  compareAmount?: number | null;
  showUsd?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Price({ 
  amount, 
  compareAmount, 
  showUsd = true, 
  size = "md",
  className = ""
}: PriceProps) {
  if (amount === null || amount === undefined) {
    return null;
  }

  // Set CSS classes based on size
  const sizeClasses = {
    sm: {
      main: "text-sm font-medium",
      compare: "text-xs line-through",
      usd: "text-xs text-muted-foreground ml-1"
    },
    md: {
      main: "text-base font-semibold",
      compare: "text-sm line-through",
      usd: "text-xs text-muted-foreground ml-1"
    },
    lg: {
      main: "text-xl font-bold",
      compare: "text-sm line-through",
      usd: "text-sm text-muted-foreground ml-1"
    }
  };
  
  return (
    <div className={`flex flex-wrap items-center ${className}`}>
      {compareAmount && compareAmount > amount && (
        <span className={`${sizeClasses[size].compare} text-muted-foreground mr-2`}>
          {formatKshPrice(compareAmount)}
        </span>
      )}
      
      <span className={sizeClasses[size].main}>
        {formatKshPrice(amount)}
      </span>
      
      {showUsd && (
        <span className={sizeClasses[size].usd}>
          ({formatUsdPrice(amount)})
        </span>
      )}
    </div>
  );
}