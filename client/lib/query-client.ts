import { QueryClient, QueryFunction } from "@tanstack/react-query";
import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra;

/**
 * Gets the base URL for the Express API server
 * 
 * PRODUCTION-SAFE: Works in both Expo Go and TestFlight
 * Priority:
 * 1. Build-time config (TestFlight/Production via app.config.js)
 * 2. Runtime environment variable (Expo Go)
 * 3. Fallback to localhost (development)
 * 
 * @returns {string} The API base URL
 */
export function getApiUrl(): string {
  let host: string | null = null;

  // 1. Try build-time config (works in TestFlight)
  if (extra?.apiDomain) {
    host = extra.apiDomain;
  }

  // 2. Try runtime environment variable (works in Expo Go)
  if (!host && process.env.EXPO_PUBLIC_DOMAIN) {
    host = process.env.EXPO_PUBLIC_DOMAIN;
  }

  // 3. Fallback for local development
  if (!host) {
    host = "localhost:5000";
  }

  const protocol = host.includes("localhost") ? "http" : "https";
  const url = new URL(`${protocol}://${host}`);

  return url.href;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);

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
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);

    const res = await fetch(url, {
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
