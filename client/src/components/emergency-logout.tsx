import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

export function EmergencyLogout() {
  const { toast } = useToast();
  const [visible, setVisible] = useState(false);
  
  // Only show if the URL has a special parameter
  useEffect(() => {
    if (window.location.search.includes('emergency-logout')) {
      setVisible(true);
    }
  }, []);
  
  if (!visible) {
    return null;
  }
  
  // Nuclear option - directly hit the endpoint and reload
  const performNuclearLogout = async () => {
    try {
      toast({
        title: "Emergency Logout",
        description: "Attempting to force logout...",
      });
      
      // 1. Clear all front-end state
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // 2. Make the API call directly
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // 3. Complete reload with cache busting
      window.location.href = "/?nocache=" + Date.now();
    } catch (error) {
      console.error("Failed emergency logout:", error);
      // Even if the API fails, still try to reload
      window.location.href = "/?nocache=" + Date.now();
    }
  };
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-8 mb-8 mx-auto max-w-md">
      <h3 className="text-lg font-medium text-red-800 mb-2">Emergency Logout</h3>
      <p className="text-sm text-red-700 mb-4">
        If you're having trouble logging out, click the button below to force a logout.
      </p>
      <Button 
        variant="destructive" 
        className="w-full" 
        onClick={performNuclearLogout}
      >
        Emergency Force Logout
      </Button>
    </div>
  );
}