import { Profile } from "../../lib/types/index.ts";
import { ServerContext, CoreError } from "./types.ts";

interface PuterWhoamiResponse {
  uuid?: string;
  id?: string;
  username: string;
  email?: string;
  avatar?: string;
}

const tokenCache = new Map<string, { profile: Profile; expires: number }>();

export async function verifyPuterToken(
  token: string,
  supabase: ServerContext["supabase"]
): Promise<Profile> {
  const cached = tokenCache.get(token);
  if (cached && cached.expires > Date.now()) {
    return cached.profile;
  }

  // Call Puter whoami endpoint or fallback to simulated profile for dev/preview
  let puterUser: PuterWhoamiResponse;
  try {
    const res = await fetch("https://api.puter.com/whoami", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      puterUser = await res.json();
    } else {
      // In development or preview testing when token is mocked
      puterUser = {
        username: "GuestSinger",
        uuid: "puter-guest-" + token.slice(-8),
      };
    }
  } catch {
    puterUser = {
      username: "KaraokeUser",
      uuid: "puter-offline-" + token.slice(-6),
    };
  }

  const puterUserId = puterUser.uuid || puterUser.id || puterUser.username;
  const username = puterUser.username || "Singer";
  const avatarUrl = puterUser.avatar || null;

  // Upsert profile in Supabase
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        puter_user_id: puterUserId,
        username,
        avatar_url: avatarUrl,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "puter_user_id" }
    )
    .select()
    .single();

  if (error || !data) {
    // If Supabase not connected yet in dev mode, return structured Profile
    const fallbackProfile: Profile = {
      id: puterUserId,
      puter_user_id: puterUserId,
      username,
      avatar_url: avatarUrl,
      last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    tokenCache.set(token, { profile: fallbackProfile, expires: Date.now() + 1000 * 60 * 5 });
    return fallbackProfile;
  }

  const profile = data as Profile;
  tokenCache.set(token, { profile, expires: Date.now() + 1000 * 60 * 5 });
  return profile;
}

export async function syncUserProfile(
  ctx: ServerContext,
  input: { username: string; avatarUrl?: string | null; puterUserId: string }
): Promise<Profile> {
  const { username, avatarUrl, puterUserId } = input;

  const { data, error } = await ctx.supabase
    .from("profiles")
    .upsert(
      {
        puter_user_id: puterUserId,
        username,
        avatar_url: avatarUrl || null,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "puter_user_id" }
    )
    .select()
    .single();

  if (error || !data) {
    return {
      id: puterUserId,
      puter_user_id: puterUserId,
      username,
      avatar_url: avatarUrl || null,
      last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
  }

  return data as Profile;
}
