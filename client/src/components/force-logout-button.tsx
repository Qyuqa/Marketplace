import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { forceLogout } from "@/lib/queryClient";

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
      title: "Nuclear logout initiated",
      description: "The app will reload and sign you out completely...",
    });
    
    // Use our enhanced nuclear logout that tries multiple approaches
    forceLogout();
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={handleLogout}
        className="bg-white text-red-600 border-red-300 hover:bg-red-50 shadow-md"
      >
        Nuclear Logout
      </Button>
    </div>
  );
}