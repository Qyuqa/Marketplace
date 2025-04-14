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
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
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
    console.log("Starting nuclear logout process...");
    
    // 1. First clear all client-side state
    queryClient.clear();
    console.log("Cleared query cache");
    
    localStorage.clear();
    console.log("Cleared localStorage");
    
    sessionStorage.clear();
    console.log("Cleared sessionStorage");
    
    // 2. Clear all cookies - both session and anything else
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    console.log("Cleared all cookies");
    
    // 3. Try multiple approaches to clear session cookie specifically
    document.cookie = 'connect.sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'connect.sid=; Path=/; Domain=.replit.dev; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'connect.sid=; Path=/; Domain=replit.dev; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'connect.sid=; Max-Age=0;';
    console.log("Cleared session cookie with multiple approaches");
    
    // 4. To get around potential stale service workers, unregister them
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
          registration.unregister();
          console.log("Unregistered service worker");
        }
      }).catch(err => console.error("Error unregistering service workers:", err));
    }
    
    // 5. Make multiple server-side logout requests in parallel to maximize chances
    Promise.allSettled([
      // Standard API endpoint
      fetch('/api/logout', { method: 'POST', credentials: 'include' }),
      // Also try backup endpoint (the one used by the server HTML)
      fetch('/api/logout-action', { method: 'POST', credentials: 'include' }),
      // Try a direct GET to the force-logout page
      fetch('/force-logout', { method: 'GET', credentials: 'include' })
    ]).catch(e => {
      console.error("Error during logout API calls, but continuing:", e);
    }).finally(() => {
      console.log("Sent all logout requests");
    
      // 6. Brief delay to let any pending operations complete
      setTimeout(() => {
        console.log("Preparing for full page reload...");
        
        // 7. Force a complete reload of the application - with aggressive cache busting
        window.location.href = "/?logout=" + Date.now() + "&purge=cache";
      }, 500);
    });
  } catch (err) {
    console.error('Force logout error:', err);
    // If an error occurs during logout, still force reload after a brief delay
    alert("An error occurred during logout. The page will reload.");
    window.location.href = "/?logout=" + Date.now() + "&purge=cache";
  }
}
