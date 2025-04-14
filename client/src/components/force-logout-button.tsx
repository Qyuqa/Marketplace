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
    
    // The most reliable way to log out is to access our standalone HTML page
    // This bypasses all React state and directly opens a page that handles everything
    window.location.href = "/force-logout";
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