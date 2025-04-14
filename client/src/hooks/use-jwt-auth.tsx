import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define the auth token key
const AUTH_TOKEN_KEY = 'qyuqa_auth_token';

// Define the auth context type
type AuthContextType = {
  user: SelectUser | null;
  token: string | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<{ user: SelectUser, token: string }, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<{ user: SelectUser, token: string }, Error, InsertUser>;
};

// Define login data type
type LoginData = Pick<InsertUser, "username" | "password">;

// Create auth context
export const AuthContext = createContext<AuthContextType | null>(null);

// Utility function to save token
function saveToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

// Utility function to get token
function getToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

// Utility function to remove token
function removeToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Configure auth headers for all requests when token exists
  useEffect(() => {
    const token = getToken();
    if (token) {
      // Update the default headers for apiRequest
      queryClient.setDefaultOptions({
        queries: {
          retry: false,
        },
      });
    }
  }, []);

  // Query to get the current user
  const {
    data: user,
    error,
    isLoading,
    refetch: refetchUser
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const token = getToken();
      if (!token) return undefined;
      
      try {
        const res = await fetch('/api/user', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            // Token is invalid, remove it
            removeToken();
            return undefined;
          }
          throw new Error('Failed to fetch user data');
        }
        
        return await res.json();
      } catch (err) {
        console.error("Error fetching user:", err);
        return undefined;
      }
    },
    enabled: !!getToken(), // Only run if token exists
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Login failed');
      }
      return await res.json();
    },
    onSuccess: async (data: { user: SelectUser, token: string }) => {
      // Save token to localStorage
      saveToken(data.token);
      
      // Set user data in cache
      queryClient.setQueryData(["/api/user"], data.user);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.fullName || data.user.username}!`,
      });
      
      console.log("User login successful:", data.user);
      
      // Redirect logic based on user role
      if (data.user.isVendor) {
        console.log("User is a vendor, checking application status");
        try {
          // Get vendor information
          const res = await fetch(`/api/vendors/user/${data.user.id}`, {
            headers: {
              Authorization: `Bearer ${data.token}`
            }
          });
          
          if (!res.ok) {
            throw new Error(`Failed to fetch vendor: ${res.status} ${res.statusText}`);
          }
          
          const vendor = await res.json();
          console.log("Vendor information:", vendor);
          
          // If vendor application is approved, redirect to vendor dashboard
          if (vendor && vendor.applicationStatus === "approved") {
            console.log("Vendor is approved, redirecting to dashboard");
            if (window.location.pathname !== "/vendor/dashboard") {
              window.location.replace("/vendor/dashboard");
            }
            return;
          } else {
            console.log("Vendor not approved:", vendor?.applicationStatus);
          }
        } catch (error) {
          console.error("Error checking vendor status:", error);
        }
      } else {
        console.log("User is not a vendor");
      }
      
      // Redirect to homepage if not already there
      console.log("Redirecting to homepage");
      if (window.location.pathname !== "/") {
        window.location.replace("/");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", userData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      return await res.json();
    },
    onSuccess: (data: { user: SelectUser, token: string }) => {
      // Save token to localStorage
      saveToken(data.token);
      
      // Set user data in cache
      queryClient.setQueryData(["/api/user"], data.user);
      
      toast({
        title: "Registration successful",
        description: `Welcome to Qyuqa, ${data.user.fullName || data.user.username}!`,
      });
      
      // Redirect to homepage
      if (window.location.pathname !== "/") {
        window.location.replace("/");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Client-side logout - no server call needed with JWT
      removeToken();
      queryClient.clear();
    },
    onSuccess: () => {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      // Reload the page to reset all application state
      window.location.href = "/?logout=" + Date.now();
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        token: getToken(),
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}