"use client";

import { User } from "@supabase/supabase-js";
import { getSupabaseAuthClient } from "@/lib/supabase/client";

export type AuthUser = User;

export async function signInAnonymously(): Promise<User> {
  const { data, error } = await getSupabaseAuthClient().auth.signInAnonymously();
  if (error || !data.user) throw error || new Error("Unable to start guest session");
  return data.user;
}

export async function signInWithPassword(email: string, password: string): Promise<User> {
  const { data, error } = await getSupabaseAuthClient().auth.signInWithPassword({ email, password });
  if (error || !data.user) throw error || new Error("Unable to sign in");
  return data.user;
}

export async function signUpWithPassword(email: string, password: string): Promise<User> {
  const client = getSupabaseAuthClient();
  const { data: current } = await client.auth.getUser();
  const { data, error } = current.user?.is_anonymous
    ? await client.auth.updateUser({ email, password })
    : await client.auth.signUp({ email, password });
  if (error || !data.user) throw error || new Error("Unable to create account");
  return data.user;
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabaseAuthClient().auth.signOut();
  if (error) throw error;
}
