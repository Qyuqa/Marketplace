import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function LogoutPage() {
  const { toast } = useToast();
  const [status, setStatus] = useState('Logging out...');
  
  useEffect(() => {
    const performLogout = async () => {
      try {
        // Log for debugging
        console.log('Manual logout page: starting logout process');
        
        // Make a direct fetch request to logout
        const response = await fetch('/api/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        // Log the response
        console.log('Manual logout response:', response.status, response.statusText);
        
        if (response.ok) {
          setStatus('Logged out successfully! Redirecting...');
          
          toast({
            title: 'Logged out',
            description: 'You have been successfully logged out.',
          });
          
          // Wait a bit before redirecting to home
          setTimeout(() => {
            // The most aggressive approach
            window.location.href = '/';
            // Force a complete reload from server
            window.location.reload();
          }, 1500);
        } else {
          setStatus('Logout failed. Please try again.');
          
          toast({
            title: 'Logout failed',
            description: 'There was a problem logging you out. Please try again.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error during manual logout:', error);
        setStatus('Error during logout. Please try again.');
        
        toast({
          title: 'Logout error',
          description: 'An unexpected error occurred during logout.',
          variant: 'destructive',
        });
      }
    };
    
    // Execute the logout as soon as this component mounts
    performLogout();
    
    // Fallback: force redirection after a timeout even if logout fails
    const timeoutId = setTimeout(() => {
      console.log('Manual logout page: timeout reached, forcing redirect');
      window.location.href = '/';
      window.location.reload();
    }, 3000);
    
    return () => clearTimeout(timeoutId);
  }, [toast]);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Logging Out</h1>
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}