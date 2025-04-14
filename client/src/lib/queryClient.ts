import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      // For most queries, we use conservative caching
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute stale time
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * Force logout the user - this is a more aggressive approach
 * that bypasses the normal logout flow when the regular one isn't working
 */
export async function forceLogout() {
  try {
    console.log("Starting ultra-nuclear logout process...");
    
    // THE KEY FIX: Set logout timestamp to force client-side logout
    // This timestamp will be checked by useAuth to determine if user is logged out
    // By setting this timestamp BEFORE clearing localStorage, we ensure it persists
    localStorage.setItem('logout_timestamp', Date.now().toString());
    console.log("Set logout timestamp to force client-side logout");
    
    // 1. Now clear all client-side state - except the logout timestamp!
    queryClient.clear();
    console.log("Cleared query cache");
    
    // Don't completely clear localStorage now, just selectively clear relevant items
    const keysToPreserve = ['logout_timestamp'];
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !keysToPreserve.includes(key)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log("Selectively cleared localStorage");
    
    sessionStorage.clear();
    console.log("Cleared sessionStorage");
    
    // 2. Clear all cookies - both session and anything else
    // This aggressive approach tries different techniques
    const clearCookies = () => {
      // Standard approach to clear all cookies
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Try with different domains and paths to cover all possibilities
      const cookiesToClear = ['connect.sid', 'sessionid', 'session', 'auth', 'logged_in'];
      const domains = ['', window.location.hostname, '.' + window.location.hostname, 'replit.dev', '.replit.dev'];
      const paths = ['/', '/api', ''];
      
      domains.forEach(domain => {
        paths.forEach(path => {
          cookiesToClear.forEach(cookieName => {
            // Clear cookie with domain and path
            document.cookie = `${cookieName}=; Path=${path}; ${domain ? 'Domain=' + domain + ';' : ''} Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0; Secure; SameSite=Strict`;
          });
        });
      });
    };
    
    // Run the cookie clearing process
    clearCookies();
    console.log("Cleared all cookies with multiple approaches");
    
    // 3. To get around potential stale service workers, unregister them
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
          console.log("Unregistered service worker");
        }
      } catch (err) {
        console.error("Error unregistering service workers:", err);
      }
    }
    
    // 4. Make multiple server-side logout requests in sequence for maximum reliability
    try {
      // First try the nuclear logout endpoint
      await fetch('/api/logout-action', { 
        method: 'POST', 
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      console.log("Nuclear logout request sent successfully");
      
      // Then standard logout endpoint
      await fetch('/api/logout', { 
        method: 'POST', 
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      console.log("Standard logout request sent successfully");
      
      // Special fix: check auth status immediately and update cache
      const checkResponse = await fetch('/api/check-session', {
        cache: 'no-store',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      const authStatus = await checkResponse.json();
      console.log("Auth status after logout:", authStatus);
      
      // Force update the TanStack Query cache with null for user
      queryClient.setQueryData(["/api/user"], null);
      
      // Force a background refetch of user status
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Run the cookie clearing process again after server responses
      clearCookies();
    } catch (e) {
      console.error("Error during logout API calls, but continuing:", e);
      // Even if there's an error, still update cache
      queryClient.setQueryData(["/api/user"], null);
    }
    
    console.log("All logout processes completed");
    
    // 5. Brief delay to let any pending operations complete
    setTimeout(() => {
      console.log("Preparing for full page reload with cache busting...");
      
      // 6. Force a complete reload of the application - with aggressive cache busting
      // Use location.replace to prevent back button from restoring the session
      window.location.replace(
        `/?logout=${Date.now()}&purge=${Math.random().toString(36).substring(2, 15)}&nocache=true`
      );
    }, 300);
  } catch (err) {
    console.error('Force logout error:', err);
    // If an error occurs during logout, still force reload after a brief delay
    console.log("Encountered error, forcing reload anyway");
    window.location.replace(`/?logout=${Date.now()}&error=true`);
  }
}
