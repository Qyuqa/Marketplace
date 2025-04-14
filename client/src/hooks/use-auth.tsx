import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
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
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: async (user: SelectUser) => {
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
      // Redirect to the logout page which will handle the session cleaning
      window.location.href = "/logout";
      // This is a fake promise that never resolves since we're redirecting
      return new Promise<void>(() => {});
    },
    // We don't actually need these handlers since we're redirecting to /logout
    // but keeping them for completeness
    onSuccess: () => {
      // This will not execute due to the page redirect above
      queryClient.clear(); // Clear ALL queries, not just user
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
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
