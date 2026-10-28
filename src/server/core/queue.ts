import { QueueItem, Room } from "../../lib/types/index.ts";
import { ServerContext, CoreError } from "./types.ts";

export async function getRoomQueue(
  ctx: ServerContext,
  roomId: string
): Promise<QueueItem[]> {
  const { data, error } = await ctx.supabase
    .from("queue_items")
    .select("*, added_by_profile:profiles(*)")
    .eq("room_id", roomId)
    .in("status", ["queued", "playing"])
    .order("position", { ascending: true });

  if (error) {
    throw new CoreError("Failed to fetch room queue", "QUEUE_FETCH_FAILED", 500);
  }

  return (data || []) as QueueItem[];
}

export async function addQueueItem(
  ctx: ServerContext,
  roomId: string,
  input: {
    videoId: string;
    title: string;
    channelTitle?: string | null;
    thumbnailUrl?: string | null;
    durationSeconds: number;
  }
): Promise<{ item: QueueItem; isDuplicate: boolean }> {
  if (!ctx.user) throw new CoreError("Unauthorized", "UNAUTHORIZED", 401);

  // 1. Verify room and member
  const { data: roomData, error: roomError } = await ctx.supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (roomError || !roomData) throw new CoreError("Room not found", "ROOM_NOT_FOUND", 404);
  const room = roomData as Room;

  if (room.status === "ended") throw new CoreError("Room session ended", "ROOM_ENDED", 400);

  const { data: member } = await ctx.supabase
    .from("room_members")
    .select("*")
    .eq("room_id", roomId)
    .eq("user_id", ctx.user.id)
    .single();

  if (!member || member.status !== "active") {
    throw new CoreError("You must be an active member of this room to queue songs", "FORBIDDEN", 403);
  }

  // 2. Check song limit per guest (unless host)
  const isHost = room.host_id === ctx.user.id;
  const maxSongs = room.settings?.maxSongsPerGuest ?? 3;

  if (!isHost) {
    const { count: userQueuedCount } = await ctx.supabase
      .from("queue_items")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId)
      .eq("added_by", ctx.user.id)
      .eq("status", "queued");

    if (userQueuedCount && userQueuedCount >= maxSongs) {
      throw new CoreError(
        `Queue limit reached! You can have at most ${maxSongs} songs queued at once.`,
        "QUEUE_LIMIT_REACHED",
        400
      );
    }
  }

  // 3. Check for duplicates currently in queue
  const { data: existingDuplicate } = await ctx.supabase
    .from("queue_items")
    .select("id")
    .eq("room_id", roomId)
    .eq("video_id", input.videoId)
    .in("status", ["queued", "playing"])
    .maybeSingle();

  const isDuplicate = !!existingDuplicate;

  // 4. Calculate position (Fractional indexing: max + 1000)
  const { data: lastItem } = await ctx.supabase
    .from("queue_items")
    .select("position")
    .eq("room_id", roomId)
    .in("status", ["queued", "playing"])
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = lastItem?.position ? Number(lastItem.position) + 1000 : 1000;

  // 5. Insert queue item
  const { data: inserted, error: insertError } = await ctx.supabase
    .from("queue_items")
    .insert({
      room_id: roomId,
      added_by: ctx.user.id,
      video_id: input.videoId,
      title: input.title,
      channel_title: input.channelTitle || null,
      thumbnail_url: input.thumbnailUrl || null,
      duration_seconds: input.durationSeconds || 0,
      position: nextPosition,
      status: "queued",
    })
    .select("*, added_by_profile:profiles(*)")
    .single();

  if (insertError || !inserted) {
    throw new CoreError("Failed to add song to queue", "QUEUE_INSERT_FAILED", 500);
  }

  // Update room last activity
  await ctx.supabase
    .from("rooms")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", roomId);

  return {
    item: inserted as QueueItem,
    isDuplicate,
  };
}

export async function updateQueueItem(
  ctx: ServerContext,
  roomId: string,
  itemId: string,
  input: {
    status?: "queued" | "playing" | "played" | "skipped" | "removed";
    position?: number;
    action?: "reorder" | "skip" | "remove" | "play";
  }
): Promise<QueueItem> {
  if (!ctx.user) throw new CoreError("Unauthorized", "UNAUTHORIZED", 401);

  // Get room and item
  const { data: room } = await ctx.supabase.from("rooms").select("*").eq("id", roomId).single();
  if (!room) throw new CoreError("Room not found", "ROOM_NOT_FOUND", 404);

  const { data: item } = await ctx.supabase.from("queue_items").select("*").eq("id", itemId).single();
  if (!item) throw new CoreError("Queue item not found", "ITEM_NOT_FOUND", 404);

  const isHost = room.host_id === ctx.user.id;
  const isOwner = item.added_by === ctx.user.id;

  // Permission checks
  if (input.action === "remove" || input.status === "removed") {
    if (!isHost && !isOwner) {
      throw new CoreError("You can only remove your own songs", "FORBIDDEN", 403);
    }
  } else if (input.action === "reorder" || input.position !== undefined) {
    if (!isHost && (!isOwner || !room.settings?.allowGuestReorder)) {
      throw new CoreError("You are not allowed to reorder songs in this room", "FORBIDDEN", 403);
    }
  } else if (input.action === "skip" || input.action === "play" || input.status === "playing" || input.status === "played") {
    if (!isHost) {
      throw new CoreError("Only the host can advance or skip the player", "FORBIDDEN", 403);
    }
  }

  const updates: Partial<QueueItem> = {};
  if (input.status) updates.status = input.status;
  if (input.action === "remove") updates.status = "removed";
  if (input.action === "skip") updates.status = "skipped";
  if (input.action === "play") updates.status = "playing";
  if (input.position !== undefined) updates.position = input.position;

  const { data: updated, error } = await ctx.supabase
    .from("queue_items")
    .update(updates)
    .eq("id", itemId)
    .select("*, added_by_profile:profiles(*)")
    .single();

  if (error || !updated) {
    throw new CoreError("Failed to update queue item", "QUEUE_UPDATE_FAILED", 500);
  }

  // If played or playing, log to play_history
  if (updates.status === "playing" || updates.status === "played") {
    await ctx.supabase.from("play_history").insert({
      user_id: item.added_by,
      room_id: roomId,
      video_id: item.video_id,
      title: item.title,
      channel_title: item.channel_title,
      thumbnail_url: item.thumbnail_url,
      duration_seconds: item.duration_seconds,
    });
  }

  return updated as QueueItem;
}

export async function deleteQueueItem(
  ctx: ServerContext,
  roomId: string,
  itemId: string
): Promise<boolean> {
  await updateQueueItem(ctx, roomId, itemId, { action: "remove", status: "removed" });
  return true;
}
