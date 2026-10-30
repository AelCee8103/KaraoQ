import { Playlist, PlaylistItem, Favourite, PlayHistoryItem } from "../../lib/types/index.ts";
import { ServerContext, CoreError, requireRegisteredUser } from "./types.ts";

// Playlists
export async function getUserPlaylists(ctx: ServerContext): Promise<Playlist[]> {
  requireRegisteredUser(ctx);

  const { data, error } = await ctx.supabase
    .from("playlists")
    .select("*, items:playlist_items(*)")
    .eq("owner_id", requireRegisteredUser(ctx).id)
    .order("created_at", { ascending: false });

  if (error) throw new CoreError("Failed to fetch playlists", "DB_ERROR", 500);
  return (data || []) as Playlist[];
}

export async function createPlaylist(
  ctx: ServerContext,
  input: { name: string; description?: string | null; isPublic?: boolean }
): Promise<Playlist> {
  requireRegisteredUser(ctx);

  const { data, error } = await ctx.supabase
    .from("playlists")
    .insert({
      owner_id: requireRegisteredUser(ctx).id,
      name: input.name.trim(),
      description: input.description || null,
      is_public: input.isPublic || false,
    })
    .select()
    .single();

  if (error || !data) throw new CoreError("Failed to create playlist", "DB_ERROR", 500);
  return data as Playlist;
}

export async function addPlaylistItem(
  ctx: ServerContext,
  playlistId: string,
  input: {
    videoId: string;
    title: string;
    channelTitle?: string | null;
    thumbnailUrl?: string | null;
    durationSeconds: number;
  }
): Promise<PlaylistItem> {
  requireRegisteredUser(ctx);

  // Verify ownership
  const { data: pl } = await ctx.supabase
    .from("playlists")
    .select("owner_id")
    .eq("id", playlistId)
    .single();

  if (!pl || pl.owner_id !== requireRegisteredUser(ctx).id) throw new CoreError("Forbidden", "FORBIDDEN", 403);

  // Position
  const { data: lastItem } = await ctx.supabase
    .from("playlist_items")
    .select("position")
    .eq("playlist_id", playlistId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPos = (lastItem?.position ?? 0) + 1;

  const { data, error } = await ctx.supabase
    .from("playlist_items")
    .insert({
      playlist_id: playlistId,
      video_id: input.videoId,
      title: input.title,
      channel_title: input.channelTitle || null,
      thumbnail_url: input.thumbnailUrl || null,
      duration_seconds: input.durationSeconds || 0,
      position: nextPos,
    })
    .select()
    .single();

  if (error || !data) throw new CoreError("Failed to add song to playlist", "DB_ERROR", 500);
  return data as PlaylistItem;
}

// Favourites
export async function getUserFavourites(ctx: ServerContext): Promise<Favourite[]> {
  requireRegisteredUser(ctx);

  const { data, error } = await ctx.supabase
    .from("favourites")
    .select("*")
    .eq("user_id", requireRegisteredUser(ctx).id)
    .order("created_at", { ascending: false });

  if (error) throw new CoreError("Failed to fetch favourites", "DB_ERROR", 500);
  return (data || []) as Favourite[];
}

export async function toggleFavourite(
  ctx: ServerContext,
  input: {
    videoId: string;
    title: string;
    channelTitle?: string | null;
    thumbnailUrl?: string | null;
    durationSeconds: number;
  }
): Promise<{ isFavourited: boolean }> {
  requireRegisteredUser(ctx);

  const { data: existing } = await ctx.supabase
    .from("favourites")
    .select("id")
    .eq("user_id", requireRegisteredUser(ctx).id)
    .eq("video_id", input.videoId)
    .maybeSingle();

  if (existing) {
    await ctx.supabase.from("favourites").delete().eq("id", existing.id);
    return { isFavourited: false };
  } else {
    await ctx.supabase.from("favourites").insert({
      user_id: requireRegisteredUser(ctx).id,
      video_id: input.videoId,
      title: input.title,
      channel_title: input.channelTitle || null,
      thumbnail_url: input.thumbnailUrl || null,
      duration_seconds: input.durationSeconds || 0,
    });
    return { isFavourited: true };
  }
}

// History
export async function getUserPlayHistory(ctx: ServerContext): Promise<PlayHistoryItem[]> {
  requireRegisteredUser(ctx);

  const { data, error } = await ctx.supabase
    .from("play_history")
    .select("*")
    .eq("user_id", requireRegisteredUser(ctx).id)
    .order("played_at", { ascending: false })
    .limit(50);

  if (error) throw new CoreError("Failed to fetch play history", "DB_ERROR", 500);
  return (data || []) as PlayHistoryItem[];
}

// Delete user data (Master brief Section 4.1)
export async function deleteUserData(ctx: ServerContext): Promise<boolean> {
  requireRegisteredUser(ctx);

  await ctx.supabase.from("profiles").delete().eq("id", requireRegisteredUser(ctx).id);
  return true;
}
