import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const performLogout = async () => {
      try {
        // Make a single logout request
        const response = await apiRequest("POST", "/api/logout");
        
        if (response.ok) {
          // Show success toast
          toast({
            title: "Logged out",
            description: "You have been successfully logged out",
          });
          
          // Redirect to home page after a short delay
          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
        } else {
          setError("Failed to logout. Please try again.");
        }
      } catch (err) {
        setError("An error occurred during logout.");
        console.error("Logout error:", err);
      }
    };
    
    performLogout();
  }, [toast]); // Only run this effect once
  
  return (
    <div className="container max-w-lg mx-auto my-20 p-6 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-6">Logging Out</h1>
        
        {error ? (
          <div className="text-red-500 mb-4">{error}</div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p>Please wait while we log you out...</p>
          </div>
        )}
      </div>
    </div>
  );
}