// Constants for currency conversion
export const KSH_TO_USD_RATE = 0.0077; // 1 KSh = 0.0077 USD (approximate rate)
export const USD_TO_KSH_RATE = 130; // 1 USD = 130 KSh (approximate rate)

// Format price in KSh
export function formatKshPrice(amountInUsd: number | null | undefined): string {
  if (amountInUsd === null || amountInUsd === undefined) {
    return "KSh 0";
  }
  
  // Convert from USD to KSh
  const amountInKsh = amountInUsd * USD_TO_KSH_RATE;
  
  // Format with comma separators for thousands
  return `KSh ${amountInKsh.toLocaleString('en-KE', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
}

// Format price in USD as a small indicator
export function formatUsdPrice(amountInUsd: number | null | undefined): string {
  if (amountInUsd === null || amountInUsd === undefined) {
    return "$0";
  }
  
  return `$${amountInUsd.toLocaleString('en-US', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

// Component for displaying both currencies
export function PriceDisplay({ priceInUsd, showUsd = true }: { priceInUsd: number | null | undefined, showUsd?: boolean }) {
  return {
    main: formatKshPrice(priceInUsd),
    secondary: showUsd ? formatUsdPrice(priceInUsd) : undefined
  };
}