import { Profile } from "../../lib/types/index.ts";
import { ServerContext, CoreError } from "./types.ts";

const tokenCache = new Map<string, { profile: Profile; isAnonymous: boolean; expires: number }>();

function usernameFor(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
  const username = user.user_metadata?.username;
  return typeof username === "string" && username.trim()
    ? username.trim()
    : user.email?.split("@")[0] || `Singer-${user.id.slice(0, 6)}`;
}

export async function verifySupabaseToken(
  token: string,
  supabase: ServerContext["supabase"]
): Promise<{ profile: Profile; isAnonymous: boolean }> {
  const cached = tokenCache.get(token);
  if (cached && cached.expires > Date.now()) {
    return { profile: cached.profile, isAnonymous: cached.isAnonymous };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new CoreError("Invalid authentication token", "UNAUTHORIZED", 401);

  const authUser = data.user;
  const isAnonymous = Boolean(authUser.is_anonymous);
  const username = usernameFor(authUser);
  const avatarUrl = typeof authUser.user_metadata?.avatar_url === "string"
    ? authUser.user_metadata.avatar_url
    : null;
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .upsert(
      { auth_user_id: authUser.id, username, avatar_url: avatarUrl, last_seen_at: new Date().toISOString() },
      { onConflict: "auth_user_id" }
    )
    .select()
    .single();

  const profile: Profile = profileError || !profileData
    ? { id: authUser.id, auth_user_id: authUser.id, username, avatar_url: avatarUrl,
        last_seen_at: new Date().toISOString(), created_at: new Date().toISOString() }
    : (profileData as Profile);
  tokenCache.set(token, { profile, isAnonymous, expires: Date.now() + 1000 * 60 * 5 });
  return { profile, isAnonymous };
}

export async function syncUserProfile(
  ctx: ServerContext,
  input: { username: string; avatarUrl?: string | null }
): Promise<Profile> {
  if (!ctx.user) throw new CoreError("Authentication required", "UNAUTHORIZED", 401);
  const { data, error } = await ctx.supabase
    .from("profiles")
    .upsert(
      { auth_user_id: ctx.user.auth_user_id, username: input.username.trim(),
        avatar_url: input.avatarUrl || null, last_seen_at: new Date().toISOString() },
      { onConflict: "auth_user_id" }
    )
    .select()
    .single();
  if (error || !data) {
    return { ...ctx.user, username: input.username.trim(), avatar_url: input.avatarUrl || null,
      last_seen_at: new Date().toISOString() };
  }
  return data as Profile;
}
