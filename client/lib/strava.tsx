import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getApiUrl } from "@/lib/query-client";

WebBrowser.maybeCompleteAuthSession();

const STRAVA_STORAGE_KEY = "strava_tokens";

interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;
  city?: string;
  country?: string;
}

interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  athlete?: StravaAthlete;
}

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string;
  start_date_local: string;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  calories?: number;
  map?: {
    summary_polyline: string;
    polyline: string;
  };
  achievement_count?: number;
  kudos_count?: number;
}

interface StravaContextType {
  isConnected: boolean;
  isLoading: boolean;
  athlete: StravaAthlete | null;
  activities: StravaActivity[];
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  refreshActivities: () => Promise<void>;
}

const StravaContext = createContext<StravaContextType | undefined>(undefined);

interface StravaProviderProps {
  children: ReactNode;
}

export function StravaProvider({ children }: StravaProviderProps) {
  const [tokens, setTokens] = useState<StravaTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<StravaActivity[]>([]);

  const discovery = {
    authorizationEndpoint: "https://www.strava.com/oauth/mobile/authorize",
    tokenEndpoint: "https://www.strava.com/api/v3/oauth/token",
    revocationEndpoint: "https://www.strava.com/oauth/deauthorize",
  };

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "fitforge",
    path: "strava-redirect",
  });

  useEffect(() => {
    loadStoredTokens();
  }, []);

  useEffect(() => {
    if (tokens && !isTokenExpired(tokens.expiresAt)) {
      refreshActivities();
    }
  }, [tokens]);

  const loadStoredTokens = async () => {
    try {
      const stored = await AsyncStorage.getItem(STRAVA_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StravaTokens;
        if (isTokenExpired(parsed.expiresAt)) {
          const refreshed = await refreshTokens(parsed.refreshToken);
          if (refreshed) {
            setTokens(refreshed);
          }
        } else {
          setTokens(parsed);
        }
      }
    } catch (error) {
      console.error("Error loading Strava tokens:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isTokenExpired = (expiresAt: number): boolean => {
    return Date.now() / 1000 > expiresAt - 300;
  };

  const refreshTokens = async (refreshToken: string): Promise<StravaTokens | null> => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(new URL("/api/strava/refresh", apiUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const data = await response.json();
      const newTokens: StravaTokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
        athlete: data.athlete || tokens?.athlete,
      };

      await AsyncStorage.setItem(STRAVA_STORAGE_KEY, JSON.stringify(newTokens));
      return newTokens;
    } catch (error) {
      console.error("Error refreshing Strava token:", error);
      await disconnect();
      return null;
    }
  };

  const connect = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const apiUrl = getApiUrl();
      const configResponse = await fetch(new URL("/api/strava/config", apiUrl).toString());
      const config = await configResponse.json();
      
      const authRequest = new AuthSession.AuthRequest({
        clientId: config.clientId,
        scopes: ["activity:read_all", "profile:read_all"],
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        usePKCE: false,
      });

      const result = await authRequest.promptAsync(discovery);

      if (result.type === "success" && result.params.code) {
        const tokenResponse = await fetch(new URL("/api/strava/token", apiUrl).toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            code: result.params.code,
            redirectUri 
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error("Failed to exchange code for token");
        }

        const data = await tokenResponse.json();
        const newTokens: StravaTokens = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: data.expires_at,
          athlete: data.athlete,
        };

        await AsyncStorage.setItem(STRAVA_STORAGE_KEY, JSON.stringify(newTokens));
        setTokens(newTokens);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error connecting to Strava:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async (): Promise<void> => {
    try {
      if (tokens?.accessToken) {
        const apiUrl = getApiUrl();
        await fetch(new URL("/api/strava/disconnect", apiUrl).toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: tokens.accessToken }),
        });
      }
    } catch (error) {
      console.error("Error disconnecting Strava:", error);
    } finally {
      await AsyncStorage.removeItem(STRAVA_STORAGE_KEY);
      setTokens(null);
      setActivities([]);
    }
  };

  const getValidAccessToken = async (): Promise<string | null> => {
    if (!tokens) return null;
    
    if (isTokenExpired(tokens.expiresAt)) {
      const refreshed = await refreshTokens(tokens.refreshToken);
      return refreshed?.accessToken || null;
    }
    
    return tokens.accessToken;
  };

  const refreshActivities = async (): Promise<void> => {
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) return;

      const apiUrl = getApiUrl();
      const response = await fetch(
        new URL("/api/strava/activities", apiUrl).toString(),
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error("Error fetching Strava activities:", error);
    }
  };

  const value: StravaContextType = {
    isConnected: !!tokens && !isTokenExpired(tokens.expiresAt),
    isLoading,
    athlete: tokens?.athlete || null,
    activities,
    connect,
    disconnect,
    refreshActivities,
  };

  return (
    <StravaContext.Provider value={value}>
      {children}
    </StravaContext.Provider>
  );
}

export function useStrava(): StravaContextType {
  const context = useContext(StravaContext);
  if (!context) {
    throw new Error("useStrava must be used within a StravaProvider");
  }
  return context;
}
