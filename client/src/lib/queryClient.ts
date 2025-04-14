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
    console.log("Starting force logout process...");
    
    // 1. First clear all client-side state
    queryClient.clear();
    console.log("Cleared query cache");
    
    localStorage.clear();
    console.log("Cleared localStorage");
    
    sessionStorage.clear();
    console.log("Cleared sessionStorage");
    
    // 2. Clear the session cookie directly - do this first in case the fetch fails
    document.cookie = 'connect.sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    console.log("Cleared session cookie");
    
    // 3. Make the server-side logout request - don't await this to prevent blocking
    fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(e => {
      console.error("Error during logout API call, but continuing:", e);
    });
    console.log("Sent logout request");
    
    // 4. Brief delay to let any pending operations complete
    setTimeout(() => {
      console.log("Reloading page...");
      // 5. Force a complete reload of the application - with cache busting
      window.location.href = '/?logout=' + Date.now();
    }, 300);
  } catch (err) {
    console.error('Force logout error:', err);
    // If an error occurs during logout, still force reload after a brief delay
    alert("An error occurred during logout. The page will reload.");
    setTimeout(() => {
      window.location.href = '/?logout=' + Date.now();
    }, 1000);
  }
}
