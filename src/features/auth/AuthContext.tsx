"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getSupabaseAuthClient } from "@/lib/supabase/client";
import {
  signInAnonymously,
  signInWithPassword,
  signUpWithPassword,
} from "./supabaseAuth";
import { Profile } from "@/lib/types";
import { apiClient } from "@/lib/apiClient";

interface AuthContextType {
  user: import("@supabase/supabase-js").User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  signIn: (email?: string, password?: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<import("@supabase/supabase-js").User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncProfile = useCallback(async (authUser: import("@supabase/supabase-js").User) => {
    const username =
      authUser.user_metadata?.username ||
      authUser.email?.split("@")[0] ||
      `Singer-${authUser.id.slice(0, 6)}`;
    try {
      const synced = await apiClient.post<Profile>("/me/sync", {
        username,
        avatarUrl: authUser.user_metadata?.avatar_url || null,
      });
      setProfile(synced);
    } catch (err) {
      console.warn("Backend profile sync warning (falling back to local user data):", err);
      // Fallback local profile when backend/database is in preview mode
      setProfile({
        id: authUser.id,
        auth_user_id: authUser.id,
        username,
        avatar_url: authUser.user_metadata?.avatar_url || null,
        last_seen_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    }
  }, []);

  const initAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const client = getSupabaseAuthClient();
      const { data } = await client.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user);
        await syncProfile(data.session.user);
      } else {
        const u = await signInAnonymously();
        setUser(u);
        await syncProfile(u);
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

  const signIn = async (email?: string, password?: string) => {
    try {
      const u = email && password
        ? await signInWithPassword(email, password)
        : await signInAnonymously();
      setUser(u);
      await syncProfile(u);
    } catch (err) {
      console.error("Sign in failed:", err);
      throw err;
    }
  };

  const signUp = async (email: string, password: string) => {
    const u = await signUpWithPassword(email, password);
    setUser(u);
    await syncProfile(u);
  };

  const signOut = async () => {
    try {
      await getSupabaseAuthClient().auth.signOut();
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
        isAnonymous: Boolean(user?.is_anonymous),
        signIn,
        signUp,
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
