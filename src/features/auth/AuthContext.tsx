"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { puterClient, PuterUser } from "./puter";
import { Profile } from "@/lib/types";
import { apiClient } from "@/lib/apiClient";

interface AuthContextType {
  user: PuterUser | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PuterUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncProfile = useCallback(async (puterUser: PuterUser) => {
    try {
      const synced = await apiClient.post<Profile>("/me/sync", {
        username: puterUser.username,
        avatarUrl: puterUser.avatar || null,
        puterUserId: puterUser.uuid || puterUser.username,
      });
      setProfile(synced);
    } catch (err) {
      console.warn("Backend profile sync warning (falling back to local user data):", err);
      // Fallback local profile when backend/database is in preview mode
      setProfile({
        id: puterUser.uuid || "guest-id",
        puter_user_id: puterUser.uuid || puterUser.username,
        username: puterUser.username,
        avatar_url: puterUser.avatar || null,
        last_seen_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    }
  }, []);

  const initAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      if (puterClient.isSignedIn()) {
        const u = await puterClient.getUser();
        if (u) {
          setUser(u);
          await syncProfile(u);
        }
      }
    } catch (err) {
      console.error("Auth initialization error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [syncProfile]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const signIn = async () => {
    try {
      const u = await puterClient.signIn();
      if (u) {
        setUser(u);
        await syncProfile(u);
      }
    } catch (err) {
      console.error("Sign in failed:", err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await puterClient.signOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await syncProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signOut,
        refreshProfile,
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
