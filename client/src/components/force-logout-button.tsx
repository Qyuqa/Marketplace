import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export function ForceLogoutButton() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Only show for logged in users
  if (!user) {
    return null;
  }
  
  const handleLogout = () => {
    // Show toast to acknowledge the action
    toast({
      title: "Force logout initiated",
      description: "The app will reload and sign you out...",
    });
    
    // Wait a moment so user can see the toast
    setTimeout(() => {
      try {
        // 1. Clear browser state
        localStorage.clear();
        sessionStorage.clear();
        
        // 2. Delete cookies
        document.cookie.split(";").forEach(function(c) {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        
        // Special delete for connect.sid
        document.cookie = "connect.sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        
        // 3. Hit the logout endpoint directly (don't wait for response)
        fetch('/api/logout', {
          method: 'POST',
          credentials: 'include'
        }).catch(console.error);
        
        // 4. Force reload with cache busting
        window.location.href = "/?logout=" + Date.now();
      } catch (error) {
        console.error("Force logout error:", error);
        // Still try to reload
        window.location.reload();
      }
    }, 1000);
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={handleLogout}
        className="bg-white text-red-600 border-red-300 hover:bg-red-50 shadow-md"
      >
        Force Logout
      </Button>
    </div>
  );
}