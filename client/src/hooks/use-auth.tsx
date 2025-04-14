import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient, forceLogout } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  // NEW APPROACH: Keep track of an explicit logout timestamp in localStorage
  // When this timestamp is newer than the last login, consider the user logged out
  // This way, the client knows definitively whether a user is meant to be logged out
  // regardless of whether the server session was properly cleared
  
  // Check localStorage for a logout timestamp
  const getStoredLogoutTime = (): number => {
    const timestamp = localStorage.getItem('logout_timestamp');
    return timestamp ? parseInt(timestamp, 10) : 0;
  };
  
  // Get the login timestamp
  const getStoredLoginTime = (): number => {
    const timestamp = localStorage.getItem('login_timestamp');
    return timestamp ? parseInt(timestamp, 10) : 0;
  };
  
  // If logout timestamp is newer than login timestamp, user is explicitly logged out
  const isExplicitlyLoggedOut = getStoredLogoutTime() > getStoredLoginTime();
  
  const {
    data: serverUser,
    error,
    isLoading,
    refetch,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    // Critical fix: Don't cache auth state for long, refetch on window focus
    staleTime: 0, // Consider data immediately stale
    refetchInterval: 30000, // Refresh auth status every 30 seconds
    refetchOnWindowFocus: true, // Refresh when tab becomes active
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnReconnect: true, // Refetch when reconnecting
  });
  
  // Override the user data if we've explicitly logged out
  const user = isExplicitlyLoggedOut ? null : serverUser;

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: async (user: SelectUser) => {
      // Store login timestamp 
      localStorage.setItem('login_timestamp', Date.now().toString());
      
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.fullName || user.username}!`,
      });
      
      console.log("User login successful:", user);
      
      // If user is a vendor, check if they have an approved application
      if (user.isVendor) {
        console.log("User is a vendor, checking application status");
        try {
          // Get vendor information
          const res = await apiRequest("GET", `/api/vendors/user/${user.id}`);
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
          // If there's an error, fallback to homepage redirect
        }
      } else {
        console.log("User is not a vendor");
      }
      
      // Otherwise redirect to homepage, but only if we're not already there
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

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      // Store login timestamp for newly registered user
      localStorage.setItem('login_timestamp', Date.now().toString());
      
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome to Qyuqa, ${user.fullName || user.username}!`,
      });
      // Redirect to homepage after successful registration, only if we're not already there
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

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Use our nuclear logout function that tries multiple approaches
      // This is the most reliable way to handle logout
      return forceLogout();
    },
    // These handlers won't run due to the page reload in forceLogout
    onSuccess: () => {
      // Will not execute
      console.log("Logout successful");
    },
    onError: (error: Error) => {
      // Will not execute
      console.error("Logout error:", error);
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
